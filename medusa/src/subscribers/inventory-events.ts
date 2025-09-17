import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { INVENTORY_MANAGEMENT } from "../modules/inventory_management"

// Subscribe to order placement to reserve inventory
export async function handleOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const inventoryService = container.resolve(INVENTORY_MANAGEMENT)
  const orderService = container.resolve("order")

  console.log("📦 Order placed, reserving inventory...")

  try {
    const order = await orderService.retrieve(data.id, {
      relations: ["items", "items.variant"],
    })

    // Create reservations for each line item
    for (const item of order.items) {
      if (!item.variant_id) continue

      // Get inventory item for this variant
      const inventoryItems = await inventoryService.listInventoryItems({
        variant_id: item.variant_id,
      })

      if (inventoryItems.length === 0) {
        console.log(`  ⚠ No inventory item found for variant ${item.variant_id}`)
        continue
      }

      const inventoryItem = inventoryItems[0]

      // Get default location (main warehouse)
      const locations = await inventoryService.listLocations({ code: "main-warehouse" })
      if (locations.length === 0) {
        console.log("  ⚠ Main warehouse location not found")
        continue
      }

      const location = locations[0]

      // Create reservation
      try {
        const reservation = await inventoryService.createReservation({
          inventory_item_id: inventoryItem.id,
          location_id: location.id,
          quantity: item.quantity,
          line_item_id: item.id,
          external_id: order.id,
          description: `Order ${order.display_id}`,
          created_by: "order-system",
        })

        console.log(`  ✓ Reserved ${item.quantity} units of ${item.title}`)
      } catch (error) {
        console.log(`  ⚠ Failed to reserve inventory for ${item.title}: ${error.message}`)
      }
    }
  } catch (error) {
    console.error("Error handling order placement:", error)
  }
}

// Subscribe to order cancellation to release inventory
export async function handleOrderCanceled({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const inventoryService = container.resolve(INVENTORY_MANAGEMENT)

  console.log("🚫 Order canceled, releasing inventory reservations...")

  try {
    // Find and delete reservations for this order
    const reservations = await inventoryService.listReservationItems({
      external_id: data.id,
    })

    for (const reservation of reservations) {
      await inventoryService.deleteReservation(reservation.id)
      console.log(`  ✓ Released reservation ${reservation.id}`)
    }
  } catch (error) {
    console.error("Error handling order cancellation:", error)
  }
}

// Subscribe to order fulfillment to confirm inventory reduction
export async function handleOrderFulfilled({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const inventoryService = container.resolve(INVENTORY_MANAGEMENT)

  console.log("✅ Order fulfilled, confirming inventory reduction...")

  try {
    // Find and confirm reservations for this order
    const reservations = await inventoryService.listReservationItems({
      external_id: data.id,
    })

    for (const reservation of reservations) {
      await inventoryService.confirmReservation(reservation.id)
      console.log(`  ✓ Confirmed inventory reduction for reservation ${reservation.id}`)
    }
  } catch (error) {
    console.error("Error handling order fulfillment:", error)
  }
}

// Subscribe to product variant updates to sync inventory
export async function handleVariantUpdated({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const inventoryService = container.resolve(INVENTORY_MANAGEMENT)

  console.log("🔄 Product variant updated, syncing inventory...")

  try {
    const variant = data

    // Check if inventory item exists
    const inventoryItems = await inventoryService.listInventoryItems({
      variant_id: variant.id,
    })

    if (inventoryItems.length === 0) {
      // Create new inventory item if it doesn't exist
      const inventoryItem = await inventoryService.createInventoryItem({
        sku: variant.sku || `SKU-${variant.id}`,
        variant_id: variant.id,
        title: variant.title,
        requires_shipping: true,
      })

      console.log(`  ✓ Created inventory item for variant ${variant.title}`)

      // Set default stock level
      const locations = await inventoryService.listLocations({ code: "main-warehouse" })
      if (locations.length > 0) {
        await inventoryService.createInventoryLevel({
          inventory_item_id: inventoryItem.id,
          location_id: locations[0].id,
          stocked_quantity: 100,
        })
        console.log(`  ✓ Set default stock level: 100 units`)
      }
    } else {
      // Update existing inventory item
      await inventoryService.updateInventoryItem(inventoryItems[0].id, {
        sku: variant.sku,
        title: variant.title,
      })
      console.log(`  ✓ Updated inventory item for variant ${variant.title}`)
    }
  } catch (error) {
    console.error("Error handling variant update:", error)
  }
}

export const config: SubscriberConfig = {
  event: [
    "order.placed",
    "order.canceled",
    "order.fulfilled",
    "product-variant.updated",
  ],
}