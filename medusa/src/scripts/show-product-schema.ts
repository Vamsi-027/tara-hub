/**
 * Medusa Product Schema Documentation
 * Shows the key tables and their relationships for product management
 */

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function showProductSchema({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  logger.info("📋 Medusa Product Schema Overview")
  logger.info("=" * 50)
  
  // Define the main product-related tables in Medusa
  const productSchema = {
    core_tables: {
      product: {
        description: "Main product table - stores base product information",
        key_fields: [
          "id (UUID) - Primary key",
          "title (VARCHAR) - Product name", 
          "subtitle (VARCHAR) - Product subtitle",
          "description (TEXT) - Product description",
          "handle (VARCHAR) - URL slug",
          "status (ENUM) - draft, proposed, published, rejected",
          "weight (NUMERIC) - Product weight",
          "length (NUMERIC) - Product length", 
          "width (NUMERIC) - Product width",
          "height (NUMERIC) - Product height",
          "origin_country (VARCHAR) - Country of origin",
          "hs_code (VARCHAR) - Harmonized system code",
          "mid_code (VARCHAR) - Manufacturer identification code",
          "material (VARCHAR) - Product material",
          "collection_id (UUID) - FK to product_collection",
          "type_id (UUID) - FK to product_type",
          "discountable (BOOLEAN) - Can product be discounted",
          "external_id (VARCHAR) - External system ID",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP) - Soft delete",
          "metadata (JSONB) - Custom fields"
        ]
      },
      
      product_variant: {
        description: "Product variants - different options/SKUs of a product",
        key_fields: [
          "id (UUID) - Primary key",
          "title (VARCHAR) - Variant name",
          "product_id (UUID) - FK to product",
          "sku (VARCHAR) - Stock keeping unit",
          "barcode (VARCHAR) - Product barcode",
          "ean (VARCHAR) - European article number",
          "upc (VARCHAR) - Universal product code",
          "variant_rank (INTEGER) - Display order",
          "inventory_quantity (INTEGER) - Stock quantity",
          "allow_backorder (BOOLEAN) - Allow orders when out of stock",
          "manage_inventory (BOOLEAN) - Track inventory",
          "hs_code (VARCHAR) - Harmonized system code",
          "origin_country (VARCHAR) - Country of origin",
          "mid_code (VARCHAR) - Manufacturer ID code",
          "material (VARCHAR) - Variant material",
          "weight (NUMERIC) - Variant weight",
          "length (NUMERIC) - Variant length",
          "width (NUMERIC) - Variant width", 
          "height (NUMERIC) - Variant height",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)",
          "metadata (JSONB) - Custom fields"
        ]
      },
      
      product_collection: {
        description: "Product collections for grouping related products",
        key_fields: [
          "id (UUID) - Primary key",
          "title (VARCHAR) - Collection name",
          "handle (VARCHAR) - URL slug",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)",
          "metadata (JSONB) - Custom fields"
        ]
      },
      
      product_category: {
        description: "Hierarchical product categories",
        key_fields: [
          "id (UUID) - Primary key", 
          "name (VARCHAR) - Category name",
          "description (TEXT) - Category description",
          "handle (VARCHAR) - URL slug",
          "mpath (VARCHAR) - Materialized path for hierarchy",
          "is_active (BOOLEAN) - Category status",
          "is_internal (BOOLEAN) - Internal use only",
          "rank (INTEGER) - Display order",
          "parent_category_id (UUID) - FK to parent category",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "metadata (JSONB) - Custom fields"
        ]
      }
    },
    
    relationship_tables: {
      product_category_products: {
        description: "Many-to-many relationship between products and categories",
        key_fields: [
          "product_id (UUID) - FK to product",
          "product_category_id (UUID) - FK to product_category"
        ]
      },
      
      product_images: {
        description: "Product images and media",
        key_fields: [
          "id (UUID) - Primary key",
          "product_id (UUID) - FK to product", 
          "url (VARCHAR) - Image URL",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)",
          "metadata (JSONB) - Custom fields (alt text, etc.)"
        ]
      },
      
      product_options: {
        description: "Product option definitions (Size, Color, etc.)",
        key_fields: [
          "id (UUID) - Primary key",
          "title (VARCHAR) - Option name",
          "product_id (UUID) - FK to product",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)",
          "metadata (JSONB) - Custom fields"
        ]
      },
      
      product_option_values: {
        description: "Specific values for product options",
        key_fields: [
          "id (UUID) - Primary key",
          "value (VARCHAR) - Option value",
          "option_id (UUID) - FK to product_options",
          "variant_id (UUID) - FK to product_variant",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)",
          "metadata (JSONB) - Custom fields"
        ]
      }
    },
    
    pricing_tables: {
      price_set: {
        description: "Price sets for managing complex pricing",
        key_fields: [
          "id (UUID) - Primary key",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)"
        ]
      },
      
      price_list: {
        description: "Price lists for different customer groups/regions",
        key_fields: [
          "id (UUID) - Primary key",
          "name (VARCHAR) - Price list name",
          "description (TEXT) - Price list description", 
          "type (ENUM) - sale, override",
          "status (ENUM) - active, draft",
          "starts_at (TIMESTAMP) - Valid from date",
          "ends_at (TIMESTAMP) - Valid until date",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)"
        ]
      },
      
      money_amount: {
        description: "Specific price amounts with currency",
        key_fields: [
          "id (UUID) - Primary key",
          "currency_code (VARCHAR) - Currency (USD, EUR, etc.)",
          "amount (NUMERIC) - Price amount in minor units (cents)",
          "price_set_id (UUID) - FK to price_set",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)"
        ]
      }
    },
    
    inventory_tables: {
      inventory_item: {
        description: "Inventory items linked to product variants",
        key_fields: [
          "id (UUID) - Primary key",
          "sku (VARCHAR) - Stock keeping unit",
          "origin_country (VARCHAR) - Country of origin",
          "hs_code (VARCHAR) - Harmonized system code",
          "mid_code (VARCHAR) - Manufacturer ID code", 
          "material (VARCHAR) - Item material",
          "weight (NUMERIC) - Item weight",
          "length (NUMERIC) - Item length",
          "width (NUMERIC) - Item width",
          "height (NUMERIC) - Item height",
          "requires_shipping (BOOLEAN) - Needs shipping",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)",
          "metadata (JSONB) - Custom fields"
        ]
      },
      
      inventory_level: {
        description: "Inventory levels at different stock locations",
        key_fields: [
          "id (UUID) - Primary key",
          "inventory_item_id (UUID) - FK to inventory_item",
          "location_id (UUID) - FK to stock_location",
          "stocked_quantity (INTEGER) - Available quantity",
          "reserved_quantity (INTEGER) - Reserved/allocated quantity",
          "incoming_quantity (INTEGER) - Incoming stock",
          "created_at (TIMESTAMP)",
          "updated_at (TIMESTAMP)",
          "deleted_at (TIMESTAMP)",
          "metadata (JSONB) - Custom fields"
        ]
      }
    }
  }
  
  // Log the schema structure
  for (const [section, tables] of Object.entries(productSchema)) {
    logger.info(`\n📂 ${section.replace('_', ' ').toUpperCase()}`)
    logger.info("-".repeat(40))
    
    for (const [tableName, tableInfo] of Object.entries(tables)) {
      logger.info(`\n🗃️  ${tableName}`)
      logger.info(`   ${tableInfo.description}`)
      logger.info(`   Key Fields:`)
      tableInfo.key_fields.forEach(field => {
        logger.info(`     • ${field}`)
      })
    }
  }
  
  // Show key relationships
  logger.info("\n🔗 KEY RELATIONSHIPS")
  logger.info("-".repeat(40))
  logger.info("• product → product_variant (1:many)")
  logger.info("• product → product_collection (many:1)")  
  logger.info("• product → product_category (many:many via product_category_products)")
  logger.info("• product → product_images (1:many)")
  logger.info("• product → product_options (1:many)")
  logger.info("• product_options → product_option_values (1:many)")
  logger.info("• product_variant → product_option_values (1:many)")
  logger.info("• product_variant → inventory_item (1:1)")
  logger.info("• inventory_item → inventory_level (1:many)")
  logger.info("• product_variant → price_set (1:1)")
  logger.info("• price_set → money_amount (1:many)")
  
  logger.info("\n💡 FABRIC-SPECIFIC USAGE")
  logger.info("-".repeat(40))
  logger.info("For fabric products, use:")
  logger.info("• product.metadata for fabric properties (composition, width, weight, etc.)")
  logger.info("• product_variant for different colors/patterns of the same fabric")
  logger.info("• product_collection to group fabrics by collection (Essential, Luxury, etc.)")
  logger.info("• product_category for fabric types (Cotton, Velvet, Outdoor, etc.)")
  logger.info("• product_images for swatch images")
  logger.info("• inventory_item/inventory_level for stock management")
  
  logger.info("\n✅ Schema overview complete!")
}