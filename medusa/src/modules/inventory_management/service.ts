import { MedusaService } from "@medusajs/framework/utils"
import {
  InventoryItem,
  InventoryLevel,
  InventoryLocation,
  ReservationItem,
} from "./models"

type InjectedDependencies = {}

interface CreateInventoryItemInput {
  sku: string
  variant_id?: string
  title?: string
  description?: string
  thumbnail?: string
  requires_shipping?: boolean
  metadata?: Record<string, any>
}

interface CreateInventoryLocationInput {
  name: string
  code: string
  address?: any
  metadata?: Record<string, any>
  is_active?: boolean
}

interface CreateInventoryLevelInput {
  inventory_item_id: string
  location_id: string
  stocked_quantity: number
  reserved_quantity?: number
  incoming_quantity?: number
  metadata?: Record<string, any>
}

interface CreateReservationInput {
  inventory_item_id: string
  location_id: string
  quantity: number
  line_item_id?: string
  external_id?: string
  description?: string
  created_by?: string
  metadata?: Record<string, any>
  expires_at?: Date
}

interface AdjustInventoryInput {
  inventory_item_id: string
  location_id: string
  adjustment: number
}

class InventoryService extends MedusaService({
  InventoryItem,
  InventoryLevel,
  InventoryLocation,
  ReservationItem,
}) {
  protected dependencies_: InjectedDependencies

  constructor(container: InjectedDependencies) {
    super(...[container as any])
    this.dependencies_ = container
  }

  // Inventory Items
  async createInventoryItem(data: CreateInventoryItemInput) {
    return await this.createInventoryItems(data)
  }

  async listInventoryItems(filters: any = {}, config: any = {}) {
    return await this.listInventoryItems(filters, config)
  }

  async retrieveInventoryItem(id: string, config?: any) {
    return await this.retrieveInventoryItems(id, config)
  }

  async updateInventoryItem(id: string, data: Partial<CreateInventoryItemInput>) {
    return await this.updateInventoryItems(id, data)
  }

  async deleteInventoryItem(id: string) {
    return await this.deleteInventoryItems(id)
  }

  // Inventory Locations
  async createLocation(data: CreateInventoryLocationInput) {
    return await this.createInventoryLocations(data)
  }

  async listLocations(filters: any = {}, config: any = {}) {
    return await this.listInventoryLocations(filters, config)
  }

  async retrieveLocation(id: string, config?: any) {
    return await this.retrieveInventoryLocations(id, config)
  }

  async updateLocation(id: string, data: Partial<CreateInventoryLocationInput>) {
    return await this.updateInventoryLocations(id, data)
  }

  async deleteLocation(id: string) {
    return await this.deleteInventoryLocations(id)
  }

  // Inventory Levels
  async createInventoryLevel(data: CreateInventoryLevelInput) {
    const availableQuantity = data.stocked_quantity - (data.reserved_quantity || 0)
    return await this.createInventoryLevels({
      ...data,
      available_quantity: availableQuantity,
    })
  }

  async updateInventoryLevel(
    inventoryItemId: string,
    locationId: string,
    update: Partial<CreateInventoryLevelInput>
  ) {
    const existing = await this.listInventoryLevels({
      inventory_item_id: inventoryItemId,
      location_id: locationId,
    })

    if (!existing.length) {
      throw new Error("Inventory level not found")
    }

    const level = existing[0]
    const updatedData: any = { ...update }

    if (update.stocked_quantity !== undefined || update.reserved_quantity !== undefined) {
      const stocked = update.stocked_quantity ?? level.stocked_quantity
      const reserved = update.reserved_quantity ?? level.reserved_quantity
      updatedData.available_quantity = stocked - reserved
    }

    return await this.updateInventoryLevels(level.id, updatedData)
  }

  async adjustInventory(data: AdjustInventoryInput) {
    const levels = await this.listInventoryLevels({
      inventory_item_id: data.inventory_item_id,
      location_id: data.location_id,
    })

    if (!levels.length) {
      // Create new level if doesn't exist
      return await this.createInventoryLevel({
        inventory_item_id: data.inventory_item_id,
        location_id: data.location_id,
        stocked_quantity: Math.max(0, data.adjustment),
      })
    }

    const level = levels[0]
    const newQuantity = Math.max(0, level.stocked_quantity + data.adjustment)

    return await this.updateInventoryLevel(
      data.inventory_item_id,
      data.location_id,
      { stocked_quantity: newQuantity }
    )
  }

  async getAvailableQuantity(inventoryItemId: string, locationIds?: string[]) {
    const filters: any = { inventory_item_id: inventoryItemId }
    if (locationIds?.length) {
      filters.location_id = locationIds
    }

    const levels = await this.listInventoryLevels(filters)

    return levels.reduce((sum, level) => sum + level.available_quantity, 0)
  }

  // Reservations
  async createReservation(data: CreateReservationInput) {
    // First check if there's enough available inventory
    const levels = await this.listInventoryLevels({
      inventory_item_id: data.inventory_item_id,
      location_id: data.location_id,
    })

    if (!levels.length) {
      throw new Error("Inventory level not found for this item and location")
    }

    const level = levels[0]
    if (level.available_quantity < data.quantity) {
      throw new Error(`Insufficient inventory. Available: ${level.available_quantity}, Requested: ${data.quantity}`)
    }

    // Create the reservation
    const reservation = await this.createReservationItems(data)

    // Update the inventory level
    await this.updateInventoryLevel(
      data.inventory_item_id,
      data.location_id,
      { reserved_quantity: level.reserved_quantity + data.quantity }
    )

    return reservation
  }

  async deleteReservation(id: string) {
    const reservation = await this.retrieveReservationItems(id)
    if (!reservation) {
      throw new Error("Reservation not found")
    }

    // Update inventory level
    const levels = await this.listInventoryLevels({
      inventory_item_id: reservation.inventory_item_id,
      location_id: reservation.location_id,
    })

    if (levels.length) {
      const level = levels[0]
      await this.updateInventoryLevel(
        reservation.inventory_item_id,
        reservation.location_id,
        { reserved_quantity: Math.max(0, level.reserved_quantity - reservation.quantity) }
      )
    }

    return await this.deleteReservationItems(id)
  }

  async confirmReservation(id: string) {
    const reservation = await this.retrieveReservationItems(id)
    if (!reservation) {
      throw new Error("Reservation not found")
    }

    // Reduce stocked quantity and remove reservation
    const levels = await this.listInventoryLevels({
      inventory_item_id: reservation.inventory_item_id,
      location_id: reservation.location_id,
    })

    if (levels.length) {
      const level = levels[0]
      await this.updateInventoryLevel(
        reservation.inventory_item_id,
        reservation.location_id,
        {
          stocked_quantity: Math.max(0, level.stocked_quantity - reservation.quantity),
          reserved_quantity: Math.max(0, level.reserved_quantity - reservation.quantity)
        }
      )
    }

    return await this.deleteReservationItems(id)
  }

  // Bulk operations
  async bulkCreateInventoryLevels(data: CreateInventoryLevelInput[]) {
    const levelsWithAvailable = data.map(level => ({
      ...level,
      available_quantity: level.stocked_quantity - (level.reserved_quantity || 0),
    }))
    return await this.createInventoryLevels(levelsWithAvailable)
  }

  async bulkAdjustInventory(adjustments: AdjustInventoryInput[]) {
    const results = []
    for (const adjustment of adjustments) {
      results.push(await this.adjustInventory(adjustment))
    }
    return results
  }

  // Helper to sync with product variants
  async syncWithProductVariant(variantId: string, sku: string, stockQuantity: number, locationCode: string = "default") {
    // Check if inventory item exists
    let items = await this.listInventoryItems({ variant_id: variantId })
    let inventoryItem = items[0]

    if (!inventoryItem) {
      // Create inventory item
      inventoryItem = await this.createInventoryItem({
        sku,
        variant_id: variantId,
        requires_shipping: true,
      })
    }

    // Check if location exists
    let locations = await this.listLocations({ code: locationCode })
    let location = locations[0]

    if (!location) {
      // Create default location
      location = await this.createLocation({
        name: locationCode === "default" ? "Default Warehouse" : locationCode,
        code: locationCode,
        is_active: true,
      })
    }

    // Create or update inventory level
    const levels = await this.listInventoryLevels({
      inventory_item_id: inventoryItem.id,
      location_id: location.id,
    })

    if (levels.length) {
      return await this.updateInventoryLevel(
        inventoryItem.id,
        location.id,
        { stocked_quantity: stockQuantity }
      )
    } else {
      return await this.createInventoryLevel({
        inventory_item_id: inventoryItem.id,
        location_id: location.id,
        stocked_quantity: stockQuantity,
      })
    }
  }
}

export default InventoryService