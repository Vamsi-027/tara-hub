# Complete Bundle Implementation - Single File Prompt

## Objective
Implement curated fabric sample bundles feature. Total time: 10 minutes.

## Step 1: Create Seed Script (2 minutes)

Create new file: `/medusa/scripts/seed-bundles.js`

```javascript
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

  console.log("ℹ️ Proceeding without admin token (will use store API)");
  return null;
}

async function seedBundles() {
  console.log("🚀 Starting bundle products seed...");
  console.log(`📍 Medusa Backend URL: ${medusa.config.baseUrl}`);

  try {
    const adminToken = await getAdminToken();

    console.log("\n🌍 Fetching regions...");
    const { regions } = await medusa.store.region.list();
    const usdRegion = regions.find(r => r.currency_code === "usd");

    if (!usdRegion) {
      throw new Error("No USD region found. Please set up a US region first.");
    }
    console.log(`✅ Found USD region: ${usdRegion.name} (${usdRegion.id})`);

    console.log("\n📦 Creating bundle products...");
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const bundleData of bundleProducts) {
      try {
        console.log(`\nChecking if "${bundleData.title}" exists...`);
        const { products: existingProducts } = await medusa.store.product.list({
          handle: bundleData.handle,
        });

        if (existingProducts && existingProducts.length > 0) {
          console.log(`⏭️ Bundle "${bundleData.title}" already exists. Skipping...`);
          skipped++;
          continue;
        }

        if (adminToken) {
          console.log(`Creating "${bundleData.title}" via Admin API...`);

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
```

## Step 2: Add Script to Package.json (1 minute)

Add this line to `/medusa/package.json` in the scripts section:

```json
"seed:bundles": "node ./scripts/seed-bundles.js",
```

## Step 3: Run Seed Script (1 minute)

```bash
cd medusa
npm run seed:bundles
```

## Step 4: Create Bundles Display Page (2 minutes)

Create or replace `/frontend/experiences/fabric-store/app/bundles/page.tsx`:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fabric Sample Bundles | Curated Collections',
  description: 'Shop our pre-selected fabric sample bundles.',
};

async function getBundles() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';

    const response = await fetch(`${baseUrl}/store/products?limit=100`, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch products');
      return [];
    }

    const data = await response.json();

    const bundles = data.products?.filter((product: any) =>
      product.handle?.includes('bundle')
    ) || [];

    return bundles;
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return [];
  }
}

