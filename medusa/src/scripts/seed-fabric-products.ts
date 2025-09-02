import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedFabricProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  logger.info("🏠 Seeding home fabric products...")

  // Get default sales channel
  const [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!defaultSalesChannel) {
    logger.error("No default sales channel found. Please run the main seed script first.")
    return
  }

  // Get shipping profile
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const shippingProfiles = await fulfillmentModule.listShippingProfiles()
  const shippingProfile = shippingProfiles[0]

  if (!shippingProfile) {
    logger.error("No shipping profile found. Please run the main seed script first.")
    return
  }

  logger.info("Using existing categories...")
  
  const productModule = container.resolve(Modules.PRODUCT)
  const categoryResult = await productModule.listProductCategories()
  
  logger.info(`Found ${categoryResult.length} existing categories`)

  logger.info("Creating fabric products...")

  const fabricProducts = [
    {
      title: "Emerald Velvet Upholstery",
      description: "Luxurious deep-pile velvet perfect for statement sofas and elegant chairs. This premium fabric features a rich emerald green color with exceptional durability and stain resistance.",
      handle: "emerald-velvet-upholstery",
      category_ids: categoryResult.length > 0 ? [categoryResult[0].id] : [],
      weight: 450,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        {
          url: "https://images.unsplash.com/photo-1631049035326-57414e1739d7?w=1200",
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      options: [
        {
          title: "Unit",
          values: ["Per Yard", "Sample Swatch"],
        },
      ],
      variants: [
        {
          title: "Per Yard",
          options: { Unit: "Per Yard" },
          sku: "VEL-EMR-001",
          manage_inventory: true,
          inventory_quantity: 150,
          prices: [
            { currency_code: "usd", amount: 8999 },
            { currency_code: "eur", amount: 8499 },
          ],
        },
        {
          title: "Sample Swatch",
          options: { Unit: "Sample Swatch" },
          sku: "VEL-EMR-001-SW",
          manage_inventory: true,
          inventory_quantity: 500,
          prices: [
            { currency_code: "usd", amount: 500 },
            { currency_code: "eur", amount: 450 },
          ],
        },
      ],
    },
    {
      title: "Natural Linen Curtain Fabric",
      description: "Breathable, light-filtering linen ideal for modern window treatments. Creates a soft, diffused light while maintaining privacy.",
      handle: "natural-linen-curtain",
      category_ids: categoryResult.length > 0 ? [categoryResult[0].id] : [],
      weight: 280,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        {
          url: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200",
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      options: [
        {
          title: "Unit",
          values: ["Per Yard", "Sample Swatch"],
        },
      ],
      variants: [
        {
          title: "Per Yard",
          options: { Unit: "Per Yard" },
          sku: "LIN-NAT-002",
          manage_inventory: true,
          inventory_quantity: 200,
          prices: [
            { currency_code: "usd", amount: 5499 },
            { currency_code: "eur", amount: 5199 },
          ],
        },
        {
          title: "Sample Swatch",
          options: { Unit: "Sample Swatch" },
          sku: "LIN-NAT-002-SW",
          manage_inventory: true,
          inventory_quantity: 300,
          prices: [
            { currency_code: "usd", amount: 500 },
            { currency_code: "eur", amount: 450 },
          ],
        },
      ],
    },
    {
      title: "Modern Geometric Print Cotton",
      description: "Bold contemporary patterns for accent cushions and throw pillows. Machine washable and colorfast.",
      handle: "geometric-print-cushion",
      category_ids: categoryResult.length > 0 ? [categoryResult[0].id] : [], // Using first category, was:      weight: 320,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        {
          url: "https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=1200",
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      options: [
        {
          title: "Unit",
          values: ["Per Yard", "Sample Swatch"],
        },
      ],
      variants: [
        {
          title: "Per Yard",
          options: { Unit: "Per Yard" },
          sku: "GEO-CUS-003",
          manage_inventory: true,
          inventory_quantity: 180,
          prices: [
            { currency_code: "usd", amount: 3999 },
            { currency_code: "eur", amount: 3799 },
          ],
        },
        {
          title: "Sample Swatch",
          options: { Unit: "Sample Swatch" },
          sku: "GEO-CUS-003-SW",
          manage_inventory: true,
          inventory_quantity: 250,
          prices: [
            { currency_code: "usd", amount: 500 },
            { currency_code: "eur", amount: 450 },
          ],
        },
      ],
    },
    {
      title: "Waterproof Striped Canvas",
      description: "Durable outdoor fabric perfect for patio furniture and garden cushions. UV protected and mold resistant.",
      handle: "waterproof-outdoor-canvas",
      category_ids: categoryResult.length > 0 ? [categoryResult[0].id] : [], // Using first category, was:      weight: 380,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        {
          url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200",
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      options: [
        {
          title: "Unit",
          values: ["Per Yard", "Sample Swatch"],
        },
      ],
      variants: [
        {
          title: "Per Yard",
          options: { Unit: "Per Yard" },
          sku: "OUT-CAN-004",
          manage_inventory: true,
          inventory_quantity: 120,
          prices: [
            { currency_code: "usd", amount: 6499 },
            { currency_code: "eur", amount: 6199 },
          ],
        },
        {
          title: "Sample Swatch",
          options: { Unit: "Sample Swatch" },
          sku: "OUT-CAN-004-SW",
          manage_inventory: true,
          inventory_quantity: 200,
          prices: [
            { currency_code: "usd", amount: 500 },
            { currency_code: "eur", amount: 450 },
          ],
        },
      ],
    },
    {
      title: "Luxury Damask Silk Blend",
      description: "Exquisite damask pattern woven in silk blend, perfect for formal dining chairs and decorative pillows.",
      handle: "luxury-damask-silk",
      category_ids: categoryResult.length > 0 ? [categoryResult[0].id] : [], // Using first category, was:      weight: 340,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        {
          url: "https://images.unsplash.com/photo-1561053720-76cd73ff22c3?w=1200",
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      options: [
        {
          title: "Unit",
          values: ["Per Yard", "Sample Swatch"],
        },
      ],
      variants: [
        {
          title: "Per Yard",
          options: { Unit: "Per Yard" },
          sku: "DAM-SIL-005",
          manage_inventory: true,
          inventory_quantity: 80,
          prices: [
            { currency_code: "usd", amount: 12999 },
            { currency_code: "eur", amount: 12499 },
          ],
        },
        {
          title: "Sample Swatch",
          options: { Unit: "Sample Swatch" },
          sku: "DAM-SIL-005-SW",
          manage_inventory: true,
          inventory_quantity: 150,
          prices: [
            { currency_code: "usd", amount: 800 },
            { currency_code: "eur", amount: 750 },
          ],
        },
      ],
    },
    {
      title: "Organic Hemp Canvas",
      description: "Sustainable, durable hemp fabric perfect for eco-conscious upholstery projects. Naturally antimicrobial and hypoallergenic.",
      handle: "organic-hemp-canvas",
      category_ids: categoryResult.length > 0 ? [categoryResult[0].id] : [], // Using first category, was:      weight: 420,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        {
          url: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=1200",
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      options: [
        {
          title: "Unit",
          values: ["Per Yard", "Sample Swatch"],
        },
      ],
      variants: [
        {
          title: "Per Yard",
          options: { Unit: "Per Yard" },
          sku: "HEM-ECO-006",
          manage_inventory: true,
          inventory_quantity: 100,
          prices: [
            { currency_code: "usd", amount: 7999 },
            { currency_code: "eur", amount: 7599 },
          ],
        },
        {
          title: "Sample Swatch",
          options: { Unit: "Sample Swatch" },
          sku: "HEM-ECO-006-SW",
          manage_inventory: true,
          inventory_quantity: 200,
          prices: [
            { currency_code: "usd", amount: 600 },
            { currency_code: "eur", amount: 550 },
          ],
        },
      ],
    },
    {
      title: "Premium Leather-Look Vinyl",
      description: "High-quality vinyl upholstery that looks and feels like genuine leather. Perfect for high-traffic furniture.",
      handle: "premium-leather-vinyl",
      category_ids: categoryResult.length > 0 ? [categoryResult[0].id] : [],
      weight: 550,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        {
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      options: [
        {
          title: "Unit",
          values: ["Per Yard", "Sample Swatch"],
        },
      ],
      variants: [
        {
          title: "Per Yard",
          options: { Unit: "Per Yard" },
          sku: "VIN-LEA-007",
          manage_inventory: true,
          inventory_quantity: 90,
          prices: [
            { currency_code: "usd", amount: 4999 },
            { currency_code: "eur", amount: 4699 },
          ],
        },
        {
          title: "Sample Swatch",
          options: { Unit: "Sample Swatch" },
          sku: "VIN-LEA-007-SW",
          manage_inventory: true,
          inventory_quantity: 180,
          prices: [
            { currency_code: "usd", amount: 500 },
            { currency_code: "eur", amount: 450 },
          ],
        },
      ],
    },
    {
      title: "Embroidered Sheer Voile",
      description: "Delicate sheer fabric with beautiful embroidered details. Perfect for layering with heavier curtains.",
      handle: "embroidered-sheer-voile",
      category_ids: categoryResult.length > 0 ? [categoryResult[0].id] : [],
      weight: 120,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [
        {
          url: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1200",
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      options: [
        {
          title: "Unit",
          values: ["Per Yard", "Sample Swatch"],
        },
      ],
      variants: [
        {
          title: "Per Yard",
          options: { Unit: "Per Yard" },
          sku: "SHE-VOI-008",
          manage_inventory: true,
          inventory_quantity: 150,
          prices: [
            { currency_code: "usd", amount: 2999 },
            { currency_code: "eur", amount: 2799 },
          ],
        },
        {
          title: "Sample Swatch",
          options: { Unit: "Sample Swatch" },
          sku: "SHE-VOI-008-SW",
          manage_inventory: true,
          inventory_quantity: 250,
          prices: [
            { currency_code: "usd", amount: 400 },
            { currency_code: "eur", amount: 350 },
          ],
        },
      ],
    },
  ]

  await createProductsWorkflow(container).run({
    input: {
      products: fabricProducts,
    },
  })

  logger.info("✅ Finished seeding fabric products!")
  logger.info(`📦 Created ${fabricProducts.length} fabric products`)
  logger.info(`📁 Created ${categoryResult.length} fabric categories`)
  logger.info("\n🔗 Access your products at:")
  logger.info("• Admin Dashboard: http://localhost:9000/app/products")
  logger.info("• Fabric Store: http://localhost:3006/browse")
}