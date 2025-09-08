import { Client } from "pg"

/**
 * Test script to verify fabric sync works
 * 
 * This script:
 * 1. Connects to admin database
 * 2. Fetches a sample fabric
 * 3. Calls the sync endpoint
 * 4. Verifies the product was created/updated
 * 
 * Usage: npx tsx scripts/test-fabric-sync.ts
 */
async function testFabricSync() {
  console.log("🧪 Testing Fabric to Medusa sync...")

  // Connect to admin database
  const adminDb = new Client({
    connectionString: process.env.ADMIN_DATABASE_URL || 
                     process.env.DATABASE_URL ||
                     process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === "production" ? {
      rejectUnauthorized: false
    } : undefined
  })

  try {
    await adminDb.connect()
    console.log("✅ Connected to admin database")

    // Get a sample fabric
    const result = await adminDb.query(`
      SELECT * FROM fabrics 
      WHERE deleted_at IS NULL 
      AND status = 'active'
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      console.log("❌ No active fabrics found in database")
      return
    }

    const fabric = result.rows[0]
    console.log(`\n📦 Testing with fabric: ${fabric.name} (${fabric.sku})`)
    console.log(`   Price: $${fabric.retail_price}`)
    console.log(`   Stock: ${fabric.available_quantity} ${fabric.price_unit}`)
    console.log(`   Fiber Content:`, fabric.fiber_content)

    // Call sync endpoint
    const medusaUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    console.log(`\n🔄 Calling sync endpoint: ${medusaUrl}/admin/fabric-sync`)

    const response = await fetch(`${medusaUrl}/admin/fabric-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fabric })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ Sync failed: ${response.status} - ${error}`)
      return
    }

    const result = await response.json()
    console.log(`\n✅ Sync successful!`)
    console.log(`   Action: ${result.action}`)
    console.log(`   Product ID: ${result.product?.id}`)
    console.log(`   Product Handle: ${result.product?.handle}`)
    console.log(`   Message: ${result.message}`)

    // Verify product metadata
    if (result.product?.metadata) {
      console.log(`\n📋 Product Metadata:`)
      console.log(`   Fabric ID: ${result.product.metadata.fabric_id}`)
      console.log(`   SKU: ${result.product.metadata.sku}`)
      console.log(`   Width: ${result.product.metadata.width} ${result.product.metadata.width_unit}`)
      console.log(`   Fiber Content:`, result.product.metadata.fiber_content)
    }

    // Verify variants
    if (result.product?.variants) {
      console.log(`\n💰 Product Variants:`)
      result.product.variants.forEach((variant: any) => {
        console.log(`   - ${variant.title}`)
        console.log(`     SKU: ${variant.sku}`)
        console.log(`     Price: $${variant.prices?.[0]?.amount / 100}`)
        console.log(`     Inventory: ${variant.inventory_quantity ?? 'N/A'}`)
      })
    }

    console.log("\n🎉 Test completed successfully!")

  } catch (error) {
    console.error(`\n❌ Test failed:`, error)
  } finally {
    await adminDb.end()
    console.log("\n🔌 Disconnected from admin database")
  }
}

// Run test
testFabricSync().catch(console.error)