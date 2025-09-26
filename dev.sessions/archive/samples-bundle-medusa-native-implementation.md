# 📦 Fabric Sample Bundle - Medusa Native Implementation

## Executive Summary
Implement fabric sample bundles using Medusa's core product and metadata capabilities, avoiding custom database tables for a more maintainable and stable architecture.

## Key Architecture Decision
✅ **Use Medusa's native products and metadata** - No custom tables
✅ **Store bundle contents in line item metadata** - Preserves sample details
✅ **Leverage existing cart/order flow** - No custom checkout logic needed

## Implementation Strategy

### Phase 1: Backend Setup (No Database Changes Required)

#### 1.1 Create Bundle Products in Medusa Admin
```javascript
// Bundle products to create in Medusa Admin
const bundleProducts = [
  {
    title: "5 Fabric Swatch Bundle",
    handle: "fabric-sample-bundle-5",
    description: "Choose any 5 fabric swatches from our collection",
    variants: [{
      title: "5 Swatches",
      sku: "BUNDLE-5",
      prices: [{ amount: 1099, currency_code: "usd" }] // $10.99
    }],
    metadata: {
      bundle_type: "sample",
      bundle_size: 5,
      allowed_sample_types: ["memo", "standard"],
      savings_percentage: 27,
      badge_text: "Best Value"
    }
  },
  {
    title: "10 Fabric Swatch Bundle",
    handle: "fabric-sample-bundle-10",
    description: "Designer pack - Choose any 10 fabric swatches",
    variants: [{
      title: "10 Swatches",
      sku: "BUNDLE-10",
      prices: [{ amount: 1899, currency_code: "usd" }] // $18.99
    }],
    metadata: {
      bundle_type: "sample",
      bundle_size: 10,
      allowed_sample_types: ["memo", "standard"],
      savings_percentage: 37,
      badge_text: "Designer Pack",
      free_shipping: true
    }
  },
  {
    title: "15 Fabric Swatch Bundle",
    handle: "fabric-sample-bundle-15",
    description: "Professional bundle - Choose any 15 fabric swatches",
    variants: [{
      title: "15 Swatches",
      sku: "BUNDLE-15",
      prices: [{ amount: 2499, currency_code: "usd" }] // $24.99
    }],
    metadata: {
      bundle_type: "sample",
      bundle_size: 15,
      allowed_sample_types: ["memo", "standard", "large"],
      savings_percentage: 44,
      badge_text: "Pro Bundle",
      free_shipping: true
    }
  },
  {
    title: "20 Fabric Swatch Bundle",
    handle: "fabric-sample-bundle-20",
    description: "Studio set - Choose any 20 fabric swatches",
    variants: [{
      title: "20 Swatches",
      sku: "BUNDLE-20",
      prices: [{ amount: 2999, currency_code: "usd" }] // $29.99
    }],
    metadata: {
      bundle_type: "sample",
      bundle_size: 20,
      allowed_sample_types: ["memo", "standard", "large"],
      savings_percentage: 50,
      badge_text: "Studio Set",
      free_shipping: true
    }
  }
];
```

#### 1.2 Metadata Structure for Bundle Line Items
```typescript
// Line item metadata structure when bundle is added to cart
interface BundleLineItemMetadata {
  bundled_items: Array<{
    product_id: string;
    variant_id: string;
    title: string;
    sku: string;
    thumbnail: string;
    sample_type: "memo" | "standard" | "large";
    fabric_properties?: {
      color: string;
      pattern: string;
      weight: string;
      width: string;
      composition: string;
    };
  }>;
  bundle_configuration: {
    size: number;
    type: string;
    selected_at: string;
    customer_notes?: string;
  };
}
```

### Phase 2: Frontend Implementation

