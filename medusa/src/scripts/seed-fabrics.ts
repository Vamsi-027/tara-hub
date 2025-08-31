/**
 * Fabric Data Seeding Script
 * Seeds Medusa with fabric collections, categories, and products
 */

import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

async function seedFabrics() {
  console.log("🌱 Starting fabric data seeding...")

  try {
    // Run the import script
    console.log("📦 Running fabric import script...")
    const { stdout, stderr } = await execAsync("npx tsx src/scripts/import-fabric-data.ts")
    
    if (stderr) {
      console.warn("⚠️ Warnings during import:", stderr)
    }
    
    console.log("✅ Import output:", stdout)
    
    console.log("🎉 Fabric seeding completed successfully!")
    
    console.log("\n📊 What was created:")
    console.log("• 4 Fabric collections (Essential, Luxury, Outdoor, Trending)")
    console.log("• Multiple fabric categories (Cotton, Velvet, etc.)")
    console.log("• All fabric products with detailed properties")
    console.log("• Product variants with pricing and inventory")
    console.log("• Fabric-specific metadata and properties")
    
    console.log("\n🔗 Access points:")
    console.log("• Admin Dashboard: http://localhost:9000/app")
    console.log("• Store API: http://localhost:9000/store/fabrics")
    console.log("• Products API: http://localhost:9000/store/products")
    
  } catch (error) {
    console.error("❌ Fabric seeding failed:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  seedFabrics()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { seedFabrics }