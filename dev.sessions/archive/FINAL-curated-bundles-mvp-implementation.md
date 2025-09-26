# Final Implementation Plan: Curated Sample Bundles (MVP)

**Version:** 1.0
**Status:** Approved
**Objective:** To go live as quickly as possible by implementing simple, pre-selected "Curated Sample Bundles" as standard Medusa products. This plan supersedes all previous sample-related plans.

## 1. Executive Summary

The goal is to launch a Minimum Viable Product (MVP) for sample ordering. We will achieve this by creating "Curated Bundles" (e.g., a pre-set pack of 5 fabric samples) and selling them as regular products. This strategy prioritizes speed-to-market and simplicity over complex features. There will be no customer-choice functionality in this MVP.

## 2. Core Architectural Decision

- **Bundles are Simple Products:** Each Curated Bundle will be a standard product in Medusa with a single variant and a fixed price.
- **No Complex Metadata:** Since the contents are pre-set, we do not need to store a list of chosen samples in the line item metadata.
- **No Custom UI:** The standard product page and "Add to Cart" functionality will be used. No special "picker" or selection UI is required.

## 3. Phase 1: Backend Product Setup (in Medusa Admin)

This phase requires no coding.

1. Log in to your Medusa Admin.
2. Navigate to the Products section.
3. For each bundle you want to offer (e.g., "5 Swatch Bundle," "10 Swatch Bundle"), click "New Product" and configure it as follows:
   - **Title:** Give it a clear, descriptive name, e.g., "Designer's Choice - 5 Swatch Bundle".
   - **Handle:** e.g., "designers-choice-5-bundle".
   - **Description:** This is the most important step. List the exact, pre-selected fabric samples that are included in the bundle. For example:
     > "This bundle includes one 4x6 inch sample of each of the following essential fabrics:
     > - Emerald Green Velvet
     > - Natural Linen
     > - Charcoal Grey Wool
     > - Navy Blue Performance Weave
     > - Classic White Cotton Twill"
   - **Variant:** Create only one variant for the product.
     - Title: e.g., "5 Swatch Bundle"
     - SKU: e.g., BUNDLE-CURATED-5
     - Price: Set the final price for the bundle (e.g., for $10.99, enter 10.99 in the price field).
   - **Publication:** Ensure the product is Published and assigned to your active Sales Channel.
4. Repeat for all bundle tiers you wish to sell.

### Example Bundle Products to Create

