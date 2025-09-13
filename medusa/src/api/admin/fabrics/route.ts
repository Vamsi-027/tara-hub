import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Client } from "pg"
import { authenticate } from "@medusajs/framework/http"

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
export const GET = [
  authenticate("user", ["session", "bearer"]),
  async (
    req: MedusaRequest,
    res: MedusaResponse
  ) => {
  const { q, limit = '20', offset = '0' } = req.query as Record<string, string>
  
  const limitNum = Math.min(parseInt(limit) || 20, 100)
  const offsetNum = parseInt(offset) || 0

  let client: Client | null = null

  try {
    // Connect to database
    const connectionString = process.env.DATABASE_URL
    
    if (!connectionString) {
      return res.status(500).json({
        error: "Database connection not configured"
      })
    }

    const sslConnectionString = connectionString.includes('sslmode=') 
      ? connectionString 
      : connectionString + (connectionString.includes('?') ? '&' : '?') + 'sslmode=require'

    client = new Client({
      connectionString: sslConnectionString
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
          thumbnail_url,
          retail_price,
          stock_quantity,
          status
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
      // List all fabrics
      query = `
        SELECT 
          id,
          sku,
          name,
          category,
          collection,
          thumbnail_url,
          retail_price,
          stock_quantity,
          status
        FROM fabrics 
        WHERE status = 'active'
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
        WHERE status = 'active'
      `
      countParams = []
    }

    const countResult = await client.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    // Format response
    const fabrics = result.rows.map(fabric => ({
      id: fabric.id,
      sku: fabric.sku,
      name: fabric.name,
      category: fabric.category,
      collection: fabric.collection,
      thumbnail: fabric.thumbnail_url,
      price: fabric.retail_price,
      stock: fabric.stock_quantity,
      status: fabric.status,
      // Display label for dropdown
      label: `${fabric.sku} - ${fabric.name}`,
      value: fabric.sku
    }))

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
]