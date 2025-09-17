import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { INVENTORY_MANAGEMENT } from "../../../modules/inventory_management"

// GET /admin/inventory
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const inventoryService = req.scope.resolve(INVENTORY_MANAGEMENT)

  const {
    variant_id,
    location_id,
    sku,
    limit = 20,
    offset = 0
  } = req.query

  try {
    // Build filters
    const filters: any = {}
    if (variant_id) filters.variant_id = variant_id
    if (sku) filters.sku = sku

    // Get inventory items
    const items = await inventoryService.listInventoryItems(filters, {
      limit: Number(limit),
      offset: Number(offset),
    })

    // For each item, get levels across locations
    const itemsWithLevels = await Promise.all(
      items.map(async (item: any) => {
        const levelFilters: any = { inventory_item_id: item.id }
        if (location_id) levelFilters.location_id = location_id

        const levels = await inventoryService.listInventoryLevels(levelFilters)

        return {
          ...item,
          levels,
          total_available: levels.reduce((sum: number, level: any) => sum + level.available_quantity, 0),
          total_stocked: levels.reduce((sum: number, level: any) => sum + level.stocked_quantity, 0),
          total_reserved: levels.reduce((sum: number, level: any) => sum + level.reserved_quantity, 0),
        }
      })
    )

    res.json({
      inventory_items: itemsWithLevels,
      count: itemsWithLevels.length,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error) {
    res.status(400).json({
      error: error.message,
    })
  }
}

// POST /admin/inventory
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const inventoryService = req.scope.resolve(INVENTORY_MANAGEMENT)

  try {
    const { sku, variant_id, title, description, thumbnail, requires_shipping, metadata } = req.body

    if (!sku) {
      return res.status(400).json({ error: "SKU is required" })
    }

    const inventoryItem = await inventoryService.createInventoryItem({
      sku,
      variant_id,
      title,
      description,
      thumbnail,
      requires_shipping: requires_shipping ?? true,
      metadata,
    })

    res.json({
      inventory_item: inventoryItem,
    })
  } catch (error) {
    res.status(400).json({
      error: error.message,
    })
  }
}