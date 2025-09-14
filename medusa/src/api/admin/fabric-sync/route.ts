import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  ContainerRegistrationKeys,
  Modules,
  ProductStatus
} from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Admin API endpoint to sync a single fabric to Medusa product
 * 
 * This endpoint is called by the admin app whenever a fabric is saved.
 * It creates or updates the corresponding product in Medusa.
 * 
 * POST /admin/fabric-sync
 * Body: { fabric: FabricData }
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const productModule = req.scope.resolve(Modules.PRODUCT)
  
  try {
    // Extract fabric data from request
    const { fabric } = req.body as any
    
    if (!fabric) {
      return res.status(400).json({
        success: false,
        error: "Fabric data is required"
      })
    }

    logger.info(`🔄 Syncing fabric: ${fabric.name} (${fabric.sku})`)

    // Get default sales channel
    const salesChannelModule = req.scope.resolve(Modules.SALES_CHANNEL)
    const [defaultSalesChannel] = await salesChannelModule.listSalesChannels({
      name: "Default Sales Channel",
    })

    if (!defaultSalesChannel) {
      return res.status(500).json({
        success: false,
        error: "No default sales channel found"
      })
    }

    // Transform fabric to product format
    const productData = transformFabricToProduct(fabric, defaultSalesChannel.id)
    
    // Check if product already exists by handle
    const existingProducts = await productModule.listProducts({
      handle: productData.handle,
    })

    let result
    let action

    if (existingProducts.length > 0) {
      // Update existing product
      const existingProduct = existingProducts[0]
      
      // Check if update is needed based on version or updated_at
      const existingVersion = existingProduct.metadata?.version
      const newVersion = fabric.version
      
      if (existingVersion && newVersion && existingVersion >= newVersion) {
        logger.info(`⏭️  Skipping: Product already up-to-date (version ${existingVersion})`)
        return res.json({
          success: true,
          action: "skipped",
          product: existingProduct,
          message: "Product already up-to-date"
        })
      }
      
      result = await updateProductsWorkflow(req.scope).run({
        input: {
          products: [{
            id: existingProduct.id,
            ...productData
          }]
        }
      })
      
      action = "updated"
      logger.info(`✏️  Updated product: ${existingProduct.id}`)
    } else {
      // Create new product
      result = await createProductsWorkflow(req.scope).run({
        input: {
          products: [productData]
        }
      })
      
      action = "created"
      logger.info(`✨ Created new product for fabric: ${fabric.sku}`)
    }

    return res.json({
      success: true,
      action: action,
      product: result.result?.products?.[0],
      message: `Product ${action} successfully`
    })

  } catch (error) {
    logger.error(`❌ Fabric sync failed: ${error.message}`)
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to sync fabric"
    })
  }
}

/**
 * Transform fabric data to Medusa product format
 * (Same as in bulk sync script)
 */
