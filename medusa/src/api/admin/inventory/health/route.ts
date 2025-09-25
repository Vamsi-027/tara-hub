import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

// Inline inventory policy functions
const getBaseUnitFactor = (minIncrement: number): number => {
  if (minIncrement <= 0) {
    throw new Error("min_increment must be > 0");
  }
  const factor = Math.round(1 / minIncrement);
  const reconstructed = 1 / factor;
  if (Math.abs(reconstructed - minIncrement) > 1e-10) {
    const scaled = Math.round(minIncrement * 1_000_000);
    return Math.round(1_000_000 / scaled);
  }
  return factor;
};

const toBaseUnits = (
  decimalQty: number,
  minIncrement: number,
  rounding: "up" | "down" | "nearest" = "nearest"
): number => {
  const factor = getBaseUnitFactor(minIncrement);
  const rawUnits = decimalQty * factor;
  let units: number;
  switch (rounding) {
    case "up":
      units = Math.ceil(rawUnits - 1e-10);
      break;
    case "down":
      units = Math.floor(rawUnits + 1e-10);
      break;
    default:
      units = Math.round(rawUnits);
  }
  return units;
};

const fromBaseUnits = (baseUnits: number, minIncrement: number): number => {
  const factor = getBaseUnitFactor(minIncrement);
  return baseUnits / factor;
};

interface AtsParams {
  stockedUnits: number;
  reservedUnits: number;
  incomingUnits?: number;
  includeIncomingInAts?: boolean;
}

const computeAtsUnits = (params: AtsParams): number => {
  const { stockedUnits, reservedUnits, incomingUnits = 0, includeIncomingInAts = false } = params;
  const ats = stockedUnits - reservedUnits + (includeIncomingInAts ? incomingUnits : 0);
  return Math.max(0, ats);
};

type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "backordered";

const getStockStatus = (atsUnits: number, lowStockThresholdDecimal: number, minIncrement: number): StockStatus => {
  if (atsUnits <= 0) {
    return "out_of_stock";
  }
  const thresholdUnits = toBaseUnits(lowStockThresholdDecimal, minIncrement, "nearest");
  return atsUnits <= thresholdUnits ? "low_stock" : "in_stock";
};

// Inline RBAC helpers
const INVENTORY_SCOPES = {
  READ: "inventory:read",
  WRITE: "inventory:write",
  TRANSFER: "inventory:transfer",
} as const;

function isAdmin(req: MedusaRequest): boolean {
  return (
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.type === "admin" ||
    (req as any).user?.role === "admin" ||
    Boolean((req as any).session?.user_id)
  );
}

function enforceScopes(
  req: MedusaRequest,
  res: MedusaResponse,
  required: string[]
): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

type HealthItem = {
  variant_id?: string;
  sku?: string;
  title?: string;
  product_title?: string;
  inventory_item_id: string;
  location_id: string;
  location_name?: string;
  stocked: number; // decimal
  reserved: number; // decimal
  incoming: number; // decimal
  ats: number; // decimal
  low_stock_threshold?: number; // decimal
  status: "in_stock" | "low_stock" | "out_of_stock" | "backordered";
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    if (!enforceScopes(req, res, [INVENTORY_SCOPES.READ])) return;

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const productModule = req.scope.resolve(Modules.PRODUCT);

    const { limit = "50", offset = "0", location_id, status, q, order = "ats:desc" } = req.query as Record<string, string>;

    // Fetch inventory levels with related item and location
    const filters: any = {};
    if (location_id) filters.location_id = location_id;

    const { data: levels } = await query.graph({
      entity: "inventory_level",
      fields: [
        "id",
        "location_id",
        "inventory_item_id",
        "stocked_quantity",
        "reserved_quantity",
        "incoming_quantity",
        "location.id",
        "location.name",
        "inventory_item.id",
        "inventory_item.metadata",
      ],
      filters,
      pagination: { take: parseInt(limit), skip: parseInt(offset) },
    });

    // Build map inventory_item_id -> variant metadata by scanning variants (metadata.inventory_item_id)
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "title", "metadata", "product.title"],
    });

    const variantByInvItem: Map<string, any> = new Map();
    for (const v of variants) {
      const invId = v?.metadata?.inventory_item_id;
      if (invId) variantByInvItem.set(invId, v);
    }

    const items: HealthItem[] = [];
    for (const lvl of levels) {
      const invItemId = lvl.inventory_item_id;
      const variant = variantByInvItem.get(invItemId);

      // Resolve policy metadata for min_increment and low_stock_threshold
      const invMeta = lvl.inventory_item?.metadata || {};
      let min_increment = invMeta.min_increment;
      let low_stock_threshold = invMeta.low_stock_threshold;
      if ((!min_increment || !low_stock_threshold) && variant?.metadata?.inventory) {
        min_increment = min_increment ?? variant.metadata.inventory.min_increment;
        low_stock_threshold = low_stock_threshold ?? variant.metadata.inventory.low_stock_threshold;
      }
      // Fallbacks
      const minInc = typeof min_increment === "number" && min_increment > 0 ? min_increment : 1;
      const lowThreshDec = typeof low_stock_threshold === "number" ? low_stock_threshold : 0;

      const stockedUnits = typeof lvl.stocked_quantity === "number" ? lvl.stocked_quantity : 0;
      const reservedUnits = typeof lvl.reserved_quantity === "number" ? lvl.reserved_quantity : 0;
      const incomingUnits = typeof lvl.incoming_quantity === "number" ? lvl.incoming_quantity : 0;

      const atsUnits = computeAtsUnits({ stockedUnits, reservedUnits, incomingUnits, includeIncomingInAts: false });
      const statusVal = getStockStatus(atsUnits, lowThreshDec, minInc);

      // Convert base units to decimals via min_increment
      const stocked = stockedUnits / (1 / minInc);
      const reserved = reservedUnits / (1 / minInc);
      const incoming = incomingUnits / (1 / minInc);
      const ats = atsUnits / (1 / minInc);

      items.push({
        variant_id: variant?.id,
        sku: variant?.sku,
        title: variant?.title,
        product_title: variant?.product?.title,
        inventory_item_id: invItemId,
        location_id: lvl.location_id,
        location_name: lvl.location?.name,
        stocked,
        reserved,
        incoming,
        ats,
        low_stock_threshold: lowThreshDec,
        status: statusVal,
      });
    }

    // Filter by status if provided
    const filtered = status ? items.filter((it) => it.status === status) : items;

    // Basic search on sku/title/product_title
    const searched = q
      ? filtered.filter((it) =>
          [it.sku, it.title, it.product_title].some((s) =>
            typeof s === "string" && s.toLowerCase().includes(q.toLowerCase())
          )
        )
      : filtered;

    // Sort
    const [orderField, orderDirRaw] = order.split(":");
    const orderDir = orderDirRaw?.toLowerCase() === "asc" ? 1 : -1;
    const sortable = ["ats", "stocked", "reserved", "incoming", "sku", "title", "product_title"];
    const sorted = [...searched].sort((a, b) => {
      if (!sortable.includes(orderField)) return 0;
      const av: any = (a as any)[orderField];
      const bv: any = (b as any)[orderField];
      if (av === bv) return 0;
      return av > bv ? orderDir : -orderDir;
    });

    return res.json({ count: sorted.length, items: sorted });
  } catch (e: any) {
    return res.status(500).json({ error: "Failed to compute inventory health", message: e?.message || String(e) });
  }
}
