import { model } from "@medusajs/framework/utils"

export const InventoryLevel = model.define("inventory_level", {
  id: model.id(),
  inventory_item_id: model.text(),
  location_id: model.text(),
  stocked_quantity: model.number().default(0),
  reserved_quantity: model.number().default(0),
  available_quantity: model.number().default(0),
  incoming_quantity: model.number().default(0),
  metadata: model.json().nullable(),
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
}).indexes([
  {
    name: "idx_inventory_level_item_location",
    on: ["inventory_item_id", "location_id"],
    unique: true,
  },
])