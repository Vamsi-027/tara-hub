/**
 * Quick script to add sample fabrics to Medusa
 * Run this to populate Medusa Admin with fabrics
 */

import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

export default async function addSampleFabrics({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const regionModuleService = container.resolve(Modules.REGION)

  logger.info("🧵 Adding sample fabrics to Medusa...")

  try {
    // Get default sales channel
    const [salesChannel] = await salesChannelModuleService.listSalesChannels({
      name: "Default Sales Channel",
    })
    
    // Get default region
    const [region] = await regionModuleService.listRegions({})

    // Sample fabric data
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
            title: "Quantity",
            values: ["Per Yard"]
          }
        ],
        variants: [
          {
            title: "Per Yard",
            sku: "FAB-NAVY-001",
            manage_inventory: true,
            inventory_quantity: 100,
            options: {
              Quantity: "Per Yard"
            },
            prices: [
              {
                amount: 12500, // $125.00
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
          durability: "Heavy Duty - 50,000 double rubs"
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
            title: "Quantity",
            values: ["Per Yard"]
          }
        ],
        variants: [
          {
            title: "Per Yard",
            sku: "FAB-SAGE-002",
            manage_inventory: true,
            inventory_quantity: 75,
            options: {
              Quantity: "Per Yard"
            },
            prices: [
              {
                amount: 9500, // $95.00
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
          durability: "Medium - 30,000 double rubs"
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
            title: "Quantity",
            values: ["Per Yard"]
          }
        ],
        variants: [
          {
            title: "Per Yard",
            sku: "FAB-VELVET-003",
            manage_inventory: true,
            inventory_quantity: 50,
            options: {
              Quantity: "Per Yard"
            },
            prices: [
              {
                amount: 15500, // $155.00
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
          durability: "Heavy Duty - 60,000 double rubs"
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
            title: "Quantity",
            values: ["Per Yard"]
          }
        ],
        variants: [
          {
            title: "Per Yard",
            sku: "FAB-TWEED-004",
            manage_inventory: true,
            inventory_quantity: 80,
            options: {
              Quantity: "Per Yard"
            },
            prices: [
              {
                amount: 11000, // $110.00
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
          durability: "Medium - 40,000 double rubs"
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
            title: "Quantity",
            values: ["Per Yard"]
          }
        ],
        variants: [
          {
            title: "Per Yard",
            sku: "FAB-OUTDOOR-005",
            manage_inventory: true,
            inventory_quantity: 120,
            options: {
              Quantity: "Per Yard"
            },
            prices: [
              {
                amount: 8500, // $85.00
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
          durability: "Heavy Duty - UV and mildew resistant"
        }
      }
    ]

    // Create products using workflow
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: sampleFabrics
      }
    })

    logger.info(`✅ Successfully added ${result.length} fabrics to Medusa!`)
    logger.info("📱 View them at: http://localhost:9000/app/products")
    logger.info("🛍️ They'll appear in fabric-store at: http://localhost:3006/browse")

  } catch (error) {
    logger.error("❌ Error adding sample fabrics:", error)
    throw error
  }
}