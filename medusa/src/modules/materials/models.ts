import { model } from "@medusajs/framework/utils"

/**
 * Material Model
 * Direct mirror of admin materials table
 */
export const Material = model.define("material", {
  id: model.text().primaryKey(), // Use same ID from admin
  
  name: model.text(),
  
  properties: model.json().default({})
})