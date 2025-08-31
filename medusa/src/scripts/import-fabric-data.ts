/**
 * Fabric Data Migration Script
 * Imports existing fabric data from frontend into Medusa
 */

import { MedusaApp } from "@medusajs/framework/utils"
import { fabricSwatches, fabricCollections } from "../../../frontend/shared/data/fabric-data"

async function importFabricData() {
  const container = await MedusaApp({
    directory: process.cwd(),
  })

  const productModuleService = container.resolve("productModuleService")
  const fabricPropertiesService = container.resolve("fabric-details")

  console.log("🧵 Starting fabric data migration...")

  try {
    // Step 1: Create Collections
    console.log("📦 Creating collections...")
    const createdCollections = new Map()
    
    for (const collection of fabricCollections) {
      const medusaCollection = await productModuleService.createCollections({
        title: collection.name,
        handle: collection.id,
        metadata: {
          description: collection.description,
          image: collection.image,
          original_id: collection.id
        }
      })
      createdCollections.set(collection.id, medusaCollection.id)
      console.log(`✅ Created collection: ${collection.name}`)
    }

    // Step 2: Create Categories
    console.log("📂 Creating categories...")
    const uniqueCategories = [...new Set(fabricSwatches.map(f => f.category))]
    const createdCategories = new Map()

    for (const categoryName of uniqueCategories) {
      const category = await productModuleService.createCategories({
        name: categoryName,
        handle: categoryName.toLowerCase().replace(/\s+/g, '-'),
        description: `${categoryName} fabrics`,
        is_active: true,
        metadata: {
          type: 'fabric_category'
        }
      })
      createdCategories.set(categoryName, category.id)
      console.log(`✅ Created category: ${categoryName}`)
    }

    // Step 3: Create Product Type for Fabrics
    console.log("🏷️ Creating fabric product type...")
    const fabricProductType = await productModuleService.createProductTypes({
      value: 'fabric',
      label: 'Fabric'
    })

    // Step 4: Import Fabric Products
    console.log("🧵 Importing fabric products...")
    let importCount = 0

    for (const fabric of fabricSwatches) {
      try {
        // Create the base product
        const product = await productModuleService.createProducts({
          title: fabric.name,
          subtitle: fabric.collection || undefined,
          description: fabric.description,
          handle: generateSlug(fabric.name, fabric.sku),
          status: fabric.inStock ? 'published' : 'draft',
          
          // Associate with collection and category
          collection_id: fabric.collection ? createdCollections.get(fabric.collection) : undefined,
          categories: [{
            id: createdCategories.get(fabric.category)
          }],
          
          // Product type
          type_id: fabricProductType.id,
          
          // Tags from properties
          tags: fabric.properties.map(prop => ({ value: prop })),
          
          // Images
          images: [
            {
              url: fabric.swatchImageUrl,
              metadata: {
                alt: `${fabric.name} swatch`,
                type: 'swatch'
              }
            }
          ],
          
          // Metadata - Store all fabric-specific data
          metadata: {
            sku: fabric.sku,
            composition: fabric.composition,
            width: fabric.width,
            weight: fabric.weight,
            pattern: fabric.pattern,
            color: fabric.color,
            color_family: fabric.colorFamily,
            color_hex: fabric.colorHex,
            usage: fabric.usage,
            care_instructions: fabric.careInstructions,
            durability: fabric.durability,
            properties: fabric.properties,
            manufacturer: fabric.collection, // Using collection as manufacturer for now
            in_stock: fabric.inStock,
            original_id: fabric.id,
            
            // Admin system fields (if available)
            is_pet_friendly: false,
            is_stain_resistant: fabric.properties.includes('Stain Resistant'),
            is_outdoor_safe: fabric.usage === 'Outdoor' || fabric.usage === 'Both',
          }
        })

        // Create a single variant for the fabric
        const variant = await productModuleService.createProductVariants({
          product_id: product.id,
          title: `${fabric.name} - ${fabric.color}`,
          sku: fabric.sku,
          manage_inventory: true,
          allow_backorder: false,
          inventory_quantity: fabric.inStock ? 100 : 0,
          
          // Set options
          options: [
            {
              option_id: 'color_option', // We'll create these options separately
              value: fabric.color
            }
          ]
        })

        // Set pricing (example price since not in current data)
        const basePrice = 100.00 // Default price - should be updated with real data
        await productModuleService.createProductVariantPrices({
          variant_id: variant.id,
          prices: [{
            amount: basePrice * 100, // Convert to cents
            currency_code: 'usd'
          }]
        })

        // Create fabric-specific properties using our custom module
        await fabricPropertiesService.createFabricProperties({
          product_id: product.id,
          composition: fabric.composition,
          width: fabric.width,
          weight: fabric.weight,
          pattern: fabric.pattern,
          color: fabric.color,
          color_family: fabric.colorFamily,
          color_hex: fabric.colorHex,
          usage: fabric.usage as "Indoor" | "Outdoor" | "Both",
          care_instructions: fabric.careInstructions,
          durability: fabric.durability,
          manufacturer: fabric.collection,
          collection: fabric.collection,
          is_stain_resistant: fabric.properties.includes('Stain Resistant'),
          is_outdoor_safe: fabric.usage === 'Outdoor' || fabric.usage === 'Both',
          properties: fabric.properties
        })

        importCount++
        console.log(`✅ Imported fabric: ${fabric.name} (${fabric.sku})`)
        
      } catch (error) {
        console.error(`❌ Failed to import fabric ${fabric.name}:`, error)
      }
    }

    console.log(`🎉 Migration completed! Imported ${importCount}/${fabricSwatches.length} fabrics`)
    console.log("📊 Summary:")
    console.log(`  - Collections: ${fabricCollections.length}`)
    console.log(`  - Categories: ${uniqueCategories.length}`) 
    console.log(`  - Products: ${importCount}`)

  } catch (error) {
    console.error("❌ Migration failed:", error)
    throw error
  }
}

function generateSlug(name: string, sku: string): string {
  // Generate URL-friendly slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  
  // Ensure uniqueness by appending SKU
  return `${slug}-${sku.toLowerCase()}`
}

// Run the migration
importFabricData()
  .then(() => {
    console.log("✅ Fabric data migration completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error)
    process.exit(1)
  })