#### 2.1 SampleBundleSelector Component
```tsx
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useMedusa } from '@/lib/medusa-client';

interface SampleBundleSelectorProps {
  currentProduct: Product;
}

export const SampleBundleSelector: React.FC<SampleBundleSelectorProps> = ({
  currentProduct
}) => {
  const { medusa } = useMedusa();
  const { cart, addToCart } = useCart();
  const [selectedBundle, setSelectedBundle] = useState<BundleProduct | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<BundledItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available bundle products
  const { data: bundles } = useSWR(
    '/api/products/bundles',
    () => medusa.products.list({
      handle: ['fabric-sample-bundle-5', 'fabric-sample-bundle-10',
               'fabric-sample-bundle-15', 'fabric-sample-bundle-20']
    })
  );

  const handleAddBundleToCart = async () => {
    if (!selectedBundle || !cart?.id) return;

    setIsLoading(true);
    try {
      // Prepare metadata with selected samples
      const bundleMetadata: BundleLineItemMetadata = {
        bundled_items: selectedSamples.map(sample => ({
          product_id: sample.product_id,
          variant_id: sample.variant_id,
          title: sample.title,
          sku: sample.sku,
          thumbnail: sample.thumbnail,
          sample_type: sample.sample_type,
          fabric_properties: sample.fabric_properties
        })),
        bundle_configuration: {
          size: selectedBundle.metadata.bundle_size,
          type: 'fabric_sample',
          selected_at: new Date().toISOString()
        }
      };

      // Add bundle to cart using standard Medusa API
      await medusa.carts.lineItems.create(cart.id, {
        variant_id: selectedBundle.variants[0].id,
        quantity: 1,
        metadata: bundleMetadata
      });

      // Track analytics
      trackBundleAddedToCart(selectedBundle, selectedSamples);

      // Reset selection
      setSelectedBundle(null);
      setSelectedSamples([]);

      // Show success message
      toast.success(`${selectedBundle.metadata.bundle_size} swatch bundle added to cart!`);
    } catch (error) {
      console.error('Failed to add bundle to cart:', error);
      toast.error('Failed to add bundle to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sample-bundle-selector">
      {/* Bundle Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {bundles?.products.map((bundle) => (
          <BundleCard
            key={bundle.id}
            bundle={bundle}
            isSelected={selectedBundle?.id === bundle.id}
            onSelect={() => setSelectedBundle(bundle)}
          />
        ))}
      </div>

      {/* Sample Selection UI */}
      {selectedBundle && (
        <FabricPicker
          bundleSize={selectedBundle.metadata.bundle_size}
          currentProduct={currentProduct}
          selectedSamples={selectedSamples}
          onUpdateSelection={setSelectedSamples}
        />
      )}

      {/* Add to Cart Button */}
      {selectedBundle && selectedSamples.length === selectedBundle.metadata.bundle_size && (
        <button
          onClick={handleAddBundleToCart}
          disabled={isLoading}
          className="w-full bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding to Cart...' : `Add ${selectedBundle.metadata.bundle_size} Swatch Bundle to Cart`}
        </button>
      )}
    </div>
  );
};
```

