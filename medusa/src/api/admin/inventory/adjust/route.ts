import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { enforceScopes, INVENTORY_SCOPES } from "../../../utils/rbac";
import { toBaseUnits, getBaseUnitFactor } from "../../../services/inventory-policy.service";
import InventoryAdjustmentService from "../../../services/inventory-adjustment.service";
import { INVENTORY_AUDIT_MODULE } from "../../../modules/inventory_audit";

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
