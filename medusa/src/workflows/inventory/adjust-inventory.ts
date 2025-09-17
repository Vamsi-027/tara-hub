import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
  parallelize,
} from "@medusajs/framework/workflows-sdk"
import { INVENTORY_MANAGEMENT } from "../../modules/inventory_management"

interface InventoryAdjustment {
  inventory_item_id: string
  location_id: string
  adjustment: number
  reason?: string
}

interface BulkInventoryAdjustment {
  adjustments: InventoryAdjustment[]
}

const adjustInventoryStep = createStep(
  "adjust-inventory",
  async ({ inventory_item_id, location_id, adjustment, reason }: InventoryAdjustment, { container }) => {
    const inventoryService = container.resolve(INVENTORY_MANAGEMENT)

    // Get current level
    const levels = await inventoryService.listInventoryLevels({
      inventory_item_id,
      location_id,
    })

    const previousQuantity = levels.length ? levels[0].stocked_quantity : 0

    // Apply adjustment
    const result = await inventoryService.adjustInventory({
      inventory_item_id,
      location_id,
      adjustment,
    })

    return new StepResponse(result, {
      inventory_item_id,
      location_id,
      previousQuantity,
      adjustment: -adjustment, // Reverse adjustment for compensation
    })
  },
  async (compensationData: any, { container }) => {
    // Compensation: Reverse the adjustment
    const inventoryService = container.resolve(INVENTORY_MANAGEMENT)
    await inventoryService.adjustInventory({
      inventory_item_id: compensationData.inventory_item_id,
      location_id: compensationData.location_id,
      adjustment: compensationData.adjustment,
    })
  }
)

export const adjustInventoryWorkflow = createWorkflow(
  "adjust-inventory",
  (input: InventoryAdjustment) => {
    const result = adjustInventoryStep(input)
    return new WorkflowResponse(result)
  }
)

export const bulkAdjustInventoryWorkflow = createWorkflow(
  "bulk-adjust-inventory",
  (input: BulkInventoryAdjustment) => {
    const results = parallelize(
      ...input.adjustments.map(adjustment => adjustInventoryStep(adjustment))
    )
    return new WorkflowResponse(results)
  }
)