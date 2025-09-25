import { model } from "@medusajs/framework/utils";

export const InventoryAdjustment = model.define("inventory_adjustment", {
  id: model.id().primaryKey(),
  inventory_item_id: model.text(),
  location_id: model.text(),
  reason: model.text(),
  note: model.text().nullable(),
  reference: model.text().nullable(),
  delta: model.number().nullable(),
  to_quantity: model.number().nullable(),
  prev_quantity: model.number(),
  new_quantity: model.number(),
  actor_id: model.text().nullable(),
  created_at: model.dateTime().defaultNow(),
});

export default InventoryAdjustment

