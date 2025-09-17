import { model } from "@medusajs/framework/utils"

export const InventoryLocation = model.define("inventory_location", {
  id: model.id(),
  name: model.text(),
  code: model.text().unique(),
  address: model.json().nullable(),
  metadata: model.json().nullable(),
  is_active: model.boolean().default(true),
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
})