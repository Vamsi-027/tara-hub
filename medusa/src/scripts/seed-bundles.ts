import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

interface BundleProduct {
  title: string;
  handle: string;
  description: string;
  status: "published" | "draft";
  thumbnail?: string;
  images?: string[];
  category_ids?: string[];
  type_id?: string;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hs_code?: string;
  origin_country?: string;
  mid_code?: string;
  material?: string;
  metadata?: Record<string, any>;
  variants: {
    title: string;
    sku: string;
    barcode?: string;
    manage_inventory: boolean;
    prices: {
      amount: number;
      currency_code: string;
      region_id?: string;
    }[];
    inventory_quantity?: number;
    weight?: number;
  }[];
}

export default async function seedBundles({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productService = container.resolve(Modules.PRODUCT);
  const regionService = container.resolve(Modules.REGION);
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Starting bundle products seed...");

  try {
    // Get the default region (or first available region)
    const regions = await regionService.listRegions({});
    const defaultRegion = regions.find(r => r.currency_code === "usd") || regions[0];

    if (!defaultRegion) {
      throw new Error("No region found. Please set up at least one region first.");
    }

    // Get the default sales channel
    const salesChannels = await salesChannelService.listSalesChannels({});
    const defaultChannel = salesChannels.find(sc => sc.name === "Default Sales Channel") || salesChannels[0];

    if (!defaultChannel) {
      throw new Error("No sales channel found. Please set up at least one sales channel first.");
    }

    // Define bundle products
    const bundleProducts: BundleProduct[] = [
      {
        title: "Designer's Choice - 5 Swatch Bundle",
        handle: "designers-choice-5-bundle",
        description: `This bundle includes one 4x6 inch sample of each of the following essential fabrics:
• Emerald Green Velvet - Luxurious medium-weight velvet perfect for upholstery
• Natural Linen - Classic lightweight linen ideal for curtains and clothing
• Charcoal Grey Wool - Durable wool blend suitable for winter projects
• Navy Blue Performance Weave - Water-resistant outdoor fabric
• Classic White Cotton Twill - Versatile medium-weight cotton for all purposes

Perfect for designers exploring color palettes and texture combinations.`,
        status: "published",
        weight: 100,
        metadata: {
          bundle_type: "curated",
          bundle_size: 5,
          sample_dimensions: "4x6 inches",
          contents: [
            "Emerald Green Velvet",
            "Natural Linen",
            "Charcoal Grey Wool",
            "Navy Blue Performance Weave",
            "Classic White Cotton Twill"
          ]
        },
        variants: [
          {
            title: "5 Swatch Bundle",
            sku: "BUNDLE-CURATED-5",
            manage_inventory: true,
            inventory_quantity: 100,
            weight: 100,
            prices: [
              {
                amount: 1099,
                currency_code: "usd"
              }
            ]
          }
        ]
      },
      {
        title: "Color Explorer - 10 Swatch Bundle",
        handle: "color-explorer-10-bundle",
        description: `A vibrant collection of 10 fabric samples (4x6 inches each) featuring:
• Ruby Red Silk - Lustrous lightweight silk for elegant projects
• Sapphire Blue Satin - Smooth satin with beautiful drape
• Golden Yellow Canvas - Sturdy cotton canvas for bags and decor
• Forest Green Tweed - Classic wool tweed with subtle texture
• Plum Purple Velvet - Rich velvet perfect for accent pieces
• Coral Pink Cotton - Soft cotton poplin for clothing
• Teal Blue Linen - Breathable linen blend for summer projects
• Burnt Orange Wool - Warm wool felt for crafts
• Dusty Rose Chambray - Lightweight chambray for shirts
• Mint Green Jersey - Stretchy cotton jersey for comfortable wear

Ideal for exploring our full color range before your next project.`,
        status: "published",
        weight: 200,
        metadata: {
          bundle_type: "curated",
          bundle_size: 10,
          sample_dimensions: "4x6 inches",
          contents: [
            "Ruby Red Silk",
            "Sapphire Blue Satin",
            "Golden Yellow Canvas",
            "Forest Green Tweed",
            "Plum Purple Velvet",
            "Coral Pink Cotton",
            "Teal Blue Linen",
            "Burnt Orange Wool",
            "Dusty Rose Chambray",
            "Mint Green Jersey"
          ]
        },
        variants: [
          {
            title: "10 Swatch Bundle",
            sku: "BUNDLE-CURATED-10",
            manage_inventory: true,
            inventory_quantity: 100,
            weight: 200,
            prices: [
              {
                amount: 1899,
                currency_code: "usd"
              }
            ]
          }
        ]
      },
      {
        title: "Texture Collection - 15 Swatch Bundle",
        handle: "texture-collection-15-bundle",
        description: `Experience 15 different fabric textures (4x6 inches each):
• Smooth Silk Charmeuse - Lustrous and flowing
• Nubby Linen Blend - Natural texture with character
• Plush Velvet - Deep pile luxury fabric
• Crisp Cotton Poplin - Smooth and professional
• Soft Flannel - Brushed for warmth and comfort
• Structured Canvas - Heavy-duty and durable
• Delicate Lace - Intricate openwork design
• Cozy Fleece - Synthetic warmth and softness
• Classic Denim - Sturdy cotton twill weave
• Lightweight Voile - Sheer and airy
• Heavy Upholstery - Thick and durable
• Stretch Jersey - Flexible knit fabric
• Textured Bouclé - Looped yarn texture
• Sheer Organza - Crisp transparent fabric
• Rugged Cordura - Technical outdoor fabric

Perfect for understanding fabric feel, drape, and weight differences.`,
        status: "published",
        weight: 300,
        metadata: {
          bundle_type: "curated",
          bundle_size: 15,
          sample_dimensions: "4x6 inches",
          free_shipping: true,
          contents: [
            "Smooth Silk Charmeuse",
            "Nubby Linen Blend",
            "Plush Velvet",
            "Crisp Cotton Poplin",
            "Soft Flannel",
            "Structured Canvas",
            "Delicate Lace",
            "Cozy Fleece",
            "Classic Denim",
            "Lightweight Voile",
            "Heavy Upholstery",
            "Stretch Jersey",
            "Textured Bouclé",
            "Sheer Organza",
            "Rugged Cordura"
          ]
        },
        variants: [
          {
            title: "15 Swatch Bundle",
            sku: "BUNDLE-CURATED-15",
            manage_inventory: true,
            inventory_quantity: 50,
            weight: 300,
            prices: [
              {
                amount: 2499,
                currency_code: "usd"
              }
            ]
          }
        ]
      },
      {
        title: "Professional Pack - 20 Swatch Bundle",
        handle: "professional-pack-20-bundle",
        description: `Our most comprehensive bundle with 20 premium fabric samples (4x6 inches each):

COTTONS (5 samples):
• Cotton Twill - Medium weight with diagonal weave
• Cotton Poplin - Smooth and crisp finish
• Cotton Canvas - Heavy and durable
• Cotton Jersey - Soft stretch knit
• Cotton Flannel - Brushed for warmth

LINENS (4 samples):
• Natural Linen - Classic texture and drape
• Belgian Linen - Premium quality
• Linen Blend - Wrinkle-resistant mix
• Heavy Linen - Upholstery weight

WOOLS (3 samples):
• Merino Wool - Fine and soft
• Wool Tweed - Classic pattern
• Wool Felt - Compressed and sturdy

SILKS (3 samples):
• Silk Charmeuse - Smooth and lustrous
• Dupioni Silk - Textured with slubs
• Silk Organza - Sheer and crisp

PERFORMANCE (2 samples):
• Water-Resistant Nylon - Technical outdoor
• UV-Protective Polyester - Sun-safe fabric

SPECIALTY (3 samples):
• Luxury Velvet - Deep pile elegance
• Faux Leather - Vegan alternative
• Metallic Lamé - Shimmer and shine

The ultimate reference collection for professional designers and serious crafters.`,
        status: "published",
        weight: 400,
        metadata: {
          bundle_type: "curated",
          bundle_size: 20,
          sample_dimensions: "4x6 inches",
          free_shipping: true,
          professional_grade: true,
          contents: {
            cottons: ["Cotton Twill", "Cotton Poplin", "Cotton Canvas", "Cotton Jersey", "Cotton Flannel"],
            linens: ["Natural Linen", "Belgian Linen", "Linen Blend", "Heavy Linen"],
            wools: ["Merino Wool", "Wool Tweed", "Wool Felt"],
            silks: ["Silk Charmeuse", "Dupioni Silk", "Silk Organza"],
            performance: ["Water-Resistant Nylon", "UV-Protective Polyester"],
            specialty: ["Luxury Velvet", "Faux Leather", "Metallic Lamé"]
          }
        },
        variants: [
          {
            title: "20 Swatch Bundle",
            sku: "BUNDLE-CURATED-20",
            manage_inventory: true,
            inventory_quantity: 50,
            weight: 400,
            prices: [
              {
                amount: 2999,
                currency_code: "usd"
              }
            ]
          }
        ]
      }
    ];

    logger.info(`Creating ${bundleProducts.length} bundle products...`);

    // Create each bundle product
    for (const bundleData of bundleProducts) {
      try {
        // Check if product already exists
        const existingProducts = await productService.listProducts({
          filters: { handle: bundleData.handle }
        });

        if (existingProducts.length > 0) {
          logger.info(`Bundle "${bundleData.title}" already exists. Skipping...`);
          continue;
        }

        // Create the product with variants
        const product = await productService.createProducts({
          title: bundleData.title,
          handle: bundleData.handle,
          description: bundleData.description,
          status: bundleData.status,
          weight: bundleData.weight,
          metadata: bundleData.metadata,
          sales_channels: [{ id: defaultChannel.id }],
          variants: bundleData.variants.map(variant => ({
            title: variant.title,
            sku: variant.sku,
            manage_inventory: variant.manage_inventory,
            inventory_quantity: variant.inventory_quantity,
            weight: variant.weight,
            prices: variant.prices.map(price => ({
              amount: price.amount,
              currency_code: price.currency_code,
              region_id: defaultRegion.id
            }))
          }))
        });

        logger.info(`✓ Created bundle: ${bundleData.title}`);
      } catch (error) {
        logger.error(`Failed to create bundle "${bundleData.title}":`, error);
      }
    }

    logger.info("✓ Bundle products seed completed successfully!");

  } catch (error) {
    logger.error("Failed to seed bundle products:", error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  require("dotenv").config();

  seedBundles({
    container: require("../loaders/container").default
  })
    .then(() => {
      console.log("Bundle seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Bundle seeding failed:", error);
      process.exit(1);
    });
}