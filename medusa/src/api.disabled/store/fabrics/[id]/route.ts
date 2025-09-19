import { 
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

// Use same global cache as list endpoint
declare global {
  var materialsCache: {
    data: any[] | null
    timestamp: number
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const materialsService = req.scope.resolve("materials")
  
  try {
    const fabricId = req.params.id

    // Try to get from cache first
    let material = null
    
    if (global.materialsCache?.data) {
      material = global.materialsCache.data.find(m => m.id === fabricId)
    }
    
    // If not in cache, fetch directly
    if (!material) {
      material = await materialsService.retrieveMaterial(fabricId)
    }

    if (!material) {
      return res.status(404).json({ 
        error: "Fabric not found",
        id: fabricId 
      })
    }

    // Transform to fabric-store expected format
    // Properties contains the entire admin fabric record
    const fabric = {
      ...material.properties,  // Spread all fabric properties
      id: material.id,         // Use material ID
      name: material.name      // Use material name
    }

    res.json({ fabric })

  } catch (error) {
    console.error("Error fetching fabric:", error)
    res.status(500).json({
      error: "Failed to fetch fabric details",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}