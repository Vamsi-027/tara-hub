# Developer Implementation Prompt: Curated Sample Bundles MVP

## Objective
Implement a simple "Curated Sample Bundles" feature that allows customers to purchase pre-selected fabric sample packs. These bundles are standard Medusa products with no custom functionality required.

## Priority: IMMEDIATE - Ship Today
This is an MVP implementation focused on speed-to-market. Do not add any features not explicitly listed below.

## Implementation Tasks

### Task 1: Create Bundle Products in Medusa Admin (30 minutes)

**No coding required for this task.**

1. **Access Medusa Admin**
   ```bash
   cd medusa
   npm run dev
   # Visit http://localhost:9000/app
   # Login with admin credentials
   ```

2. **Create 4 Bundle Products**

   Navigate to Products → New Product and create these exact products:

   **Bundle 1: Designer's Choice - 5 Swatch Bundle**
   ```
   Title: Designer's Choice - 5 Swatch Bundle
   Handle: designers-choice-5-bundle
   Description:
   This bundle includes one 4x6 inch sample of each of the following essential fabrics:
   • Emerald Green Velvet - Luxurious medium-weight velvet perfect for upholstery
   • Natural Linen - Classic lightweight linen ideal for curtains and clothing
   • Charcoal Grey Wool - Durable wool blend suitable for winter projects
   • Navy Blue Performance Weave - Water-resistant outdoor fabric
   • Classic White Cotton Twill - Versatile medium-weight cotton for all purposes

   Perfect for designers exploring color palettes and texture combinations.

   Variant:
   - Title: 5 Swatch Bundle
   - SKU: BUNDLE-CURATED-5
   - Price: $10.99 (enter 1099 in cents field)
   - Inventory: Track inventory = Yes, Quantity = 100
   - Weight: 100g

   Publication:
   - Status: Published
   - Sales Channel: Default Sales Channel (or your active channel)
   ```

   **Bundle 2: Color Explorer - 10 Swatch Bundle**
   ```
   Title: Color Explorer - 10 Swatch Bundle
   Handle: color-explorer-10-bundle
   Description:
   A vibrant collection of 10 fabric samples (4x6 inches each) featuring:
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

   Ideal for exploring our full color range before your next project.

   Variant:
   - Title: 10 Swatch Bundle
   - SKU: BUNDLE-CURATED-10
   - Price: $18.99 (enter 1899 in cents field)
   - Inventory: Track inventory = Yes, Quantity = 100
   - Weight: 200g

   Publication:
   - Status: Published
   - Sales Channel: Default Sales Channel
   ```

   **Bundle 3: Texture Collection - 15 Swatch Bundle**
   ```
   Title: Texture Collection - 15 Swatch Bundle
   Handle: texture-collection-15-bundle
   Description:
   Experience 15 different fabric textures (4x6 inches each):
   • Smooth Silk Charmeuse
   • Nubby Linen Blend
   • Plush Velvet
   • Crisp Cotton Poplin
   • Soft Flannel
   • Structured Canvas
   • Delicate Lace
   • Cozy Fleece
   • Classic Denim
   • Lightweight Voile
   • Heavy Upholstery
   • Stretch Jersey
   • Textured Bouclé
   • Sheer Organza
   • Rugged Cordura

   Perfect for understanding fabric feel, drape, and weight differences.

   Variant:
   - Title: 15 Swatch Bundle
   - SKU: BUNDLE-CURATED-15
   - Price: $24.99 (enter 2499 in cents field)
   - Inventory: Track inventory = Yes, Quantity = 50
   - Weight: 300g

   Publication:
   - Status: Published
   - Sales Channel: Default Sales Channel
   ```

   **Bundle 4: Professional Pack - 20 Swatch Bundle**
   ```
   Title: Professional Pack - 20 Swatch Bundle
   Handle: professional-pack-20-bundle
   Description:
   Our most comprehensive bundle with 20 premium fabric samples (4x6 inches each):
   • 5 Cottons (Twill, Poplin, Canvas, Jersey, Flannel)
   • 4 Linens (Natural, Belgian, Linen Blend, Heavy Linen)
   • 3 Wools (Merino, Tweed, Felt)
   • 3 Silks (Charmeuse, Dupioni, Organza)
   • 2 Performance (Water-resistant, UV-protective)
   • 3 Specialty (Velvet, Leather-look, Metallic)

   The ultimate reference collection for professional designers and serious crafters.

   Variant:
   - Title: 20 Swatch Bundle
   - SKU: BUNDLE-CURATED-20
   - Price: $29.99 (enter 2999 in cents field)
   - Inventory: Track inventory = Yes, Quantity = 50
   - Weight: 400g

   Publication:
   - Status: Published
   - Sales Channel: Default Sales Channel
   ```

3. **Add Product Images (Optional but Recommended)**
   - Use a generic bundle/package image for all bundles
   - Or create a collage showing fabric swatches
   - Image can be the same for all bundles initially

### Task 2: Update Bundles Page with Medusa Integration (20 minutes)

Replace the mock data in `/frontend/experiences/fabric-store/app/bundles/page.tsx` with actual Medusa API integration:

