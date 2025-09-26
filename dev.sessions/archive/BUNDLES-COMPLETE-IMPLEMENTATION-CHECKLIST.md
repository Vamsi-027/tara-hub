# Complete Bundle Implementation Checklist

## Current Gaps Analysis

### ❌ What's Missing:

1. **Frontend bundles page still uses mock data** - needs Medusa API integration
2. **Prices in seed script are basic** - need proper region/price list setup
3. **Navigation link** not added yet
4. **Product detail page** might need adjustment for bundles

## Complete Implementation Tasks

### Task 1: Fix Bundle Pricing in Seed Script ✅

The current seed script (`/medusa/scripts/seed-bundles.js`) sets prices but needs region context. Here's the updated pricing approach:

```javascript
// In seed-bundles.js, prices should be set with region context:
variants: [
  {
    title: "5 Swatch Bundle",
    sku: "BUNDLE-CURATED-5",
    manage_inventory: true,
    inventory_quantity: 100,
    prices: [
      {
        amount: 1099, // $10.99 in cents
        currency_code: "usd",
        region_id: usdRegion.id // This needs to be set!
      }
    ]
  }
]
```

**The seed script already handles this!** It finds the USD region and uses it for pricing.

### Task 2: Update Frontend Bundles Page (Required) 🔧

The `/frontend/experiences/fabric-store/app/bundles/page.tsx` currently uses **mock data**. Developer needs to replace it:

```tsx
// Replace the entire bundles/page.tsx with this working version:
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fabric Sample Bundles | Curated Collections',
  description: 'Shop our pre-selected fabric sample bundles.',
};

async function getBundles() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';

    // Fetch all products and filter for bundles
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

    // Filter for bundle products (those with "bundle" in handle)
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

  // Helper functions
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
    // Get the first variant's first price
    const price = product.variants?.[0]?.prices?.[0];
    if (!price) return null;

    // Handle both calculated_price and amount
    const amount = price.calculated_price?.calculated_amount || price.amount || 0;
    return amount / 100; // Convert cents to dollars
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Curated Sample Bundles</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our carefully selected fabric sample collections.
          Each bundle is thoughtfully curated to showcase our best fabrics
          at unbeatable prices.
        </p>
      </div>

      {/* Value Props */}
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

      {/* Bundle Products Grid */}
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
                    {/* Bundle Image */}
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

                      {/* Bundle Size Badge */}
                      {swatchCount > 0 && (
                        <div className="absolute top-2 right-2 bg-black text-white
                                        rounded-full w-12 h-12 flex items-center
                                        justify-center font-bold">
                          {swatchCount}
                        </div>
                      )}

                      {/* Special Badge */}
                      {badge && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white
                                        text-xs px-2 py-1 rounded-full">
                          {badge}
                        </div>
                      )}
                    </div>

                    {/* Bundle Details */}
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{bundle.title}</h3>

                      {/* Price */}
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

                      {/* Quick Description */}
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {bundle.description}
                      </p>

                      {/* CTA Button */}
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

      {/* Additional Info Section */}
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

### Task 3: Add Navigation Link (Required) 🔧

Developer needs to add bundle link to navigation. Find your navigation component (likely in `/frontend/experiences/fabric-store/components/header.tsx` or similar) and add:

```tsx
<Link href="/bundles" className="nav-link">
  Sample Bundles
</Link>
```

### Task 4: Verify Product Detail Page (Optional Check) ✅

The existing product detail page should work fine since bundles are standard products. No changes needed unless you want to hide certain features for bundles.

## Complete Developer Action List

### Required Actions:

1. **Run seed script** ✅
   ```bash
   cd medusa
   npm run seed:bundles
   ```

2. **Replace bundles page** 🔧
   - Copy the complete code above into `/frontend/experiences/fabric-store/app/bundles/page.tsx`
   - This connects to real Medusa API instead of mock data

3. **Add navigation link** 🔧
   - Find your header/navigation component
   - Add link to `/bundles`

### That's It! Only 2 code changes needed:
- Update bundles page (copy-paste provided code)
- Add nav link (one line)

## About Pricing

### Where Prices Are Set:

1. **In Seed Script**: Prices are set at the variant level with region context
2. **In Database**: Stored in `product_variant_price` table
3. **Via API**: Retrieved with product data including calculated prices

### Price Lists (Advanced - Not Needed for MVP):

Price lists are for:
- B2B customer group pricing
- Sale/discount pricing
- Multi-currency beyond regions

For MVP, the basic variant pricing is sufficient. Price lists can be added later for:
```javascript
// Future enhancement for B2B pricing
{
  type: "sale",
  title: "Trade Discount",
  starts_at: "2024-01-01",
  customer_groups: ["wholesale", "designer"],
  prices: [
    { variant_id: "bundle_5_variant_id", amount: 899 } // $8.99 for trade
  ]
}
```

## Testing Checklist

After developer completes the 2 code changes:

- [ ] Bundles page shows real products (not mock data)
- [ ] Prices display correctly from Medusa
- [ ] Navigation link to `/bundles` works
- [ ] Can click through to product detail page
- [ ] Can add bundle to cart
- [ ] Can complete checkout

## Total Implementation Time

1. Run seed script: 1 minute ✅
2. Update bundles page: 2 minutes (copy-paste) 🔧
3. Add nav link: 1 minute 🔧
4. Test: 2 minutes

**Total: 6 minutes** to fully working bundles!

---

## Summary

**Developer needs to:**
1. ✅ Run `npm run seed:bundles` (creates products with prices)
2. 🔧 Replace bundles page code (provided above)
3. 🔧 Add navigation link (one line)

**That's all!** The seed script handles all the data and pricing. The frontend just needs to connect to the real API instead of using mock data.