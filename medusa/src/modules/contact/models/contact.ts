import { model } from "@medusajs/framework/utils"

const Contact = model.define("contact", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  subject: model.text(),
  message: model.text(),
  orderNumber: model.text().nullable(),
  status: model.enum(["new", "in_progress", "resolved", "closed"]).default("new"),
  priority: model.enum(["low", "medium", "high", "urgent"]).default("medium"),
  category: model.text().nullable(),
  source: model.text().default("fabric_store"),
  adminNotes: model.text().nullable(),
  respondedAt: model.dateTime().nullable()
})

export default Contact