#### Bundle 1: Designer's Choice - 5 Swatch Bundle ($10.99)
- **Handle:** designers-choice-5-bundle
- **SKU:** BUNDLE-CURATED-5
- **Contents:**
  - Emerald Green Velvet (4x6")
  - Natural Linen (4x6")
  - Charcoal Grey Wool (4x6")
  - Navy Blue Performance Weave (4x6")
  - Classic White Cotton Twill (4x6")

#### Bundle 2: Color Explorer - 10 Swatch Bundle ($18.99)
- **Handle:** color-explorer-10-bundle
- **SKU:** BUNDLE-CURATED-10
- **Contents:**
  - Ruby Red Silk (4x6")
  - Sapphire Blue Satin (4x6")
  - Golden Yellow Canvas (4x6")
  - Forest Green Tweed (4x6")
  - Plum Purple Velvet (4x6")
  - Coral Pink Cotton (4x6")
  - Teal Blue Linen (4x6")
  - Burnt Orange Wool (4x6")
  - Dusty Rose Chambray (4x6")
  - Mint Green Jersey (4x6")

#### Bundle 3: Texture Collection - 15 Swatch Bundle ($24.99)
- **Handle:** texture-collection-15-bundle
- **SKU:** BUNDLE-CURATED-15
- **Contents:** [List 15 diverse fabric textures]

#### Bundle 4: Professional Pack - 20 Swatch Bundle ($29.99)
- **Handle:** professional-pack-20-bundle
- **SKU:** BUNDLE-CURATED-20
- **Contents:** [List 20 comprehensive fabric samples]

## 4. Phase 2: Frontend Implementation

This phase makes the new bundle products visible to customers.

### 4.1 Create the "Bundles" Listing Page

Create a new page at `/frontend/experiences/fabric-store/app/bundles/page.tsx`:

```tsx
import { Metadata } from 'next';
import { medusa } from '@/lib/medusa-client';
import ProductCard from '@/components/products/ProductCard';

export const metadata: Metadata = {
  title: 'Fabric Sample Bundles | Curated Collections',
  description: 'Shop our pre-selected fabric sample bundles. Perfect for designers and DIY enthusiasts.',
};

export default async function BundlesPage() {
  // Fetch bundle products
  const { products } = await medusa.products.list({
    q: 'bundle', // Search for products with "bundle" in title
    limit: 20,
  });

  // Filter to only show bundle products
  const bundles = products.filter(product =>
    product.handle?.includes('bundle') ||
    product.title?.toLowerCase().includes('bundle')
  );

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {bundles.map((bundle) => (
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
                      <span className="text-4xl">📦</span>
                    </div>
                  )}

                  {/* Bundle Size Badge */}
                  {bundle.title.match(/(\d+)\s*swatch/i)?.[1] && (
                    <div className="absolute top-2 right-2 bg-black text-white
                                    rounded-full w-12 h-12 flex items-center
                                    justify-center font-bold">
                      {bundle.title.match(/(\d+)\s*swatch/i)?.[1]}
                    </div>
                  )}
                </div>

                {/* Bundle Details */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{bundle.title}</h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      ${(bundle.variants[0]?.prices[0]?.amount / 100).toFixed(2)}
                    </span>

                    {/* Calculate per-sample price */}
                    {bundle.title.match(/(\d+)\s*swatch/i)?.[1] && (
                      <span className="text-sm text-gray-500">
                        (${(
                          bundle.variants[0]?.prices[0]?.amount / 100 /
                          parseInt(bundle.title.match(/(\d+)\s*swatch/i)?.[1])
                        ).toFixed(2)} per sample)
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
        ))}
      </div>

      {/* If no bundles found */}
      {bundles.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No bundles available at this time.</p>
        </div>
      )}
    </div>
  );
}
```

### 4.2 Add Bundles Link to Navigation

Update the main navigation to include a link to the bundles page:

```tsx
// In your navigation component
<Link href="/bundles" className="nav-link">
  Sample Bundles
</Link>
```

### 4.3 Confirm Product Page Behavior

The existing product detail page should already work for bundle products. No modifications needed since bundles are standard products.

## 5. Phase 3: Final Testing & Verification

### Testing Checklist

1. **Navigate to `/bundles` page**
   - [ ] Page loads successfully
   - [ ] All bundle products are displayed
   - [ ] Prices are shown correctly
   - [ ] Bundle descriptions are visible

2. **Add bundle to cart**
   - [ ] Click on a bundle product
   - [ ] Product detail page shows bundle information
   - [ ] "Add to Cart" button works
   - [ ] Cart shows correct bundle item and price

3. **Complete checkout**
   - [ ] Proceed to checkout
   - [ ] Enter shipping information
   - [ ] Complete payment with Stripe test card (4242 4242 4242 4242)
   - [ ] Receive order confirmation

4. **Verify in Medusa Admin**
   - [ ] Log into Medusa Admin
   - [ ] Find the test order
   - [ ] Confirm bundle product is shown correctly
   - [ ] Verify price and shipping details

### Test Card Numbers for Stripe
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Requires Auth:** 4000 0025 0000 3155

## 6. Go-Live Checklist

- [ ] Create all bundle products in Medusa Admin
- [ ] Deploy `/bundles` page to production
- [ ] Add navigation link to bundles
- [ ] Test complete purchase flow in production
- [ ] Verify inventory tracking (if applicable)
- [ ] Set up analytics tracking for bundle pages
- [ ] Create marketing materials highlighting bundles
- [ ] Train customer service on bundle offerings

## 7. Post-Launch Monitoring

### Key Metrics to Track
- Bundle page views
- Bundle add-to-cart rate
- Bundle conversion rate
- Average order value for bundle purchases
- Customer feedback on bundle contents

### Success Criteria (First 30 Days)
- 100+ bundle page visits
- 10%+ add-to-cart rate
- 5%+ conversion rate
- No critical bugs reported

## 8. Future Enhancements (Post-MVP)

Once the MVP is successful, consider these enhancements:
- Customer-selected bundles (Phase 2)
- Seasonal/themed bundles
- Personalized bundle recommendations
- Bundle subscription service
- Bulk discounts for multiple bundles

---

## Developer Implementation Steps

### Step 1: Product Setup (No Code Required)
1. Log into Medusa Admin at http://localhost:9000/app
2. Create 4 bundle products as described in Phase 1
3. Ensure each has proper title, description, SKU, and price
4. Publish to active sales channel

### Step 2: Create Bundles Page (30 minutes)
1. Create `/frontend/experiences/fabric-store/app/bundles/page.tsx`
2. Copy the provided code from section 4.1
3. Test locally at http://localhost:3006/bundles

### Step 3: Update Navigation (5 minutes)
1. Add link to bundles in main navigation component
2. Test navigation works correctly

### Step 4: End-to-End Testing (15 minutes)
1. Add a bundle to cart
2. Complete checkout with test card
3. Verify order in Medusa Admin

### Step 5: Deploy (10 minutes)
1. Commit changes
2. Push to main branch
3. Verify deployment on production

**Total Implementation Time: ~1 hour**

---

*This plan prioritizes immediate go-live with maximum simplicity. No complex features, no custom UI, just standard Medusa products sold as bundles.*