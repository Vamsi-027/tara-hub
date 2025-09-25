import { Modules } from "@medusajs/framework/utils";

export interface InventoryAdjustmentInput {
  inventory_item_id: string;
  location_id: string;
  delta?: number; // decimal quantity
  to_quantity?: number; // decimal quantity
  reason: string;
  note?: string;
  reference?: string;
  actor_id?: string;
}

export default class InventoryAdjustmentService {
  private logger_: any;

  constructor(container: any) {
    this.logger_ = container.logger || container.resolve?.("logger");
  }

  async recordAdjustment(input: InventoryAdjustmentInput & { new_quantity: number; prev_quantity: number }) {
    // Placeholder audit: log now, persist in D3 module
    this.logger_?.info?.("inventory.adjusted", {
      inventory_item_id: input.inventory_item_id,
      location_id: input.location_id,
      reason: input.reason,
      note: input.note,
      reference: input.reference,
      delta: input.delta,
      to_quantity: input.to_quantity,
      prev_quantity: input.prev_quantity,
      new_quantity: input.new_quantity,
      actor_id: input.actor_id,
      at: new Date().toISOString(),
    });
  }
}