function transformFabricToProduct(fabric: any, salesChannelId: string) {
  // Generate handle from slug or SKU
  const handle = fabric.slug || fabric.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  
  // Prepare image URLs
  const images = []
  if (fabric.main_image_url || fabric.mainImageUrl) {
    images.push({ url: fabric.main_image_url || fabric.mainImageUrl })
  }
  if (fabric.images && Array.isArray(fabric.images)) {
    fabric.images.forEach((url: string) => {
      if (url && !images.find(img => img.url === url)) {
        images.push({ url })
      }
    })
  }

  // Calculate prices (convert to cents)
  const retailPriceCents = Math.round((fabric.retail_price || fabric.retailPrice || 0) * 100)
  const swatchPriceCents = 500 // Fixed $5.00 for swatches
  
  return {
    title: fabric.name,
    handle: handle,
    description: fabric.description || `Premium ${fabric.type} fabric from our ${fabric.collection || 'exclusive'} collection.`,
    status: (fabric.status === 'active' || fabric.status === 'Active' || fabric.isActive) 
      ? ProductStatus.PUBLISHED 
      : ProductStatus.DRAFT,
    
    // Store ALL fabric data in metadata for complete preservation
    metadata: {
      // Identity
      fabric_id: fabric.id,
      sku: fabric.sku,
      version: fabric.version || 1,
      
      // Classification
      type: fabric.type,
      pattern: fabric.pattern,
      collection: fabric.collection,
      manufacturer_id: fabric.manufacturer_id || fabric.manufacturerId,
      manufacturer_name: fabric.manufacturer_name || fabric.manufacturerName || fabric.supplierName,
      designer_name: fabric.designer_name || fabric.designerName,
      country_of_origin: fabric.country_of_origin || fabric.countryOfOrigin,
      
      // Colors
      primary_color: fabric.primary_color || fabric.primaryColor,
      color_hex: fabric.color_hex || fabric.colorHex,
      color_family: fabric.color_family || fabric.colorFamily,
      secondary_colors: fabric.secondary_colors || fabric.secondaryColors,
      
      // Dimensions
      width: fabric.width,
      width_unit: fabric.width_unit || fabric.widthUnit || 'inches',
      weight: fabric.weight,
      weight_unit: fabric.weight_unit || fabric.weightUnit || 'oz/yd',
      thickness: fabric.thickness,
      
      // Composition
      fiber_content: fabric.fiber_content || fabric.fiberContent,
      backing_type: fabric.backing_type || fabric.backingType,
      finish_treatment: fabric.finish_treatment || fabric.finishTreatment,
      
      // Performance
      durability_rating: fabric.durability_rating || fabric.durabilityRating,
      martindale: fabric.martindale,
      wyzenbeek: fabric.wyzenbeek,
      lightfastness: fabric.lightfastness,
      pilling_resistance: fabric.pilling_resistance || fabric.pillingResistance,
      
      // Treatment features (handle both snake_case and camelCase)
      is_stain_resistant: fabric.is_stain_resistant ?? fabric.isStainResistant,
      is_fade_resistant: fabric.is_fade_resistant ?? fabric.isFadeResistant,
      is_water_resistant: fabric.is_water_resistant ?? fabric.isWaterResistant,
      is_pet_friendly: fabric.is_pet_friendly ?? fabric.isPetFriendly,
      is_outdoor_safe: fabric.is_outdoor_safe ?? fabric.isOutdoorSafe,
      is_fire_retardant: fabric.is_fire_retardant ?? fabric.isFireRetardant,
      is_bleach_cleanable: fabric.is_bleach_cleanable ?? fabric.isBleachCleanable,
      is_antimicrobial: fabric.is_antimicrobial ?? fabric.isAntimicrobial,
      
      // Inventory
      stock_quantity: fabric.stock_quantity || fabric.stockQuantity,
      available_quantity: fabric.available_quantity || fabric.availableQuantity || fabric.stockQuantity,
      minimum_order: fabric.minimum_order || fabric.minimumOrder || '1',
      increment_quantity: fabric.increment_quantity || fabric.incrementQuantity || '1',
      lead_time_days: fabric.lead_time_days || fabric.leadTimeDays,
      is_custom_order: fabric.is_custom_order ?? fabric.isCustomOrder,
      
      // Care & Certifications
      care_instructions: fabric.care_instructions || fabric.careInstructions,
      cleaning_code: fabric.cleaning_code || fabric.cleaningCode,
      certifications: fabric.certifications,
      flammability_standard: fabric.flammability_standard || fabric.flammabilityStandard,
      environmental_rating: fabric.environmental_rating || fabric.environmentalRating,
      
      // Images
      thumbnail_url: fabric.thumbnail_url || fabric.thumbnailUrl,
      main_image_url: fabric.main_image_url || fabric.mainImageUrl,
      swatch_image_url: fabric.swatch_image_url || fabric.swatchImageUrl,
      all_images: fabric.images,
      
      // SEO & Marketing
      meta_title: fabric.meta_title || fabric.metaTitle,
      meta_description: fabric.meta_description || fabric.metaDescription,
      tags: fabric.tags,
      is_featured: fabric.is_featured ?? fabric.isFeatured,
      is_new_arrival: fabric.is_new_arrival ?? fabric.isNewArrival,
      is_best_seller: fabric.is_best_seller ?? fabric.isBestSeller,
      
      // Notes & Policies
      internal_notes: fabric.internal_notes || fabric.internalNotes,
      public_notes: fabric.public_notes || fabric.publicNotes,
      warranty_info: fabric.warranty_info || fabric.warrantyInfo,
      return_policy: fabric.return_policy || fabric.returnPolicy,
      
      // Pricing
      cost_price: fabric.cost_price || fabric.costPrice || fabric.procurementCost,
      wholesale_price: fabric.wholesale_price || fabric.wholesalePrice,
      currency: fabric.currency || 'USD',
      price_unit: fabric.price_unit || fabric.priceUnit || 'per_yard',
      
      // Timestamps
      fabric_created_at: fabric.created_at || fabric.createdAt,
      fabric_updated_at: fabric.updated_at || fabric.updatedAt,
      
      // Sync metadata
      last_synced_at: new Date().toISOString(),
      sync_version: "1.0.0"
    },
    
    // Product images
    images: images,
    thumbnail: fabric.thumbnail_url || fabric.thumbnailUrl || fabric.main_image_url || fabric.mainImageUrl,
    
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
        inventory_quantity: Math.floor(fabric.available_quantity || fabric.availableQuantity || fabric.stockQuantity || 0),
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