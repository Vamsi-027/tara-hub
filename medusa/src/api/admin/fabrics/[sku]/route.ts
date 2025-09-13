import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Client } from "pg"

/**
 * GET /admin/fabrics/:sku
 * 
 * Fetch fabric details from neondb by SKU
 * Returns fabric data mapped to Medusa product format
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Get CDN prefix from environment
  const CDN_PREFIX = process.env.FABRIC_CDN_PREFIX || 'https://cdn.deepcrm.ai'
  
  const { sku } = req.params

  if (!sku) {
    return res.status(400).json({
      error: "SKU parameter is required"
    })
  }

  let client: Client | null = null

  try {
    // Connect directly to neondb database where fabrics table exists
    // Using the DATABASE_URL from env but replacing medusa with neondb database
    const baseUrl = process.env.DATABASE_URL
    
    if (!baseUrl) {
      return res.status(500).json({
        error: "Database connection not configured"
      })
    }

    // Parse and reconstruct the connection string to use neondb database
    const urlParts = baseUrl.match(/^(postgres:\/\/[^/]+\/)([^?]+)(.*)$/)
    if (!urlParts) {
      return res.status(500).json({
        error: "Invalid database URL format"
      })
    }

    // Construct connection string for neondb database
    const connectionString = `${urlParts[1]}neondb${urlParts[3] || ''}${urlParts[3]?.includes('sslmode=') ? '' : (urlParts[3] ? '&' : '?') + 'sslmode=require'}`
    
    client = new Client({
      connectionString: connectionString
    })

    await client.connect()

    // Query fabrics table by SKU with actual column names
    const query = `
      SELECT 
        id,
        sku,
        name,
        description,
        yardage_price,
        swatch_price,
        procurement_cost,
        images,
        cdn_urls,
        width,
        fiber_content,
        pattern,
        collection,
        brand,
        supplier_name,
        supplier_id,
        category,
        types,
        style,
        colors,
        primary_color,
        secondary_colors,
        color_family,
        usage_suitability,
        performance_metrics,
        martindale,
        stain_resistant,
        fade_resistant,
        ca_117,
        bleach_cleanable,
        washable,
        cleaning,
        cleaning_code,
        cleaning_pdf,
        stock_unit,
        low_stock_threshold,
        is_active,
        is_featured,
        availability,
        grade,
        closeout,
        quick_ship,
        h_repeat,
        v_repeat,
        keywords,
        meta_title,
        meta_description,
        specifications,
        custom_fields,
        additional_features,
        technical_documents
      FROM fabrics 
      WHERE sku = $1
      LIMIT 1
    `

    const result = await client.query(query, [sku])

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `Fabric with SKU "${sku}" not found`
      })
    }

    const fabric = result.rows[0]

    // Extract images from cdn_urls or images field
    let images = []
    let thumbnail = null
    
    if (fabric.cdn_urls?.images?.length > 0) {
      // Process cdn_urls.images - these have 'key' field with the actual image path
      images = fabric.cdn_urls.images.map((img: any) => {
        // Use the key field which contains the actual image path
        const imagePath = img.key || img.url
        const imageUrl = imagePath.startsWith('http') 
          ? imagePath 
          : `${CDN_PREFIX}/${imagePath}`
        return { url: imageUrl }
      })
      
      const firstImagePath = fabric.cdn_urls.images[0].key || fabric.cdn_urls.images[0].url
      thumbnail = firstImagePath.startsWith('http')
        ? firstImagePath
        : `${CDN_PREFIX}/${firstImagePath}`
    } else if (fabric.images?.length > 0) {
      // Add CDN prefix to image URLs if they're not already full URLs
      images = fabric.images.map((url: string) => ({
        url: url.startsWith('http') ? url : `${CDN_PREFIX}/${url}`
      }))
      thumbnail = fabric.images[0].startsWith('http') 
        ? fabric.images[0] 
        : `${CDN_PREFIX}/${fabric.images[0]}`
    }

    // Transform fabric data to Medusa product format
    const productData = {
      // Basic product info
      title: fabric.name,
      handle: fabric.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: fabric.description || '',
      status: fabric.is_active ? 'published' : 'draft',
      thumbnail: thumbnail,
      images: images,
      
      // Categories and organization
      collection: fabric.collection,
      type: fabric.types,
      tags: fabric.keywords ? fabric.keywords.split(',').map((t: string) => t.trim()) : [],
      
      // Pricing for variants
      prices: {
        yard: {
          amount: parseFloat(fabric.yardage_price || '0'),
          currency_code: 'USD'
        },
        swatch: {
          amount: parseFloat(fabric.swatch_price || '5'),
          currency_code: 'USD'
        }
      },
      
      // Inventory
      inventory: {
        stock_unit: fabric.stock_unit || 'yards',
        low_stock_threshold: fabric.low_stock_threshold,
        availability: fabric.availability
      },
      
      // All fabric metadata
      metadata: {
        // Basic Info
        fabric_id: fabric.id,
        sku: fabric.sku,
        brand: fabric.brand,
        supplier_name: fabric.supplier_name,
        supplier_id: fabric.supplier_id,
        category: fabric.category,
        pattern: fabric.pattern,
        style: fabric.style,
        
        // Colors
        colors: fabric.colors,
        primary_color: fabric.primary_color,
        secondary_colors: fabric.secondary_colors,
        color_family: fabric.color_family,
        
        // Physical Properties
        composition: fabric.fiber_content,
        width: fabric.width,
        h_repeat: fabric.h_repeat,
        v_repeat: fabric.v_repeat,
        
        // Usage & Performance
        usage_suitability: fabric.usage_suitability,
        performance_metrics: fabric.performance_metrics,
        martindale: fabric.martindale,
        
        // Features (boolean flags)
        stain_resistant: fabric.stain_resistant,
        fade_resistant: fabric.fade_resistant,
        ca_117: fabric.ca_117,
        bleach_cleanable: fabric.bleach_cleanable,
        washable: fabric.washable,
        quick_ship: fabric.quick_ship,
        closeout: fabric.closeout,
        is_featured: fabric.is_featured,
        
        // Cleaning & Care
        cleaning: fabric.cleaning,
        cleaning_code: fabric.cleaning_code,
        cleaning_pdf: fabric.cleaning_pdf,
        
        // Pricing
        procurement_cost: fabric.procurement_cost,
        
        // Grade & Availability
        grade: fabric.grade,
        availability: fabric.availability,
        
        // SEO
        meta_title: fabric.meta_title,
        meta_description: fabric.meta_description,
        
        // Additional data
        specifications: fabric.specifications || {},
        custom_fields: fabric.custom_fields || {},
        additional_features: fabric.additional_features || {},
        technical_documents: fabric.technical_documents || {}
      },
      
      // Suggested product options
      options: [
        {
          title: "Type",
          values: ["Swatch", "Fabric"]
        }
      ],
      
      // Raw fabric data for reference
      _raw: fabric
    }

    return res.json({
      success: true,
      fabric: productData
    })

  } catch (error) {
    console.error('Error fetching fabric:', error)
    return res.status(500).json({
      error: "Failed to fetch fabric details",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  } finally {
    if (client) {
      await client.end()
    }
  }
}