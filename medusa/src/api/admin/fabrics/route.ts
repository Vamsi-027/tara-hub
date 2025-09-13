import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Client } from "pg"

/**
 * GET /admin/fabrics
 * 
 * Search and list fabrics from neondb
 * Supports search by SKU, name, or listing all
 * 
 * Query params:
 * - q: Search query (searches SKU and name)
 * - limit: Max results (default 20, max 100)
 * - offset: Pagination offset
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Get CDN prefix from environment
  const CDN_PREFIX = process.env.FABRIC_CDN_PREFIX || 'https://cdn.deepcrm.ai'
  
  const { q, limit = '20', offset = '0' } = req.query as Record<string, string>
  
  const limitNum = Math.min(parseInt(limit) || 20, 100)
  const offsetNum = parseInt(offset) || 0

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

    // Build query based on search parameter
    let query: string
    let params: any[]

    if (q && q.trim()) {
      // Search by SKU or name
      query = `
        SELECT 
          id,
          sku,
          name,
          category,
          collection,
          images,
          cdn_urls,
          yardage_price,
          swatch_price,
          is_active,
          availability
        FROM fabrics 
        WHERE 
          LOWER(sku) LIKE LOWER($1) OR 
          LOWER(name) LIKE LOWER($1)
        ORDER BY 
          CASE 
            WHEN LOWER(sku) = LOWER($2) THEN 0
            WHEN LOWER(sku) LIKE LOWER($3) THEN 1
            WHEN LOWER(name) LIKE LOWER($1) THEN 2
            ELSE 3
          END,
          name ASC
        LIMIT $4 OFFSET $5
      `
      const searchTerm = `%${q.trim()}%`
      const exactTerm = q.trim()
      const startTerm = `${q.trim()}%`
      params = [searchTerm, exactTerm, startTerm, limitNum, offsetNum]
    } else {
      // List all active fabrics
      query = `
        SELECT 
          id,
          sku,
          name,
          category,
          collection,
          images,
          cdn_urls,
          yardage_price,
          swatch_price,
          is_active,
          availability
        FROM fabrics 
        WHERE is_active = true
        ORDER BY name ASC
        LIMIT $1 OFFSET $2
      `
      params = [limitNum, offsetNum]
    }

    const result = await client.query(query, params)

    // Get total count for pagination
    let countQuery: string
    let countParams: any[]

    if (q && q.trim()) {
      countQuery = `
        SELECT COUNT(*) as total
        FROM fabrics 
        WHERE 
          LOWER(sku) LIKE LOWER($1) OR 
          LOWER(name) LIKE LOWER($1)
      `
      countParams = [`%${q.trim()}%`]
    } else {
      countQuery = `
        SELECT COUNT(*) as total
        FROM fabrics 
        WHERE is_active = true
      `
      countParams = []
    }

    const countResult = await client.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    // Format response
    const fabrics = result.rows.map(fabric => {
      // Extract thumbnail from images or cdn_urls
      let thumbnail = null
      if (fabric.cdn_urls?.images?.length > 0) {
        // Use the key field which contains the actual image path
        const firstImagePath = fabric.cdn_urls.images[0].key || fabric.cdn_urls.images[0].url
        thumbnail = firstImagePath.startsWith('http')
          ? firstImagePath
          : `${CDN_PREFIX}/${firstImagePath}`
      } else if (fabric.images?.length > 0) {
        // Add CDN prefix to image URLs
        const firstImage = fabric.images[0]
        thumbnail = firstImage.startsWith('http') ? firstImage : `${CDN_PREFIX}/${firstImage}`
      }
      
      return {
        id: fabric.id,
        sku: fabric.sku,
        name: fabric.name,
        category: fabric.category,
        collection: fabric.collection,
        thumbnail: thumbnail,
        price: fabric.yardage_price,
        swatchPrice: fabric.swatch_price,
        isActive: fabric.is_active,
        availability: fabric.availability,
        // Display label for dropdown
        label: `${fabric.sku} - ${fabric.name}`,
        value: fabric.sku
      }
    })

    return res.json({
      success: true,
      fabrics,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      }
    })

  } catch (error) {
    console.error('Error listing fabrics:', error)
    return res.status(500).json({
      error: "Failed to list fabrics",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  } finally {
    if (client) {
      await client.end()
    }
  }
}