export default async function BundlesPage() {
  const bundles = await getBundles();

  const getSwatchCount = (title: string) => {
    const match = title.match(/(\d+)\s*swatch/i);
    return match ? parseInt(match[1]) : 0;
  };

  const getBadge = (swatchCount: number) => {
    switch(swatchCount) {
      case 5: return 'Best for Starters';
      case 10: return 'Most Popular';
      case 15: return 'Free Shipping';
      case 20: return 'Best Value';
      default: return null;
    }
  };

  const getPrice = (product: any) => {
    const price = product.variants?.[0]?.prices?.[0];
    if (!price) return null;
    const amount = price.calculated_price?.calculated_amount || price.amount || 0;
    return amount / 100;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Curated Sample Bundles</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our carefully selected fabric sample collections.
          Each bundle is thoughtfully curated to showcase our best fabrics
          at unbeatable prices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="text-center">
          <div className="text-3xl mb-2">📦</div>
          <h3 className="font-semibold mb-1">Pre-Selected</h3>
          <p className="text-sm text-gray-600">
            Expertly curated fabric combinations
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-semibold mb-1">Great Value</h3>
          <p className="text-sm text-gray-600">
            Save up to 50% vs individual samples
          </p>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">🚚</div>
          <h3 className="font-semibold mb-1">Fast Shipping</h3>
          <p className="text-sm text-gray-600">
            Ships within 24 hours
          </p>
        </div>
      </div>

      {bundles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {bundles.map((bundle: any) => {
            const swatchCount = getSwatchCount(bundle.title);
            const badge = getBadge(swatchCount);
            const price = getPrice(bundle);

            return (
              <div key={bundle.id} className="group">
                <a href={`/products/${bundle.handle}`}>
                  <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {bundle.thumbnail ? (
                        <img
                          src={bundle.thumbnail}
                          alt={bundle.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-6xl">📦</span>
                        </div>
                      )}

                      {swatchCount > 0 && (
                        <div className="absolute top-2 right-2 bg-black text-white
                                        rounded-full w-12 h-12 flex items-center
                                        justify-center font-bold">
                          {swatchCount}
                        </div>
                      )}

                      {badge && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white
                                        text-xs px-2 py-1 rounded-full">
                          {badge}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{bundle.title}</h3>

                      <div className="flex items-baseline gap-2">
                        {price ? (
                          <>
                            <span className="text-2xl font-bold">
                              ${price.toFixed(2)}
                            </span>
                            {swatchCount > 0 && (
                              <span className="text-sm text-gray-500">
                                (${(price / swatchCount).toFixed(2)} per sample)
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500">Price not available</span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {bundle.description}
                      </p>

                      <button className="w-full mt-4 bg-black text-white py-2 px-4
                                         rounded hover:bg-gray-800 transition-colors">
                        View Bundle
                      </button>
                    </div>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">No bundles available at this time.</p>
          <p className="text-sm text-gray-400">
            Run `npm run seed:bundles` in the medusa directory to create bundle products.
          </p>
        </div>
      )}

      <div className="mt-16 bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Why Choose Our Bundles?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Perfect for Designers</h3>
            <p className="text-gray-600">
              Our bundles are carefully curated to include complementary colors
              and textures that work well together in design projects.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Try Before You Buy</h3>
            <p className="text-gray-600">
              Sample our premium fabrics before committing to larger orders.
              Each sample is a generous 4x6 inches, perfect for evaluation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Educational Resource</h3>
            <p className="text-gray-600">
              Ideal for fashion students and DIY enthusiasts learning about
              different fabric types, weights, and characteristics.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Gift Ready</h3>
            <p className="text-gray-600">
              Our bundles make perfect gifts for crafters, quilters, and
              anyone who loves working with beautiful fabrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Step 5: Add Navigation Link (1 minute)

Find your navigation component (likely `/frontend/experiences/fabric-store/components/header.tsx` or `/frontend/experiences/fabric-store/components/nav.tsx`) and add this link:

```tsx
<Link href="/bundles" className="text-gray-700 hover:text-black">
  Sample Bundles
</Link>
```

## Step 6: Test Everything (3 minutes)

```bash
# Terminal 1: Start Medusa
cd medusa
npm run dev

# Terminal 2: Start Frontend
cd frontend/experiences/fabric-store
npm run dev
```

Test checklist:
1. Visit http://localhost:3006/bundles
2. Verify 4 bundles display with prices
3. Click "View Bundle" - goes to product page
4. Click "Add to Cart" - adds to cart
5. Complete checkout with test card: 4242 4242 4242 4242

## Complete File Structure

After implementation you should have:
```
medusa/
├── scripts/
│   └── seed-bundles.js         # NEW - Bundle seed script
├── package.json                 # MODIFIED - Added seed:bundles script

frontend/experiences/fabric-store/
├── app/
│   └── bundles/
│       └── page.tsx            # NEW - Bundles display page
├── components/
│   └── header.tsx              # MODIFIED - Added nav link
```

## Troubleshooting

### If bundles don't appear:
1. Check Medusa is running: `cd medusa && npm run dev`
2. Check seed script ran successfully
3. Check browser console for API errors

### If prices don't show:
1. Ensure USD region exists: `npm run setup:us-region`
2. Re-run seed script: `npm run seed:bundles`

### If checkout fails:
1. Verify Stripe is configured in `.env`
2. Check shipping zones are set up
3. Use test card: 4242 4242 4242 4242

## Summary

**Total implementation: 10 minutes**

1. Create seed script (copy code above)
2. Add npm script to package.json
3. Run `npm run seed:bundles`
4. Create bundles page (copy code above)
5. Add navigation link
6. Test

**That's it! Bundles are now live and ready to sell.**