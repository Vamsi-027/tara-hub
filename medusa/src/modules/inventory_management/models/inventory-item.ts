import { model } from "@medusajs/framework/utils"

export const InventoryItem = model.define("inventory_item", {
  id: model.id(),
  sku: model.text().unique(),
  variant_id: model.text().nullable(),
  title: model.text().nullable(),
  description: model.text().nullable(),
  thumbnail: model.text().nullable(),
  requires_shipping: model.boolean().default(true),
  metadata: model.json().nullable(),
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
})