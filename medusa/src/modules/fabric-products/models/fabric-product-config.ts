import { model } from "@medusajs/framework/utils"

export enum FabricProductType {
  CONFIGURABLE_FABRIC = "configurable_fabric",         // User selects single fabric
  CONFIGURABLE_SWATCH_SET = "configurable_swatch_set"  // User selects multiple fabrics
}

/**
 * Configuration for fabric-based products
 * Defines how products interact with the fabric catalog
 */
export const FabricProductConfig = model.define("fabric_product_config", {
  id: model.id().primaryKey(),
  product_id: model.text().unique(), // Medusa product ID
  fabric_type: model.enum(FabricProductType),
  
  // Configurable options (Types 1 & 3)
  allow_fabric_selection: model.boolean().default(false),
  fabric_category_filter: model.text().nullable(),
  fabric_collection_filter: model.text().nullable(),
  max_fabric_selections: model.number().default(1),
  min_fabric_selections: model.number().default(1),
  
  // Note: Fixed fabric products use standard Medusa products + fabric-details module
  
  // Pricing configuration
  base_price_override: model.number().nullable(),
  price_per_selection: model.number().nullable(),
  
  // Display settings
  display_fabric_details: model.boolean().default(true),
  display_fabric_image: model.boolean().default(true),
  display_composition: model.boolean().default(true),
  display_specifications: model.boolean().default(false),
  
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
})

/**
 * Tracks fabric selections for orders
 */
export const OrderFabricSelection = model.define("order_fabric_selection", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  line_item_id: model.text(),
  product_id: model.text(),
  
  // Selected fabric snapshot
  fabric_id: model.text(),
  fabric_sku: model.text(),
  fabric_name: model.text(),
  fabric_price: model.number().nullable(),
  fabric_metadata: model.json(), // Complete fabric data snapshot
  
  // For multi-selection products
  selection_index: model.number().default(1),
  
  created_at: model.dateTime().default(() => new Date()),
})

/**
 * Fabric availability and pricing per product
 */
export const FabricProductAvailability = model.define("fabric_product_availability", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  fabric_id: model.text(),
  
  is_available: model.boolean().default(true),
  price_adjustment: model.number().default(0),
  lead_time_days: model.number().nullable(),
  min_order_quantity: model.number().nullable(),
})

export default FabricProductConfig