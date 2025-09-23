import { ProductCreateInput, ProductRow, normalizePrices, parseList, parseSemicolonList, parseMetadata, decimalToCents, productRowWithRulesSchema, parseImageUrls } from "./schemas";

export interface RowToProductDefaults {
  default_sales_channel_handles?: string[];
  default_manage_inventory?: boolean;
  default_is_discountable?: boolean;
  variant_strategy?: 'explicit' | 'default_type'; // Default: 'explicit'
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
  // Enforce cross-field import rules
  productRowWithRulesSchema.parse(row);
  const { productPrices, variantPrices } = normalizePrices(row);

  // product-level fields
  const product: ProductCreateInput = {
    title: row.title,
    handle: row.handle || undefined,
    status: (row.status as any) === "draft" ? "draft" : "published",
    thumbnail: row.thumbnail_url || undefined,
    images: parseImageUrls(row.image_urls),
    metadata: (() => {
      const base = parseMetadata(row) || {};
      const inventory: Record<string, any> = {};
      if (row.uom) inventory.uom = row.uom;
      if (typeof row.min_increment === 'number') inventory.min_increment = row.min_increment;
      if (typeof row.min_cut === 'number') inventory.min_cut = row.min_cut;
      if (typeof row.reorder_point === 'number') inventory.reorder_point = row.reorder_point;
      if (typeof row.safety_stock === 'number') inventory.safety_stock = row.safety_stock;
      if (typeof row.low_stock_threshold === 'number') inventory.low_stock_threshold = row.low_stock_threshold;
      if (row.backorder_policy) inventory.backorder_policy = row.backorder_policy;
      return Object.keys(inventory).length ? { ...base, inventory } : base;
    })(),
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
  } else if (productPrices.length && defaults.variant_strategy === 'default_type') {
    // Only create default two variants when variant_strategy is 'default_type' (opt-in)
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
  } else if (productPrices.length && defaults.variant_strategy !== 'default_type') {
    // Explicit mode (default): Create single default variant with product prices
    product.variants?.push({
      sku: row.sku || row.handle || `${row.title.toLowerCase().replace(/\s+/g, '-')}-default`,
      prices: productPrices
    });
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
