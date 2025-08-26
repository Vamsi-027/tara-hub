import { model } from "@medusajs/framework/utils"

const FabricDetails = model.define("fabric_details", {
  id: model.id({ prefix: "fabric" }).primaryKey(),
  
  // Link to product
  product_id: model.text(),
  tenant_id: model.text().searchable(),
  
  // Fabric-specific properties
  fabric_type: model.text().searchable().nullable(),
  composition: model.json().default([]), // [{material: 'Cotton', percentage: 80}]
  weight: model.number().nullable(), // gsm
  width: model.number().nullable(), // inches
  color: model.text().searchable().nullable(),
  pattern: model.text().searchable().nullable(),
  
  // Sample configuration
  sample_available: model.boolean().default(true),
  sample_price: model.number().nullable(),
  sample_size: model.text().nullable(), // "8x8 inches"
  
  // Care & certifications
  care_instructions: model.json().default([]),
  certifications: model.json().default([]),
  
  // Performance ratings
  performance_rating: model.json().default({}),
  
  // Timestamps
  created_at: model.dateTime().default("now"),
  updated_at: model.dateTime().default("now"),
  deleted_at: model.dateTime().nullable(),
}).indexes([
  {
    name: "IDX_fabric_product_id",
    on: ["product_id"],
  },
  {
    name: "IDX_fabric_tenant_id",
    on: ["tenant_id"],
  },
  {
    name: "IDX_fabric_type",
    on: ["fabric_type"],
  },
  {
    name: "IDX_fabric_color",
    on: ["color"],
  },
])

export default FabricDetails