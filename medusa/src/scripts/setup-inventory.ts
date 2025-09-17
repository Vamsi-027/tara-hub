import { initializeContainer, Modules } from "@medusajs/framework/utils"
import { INVENTORY_MANAGEMENT } from "../modules/inventory_management"

async function setupInventory() {
  const container = await initializeContainer()

  const inventoryService = container.resolve(INVENTORY_MANAGEMENT)
  const productService = container.resolve(Modules.PRODUCT)

  console.log("🏭 Setting up inventory management system...")

  try {
    // Step 1: Create inventory locations
    console.log("\n📍 Creating inventory locations...")

    const locations = [
      {
        name: "Main Warehouse",
        code: "main-warehouse",
        address: {
          address_1: "123 Fabric Street",
          city: "New York",
          country_code: "US",
          postal_code: "10001",
        },
        is_active: true,
      },
      {
        name: "Overflow Storage",
        code: "overflow-storage",
        address: {
          address_1: "456 Storage Ave",
          city: "New Jersey",
          country_code: "US",
          postal_code: "07001",
        },
        is_active: true,
      },
    ]

    const createdLocations = []
    for (const locationData of locations) {
      try {
        // Check if location already exists
        const existing = await inventoryService.listLocations({ code: locationData.code })
        if (existing.length > 0) {
          console.log(`  ✓ Location "${locationData.name}" already exists`)
          createdLocations.push(existing[0])
        } else {
          const location = await inventoryService.createLocation(locationData)
          console.log(`  ✓ Created location: ${location.name}`)
          createdLocations.push(location)
        }
      } catch (error) {
        console.log(`  ⚠ Error with location "${locationData.name}": ${error.message}`)
      }
    }

    // Step 2: Get all products and their variants
    console.log("\n📦 Setting up inventory for products...")

    const products = await productService.listProducts({}, {
      relations: ["variants"],
    })

    if (!products.length) {
      console.log("  ⚠ No products found. Please create products first.")
      return
    }

    const mainWarehouse = createdLocations.find(l => l.code === "main-warehouse")
    if (!mainWarehouse) {
      throw new Error("Main warehouse location not found")
    }

    // Step 3: Create inventory items and levels for each variant
    for (const product of products) {
      console.log(`\n  Product: ${product.title}`)

      for (const variant of product.variants) {
        try {
          // Check if inventory item already exists
          let inventoryItems = await inventoryService.listInventoryItems({
            variant_id: variant.id,
          })

          let inventoryItem = inventoryItems[0]

          if (!inventoryItem) {
            // Create inventory item
            inventoryItem = await inventoryService.createInventoryItem({
              sku: variant.sku || `SKU-${variant.id}`,
              variant_id: variant.id,
              title: `${product.title} - ${variant.title}`,
              thumbnail: product.thumbnail,
              requires_shipping: true,
            })
            console.log(`    ✓ Created inventory item for variant: ${variant.title}`)
          } else {
            console.log(`    ✓ Inventory item exists for variant: ${variant.title}`)
          }

          // Set initial stock levels based on variant type
          let initialStock = 100 // Default for regular items

          // Customize based on variant title
          if (variant.title?.toLowerCase().includes("swatch") ||
              variant.title?.toLowerCase().includes("sample")) {
            initialStock = 500 // More stock for samples
          } else if (variant.title?.toLowerCase().includes("yard") ||
                     variant.title?.toLowerCase().includes("meter")) {
            initialStock = 200 // Standard stock for fabric by the yard
          }

          // Check if inventory level exists
          const existingLevels = await inventoryService.listInventoryLevels({
            inventory_item_id: inventoryItem.id,
            location_id: mainWarehouse.id,
          })

          if (existingLevels.length === 0) {
            // Create inventory level
            const level = await inventoryService.createInventoryLevel({
              inventory_item_id: inventoryItem.id,
              location_id: mainWarehouse.id,
              stocked_quantity: initialStock,
              reserved_quantity: 0,
              incoming_quantity: 0,
            })
            console.log(`    ✓ Set stock level: ${initialStock} units at ${mainWarehouse.name}`)
          } else {
            // Update existing level
            await inventoryService.updateInventoryLevel(
              inventoryItem.id,
              mainWarehouse.id,
              { stocked_quantity: initialStock }
            )
            console.log(`    ✓ Updated stock level: ${initialStock} units at ${mainWarehouse.name}`)
          }
        } catch (error) {
          console.log(`    ⚠ Error with variant "${variant.title}": ${error.message}`)
        }
      }
    }

    // Step 4: Update product variants to enable inventory management
    console.log("\n🔧 Enabling inventory management on variants...")

    for (const product of products) {
      for (const variant of product.variants) {
        try {
          await productService.updateProductVariants(variant.id, {
            manage_inventory: true,
            allow_backorder: true, // Allow backorders for fabric business
          })
          console.log(`  ✓ Enabled inventory management for: ${product.title} - ${variant.title}`)
        } catch (error) {
          console.log(`  ⚠ Error updating variant: ${error.message}`)
        }
      }
    }

    console.log("\n✅ Inventory setup complete!")

    // Display summary
    const allItems = await inventoryService.listInventoryItems({})
    const allLevels = await inventoryService.listInventoryLevels({})

    console.log("\n📊 Summary:")
    console.log(`  - Locations created: ${createdLocations.length}`)
    console.log(`  - Inventory items: ${allItems.length}`)
    console.log(`  - Inventory levels: ${allLevels.length}`)

    const totalStock = allLevels.reduce((sum: number, level: any) => sum + level.stocked_quantity, 0)
    console.log(`  - Total stock across all items: ${totalStock} units`)

  } catch (error) {
    console.error("❌ Error setting up inventory:", error)
  } finally {
    await container.shutdown()
  }
}

setupInventory()
  .then(() => {
    console.log("\n🎉 Inventory setup script finished!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })