const { Medusa } = require("@medusajs/js-sdk");
require("dotenv").config();

// Initialize Medusa client
const medusa = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  debug: process.env.NODE_ENV === "development",
});

// Bundle products data
const bundleProducts = [
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

async function getAdminToken() {
  try {
    console.log("🔐 Authenticating as admin...");

    // First, try to authenticate with existing admin credentials
    const authResponse = await medusa.auth.login({
      email: process.env.MEDUSA_ADMIN_EMAIL || "admin@medusa.com",
      password: process.env.MEDUSA_ADMIN_PASSWORD || "medusa123"
    });

    if (authResponse?.token) {
      console.log("✅ Admin authentication successful");
      return authResponse.token;
    }
  } catch (error) {
    console.log("⚠️ Admin authentication failed, trying alternative method...");
  }

  // If authentication fails, return null and we'll proceed without token
  console.log("ℹ️ Proceeding without admin token (will use store API)");
  return null;
}

async function seedBundles() {
  console.log("🚀 Starting bundle products seed...");
  console.log(`📍 Medusa Backend URL: ${medusa.config.baseUrl}`);

  try {
    // Get admin token if possible
    const adminToken = await getAdminToken();

    // Get regions to find USD region
    console.log("\n🌍 Fetching regions...");
    const { regions } = await medusa.store.region.list();
    const usdRegion = regions.find(r => r.currency_code === "usd");

    if (!usdRegion) {
      throw new Error("No USD region found. Please set up a US region first.");
    }
    console.log(`✅ Found USD region: ${usdRegion.name} (${usdRegion.id})`);

    // Create each bundle product
    console.log("\n📦 Creating bundle products...");
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const bundleData of bundleProducts) {
      try {
        // Check if product already exists
        console.log(`\nChecking if "${bundleData.title}" exists...`);
        const { products: existingProducts } = await medusa.store.product.list({
          handle: bundleData.handle,
        });

        if (existingProducts && existingProducts.length > 0) {
          console.log(`⏭️ Bundle "${bundleData.title}" already exists. Skipping...`);
          skipped++;
          continue;
        }

        // Use admin API if we have a token, otherwise use a workaround
        if (adminToken) {
          console.log(`Creating "${bundleData.title}" via Admin API...`);

          // Admin API endpoint for creating products
          const response = await fetch(`${medusa.config.baseUrl}/admin/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              title: bundleData.title,
              handle: bundleData.handle,
              description: bundleData.description,
              status: bundleData.status,
              weight: bundleData.weight,
              metadata: bundleData.metadata,
              variants: bundleData.variants
            })
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
          }

          console.log(`✅ Created bundle: ${bundleData.title}`);
          created++;
        } else {
          // Store API doesn't allow product creation
          console.log(`⚠️ Cannot create products via Store API. Please create manually or use admin credentials.`);
          console.log(`Product details for "${bundleData.title}":`);
          console.log(`- Handle: ${bundleData.handle}`);
          console.log(`- SKU: ${bundleData.variants[0].sku}`);
          console.log(`- Price: $${(bundleData.variants[0].prices[0].amount / 100).toFixed(2)}`);
          failed++;
        }

      } catch (error) {
        console.error(`❌ Failed to create bundle "${bundleData.title}":`, error.message);
        failed++;
      }
    }

    // Summary
    console.log("\n📊 Seeding Summary:");
    console.log(`✅ Created: ${created} bundles`);
    console.log(`⏭️ Skipped: ${skipped} bundles (already exist)`);
    console.log(`❌ Failed: ${failed} bundles`);

    if (failed > 0 && !adminToken) {
      console.log("\n⚠️ Note: Some bundles could not be created automatically.");
      console.log("To create them manually:");
      console.log("1. Go to Medusa Admin: http://localhost:9000/app");
      console.log("2. Navigate to Products → New Product");
      console.log("3. Use the details printed above for each bundle");
    }

    console.log("\n✨ Bundle products seed completed!");

  } catch (error) {
    console.error("❌ Failed to seed bundle products:", error);
    process.exit(1);
  }
}

// Run the seed function
seedBundles()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });