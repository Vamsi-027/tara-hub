import { 
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

// Global in-memory cache (1-2MB for 1000 fabrics)
declare global {
  var materialsCache: {
    data: any[] | null
    timestamp: number
  }
}

if (!global.materialsCache) {
  global.materialsCache = {
    data: null,
    timestamp: 0
  }
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const materialsService = req.scope.resolve("materials")
    const { searchParams } = new URL(req.url || "", `http://${req.headers.host}`)
    
    // Extract query parameters
    const limit = parseInt(searchParams.get("limit") || "1000") // Default to all
    const offset = parseInt(searchParams.get("offset") || "0")
    const category = searchParams.get("category")
    const collection = searchParams.get("collection")
    const color_family = searchParams.get("color_family")
    const pattern = searchParams.get("pattern")

    // Check cache
    const now = Date.now()
    if (!global.materialsCache.data || (now - global.materialsCache.timestamp) > CACHE_TTL) {
      console.log("🔄 Refreshing materials cache")
      const materials = await materialsService.listMaterials()
      global.materialsCache = {
        data: materials,
        timestamp: now
      }
      console.log(`✅ Cached ${materials.length} materials`)
    }

    // Use cached data
    let materials = global.materialsCache.data || []

    // Transform materials to fabric-store expected format
    const fabrics = materials.map((material: any) => {
      const props = material.properties || {}
      
      // Return the fabric in expected format
      // Properties contains the entire admin fabric record
      return {
        ...props,           // Spread all fabric properties
        id: material.id,    // Use material ID
        name: material.name // Use material name
      }
    })

    // Apply filters (fast with 1000 records)
    let filteredFabrics = fabrics

    if (category) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.category?.toLowerCase() === category.toLowerCase()
      )
    }

    if (collection) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.collection?.toLowerCase().includes(collection.toLowerCase())
      )
    }

    if (color_family) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.color_family?.toLowerCase() === color_family.toLowerCase()
      )
    }

    if (pattern) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.pattern?.toLowerCase().includes(pattern.toLowerCase())
      )
    }

    // Apply pagination (if needed, though 1000 records can be sent at once)
    const paginatedFabrics = filteredFabrics.slice(offset, offset + limit)

    res.json({
      fabrics: paginatedFabrics,
      total: filteredFabrics.length,
      limit,
      offset
    })

  } catch (error) {
    console.error("Error fetching fabrics:", error)
    res.status(500).json({
      error: "Failed to fetch fabrics",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}