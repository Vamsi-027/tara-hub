import { model } from "@medusajs/framework/utils"

/**
 * Contact form submission entity
 * Stores customer inquiries and support requests from the fabric store
 */
const Contact = model.define("contact", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
  email: model.text().searchable(),
  phone: model.text().nullable(),
  subject: model.text().searchable(),
  message: model.text(),
  order_number: model.text().nullable(),
  status: model.enum(["new", "in_progress", "resolved", "closed"]).default("new"),
  priority: model.enum(["low", "medium", "high", "urgent"]).default("medium"),
  category: model.text().nullable(), // e.g., "fabric_inquiry", "order_support", "general"
  source: model.text().default("fabric_store"), // Track source of submission
  admin_notes: model.text().nullable(), // Internal notes for admin use
  responded_at: model.dateTime().nullable(),
  created_at: model.dateTime().default("now"),
  updated_at: model.dateTime().default("now"),
  deleted_at: model.dateTime().nullable()
})

export default Contact