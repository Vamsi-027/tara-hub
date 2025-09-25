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

// Inline inventory adjustment service
class InventoryAdjustmentService {
  private logger_: any;

  constructor(container: any) {
    this.logger_ = container.logger || container.resolve?.("logger");
  }

  async recordAdjustment(input: any) {
    this.logger_?.info?.("inventory.adjusted", {
      ...input,
      at: new Date().toISOString(),
    });
  }
}

const INVENTORY_AUDIT_MODULE = "inventoryAudit";

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

type AdjustBody = {
  inventory_item_id: string;
  location_id: string;
  delta?: number; // decimal
  to_quantity?: number; // decimal
  reason: string;
  note?: string;
  reference?: string;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    if (!enforceScopes(req, res, [INVENTORY_SCOPES.WRITE])) return;

    const body = req.body as AdjustBody;
    const { inventory_item_id, location_id, delta, to_quantity, reason, note, reference } = body || ({} as any);

    if (!inventory_item_id || !location_id || !reason) {
      return res.status(400).json({ error: "inventory_item_id, location_id, and reason are required" });
    }
    if ((delta == null && to_quantity == null) || (delta != null && to_quantity != null)) {
      return res.status(400).json({ error: "Provide exactly one of delta or to_quantity" });
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const inventoryService = req.scope.resolve(Modules.INVENTORY) as unknown as {
      updateInventoryLevels: (levels: Array<{ inventory_item_id: string; location_id: string; stocked_quantity: number }>) => Promise<any>;
    };

    // Load current level and metadata for conversion
    const { data: levels } = await query.graph({
      entity: "inventory_level",
      fields: [
        "id",
        "stocked_quantity",
        "inventory_item_id",
        "location_id",
        "inventory_item.metadata",
      ],
      filters: { inventory_item_id, location_id },
      pagination: { take: 1, skip: 0 },
    });

    const level = levels?.[0];
    if (!level) {
      return res.status(404).json({ error: "Inventory level not found for given item/location" });
    }

    const minInc = level.inventory_item?.metadata?.min_increment;
    const min_increment = typeof minInc === "number" && minInc > 0 ? minInc : 1;
    const factor = getBaseUnitFactor(min_increment);

    const prevUnits = typeof level.stocked_quantity === "number" ? level.stocked_quantity : 0;
    const deltaUnits = delta != null ? toBaseUnits(delta, min_increment, delta >= 0 ? "up" : "down") : undefined;
    const toUnits = to_quantity != null ? toBaseUnits(to_quantity, min_increment, "nearest") : undefined;

    const newUnits = typeof toUnits === "number" ? toUnits : prevUnits + (deltaUnits as number);
    if (newUnits < 0) {
      return res.status(400).json({ error: "Resulting quantity cannot be negative" });
    }

    // Update inventory level transactionally via inventory module
    await inventoryService.updateInventoryLevels([
      { inventory_item_id, location_id, stocked_quantity: newUnits },
    ]);

    // Audit: write to module if available, else log fallback
    const auditModule: any = (() => {
      try { return req.scope.resolve(INVENTORY_AUDIT_MODULE) } catch { return null }
    })();
    const auditPayload = {
      inventory_item_id,
      location_id,
      delta,
      to_quantity,
      reason,
      note,
      reference,
      prev_quantity: prevUnits / factor,
      new_quantity: newUnits / factor,
      actor_id: (req as any).auth?.actor_id || (req as any).user?.id,
    } as any;
    if (auditModule?.createInventoryAdjustments) {
      await auditModule.createInventoryAdjustments({ inventory_adjustments: [auditPayload] });
    } else {
      const audit = new InventoryAdjustmentService(req.scope);
      await audit.recordAdjustment(auditPayload);
    }

    return res.json({
      success: true,
      inventory_item_id,
      location_id,
      prev_quantity: prevUnits / factor,
      new_quantity: newUnits / factor,
      reason,
      note,
      reference,
    });
  } catch (e: any) {
    return res.status(500).json({ error: "Failed to adjust inventory", message: e?.message || String(e) });
  }
}
