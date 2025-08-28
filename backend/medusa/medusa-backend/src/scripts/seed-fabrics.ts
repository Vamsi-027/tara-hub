import { fabricSwatches } from "../../../../frontend/shared/data/fabric-data"
import { FabricService } from "../services/fabric.service"

export async function seedFabrics(container: any) {
  const fabricService: FabricService = container.resolve("fabricService")
  
  console.log("Starting fabric seed...")
  
  // Transform the fabric data to match our database schema
  const fabricsToCreate = fabricSwatches.map(fabric => ({
    name: fabric.name,
    sku: fabric.sku,
    description: fabric.description,
    category: fabric.category,
    color: fabric.color,
    color_family: fabric.colorFamily,
    pattern: fabric.pattern,
    usage: fabric.usage,
    properties: fabric.properties,
    swatch_image_url: fabric.swatchImageUrl,
    color_hex: fabric.colorHex,
    composition: fabric.composition,
    width: fabric.width,
    weight: fabric.weight,
    durability: fabric.durability,
    care_instructions: fabric.careInstructions,
    in_stock: fabric.inStock,
    collection: fabric.collection,
    price: Math.floor(Math.random() * 100) + 20, // Random price between $20-$120
    stock_quantity: Math.floor(Math.random() * 100) + 10, // Random stock between 10-110
  }))

  try {
    // Check if fabrics already exist
    const [existingFabrics] = await fabricService.list({ limit: 1 })
    
    if (existingFabrics.length > 0) {
      console.log("Fabrics already seeded, skipping...")
      return
    }
    
    // Bulk create all fabrics
    const created = await fabricService.bulkCreate(fabricsToCreate)
    
    console.log(`Successfully seeded ${created.length} fabrics`)
  } catch (error) {
    console.error("Error seeding fabrics:", error)
    throw error
  }
}

// Run this script directly
if (require.main === module) {
  (async () => {
    try {
      // You'll need to initialize the Medusa container here
      // This is a simplified version - adjust based on your setup
      const container = require("../loaders").default
      await seedFabrics(container)
      process.exit(0)
    } catch (error) {
      console.error("Seed failed:", error)
      process.exit(1)
    }
  })()
}