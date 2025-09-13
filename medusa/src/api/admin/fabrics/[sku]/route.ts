import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Client } from "pg"
import { authenticate } from "@medusajs/framework/http"

/**
 * GET /admin/fabrics/:sku
 * 
 * Fetch fabric details from neondb by SKU
 * Returns fabric data mapped to Medusa product format
 */
export const GET = [
  authenticate("user", ["session", "bearer"]),
  async (
    req: MedusaRequest,
    res: MedusaResponse
  ) => {
  const { sku } = req.params

  if (!sku) {
    return res.status(400).json({
      error: "SKU parameter is required"
    })
  }

  let client: Client | null = null

  try {
    // Connect to neondb (same database, fabrics table)
    const connectionString = process.env.DATABASE_URL
    
    if (!connectionString) {
      return res.status(500).json({
        error: "Database connection not configured"
      })
    }

    // Add SSL mode if not present
    const sslConnectionString = connectionString.includes('sslmode=') 
      ? connectionString 
      : connectionString + (connectionString.includes('?') ? '&' : '?') + 'sslmode=require'

    client = new Client({
      connectionString: sslConnectionString
    })

    await client.connect()

    // Query fabrics table by SKU
    const query = `
      SELECT 
        id,
        sku,
        name,
        description,
        retail_price,
        wholesale_price,
        cost_price,
        yardage_price,
        swatch_price,
        thumbnail_url,
        main_image_url,
        images,
        width,
        weight,
        thickness,
        fiber_content,
        pattern,
        collection,
        manufacturer,
        supplier,
        category,
        type,
        style,
        color,
        color_family,
        usage,
        durability_rating,
        martindale,
        wyzenbeek,
        stain_resistant,
        fade_resistant,
        water_resistant,
        pet_friendly,
        outdoor_safe,
        contract_grade,
        fire_retardant,
        greenguard_certified,
        oeko_tex_certified,
        certifications,
        care_instructions,
        stock_quantity,
        available_quantity,
        minimum_order_quantity,
        lead_time_days,
        stock_unit,
        status,
        tags,
        metadata
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

    // Transform fabric data to Medusa product format
    const productData = {
      // Basic product info
      title: fabric.name,
      handle: fabric.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: fabric.description || '',
      status: fabric.status === 'active' ? 'published' : 'draft',
      thumbnail: fabric.thumbnail_url,
      images: fabric.images || [fabric.main_image_url].filter(Boolean),
      
      // Categories and organization
      collection: fabric.collection,
      type: fabric.type,
      tags: fabric.tags || [],
      
      // Pricing for variants
      prices: {
        yard: {
          amount: parseFloat(fabric.yardage_price || fabric.retail_price || '0'),
          currency_code: 'USD'
        },
        swatch: {
          amount: parseFloat(fabric.swatch_price || '5'),
          currency_code: 'USD'
        }
      },
      
      // Inventory
      inventory: {
        quantity: parseInt(fabric.stock_quantity || '0'),
        available: parseInt(fabric.available_quantity || '0'),
        min_order: parseInt(fabric.minimum_order_quantity || '1'),
        stock_unit: fabric.stock_unit || 'yards'
      },
      
      // All fabric metadata
      metadata: {
        // Basic Info
        fabric_id: fabric.id,
        sku: fabric.sku,
        brand: fabric.manufacturer,
        supplier: fabric.supplier,
        category: fabric.category,
        pattern: fabric.pattern,
        style: fabric.style,
        
        // Colors
        color: fabric.color,
        color_family: fabric.color_family,
        
        // Physical Properties
        composition: fabric.fiber_content,
        width: fabric.width,
        weight: fabric.weight,
        thickness: fabric.thickness,
        
        // Usage & Performance
        usage: fabric.usage,
        durability_rating: fabric.durability_rating,
        martindale: fabric.martindale,
        wyzenbeek: fabric.wyzenbeek,
        
        // Features (boolean flags)
        stain_resistant: fabric.stain_resistant,
        fade_resistant: fabric.fade_resistant,
        water_resistant: fabric.water_resistant,
        pet_friendly: fabric.pet_friendly,
        outdoor_safe: fabric.outdoor_safe,
        contract_grade: fabric.contract_grade,
        fire_retardant: fabric.fire_retardant,
        
        // Certifications
        greenguard_certified: fabric.greenguard_certified,
        oeko_tex_certified: fabric.oeko_tex_certified,
        certifications: fabric.certifications,
        
        // Care & Lead Time
        care_instructions: fabric.care_instructions,
        lead_time_days: fabric.lead_time_days,
        
        // Pricing
        wholesale_price: fabric.wholesale_price,
        cost_price: fabric.cost_price,
        
        // Additional metadata
        ...(fabric.metadata || {})
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
]