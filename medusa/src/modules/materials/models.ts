import { model } from "@medusajs/framework/utils"

/**
 * Material Model
 * Represents fabric materials and their properties
 */
export const Material = model.define("material", {
  id: model.text().primaryKey(),
  name: model.text(),
  properties: model.json().default({}),
})

export default Material