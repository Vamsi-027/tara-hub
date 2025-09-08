import { Client } from "pg"
import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Sync all fabrics from admin database to Medusa products
 * 
 * This script reads fabrics from the admin PostgreSQL database
 * and creates/updates corresponding products in Medusa.
 * 
 * Usage: npm run sync:fabrics
 */
export default async function syncAllFabrics({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const productModule = container.resolve(Modules.PRODUCT)
  
  logger.info("🔄 Starting fabric-to-product sync...")

  // Connect to admin database
  const adminDb = new Client({
    connectionString: process.env.ADMIN_DATABASE_URL || 
                     process.env.DATABASE_URL ||
                     process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === "production" ? {
      rejectUnauthorized: false
    } : undefined
  })

  try {
    await adminDb.connect()
    logger.info("✅ Connected to admin database")

    // Get sales channel for products
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
    const [defaultSalesChannel] = await salesChannelModule.listSalesChannels({
      name: "Default Sales Channel",
    })

    if (!defaultSalesChannel) {
      logger.error("❌ No default sales channel found")
      return
    }

    // Count total fabrics
    const countResult = await adminDb.query(`
      SELECT COUNT(*) as total 
      FROM fabrics 
      WHERE deleted_at IS NULL 
      AND status = 'active'
    `)
    const totalFabrics = parseInt(countResult.rows[0].total)
    logger.info(`📊 Found ${totalFabrics} active fabrics to sync`)

    // Fetch all active fabrics
    const fabricsResult = await adminDb.query(`
      SELECT 
        id, sku, version, name, description, type, status,
        pattern, primary_color, color_hex, color_family, secondary_colors,
        manufacturer_id, manufacturer_name, collection, designer_name,
        country_of_origin, retail_price, wholesale_price, cost_price,
        currency, price_unit, width, width_unit, weight, weight_unit,
        thickness, fiber_content, backing_type, finish_treatment,
        durability_rating, martindale, wyzenbeek, lightfastness,
        pilling_resistance, is_stain_resistant, is_fade_resistant,
        is_water_resistant, is_pet_friendly, is_outdoor_safe,
        is_fire_retardant, is_bleach_cleanable, is_antimicrobial,
        stock_quantity, reserved_quantity, available_quantity,
        minimum_order, increment_quantity, reorder_point, reorder_quantity,
        lead_time_days, is_custom_order, warehouse_location, bin_location,
        roll_count, care_instructions, cleaning_code, thumbnail_url,
        main_image_url, images, swatch_image_url, texture_image_url,
        certifications, flammability_standard, environmental_rating,
        meta_title, meta_description, slug, tags, search_keywords,
        is_featured, is_new_arrival, is_best_seller, display_order,
        view_count, favorite_count, sample_request_count, last_viewed_at,
        internal_notes, public_notes, warranty_info, return_policy,
        created_at, updated_at
      FROM fabrics 
      WHERE deleted_at IS NULL 
      AND status = 'active'
      ORDER BY created_at DESC
    `)

    logger.info(`📦 Processing ${fabricsResult.rows.length} fabrics...`)

    let created = 0
    let updated = 0
    let failed = 0

    // Process each fabric
    for (const fabric of fabricsResult.rows) {
      try {
        // Transform fabric to Medusa product format
        const productData = transformFabricToProduct(fabric, defaultSalesChannel.id)
        
        // Check if product already exists by handle
        const existingProducts = await productModule.listProducts({
          handle: productData.handle,
        })

        if (existingProducts.length > 0) {
          // Update existing product
          const existingProduct = existingProducts[0]
          
          await updateProductsWorkflow(container).run({
            input: {
              products: [{
                id: existingProduct.id,
                ...productData
              }]
            }
          })
          
          updated++
          logger.info(`✏️  Updated: ${fabric.name} (${fabric.sku})`)
        } else {
          // Create new product
          await createProductsWorkflow(container).run({
            input: {
              products: [productData]
            }
          })
          
          created++
          logger.info(`✨ Created: ${fabric.name} (${fabric.sku})`)
        }

      } catch (error) {
        failed++
        logger.error(`❌ Failed to sync fabric ${fabric.sku}: ${error.message}`)
      }
    }

    // Summary
    logger.info("=" * 50)
    logger.info("🎉 Sync completed!")
    logger.info(`✨ Created: ${created} products`)
    logger.info(`✏️  Updated: ${updated} products`)
    logger.info(`❌ Failed: ${failed} products`)
    logger.info(`📊 Total processed: ${created + updated + failed}/${totalFabrics}`)

  } catch (error) {
    logger.error(`❌ Sync failed: ${error.message}`)
    throw error
  } finally {
    await adminDb.end()
    logger.info("🔌 Disconnected from admin database")
  }
}

/**
 * Transform fabric data to Medusa product format
 */
function transformFabricToProduct(fabric: any, salesChannelId: string) {
  // Generate handle from slug or SKU
  const handle = fabric.slug || fabric.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  // Prepare image URLs
  const images = []
  if (fabric.main_image_url) {
    images.push({ url: fabric.main_image_url })
  }
  if (fabric.images && Array.isArray(fabric.images)) {
    fabric.images.forEach((url: string) => {
      if (url && !images.find(img => img.url === url)) {
        images.push({ url })
      }
    })
  }

  // Calculate prices (convert to cents)
  const retailPriceCents = Math.round((fabric.retail_price || 0) * 100)
  const wholesalePriceCents = Math.round((fabric.wholesale_price || 0) * 100)
  const swatchPriceCents = 500 // Fixed $5.00 for swatches
  
  return {
    title: fabric.name,
    handle: handle,
    description: fabric.description || `Premium ${fabric.type} fabric from our ${fabric.collection || 'exclusive'} collection.`,
    status: fabric.status === 'active' ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
    
    // Store ALL fabric data in metadata for complete preservation
    metadata: {
      // Identity
      fabric_id: fabric.id,
      sku: fabric.sku,
      version: fabric.version,
      
      // Classification
      type: fabric.type,
      pattern: fabric.pattern,
      collection: fabric.collection,
      manufacturer_id: fabric.manufacturer_id,
      manufacturer_name: fabric.manufacturer_name,
      designer_name: fabric.designer_name,
      country_of_origin: fabric.country_of_origin,
      
      // Colors
      primary_color: fabric.primary_color,
      color_hex: fabric.color_hex,
      color_family: fabric.color_family,
      secondary_colors: fabric.secondary_colors,
      
      // Dimensions
      width: fabric.width,
      width_unit: fabric.width_unit,
      weight: fabric.weight,
      weight_unit: fabric.weight_unit,
      thickness: fabric.thickness,
      
      // Composition (preserving admin's fiber_content JSONB)
      fiber_content: fabric.fiber_content,
      backing_type: fabric.backing_type,
      finish_treatment: fabric.finish_treatment,
      
      // Performance
      durability_rating: fabric.durability_rating,
      martindale: fabric.martindale,
      wyzenbeek: fabric.wyzenbeek,
      lightfastness: fabric.lightfastness,
      pilling_resistance: fabric.pilling_resistance,
      
      // Treatment features
      is_stain_resistant: fabric.is_stain_resistant,
      is_fade_resistant: fabric.is_fade_resistant,
      is_water_resistant: fabric.is_water_resistant,
      is_pet_friendly: fabric.is_pet_friendly,
      is_outdoor_safe: fabric.is_outdoor_safe,
      is_fire_retardant: fabric.is_fire_retardant,
      is_bleach_cleanable: fabric.is_bleach_cleanable,
      is_antimicrobial: fabric.is_antimicrobial,
      
      // Inventory
      stock_quantity: fabric.stock_quantity,
      reserved_quantity: fabric.reserved_quantity,
      available_quantity: fabric.available_quantity,
      minimum_order: fabric.minimum_order,
      increment_quantity: fabric.increment_quantity,
      reorder_point: fabric.reorder_point,
      reorder_quantity: fabric.reorder_quantity,
      lead_time_days: fabric.lead_time_days,
      is_custom_order: fabric.is_custom_order,
      warehouse_location: fabric.warehouse_location,
      bin_location: fabric.bin_location,
      roll_count: fabric.roll_count,
      
      // Care & Certifications
      care_instructions: fabric.care_instructions,
      cleaning_code: fabric.cleaning_code,
      certifications: fabric.certifications,
      flammability_standard: fabric.flammability_standard,
      environmental_rating: fabric.environmental_rating,
      
      // Images
      thumbnail_url: fabric.thumbnail_url,
      main_image_url: fabric.main_image_url,
      swatch_image_url: fabric.swatch_image_url,
      texture_image_url: fabric.texture_image_url,
      all_images: fabric.images,
      
      // SEO & Marketing
      meta_title: fabric.meta_title,
      meta_description: fabric.meta_description,
      tags: fabric.tags,
      search_keywords: fabric.search_keywords,
      is_featured: fabric.is_featured,
      is_new_arrival: fabric.is_new_arrival,
      is_best_seller: fabric.is_best_seller,
      display_order: fabric.display_order,
      
      // Analytics
      view_count: fabric.view_count,
      favorite_count: fabric.favorite_count,
      sample_request_count: fabric.sample_request_count,
      last_viewed_at: fabric.last_viewed_at,
      
      // Notes & Policies
      internal_notes: fabric.internal_notes,
      public_notes: fabric.public_notes,
      warranty_info: fabric.warranty_info,
      return_policy: fabric.return_policy,
      
      // Pricing (preserved for reference)
      cost_price: fabric.cost_price,
      currency: fabric.currency,
      price_unit: fabric.price_unit,
      
      // Timestamps
      fabric_created_at: fabric.created_at,
      fabric_updated_at: fabric.updated_at,
      
      // Sync metadata
      last_synced_at: new Date().toISOString(),
      sync_version: "1.0.0"
    },
    
    // Product images
    images: images,
    thumbnail: fabric.thumbnail_url || fabric.main_image_url,
    
    // Sales channel
    sales_channels: [{ id: salesChannelId }],
    
    // Options for variants
    options: [
      {
        title: "Unit",
        values: ["Per Yard", "Sample Swatch"]
      }
    ],
    
    // Variants with pricing and inventory
    variants: [
      {
        title: `${fabric.name} - Per Yard`,
        sku: `${fabric.sku}-YARD`,
        manage_inventory: true,
        inventory_quantity: Math.floor(fabric.available_quantity || 0),
        options: {
          Unit: "Per Yard"
        },
        prices: [
          {
            amount: retailPriceCents,
            currency_code: (fabric.currency || 'USD').toLowerCase()
          }
        ]
      },
      {
        title: `${fabric.name} - Sample Swatch`,
        sku: `${fabric.sku}-SWATCH`,
        manage_inventory: false, // Swatches always available
        options: {
          Unit: "Sample Swatch"
        },
        prices: [
          {
            amount: swatchPriceCents,
            currency_code: (fabric.currency || 'USD').toLowerCase()
          }
        ]
      }
    ]
  }
}