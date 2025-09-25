import { z } from "zod";

// Helpers
export const truthy = z
  .union([z.boolean(), z.string(), z.number()])
  .transform((v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const s = v.trim().toLowerCase();
    return ["true", "1", "yes", "y"].includes(s);
  });

export const falsy = z
  .union([z.boolean(), z.string(), z.number()])
  .transform((v) => {
    if (typeof v === "boolean") return !v;
    if (typeof v === "number") return v === 0;
    const s = v.trim().toLowerCase();
    return ["false", "0", "no", "n"].includes(s);
  });

export const booleanLike = z
  .union([z.boolean(), z.string(), z.number()])
  .transform((v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(s)) return true;
    if (["false", "0", "no", "n"].includes(s)) return false;
    return false;
  });

export const decimalToCents = (v: string | number | null | undefined) => {
  if (v === undefined || v === null || v === "") return undefined;
  const num = typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
  if (Number.isNaN(num)) return undefined;
  return Math.round(num * 100);
};

export const currencyCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{3}$/);

export const statusSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((s) => ["published", "draft"].includes(s), {
    message: "status must be published or draft",
  });

// Product row schema (normalized)
export const productRowSchema = z.object({
  // Identity
  title: z.string().min(1, "title is required"),
  handle: z.string().optional(),
  external_id: z.string().optional(),
  status: statusSchema.default("published"),

  // Pricing (single or multi-currency)
  currency_code: currencyCodeSchema.optional(),
  retail_price: z.union([z.string(), z.number()]).optional(),
  swatch_price: z.union([z.string(), z.number()]).optional(),
  // multi-currency prices (e.g., price_usd, price_eur, ...)
  price_usd: z.union([z.string(), z.number()]).optional(),
  price_eur: z.union([z.string(), z.number()]).optional(),
  price_gbp: z.union([z.string(), z.number()]).optional(),
  price_cad: z.union([z.string(), z.number()]).optional(),
  price_aud: z.union([z.string(), z.number()]).optional(),

  // Options
  option_1_title: z.string().optional(),
  option_2_title: z.string().optional(),
  option_3_title: z.string().optional(),

  // Variant fields
  sku: z.string().optional(),
  option_1_value: z.string().optional(),
  option_2_value: z.string().optional(),
  option_3_value: z.string().optional(),
  variant_price: z.union([z.string(), z.number()]).optional(),
  variant_price_usd: z.union([z.string(), z.number()]).optional(),
  variant_price_eur: z.union([z.string(), z.number()]).optional(),

  // Media
  thumbnail_url: z.string().url().optional(),
  image_urls: z.string().optional(), // comma-separated

  // Taxonomy & associations
  tags: z.string().optional(), // comma-separated
  collection_handles: z.string().optional(), // comma-separated
  category_handles: z.string().optional(), // comma-separated
  sales_channel_handles: z.string().optional(), // semicolon-separated

  // Inventory & flags
  manage_inventory: booleanLike.optional(),
  allow_backorder: booleanLike.optional(),
  inventory_quantity: z.coerce.number().int().nonnegative().optional(),
  is_discountable: booleanLike.optional(),
  is_giftcard: booleanLike.optional(),
  weight: z.coerce.number().nonnegative().optional(),
  length: z.coerce.number().nonnegative().optional(),
  width: z.coerce.number().nonnegative().optional(),
  height: z.coerce.number().nonnegative().optional(),

  // Fabric inventory policy
  uom: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => ["yard", "meter", "metre", "yd", "m"].includes(v), {
      message: "uom must be one of yard|meter|metre|yd|m",
    })
    .optional(),
  min_increment: z.coerce.number().positive().optional(),
  min_cut: z.coerce.number().positive().optional(),
  reorder_point: z.coerce.number().nonnegative().optional(),
  safety_stock: z.coerce.number().nonnegative().optional(),
  low_stock_threshold: z.coerce.number().nonnegative().optional(),
  backorder_policy: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => ["deny", "allow_date", "allow_any"].includes(v), {
      message: "backorder_policy must be deny|allow_date|allow_any",
    })
    .optional(),

  // Fabric-configurable
  config_type: z.enum(["configurable_fabric", "configurable_swatch_set"]).optional(),
  category_filter: z.string().optional(),
  collection_filter: z.string().optional(),
  min_selections: z.coerce.number().int().nonnegative().optional(),
  max_selections: z.coerce.number().int().nonnegative().optional(),
  set_price: z.union([z.string(), z.number()]).optional(),
  base_price: z.union([z.string(), z.number()]).optional(),

  // Metadata
  metadata_json: z.string().optional(), // JSON string
  // alternative key/value string: meta:foo=bar;baz=qux (handled in mapper)
  meta: z.string().optional(),
});

