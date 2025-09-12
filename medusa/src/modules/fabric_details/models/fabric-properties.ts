import { model } from "@medusajs/framework/utils"

export const FabricProperties = model.define("fabric_properties", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  
  // Physical Properties
  composition: model.text().nullable(),
  width: model.text().nullable(),
  weight: model.text().nullable(),
  pattern: model.text().nullable(),
  
  // Color Properties
  color: model.text().nullable(),
  color_family: model.text().nullable(),
  color_hex: model.text().nullable(),
  
  // Usage & Care
  usage: model.enum(["Indoor", "Outdoor", "Both"]).nullable(),
  care_instructions: model.text().nullable(),
  durability: model.text().nullable(),
  durability_rating: model.number().nullable(),
  
  // Manufacturer Details
  manufacturer: model.text().nullable(),
  collection: model.text().nullable(),
  
  // Boolean Properties
  is_pet_friendly: model.boolean().default(false),
  is_stain_resistant: model.boolean().default(false),
  is_outdoor_safe: model.boolean().default(false),
  
  // Additional Properties Array (JSON field)
  properties: model.json().nullable()
})

export default FabricProperties