#### 2.2 BundleCard Component
```tsx
const BundleCard: React.FC<BundleCardProps> = ({ bundle, isSelected, onSelect }) => {
  const metadata = bundle.metadata;
  const price = bundle.variants[0]?.prices[0]?.amount / 100;
  const perSample = (price / metadata.bundle_size).toFixed(2);

  return (
    <div
      onClick={onSelect}
      className={`
        relative border-2 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}
      `}
    >
      {/* Badge */}
      {metadata.badge_text && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs
                         px-2 py-1 rounded-full">
          {metadata.badge_text}
        </span>
      )}

      <div className="text-center">
        <h3 className="font-bold text-lg">{metadata.bundle_size} Swatches</h3>
        <div className="mt-2">
          <span className="text-2xl font-bold">${price}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          ${perSample} each
        </div>
        <div className="text-sm text-green-600 mt-1">
          Save {metadata.savings_percentage}%
        </div>
        {metadata.free_shipping && (
          <div className="text-xs text-blue-600 mt-2">
            ✓ Free Shipping
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 2.3 FabricPicker Component
```tsx
const FabricPicker: React.FC<FabricPickerProps> = ({
  bundleSize,
  currentProduct,
  selectedSamples,
  onUpdateSelection
}) => {
  const [suggestedFabrics, setSuggestedFabrics] = useState<Product[]>([]);
  const [showAllFabrics, setShowAllFabrics] = useState(false);

  // Auto-include current fabric as first selection
  useEffect(() => {
    if (selectedSamples.length === 0 && currentProduct) {
      onUpdateSelection([{
        product_id: currentProduct.id,
        variant_id: currentProduct.variants[0].id,
        title: currentProduct.title,
        sku: currentProduct.variants[0].sku,
        thumbnail: currentProduct.thumbnail,
        sample_type: 'standard',
        fabric_properties: currentProduct.metadata.fabric_properties
      }]);
    }
  }, [currentProduct]);

  // Fetch coordinating fabrics
  useEffect(() => {
    fetchCoordinatingFabrics(currentProduct).then(setSuggestedFabrics);
  }, [currentProduct]);

  const handleSelectFabric = (fabric: Product) => {
    if (selectedSamples.length >= bundleSize) {
      toast.error(`You can only select ${bundleSize} swatches`);
      return;
    }

    const newSample: BundledItem = {
      product_id: fabric.id,
      variant_id: fabric.variants[0].id,
      title: fabric.title,
      sku: fabric.variants[0].sku,
      thumbnail: fabric.thumbnail,
      sample_type: 'standard',
      fabric_properties: fabric.metadata.fabric_properties
    };

    onUpdateSelection([...selectedSamples, newSample]);
  };

  const handleRemoveFabric = (index: number) => {
    const updated = [...selectedSamples];
    updated.splice(index, 1);
    onUpdateSelection(updated);
  };

  return (
    <div className="fabric-picker mt-6">
      <h4 className="font-semibold mb-3">
        Select {bundleSize} Fabric Swatches ({selectedSamples.length}/{bundleSize} selected)
      </h4>

      {/* Selected Samples */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: bundleSize }).map((_, index) => {
          const sample = selectedSamples[index];
          return (
            <div
              key={index}
              className={`
                aspect-square border-2 rounded-lg relative
                ${sample ? 'border-black' : 'border-gray-300 border-dashed'}
              `}
            >
              {sample ? (
                <>
                  <img
                    src={sample.thumbnail}
                    alt={sample.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemoveFabric(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white
                               rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {index + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Suggested Fabrics */}
      <div className="mt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">
          Suggested Coordinating Fabrics
        </h5>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {suggestedFabrics.slice(0, 12).map((fabric) => (
            <FabricOption
              key={fabric.id}
              fabric={fabric}
              isSelected={selectedSamples.some(s => s.product_id === fabric.id)}
              onSelect={() => handleSelectFabric(fabric)}
            />
          ))}
        </div>
      </div>

      {/* Browse All Button */}
      <button
        onClick={() => setShowAllFabrics(true)}
        className="mt-4 text-blue-600 underline text-sm"
      >
        Browse All Fabrics →
      </button>

      {/* Full Fabric Modal */}
      {showAllFabrics && (
        <FabricBrowserModal
          onSelect={handleSelectFabric}
          onClose={() => setShowAllFabrics(false)}
          selectedIds={selectedSamples.map(s => s.product_id)}
          maxSelections={bundleSize - selectedSamples.length}
        />
      )}
    </div>
  );
};
```

### Phase 3: Cart & Checkout Integration

#### 3.1 Enhanced Cart Display
```tsx
// CartItem.tsx - Modified to handle bundles
const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const isBundle = item.metadata?.bundled_items?.length > 0;

  if (isBundle) {
    return <CartBundleItem item={item} />;
  }

  // Regular cart item rendering
  return <RegularCartItem item={item} />;
};

// CartBundleItem.tsx - Special display for bundles
const CartBundleItem: React.FC<CartBundleItemProps> = ({ item }) => {
  const bundledItems = item.metadata.bundled_items || [];
  const bundleConfig = item.metadata.bundle_configuration;

  return (
    <div className="cart-bundle-item border rounded-lg p-4 mb-4">
      {/* Bundle Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-600">
            {bundleConfig.size} Fabric Swatches Bundle
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold">${(item.subtotal / 100).toFixed(2)}</p>
          <p className="text-xs text-green-600">
            Save {item.variant.product.metadata.savings_percentage}%
          </p>
        </div>
      </div>

      {/* Bundle Contents Grid */}
      <div className="grid grid-cols-5 gap-2 mt-3">
        {bundledItems.map((bundledItem, index) => (
          <div key={index} className="relative group">
            <img
              src={bundledItem.thumbnail}
              alt={bundledItem.title}
              className="w-full aspect-square object-cover rounded"
            />
            <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0
                            group-hover:opacity-100 transition-opacity rounded
                            flex items-center justify-center">
              <p className="text-white text-xs text-center px-1">
                {bundledItem.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bundle Actions */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t">
        <button
          onClick={() => handleEditBundle(item)}
          className="text-sm text-blue-600 hover:underline"
        >
          Edit Selection
        </button>
        <button
          onClick={() => handleRemoveBundle(item.id)}
          className="text-sm text-red-600 hover:underline"
        >
          Remove Bundle
        </button>
      </div>
    </div>
  );
};
```

#### 3.2 Checkout Display (No Changes Needed)
```tsx
// The checkout process works automatically!
// Medusa treats the bundle as a single line item
// The metadata is preserved through to the final order

// Optional: Display bundle contents in order confirmation
const OrderConfirmation: React.FC<OrderConfirmationProps> = ({ order }) => {
  return (
    <div className="order-confirmation">
      {order.items.map((item) => {
        const isBundle = item.metadata?.bundled_items?.length > 0;

        if (isBundle) {
          return (
            <div key={item.id} className="order-item-bundle">
              <h4>{item.title}</h4>
              <p className="text-sm text-gray-600 mb-2">
                Includes {item.metadata.bundle_configuration.size} fabric swatches:
              </p>
              <ul className="text-sm">
                {item.metadata.bundled_items.map((bundled, idx) => (
                  <li key={idx}>• {bundled.title}</li>
                ))}
              </ul>
            </div>
          );
        }

        return <RegularOrderItem key={item.id} item={item} />;
      })}
    </div>
  );
};
```

### Phase 4: Analytics & Launch

#### 4.1 Analytics Implementation
```typescript
// analytics/bundle-tracking.ts
export const bundleAnalytics = {
  viewBundle: (bundleSize: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_bundle', {
        event_category: 'Sample Bundle',
        event_label: `${bundleSize} Swatch Bundle`,
        value: bundleSize
      });
    }
  },

  addBundleToCart: (bundle: BundleProduct, samples: BundledItem[]) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        event_category: 'Sample Bundle',
        event_label: bundle.title,
        value: bundle.variants[0].prices[0].amount / 100,
        items: samples.map(s => ({
          item_id: s.product_id,
          item_name: s.title,
          item_category: 'Fabric Sample',
          quantity: 1
        }))
      });
    }
  },

  completeBundlePurchase: (order: Order) => {
    const bundles = order.items.filter(i => i.metadata?.bundled_items);

    bundles.forEach(bundle => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'purchase', {
          event_category: 'Sample Bundle',
          transaction_id: order.id,
          value: bundle.subtotal / 100,
          currency: 'USD',
          items: bundle.metadata.bundled_items.map(s => ({
            item_id: s.product_id,
            item_name: s.title,
            quantity: 1
          }))
        });
      }
    });
  }
};
```

#### 4.2 Simple Feature Flag
```tsx
// config/features.ts
export const features = {
  sampleBundles: process.env.NEXT_PUBLIC_ENABLE_SAMPLE_BUNDLES === 'true'
};

