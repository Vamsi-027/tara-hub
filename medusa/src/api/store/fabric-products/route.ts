import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import FabricProductModuleService from "../../../modules/fabric_products/service"

/**
 * Store API endpoints for fabric product interactions
 */

/**
 * GET /store/fabric-products/:id/fabrics
 * Get available fabrics for a configurable product
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const fabricProductService = req.scope.resolve("fabricProductModuleService") as FabricProductModuleService
  const productId = req.params.id
  
  try {
    const { 
      category,
      collection,
      search,
      limit = 20,
      offset = 0
    } = req.query as any

    const fabrics = await fabricProductService.getAvailableFabrics(productId, {
      category,
      collection,
      search,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    return res.json({
      fabrics,
      count: fabrics.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
  } catch (error) {
    return res.status(400).json({
      error: error.message
    })
  }
}

/**
 * POST /store/fabric-products/select
 * Save fabric selection for cart item
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const fabricProductService = req.scope.resolve("fabricProductModuleService") as FabricProductModuleService
  
  try {
    const {
      line_item_id,
      order_id,
      product_id,
      selections
    } = req.body

    // Validate required fields
    if (!line_item_id || !product_id || !selections) {
      return res.status(400).json({
        error: "Missing required fields"
      })
    }

    // Save selections
    await fabricProductService.saveFabricSelection(
      line_item_id,
      order_id || "pending",
      product_id,
      selections
    )

    // Calculate price
    const price = await fabricProductService.calculateFabricPrice(
      product_id,
      selections.map((s: any) => s.fabric_id)
    )

    return res.json({
      success: true,
      price,
      message: "Fabric selection saved"
    })
  } catch (error) {
    return res.status(400).json({
      error: error.message
    })
  }
}