```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fabric Sample Bundles | Curated Collections',
  description: 'Shop our pre-selected fabric sample bundles. Perfect for designers and DIY enthusiasts.',
};

async function getBundles() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';

    // Fetch products with "bundle" in handle
    const response = await fetch(`${baseUrl}/store/products?handle[]=designers-choice-5-bundle&handle[]=color-explorer-10-bundle&handle[]=texture-collection-15-bundle&handle[]=professional-pack-20-bundle`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch bundles');
      return [];
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return [];
  }
}

export default async function BundlesPage() {
  const bundles = await getBundles();

  // Extract swatch count from title (e.g., "5 Swatch Bundle" -> 5)
  const getSwatchCount = (title: string) => {
    const match = title.match(/(\d+)\s*swatch/i);
    return match ? parseInt(match[1]) : 0;
  };

  // Determine badge based on bundle size
  const getBadge = (swatchCount: number) => {
    switch(swatchCount) {
      case 5: return 'Best for Starters';
      case 10: return 'Most Popular';
      case 15: return 'Free Shipping';
      case 20: return 'Best Value';
      default: return null;
    }
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
            const price = bundle.variants?.[0]?.prices?.[0]?.amount || 0;
            const priceInDollars = price / 100;

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
                        <span className="text-2xl font-bold">
                          ${priceInDollars.toFixed(2)}
                        </span>
                        {swatchCount > 0 && (
                          <span className="text-sm text-gray-500">
                            (${(priceInDollars / swatchCount).toFixed(2)} per sample)
                          </span>
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
            Make sure bundle products are created in Medusa Admin and the backend is running.
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

### Task 3: Add Navigation Link (5 minutes)

Add a link to the bundles page in the main navigation.

**File:** `/frontend/experiences/fabric-store/components/nav.tsx` (or similar navigation component)

```tsx
// Add this link to your navigation menu
<Link
  href="/bundles"
  className="text-gray-700 hover:text-black transition-colors"
>
  Sample Bundles
</Link>
```

If you have a mobile menu, add it there too:
```tsx
<Link
  href="/bundles"
  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
  onClick={() => setMobileMenuOpen(false)}
>
  Sample Bundles
</Link>
```

### Task 4: Test End-to-End Flow (15 minutes)

1. **Start Both Servers**
   ```bash
   # Terminal 1 - Medusa Backend
   cd medusa
   npm run dev

   # Terminal 2 - Fabric Store Frontend
   cd frontend/experiences/fabric-store
   npm run dev
   ```

2. **Test Bundle Display**
   - Visit http://localhost:3006/bundles
   - Verify all 4 bundles appear
   - Check prices display correctly
   - Ensure descriptions are visible

3. **Test Product Page**
   - Click "View Bundle" on any bundle
   - Verify you're taken to product detail page
   - Check that "Add to Cart" button exists
   - Ensure price and description are correct

4. **Test Add to Cart**
   - Click "Add to Cart" on a bundle product
   - Verify bundle appears in cart
   - Check price is correct
   - Ensure quantity can be updated

5. **Test Checkout**
   - Proceed to checkout
   - Enter test shipping information:
     ```
     Name: Test Customer
     Email: test@example.com
     Address: 123 Test St
     City: Test City
     State: CA
     Zip: 90210
     ```
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete the order

6. **Verify Order in Admin**
   - Go to http://localhost:9000/app
   - Navigate to Orders
   - Find your test order
   - Verify bundle product appears correctly
   - Check price and customer details

### Task 5: Deploy to Production (10 minutes)

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: Add curated sample bundles MVP"
   git push origin main
   ```

2. **Create Bundle Products in Production**
   - Access your production Medusa Admin
   - Repeat Task 1 to create all 4 bundle products
   - Use the exact same titles, handles, and SKUs

3. **Verify Deployment**
   - Visit production URL + `/bundles`
   - Test adding a bundle to cart
   - Complete a test purchase if needed

## Success Criteria

✅ **Task is complete when:**
1. All 4 bundle products exist in Medusa Admin
2. `/bundles` page displays all bundles with correct prices
3. Customers can add bundles to cart
4. Checkout works with Stripe payment
5. Orders appear correctly in Medusa Admin

## Important Notes

⚠️ **DO NOT:**
- Add any custom selection UI
- Create bundle "builder" functionality
- Modify the cart to show individual samples
- Add complex metadata to track bundle contents
- Build any features not explicitly described above

✅ **REMEMBER:**
- Bundles are just regular products
- Each bundle has fixed, pre-selected contents
- The description field lists what's included
- This is an MVP - ship fast, iterate later

## Troubleshooting

**Bundles not appearing on /bundles page:**
- Check Medusa backend is running
- Verify products are published to sales channel
- Check browser console for API errors
- Ensure product handles match exactly

**Add to Cart not working:**
- Verify Medusa cart context is initialized
- Check product has available inventory
- Ensure variant prices are set
- Look for JavaScript errors in console

**Checkout fails:**
- Confirm Stripe is configured in Medusa
- Check shipping zones are set up
- Verify payment region is configured
- Test with Stripe test cards only

## Time Estimate

- Task 1: 30 minutes (manual product creation)
- Task 2: 20 minutes (update bundles page)
- Task 3: 5 minutes (add navigation)
- Task 4: 15 minutes (testing)
- Task 5: 10 minutes (deployment)

**Total: ~80 minutes to go live**

## Questions?

If blocked, check:
1. Are Medusa backend and frontend both running?
2. Are products published to the correct sales channel?
3. Is the region configured with USD pricing?
4. Is Stripe payment provider enabled?

Remember: This is an MVP. Get it live today, improve tomorrow.

---

*Start with Task 1 immediately. The goal is to have bundles live and purchasable within 2 hours.*