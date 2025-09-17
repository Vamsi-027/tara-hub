import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { INVENTORY_MANAGEMENT } from "../../../../modules/inventory_management"

// GET /admin/inventory/levels
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const inventoryService = req.scope.resolve(INVENTORY_MANAGEMENT)

  const { inventory_item_id, location_id } = req.query

  try {
    const filters: any = {}
    if (inventory_item_id) filters.inventory_item_id = inventory_item_id
    if (location_id) filters.location_id = location_id

    const levels = await inventoryService.listInventoryLevels(filters)

    res.json({
      inventory_levels: levels,
      count: levels.length,
    })
  } catch (error) {
    res.status(400).json({
      error: error.message,
    })
  }
}

// POST /admin/inventory/levels
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const inventoryService = req.scope.resolve(INVENTORY_MANAGEMENT)

  try {
    const { inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity } = req.body

    if (!inventory_item_id || !location_id || stocked_quantity === undefined) {
      return res.status(400).json({
        error: "inventory_item_id, location_id, and stocked_quantity are required",
      })
    }

    const level = await inventoryService.createInventoryLevel({
      inventory_item_id,
      location_id,
      stocked_quantity,
      reserved_quantity: reserved_quantity || 0,
      incoming_quantity: incoming_quantity || 0,
    })

    res.json({
      inventory_level: level,
    })
  } catch (error) {
    res.status(400).json({
      error: error.message,
    })
  }
}

// PATCH /admin/inventory/levels
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const inventoryService = req.scope.resolve(INVENTORY_MANAGEMENT)

  try {
    const { inventory_item_id, location_id, stocked_quantity, reserved_quantity, incoming_quantity } = req.body

    if (!inventory_item_id || !location_id) {
      return res.status(400).json({
        error: "inventory_item_id and location_id are required",
      })
    }

    const level = await inventoryService.updateInventoryLevel(
      inventory_item_id,
      location_id,
      {
        stocked_quantity,
        reserved_quantity,
        incoming_quantity,
      }
    )

    res.json({
      inventory_level: level,
    })
  } catch (error) {
    res.status(400).json({
      error: error.message,
    })
  }
}