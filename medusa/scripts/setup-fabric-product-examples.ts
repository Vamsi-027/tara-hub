import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import FabricProductModuleService from "../src/modules/fabric_products/service"

type FabricProductType = "standard" | "custom"

/**
 * Setup script to create example products for fabric selection types
 * 
 * This creates:
 * 1. Configurable Fabric Product - User selects single fabric
 * 2. Configurable Swatch Set - User selects multiple fabrics
 * 3. Fixed Fabric Product - Standard product with fabric-details
 * 4. Fixed Swatch Product - Standard product representing a set
 * 
 * Usage: npm run setup:fabric-products
 */
export default async function setupFabricProductExamples({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModule = container.resolve(Modules.PRODUCT)
  const fabricProductService = container.resolve("fabricProductModuleService") as FabricProductModuleService
  const fabricDetailsService = container.resolve("fabricDetailsModuleService")
  
  logger.info("🎨 Setting up fabric product examples...")

  try {
    // Get sales channel
    const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
    const [defaultSalesChannel] = await salesChannelModule.listSalesChannels({
      name: "Default Sales Channel",
    })

    // ============================================================================
    // TYPE 1: Configurable Fabric Product (User selects fabric)
    // ============================================================================
    logger.info("\n📦 Creating Type 1: Configurable Fabric Product")
    
    const customCurtainProduct = await createProductsWorkflow(container).run({
      input: {
        products: [{
          title: "Custom Window Curtains",
          handle: "custom-window-curtains",
          description: "Beautiful custom curtains made with your choice of fabric. Select from our premium fabric collection.",
          status: "published",
          
          // Base product info
          metadata: {
            product_type: "configurable_fabric",
            customizable: true,
            production_time: "7-10 days",
            instructions: "Select your fabric after choosing size"
          },
          
          // Size variants (fabric selection happens after)
          options: [
            {
              title: "Size",
              values: ["36x54 inches", "52x84 inches", "52x96 inches", "104x84 inches"]
            }
          ],
          
          variants: [
            {
              title: "36x54 inches",
              sku: "CURT-36x54",
              options: { Size: "36x54 inches" },
              prices: [{ amount: 12000, currency_code: "usd" }] // $120 base + fabric
            },
            {
              title: "52x84 inches",
              sku: "CURT-52x84",
              options: { Size: "52x84 inches" },
              prices: [{ amount: 18000, currency_code: "usd" }] // $180 base + fabric
            },
            {
              title: "52x96 inches",
              sku: "CURT-52x96",
              options: { Size: "52x96 inches" },
              prices: [{ amount: 22000, currency_code: "usd" }] // $220 base + fabric
            },
            {
              title: "104x84 inches",
              sku: "CURT-104x84",
              options: { Size: "104x84 inches" },
              prices: [{ amount: 36000, currency_code: "usd" }] // $360 base + fabric
            }
          ],
          
          sales_channels: [{ id: defaultSalesChannel.id }]
        }]
      }
    })
    
    // Configure for fabric selection
    await fabricProductService.createConfigurableFabricProduct(
      (customCurtainProduct.result as any).products[0].id,
      {
        category_filter: "Drapery", // Only show drapery fabrics
        base_price: 0 // Price calculated from variant + fabric
      }
    )
    
    logger.info(`✅ Created: ${(customCurtainProduct.result as any).products[0].title}`)

    // ============================================================================
    // TYPE 2: Fixed Fabric Product (Uses standard product + fabric-details)
    // ============================================================================
    logger.info("\n📦 Creating Type 2: Fixed Fabric Product (Standard Product)")
    
    const velvetPillowProduct = await createProductsWorkflow(container).run({
      input: {
        products: [{
          title: "Luxury Velvet Throw Pillow - Emerald",
          handle: "luxury-velvet-pillow-emerald",
          description: "Plush velvet throw pillow in rich emerald green. Premium quality with hidden zipper.",
          status: "published",
          
          metadata: {
            product_type: "fixed_fabric",  // For display purposes
            fabric_sku: "VEL-EMR-001",
            fabric_name: "Emerald Velvet",
            material: "100% Polyester Velvet",
            care: "Dry clean recommended"
          },
          
          options: [
            {
              title: "Size",
              values: ["16x16", "18x18", "20x20", "22x22"]
            },
            {
              title: "Insert",
              values: ["Cover Only", "With Insert"]
            }
          ],
          
          variants: [
            {
              title: "16x16 / Cover Only",
              sku: "PILLOW-VEL-16-CO",
              options: { Size: "16x16", Insert: "Cover Only" },
              prices: [{ amount: 3500, currency_code: "usd" }],
              // inventory_quantity: 50
            },
            {
              title: "16x16 / With Insert",
              sku: "PILLOW-VEL-16-WI",
              options: { Size: "16x16", Insert: "With Insert" },
              prices: [{ amount: 4500, currency_code: "usd" }],
              // inventory_quantity: 30
            },
            {
              title: "20x20 / Cover Only",
              sku: "PILLOW-VEL-20-CO",
              options: { Size: "20x20", Insert: "Cover Only" },
              prices: [{ amount: 4500, currency_code: "usd" }],
              // inventory_quantity: 40
            },
            {
              title: "20x20 / With Insert",
              sku: "PILLOW-VEL-20-WI",
              options: { Size: "20x20", Insert: "With Insert" },
              prices: [{ amount: 5500, currency_code: "usd" }],
              // inventory_quantity: 25
            }
          ],
          
          sales_channels: [{ id: defaultSalesChannel.id }]
        }]
      }
    })
    
    // Add fabric details using fabric-details module
    await (fabricDetailsService as any).create({
      product_id: (velvetPillowProduct.result as any).products[0].id,
      composition: "100% Polyester Velvet",
      color: "Emerald",
      color_family: "Green",
      pattern: "Solid",
      durability: "High",
      durability_rating: 9,
      is_pet_friendly: true,
      is_stain_resistant: true,
      care_instructions: "Dry clean recommended. Spot clean with mild detergent.",
      properties: {
        fabric_id: "fab-id-123", // Reference to actual fabric if needed
        fabric_sku: "VEL-EMR-001"
      }
    })
    
    logger.info(`✅ Created: ${(velvetPillowProduct.result as any).products[0].title} (Standard Product)`)

    // ============================================================================
    // TYPE 3: Configurable Swatch Set (User selects multiple fabrics)
    // ============================================================================
    logger.info("\n📦 Creating Type 3: Configurable Swatch Set Product")
    
    const swatchSetProduct = await createProductsWorkflow(container).run({
      input: {
        products: [{
          title: "Fabric Swatch Set - Choose 5",
          handle: "fabric-swatch-set-5",
          description: "Select any 5 fabric swatches from our collection. Perfect for comparing colors and textures before your purchase.",
          status: "published",
          
          metadata: {
            product_type: "configurable_swatch_set",
            set_size: 5,
            swatch_size: "3x3 inches",
            shipping: "Free shipping"
          },
          
          // Single variant - price is fixed regardless of selection
          variants: [
            {
              title: "5 Swatch Set",
              sku: "SWATCH-SET-5",
              prices: [{ amount: 1000, currency_code: "usd" }], // $10 for 5 swatches
              // inventory_quantity: 999 // Virtually unlimited
            }
          ],
          
          sales_channels: [{ id: defaultSalesChannel.id }]
        }]
      }
    })
    
    // Configure for multiple fabric selection
    await fabricProductService.createConfigurableSwatchSetProduct(
      (swatchSetProduct.result as any).products[0].id,
      {
        min_selections: 5,
        max_selections: 5,
        set_price: 1000, // $10.00 fixed
        category_filter: undefined // Show all fabrics
      }
    )
    
    logger.info(`✅ Created: ${(swatchSetProduct.result as any).products[0].title}`)

    // ============================================================================
    // TYPE 4: Fixed Swatch Product (Standard product representing a set)
    // ============================================================================
    logger.info("\n📦 Creating Type 4: Fixed Swatch Product (Standard Product)")
    
    const cottonSwatchProduct = await createProductsWorkflow(container).run({
      input: {
        products: [{
          title: "Cotton Collection Swatch Set",
          handle: "cotton-collection-swatch-set",
          description: "Complete swatch set of our premium cotton collection. Includes 12 different cotton fabrics.",
          status: "published",
          
          metadata: {
            product_type: "fixed_swatch", // For display purposes
            collection: "Cotton Essentials",
            swatch_count: 12,
            swatch_size: "4x4 inches",
            included_fabrics: [
              "Natural Cotton Canvas",
              "White Cotton Twill",
              "Ivory Cotton Duck",
              "Beige Cotton Sateen",
              "Gray Cotton Poplin",
              "Navy Cotton Drill",
              "Black Cotton Canvas",
              "Striped Cotton Ticking",
              "Cotton Gingham Check",
              "Cotton Herringbone",
              "Cotton Oxford",
              "Cotton Chambray"
            ]
          },
          
          variants: [
            {
              title: "Cotton Swatch Set",
              sku: "SWATCH-COTTON-SET",
              prices: [{ amount: 2500, currency_code: "usd" }], // $25 for the set
              // inventory_quantity: 100
            }
          ],
          
          sales_channels: [{ id: defaultSalesChannel.id }]
        }]
      }
    })
    
    // Add fabric details for the collection
    await (fabricDetailsService as any).create({
      product_id: (cottonSwatchProduct.result as any).products[0].id,
      composition: "100% Cotton (various weaves)",
      collection: "Cotton Essentials",
      properties: {
        fabric_collection_id: "cotton-collection-id",
        included_fabric_skus: [
          "COT-NAT-001", "COT-WHT-002", "COT-IVY-003",
          "COT-BEI-004", "COT-GRY-005", "COT-NAV-006",
          "COT-BLK-007", "COT-STR-008", "COT-GNG-009",
          "COT-HER-010", "COT-OXF-011", "COT-CHM-012"
        ]
      }
    })
    
    logger.info(`✅ Created: ${(cottonSwatchProduct.result as any).products[0].title} (Standard Product)`)

    // ============================================================================
    // Summary
    // ============================================================================
    logger.info("\n" + "=".repeat(60))
    logger.info("✨ Fabric product examples created successfully!")
    logger.info("\nProduct Types Created:")
    logger.info("1. ✅ Configurable Fabric: Custom Window Curtains (requires fabric selection)")
    logger.info("2. ✅ Fixed Fabric: Luxury Velvet Throw Pillow (standard product + fabric-details)")
    logger.info("3. ✅ Configurable Swatch Set: Choose 5 Swatches (requires multiple selections)")
    logger.info("4. ✅ Fixed Swatch: Cotton Collection Set (standard product + fabric-details)")
    logger.info("\nNote: Types 2 & 4 are standard Medusa products using fabric-details module")
    logger.info("Only Types 1 & 3 use the custom fabric-products module for selection")
    logger.info("=".repeat(60))

  } catch (error) {
    logger.error("❌ Failed to create fabric product examples:", error)
    throw error
  }
}

// Helper function to link fabric availability to configurable products
async function setFabricAvailabilityForProduct(
  fabricProductService: FabricProductModuleService,
  productId: string,
  fabricIds: string[]
) {
  for (const fabricId of fabricIds) {
    await fabricProductService.setFabricAvailability(productId, fabricId, {
      is_available: true,
      price_adjustment: 0, // No additional cost
      lead_time_days: 5,
      min_order_quantity: 1
    })
  }
}