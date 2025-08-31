/**
 * Script to add fabrics with both swatch and fabric (per yard) variants
 * Each product will have two variants with different pricing
 */

import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function addFabricsWithSwatches({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const regionModuleService = container.resolve(Modules.REGION)

  logger.info("🧵 Adding fabrics with swatch variants to Medusa...")

  try {
    // Get default sales channel
    const [salesChannel] = await salesChannelModuleService.listSalesChannels({
      name: "Default Sales Channel",
    })
    
    // Get default region
    const [region] = await regionModuleService.listRegions({})

    // Sample fabric data with both swatch and fabric variants
    const sampleFabrics = [
      {
        title: "Premium Navy Canvas",
        handle: "premium-navy-canvas",
        description: "A versatile navy cotton canvas perfect for upholstery and home decor. Features excellent durability and a luxurious feel.",
        status: ProductStatus.PUBLISHED,
        thumbnail: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=300&fit=crop",
        images: [
          { url: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800" }
        ],
        categories: [],
        sales_channels: salesChannel ? [{ id: salesChannel.id }] : [],
        options: [
          {
            title: "Type",
            values: ["Swatch", "Fabric"]
          }
        ],
        variants: [
          {
            title: "Swatch Sample",
            sku: "FAB-NAVY-001-SWATCH",
            manage_inventory: true,
            inventory_quantity: 500,
            options: {
              Type: "Swatch"
            },
            prices: [
              {
                amount: 500, // $5.00 for a swatch
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          },
          {
            title: "Fabric Per Yard",
            sku: "FAB-NAVY-001-YARD",
            manage_inventory: true,
            inventory_quantity: 100,
            options: {
              Type: "Fabric"
            },
            prices: [
              {
                amount: 12500, // $125.00 per yard
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          }
        ],
        metadata: {
          composition: "100% Cotton Canvas",
          width: "54 inches",
          weight: "12 oz",
          pattern: "Solid",
          color: "Navy",
          color_hex: "#1e3a8a",
          usage: "Indoor",
          care_instructions: "Machine washable, cold water",
          durability: "Heavy Duty - 50,000 double rubs",
          swatch_size: "4x4 inches",
          minimum_order_yards: "1"
        }
      },
      {
        title: "Soft Sage Linen Blend",
        handle: "soft-sage-linen-blend",
        description: "A calming sage green linen-cotton blend with natural texture. Perfect for drapery and light upholstery.",
        status: ProductStatus.PUBLISHED,
        thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
        images: [
          { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800" }
        ],
        categories: [],
        sales_channels: salesChannel ? [{ id: salesChannel.id }] : [],
        options: [
          {
            title: "Type",
            values: ["Swatch", "Fabric"]
          }
        ],
        variants: [
          {
            title: "Swatch Sample",
            sku: "FAB-SAGE-002-SWATCH",
            manage_inventory: true,
            inventory_quantity: 400,
            options: {
              Type: "Swatch"
            },
            prices: [
              {
                amount: 500, // $5.00 for a swatch
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          },
          {
            title: "Fabric Per Yard",
            sku: "FAB-SAGE-002-YARD",
            manage_inventory: true,
            inventory_quantity: 75,
            options: {
              Type: "Fabric"
            },
            prices: [
              {
                amount: 9500, // $95.00 per yard
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          }
        ],
        metadata: {
          composition: "70% Cotton, 30% Linen",
          width: "52 inches",
          weight: "9 oz",
          pattern: "Solid",
          color: "Sage",
          color_hex: "#86a873",
          usage: "Indoor",
          care_instructions: "Machine wash gentle, line dry",
          durability: "Medium - 30,000 double rubs",
          swatch_size: "4x4 inches",
          minimum_order_yards: "1"
        }
      },
      {
        title: "Emerald Luxury Velvet",
        handle: "emerald-luxury-velvet",
        description: "Deep emerald velvet with exceptional luster and depth. Ideal for statement furniture pieces.",
        status: ProductStatus.PUBLISHED,
        thumbnail: "https://images.unsplash.com/photo-1604076984203-587c92ab2e58?w=300&h=300&fit=crop",
        images: [
          { url: "https://images.unsplash.com/photo-1604076984203-587c92ab2e58?w=800" }
        ],
        categories: [],
        sales_channels: salesChannel ? [{ id: salesChannel.id }] : [],
        options: [
          {
            title: "Type",
            values: ["Swatch", "Fabric"]
          }
        ],
        variants: [
          {
            title: "Swatch Sample",
            sku: "FAB-VELVET-003-SWATCH",
            manage_inventory: true,
            inventory_quantity: 300,
            options: {
              Type: "Swatch"
            },
            prices: [
              {
                amount: 750, // $7.50 for a luxury swatch
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          },
          {
            title: "Fabric Per Yard",
            sku: "FAB-VELVET-003-YARD",
            manage_inventory: true,
            inventory_quantity: 50,
            options: {
              Type: "Fabric"
            },
            prices: [
              {
                amount: 15500, // $155.00 per yard
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          }
        ],
        metadata: {
          composition: "100% Polyester Velvet",
          width: "54 inches",
          weight: "16 oz",
          pattern: "Solid",
          color: "Emerald",
          color_hex: "#065f46",
          usage: "Indoor",
          care_instructions: "Professional cleaning recommended",
          durability: "Heavy Duty - 60,000 double rubs",
          swatch_size: "4x4 inches",
          minimum_order_yards: "2"
        }
      },
      {
        title: "Natural Herringbone Tweed",
        handle: "natural-herringbone-tweed",
        description: "Classic herringbone pattern in natural cream tones. Timeless elegance for any interior.",
        status: ProductStatus.PUBLISHED,
        thumbnail: "https://images.unsplash.com/photo-1564258523680-07f21750566f?w=300&h=300&fit=crop",
        images: [
          { url: "https://images.unsplash.com/photo-1564258523680-07f21750566f?w=800" }
        ],
        categories: [],
        sales_channels: salesChannel ? [{ id: salesChannel.id }] : [],
        options: [
          {
            title: "Type",
            values: ["Swatch", "Fabric"]
          }
        ],
        variants: [
          {
            title: "Swatch Sample",
            sku: "FAB-TWEED-004-SWATCH",
            manage_inventory: true,
            inventory_quantity: 350,
            options: {
              Type: "Swatch"
            },
            prices: [
              {
                amount: 600, // $6.00 for a swatch
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          },
          {
            title: "Fabric Per Yard",
            sku: "FAB-TWEED-004-YARD",
            manage_inventory: true,
            inventory_quantity: 80,
            options: {
              Type: "Fabric"
            },
            prices: [
              {
                amount: 11000, // $110.00 per yard
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          }
        ],
        metadata: {
          composition: "100% Wool",
          width: "54 inches",
          weight: "14 oz",
          pattern: "Herringbone",
          color: "Cream",
          color_hex: "#f5f5dc",
          usage: "Indoor",
          care_instructions: "Dry clean only",
          durability: "Medium - 40,000 double rubs",
          swatch_size: "4x4 inches",
          minimum_order_yards: "1"
        }
      },
      {
        title: "Outdoor Performance Stripe",
        handle: "outdoor-performance-stripe",
        description: "Weather-resistant striped fabric perfect for outdoor furniture and marine applications.",
        status: ProductStatus.PUBLISHED,
        thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop",
        images: [
          { url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800" }
        ],
        categories: [],
        sales_channels: salesChannel ? [{ id: salesChannel.id }] : [],
        options: [
          {
            title: "Type",
            values: ["Swatch", "Fabric"]
          }
        ],
        variants: [
          {
            title: "Swatch Sample",
            sku: "FAB-OUTDOOR-005-SWATCH",
            manage_inventory: true,
            inventory_quantity: 600,
            options: {
              Type: "Swatch"
            },
            prices: [
              {
                amount: 400, // $4.00 for a swatch
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          },
          {
            title: "Fabric Per Yard",
            sku: "FAB-OUTDOOR-005-YARD",
            manage_inventory: true,
            inventory_quantity: 120,
            options: {
              Type: "Fabric"
            },
            prices: [
              {
                amount: 8500, // $85.00 per yard
                currency_code: "usd",
                region_id: region?.id
              }
            ]
          }
        ],
        metadata: {
          composition: "100% Solution Dyed Acrylic",
          width: "54 inches",
          weight: "10 oz",
          pattern: "Stripe",
          color: "Blue/White",
          color_hex: "#3b82f6",
          usage: "Outdoor",
          care_instructions: "Spot clean with mild soap",
          durability: "Heavy Duty - UV and mildew resistant",
          swatch_size: "4x4 inches",
          minimum_order_yards: "1"
        }
      }
    ]

    // Delete existing products first (optional - comment out if you want to keep them)
    logger.info("🗑️ Removing existing products...")
    const existingProducts = await container.resolve(Modules.PRODUCT).listProducts({})
    for (const product of existingProducts) {
      await container.resolve(Modules.PRODUCT).deleteProducts([product.id])
    }

    // Create products using workflow
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: sampleFabrics
      }
    })

    logger.info(`✅ Successfully added ${result.length} fabrics with swatch variants to Medusa!`)
    logger.info("📱 View them at: http://localhost:9000/app/products")
    logger.info("🛍️ They'll appear in fabric-store at: http://localhost:3006/browse")
    logger.info("💡 Each fabric now has:")
    logger.info("   - Swatch variant: Small sample at lower price")
    logger.info("   - Fabric variant: Full fabric sold per yard")

  } catch (error) {
    logger.error("❌ Error adding fabrics with swatches:", error)
    throw error
  }
}