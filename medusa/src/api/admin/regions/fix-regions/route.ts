import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IRegionModuleService } from "@medusajs/framework/types"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const regionModule = req.scope.resolve<IRegionModuleService>("@medusajs/medusa/region")

    // Get all regions
    const regions = await regionModule.listRegions({})

    console.log(`Found ${regions.length} regions to fix`)

    // Fix each region
    for (const region of regions) {
      try {
        // Update region with missing fields
        await regionModule.updateRegions(region.id, {
          name: region.name,
          currency_code: region.currency_code || "usd",
          metadata: {
            ...region.metadata,
            fixed_at: new Date().toISOString()
          }
        })

        console.log(`Fixed region: ${region.name}`)
      } catch (error) {
        console.error(`Failed to fix region ${region.id}:`, error)
      }
    }

    res.json({
      success: true,
      message: `Fixed ${regions.length} regions`,
      regions: regions.map(r => ({
        id: r.id,
        name: r.name,
        currency_code: r.currency_code
      }))
    })
  } catch (error) {
    console.error("Error fixing regions:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}