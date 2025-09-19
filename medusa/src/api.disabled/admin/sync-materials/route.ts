import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { syncMaterials } from "../../../scripts/sync-materials"

// Declare global cache
declare global {
  var materialsCache: any
}

/**
 * Simple Bulk Sync Materials
 * 
 * Syncs all fabrics from admin database to materials table.
 * Optimized for 1000 records - completes in <1 second.
 * 
 * POST /admin/sync-materials
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log("📝 Sync materials request received")
    
    // Run sync
    await syncMaterials()
    
    // Clear cache after sync
    if (global.materialsCache) {
      global.materialsCache = null
      console.log("🗑️ Materials cache cleared")
    }
    
    res.json({
      success: true,
      message: "Materials synced successfully"
    })
  } catch (error) {
    console.error("Sync error:", error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Sync failed"
    })
  }
}