// Cross-field validation: min_cut must be a multiple of min_increment when both provided
export const productRowWithRulesSchema = productRowSchema.superRefine((row, ctx) => {
  if (row.min_cut !== undefined && row.min_increment !== undefined) {
    if (row.min_increment <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min_increment"],
        message: "min_increment must be > 0",
      });
      return;
    }
    const quotient = row.min_cut / row.min_increment;
    const isMultiple = Math.abs(quotient - Math.round(quotient)) < 1e-8;
    if (!isMultiple) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min_cut"],
        message: "min_cut must be a multiple of min_increment",
      });
    }
  }
});

export type ProductRow = z.infer<typeof productRowSchema>;

export interface PriceInput {
  amount: number; // cents
  currency_code: string;
}

export interface VariantInput {
  title?: string;
  sku?: string;
  prices?: PriceInput[];
  options?: string[]; // option values aligned to product options
}

export interface ProductCreateInput {
  title: string;
  handle?: string;
  status: "published" | "draft";
  description?: string;
  thumbnail?: string;
  images?: string[];
  metadata?: Record<string, any>;
  options?: { title: string }[];
  variants?: VariantInput[];
  tags?: string[];
  collections?: string[]; // by handle
  categories?: string[]; // by handle
  sales_channels?: string[]; // by handle
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  is_discountable?: boolean;
  is_giftcard?: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

export const parseImageUrls = (input?: string): string[] | undefined => {
  if (!input) return undefined;
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => !!s);
};

export const parseList = (input?: string): string[] | undefined => {
  if (!input) return undefined;
  return input
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => !!s);
};

export const parseSemicolonList = (input?: string): string[] | undefined => {
  if (!input) return undefined;
  return input
    .split(";")
    .map((s) => s.trim())
    .filter((s) => !!s);
};

export interface NormalizedPrices {
  productPrices: PriceInput[]; // product-level prices
  variantPrices: PriceInput[]; // variant-level prices
}

export const normalizePrices = (row: ProductRow): NormalizedPrices => {
  const productPrices: PriceInput[] = [];
  const variantPrices: PriceInput[] = [];

  // single-currency
  if (row.currency_code) {
    const retail = decimalToCents(row.retail_price);
    if (typeof retail === "number") {
      productPrices.push({ amount: retail, currency_code: row.currency_code });
    }
    const vprice = decimalToCents(row.variant_price);
    if (typeof vprice === "number") {
      variantPrices.push({ amount: vprice, currency_code: row.currency_code });
    }
  }

  // multi-currency at product level
  const multi: Record<string, unknown> = row as any;
  Object.keys(multi).forEach((key) => {
    const m = key.match(/^price_([a-z]{3})$/i);
    if (m) {
      const cc = m[1].toLowerCase();
      const cents = decimalToCents((multi as any)[key]);
      if (typeof cents === "number") {
        productPrices.push({ amount: cents, currency_code: cc });
      }
    }
    const mv = key.match(/^variant_price_([a-z]{3})$/i);
    if (mv) {
      const cc = mv[1].toLowerCase();
      const cents = decimalToCents((multi as any)[key]);
      if (typeof cents === "number") {
        variantPrices.push({ amount: cents, currency_code: cc });
      }
    }
  });

  return { productPrices, variantPrices };
};

export const parseMetadata = (row: ProductRow): Record<string, any> | undefined => {
  const meta: Record<string, any> = {};
  if (row.metadata_json) {
    try {
      const parsed = JSON.parse(row.metadata_json);
      Object.assign(meta, parsed);
    } catch {
      // ignore JSON parse error; will be reported in validation elsewhere if needed
    }
  }
  if (row.meta) {
    row.meta.split(";").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k && v !== undefined) meta[k.trim()] = v.trim();
    });
  }
  return Object.keys(meta).length ? meta : undefined;
};