// In product page component
const ProductPage: React.FC = ({ product }) => {
  return (
    <div>
      {/* Existing product details */}

      {/* Conditionally render bundle selector */}
      {features.sampleBundles ? (
        <SampleBundleSelector currentProduct={product} />
      ) : (
        <OrderSample product={product} /> // Existing individual sample component
      )}
    </div>
  );
};
```

## Migration Path for Existing Orders

Since this approach uses standard Medusa products and metadata:
- Existing orders remain unchanged
- New bundle orders are standard line items with metadata
- No data migration required
- Full backward compatibility

## Admin Dashboard Configuration

### Creating Bundle Products
1. Navigate to Medusa Admin → Products
2. Create new product for each bundle tier
3. Set title, handle, and description
4. Create single variant with bundle price
5. Add metadata fields for bundle configuration
6. Publish product

### Monitoring Bundle Performance
```typescript
// Admin dashboard can query bundles using standard Medusa APIs
const getBundleMetrics = async () => {
  const orders = await medusa.admin.orders.list({
    expand: "items"
  });

  const bundleOrders = orders.orders.filter(order =>
    order.items.some(item => item.metadata?.bundled_items)
  );

  return {
    totalBundleOrders: bundleOrders.length,
    bundleRevenue: bundleOrders.reduce((sum, order) =>
      sum + order.items
        .filter(item => item.metadata?.bundled_items)
        .reduce((itemSum, item) => itemSum + item.subtotal, 0), 0
    ),
    averageBundleSize: /* calculate average bundle size */,
    mostPopularBundle: /* find most ordered bundle size */
  };
};
```

## Testing Checklist

### Unit Tests
- [ ] BundleCard component renders correctly
- [ ] SampleBundleSelector handles selection logic
- [ ] FabricPicker enforces bundle size limits
- [ ] Metadata structure is properly formatted

### Integration Tests
- [ ] Bundle products load from Medusa
- [ ] Add to cart with metadata works
- [ ] Cart displays bundle contents correctly
- [ ] Checkout preserves bundle metadata

### E2E Tests
- [ ] Complete bundle selection flow
- [ ] Cart management with bundles
- [ ] Checkout and order placement
- [ ] Order confirmation shows bundle details

## Rollout Plan

### Week 1: Setup
- Create bundle products in Medusa Admin
- Deploy frontend components behind feature flag
- Test with internal team

### Week 2: Soft Launch
- Enable for 10% of users
- Monitor performance and conversion
- Gather user feedback

### Week 3: Optimization
- Adjust based on metrics
- Fix any identified issues
- Prepare marketing materials

### Week 4: Full Launch
- Enable for all users
- Launch marketing campaign
- Monitor and iterate

## Benefits of This Approach

✅ **No Database Changes** - Uses Medusa's existing schema
✅ **Native Cart/Order Flow** - No custom checkout logic
✅ **Backward Compatible** - Works alongside existing orders
✅ **Simple to Maintain** - Standard Medusa patterns
✅ **Easy to Extend** - Can add more bundle types easily
✅ **Admin-Friendly** - Bundles manageable through Medusa Admin

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Metadata size limits | Keep bundled_items lean, store only essential data |
| Bundle validation | Validate selection count in frontend before cart add |
| Inventory tracking | Individual samples remain separate products for inventory |
| Price changes | Bundle prices are fixed at time of purchase |

---

*Document Version: 2.0 - Medusa Native Approach*
*Created: January 2025*
*Platform: Tara Hub - Fabric Store Sample Bundle System*