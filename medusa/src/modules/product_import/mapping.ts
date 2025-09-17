import { ProductCreateInput, ProductRow, normalizePrices, parseList, parseSemicolonList, parseMetadata, decimalToCents } from "./schemas";

export interface RowToProductDefaults {
  default_sales_channel_handles?: string[];
  default_manage_inventory?: boolean;
  default_is_discountable?: boolean;
}

export interface RowToProductResult {
  product: ProductCreateInput;
  derived: {
    variant_sku?: string; // if present
    product_prices_cents: number[];
    variant_prices_cents: number[];
  };
}

export const rowToProductInput = (
  row: ProductRow,
  defaults: RowToProductDefaults = {}
): RowToProductResult => {
  const { productPrices, variantPrices } = normalizePrices(row);

  // product-level fields
  const product: ProductCreateInput = {
    title: row.title,
    handle: row.handle || undefined,
    status: (row.status as any) === "draft" ? "draft" : "published",
    thumbnail: row.thumbnail_url || undefined,
    images: parseImageUrls(row.image_urls),
    metadata: parseMetadata(row),
    options: [],
    variants: [],
    tags: parseList(row.tags),
    collections: parseList(row.collection_handles),
    categories: parseList(row.category_handles),
    sales_channels: parseSemicolonList(row.sales_channel_handles) || defaults.default_sales_channel_handles,
    manage_inventory: row.manage_inventory ?? defaults.default_manage_inventory,
    allow_backorder: row.allow_backorder,
    is_discountable: row.is_discountable ?? defaults.default_is_discountable,
    is_giftcard: row.is_giftcard,
    weight: row.weight,
    length: row.length,
    width: row.width,
    height: row.height,
  };

  // options per product
  const optionTitles = [row.option_1_title, row.option_2_title, row.option_3_title].filter(
    (t): t is string => !!t && t.trim().length > 0
  );
  if (optionTitles.length) {
    product.options = optionTitles.map((title) => ({ title }));
  }

  // variants
  if (row.sku || row.option_1_value || row.option_2_value || row.option_3_value || variantPrices.length) {
    const options: string[] = [];
    if (row.option_1_value) options.push(row.option_1_value);
    if (row.option_2_value) options.push(row.option_2_value);
    if (row.option_3_value) options.push(row.option_3_value);

    product.variants?.push({
      sku: row.sku || undefined,
      options: options.length ? options : undefined,
      prices: variantPrices.length ? variantPrices : productPrices.length ? productPrices : undefined,
    });
  } else if (productPrices.length) {
    // default two variants when no explicit variant provided (Swatch & Fabric)
    product.options = product.options?.length ? product.options : [{ title: "Type" }];

    const baseSku = row.handle || (row.external_id ? `${row.external_id}` : undefined);
    const swatchSku = baseSku ? `${baseSku}-SWATCH` : undefined;
    const fabricSku = baseSku ? `${baseSku}-YARD` : undefined;

    // Swatch
    const swatchCents = decimalToCents(row.swatch_price);
    const swatchPrice = typeof swatchCents === "number" && row.currency_code
      ? [{ amount: swatchCents, currency_code: (row.currency_code || "usd").toLowerCase() }]
      : productPrices;
    product.variants?.push({ sku: swatchSku, options: ["Swatch"], prices: swatchPrice });
    // Fabric
    product.variants?.push({ sku: fabricSku, options: ["Fabric"], prices: productPrices });
  }

  return {
    product,
    derived: {
      variant_sku: row.sku || undefined,
      product_prices_cents: productPrices.map((p) => p.amount),
      variant_prices_cents: variantPrices.map((p) => p.amount),
    },
  };
};
