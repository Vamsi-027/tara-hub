import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { adjustInventoryWorkflow, bulkAdjustInventoryWorkflow } from "../../../../workflows/inventory/adjust-inventory"

// POST /admin/inventory/adjust
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { adjustments, ...singleAdjustment } = req.body

    if (adjustments && Array.isArray(adjustments)) {
      // Bulk adjustment
      const { result } = await bulkAdjustInventoryWorkflow(req.scope).run({
        input: { adjustments },
      })

      return res.json({
        adjustments: result,
        message: `Successfully adjusted ${adjustments.length} inventory levels`,
      })
    } else if (singleAdjustment.inventory_item_id && singleAdjustment.location_id) {
      // Single adjustment
      const { result } = await adjustInventoryWorkflow(req.scope).run({
        input: singleAdjustment,
      })

      return res.json({
        adjustment: result,
        message: "Inventory adjusted successfully",
      })
    } else {
      return res.status(400).json({
        error: "Invalid request. Provide either 'adjustments' array or single adjustment parameters",
      })
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    })
  }
}