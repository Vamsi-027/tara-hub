import { model } from "@medusajs/framework/utils"

export const ReservationItem = model.define("reservation_item", {
  id: model.id(),
  inventory_item_id: model.text(),
  location_id: model.text(),
  quantity: model.number(),
  line_item_id: model.text().nullable(),
  external_id: model.text().nullable(),
  description: model.text().nullable(),
  created_by: model.text().nullable(),
  metadata: model.json().nullable(),
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
  expires_at: model.dateTime().nullable(),
})