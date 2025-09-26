# 📦 Fabric Sample Bundle Implementation Plan

## Executive Summary
Transform the existing sample ordering system from individual pricing to an attractive bundle-based model that encourages larger sample orders while maintaining profitability. This plan implements a "5 Swatches for $10" style pricing with volume discounts.

## Current State Analysis
✅ **Existing Components:**
- `OrderSample.tsx` - Sophisticated 4-tier sample system
- `SwatchContext.tsx` - Multi-swatch selection (up to 5)
- Individual pricing model ($0-$24.99 per sample)

❌ **Gaps:**
- No bundle pricing incentives
- Limited cross-selling opportunities
- No volume discount structure
- Missing smart bundling logic

## Bundle Pricing Strategy

### Sample Types & Individual Pricing
| Sample Type | Size | Individual Price | Use Case |
|------------|------|-----------------|----------|
| Memo | 2" x 3" | $0.99 | Quick reference |
| Standard | 4" x 6" | $2.99 | Color/texture evaluation |
| Large | 8" x 10" | $7.99 | Pattern visibility |
| Yardage | 1/4 yard | $12.99 | Project testing |

### Bundle Pricing Tiers
| Bundle Size | Price | Per Sample | Savings | Badge |
|------------|-------|------------|---------|-------|
| 5 Swatches | $10.99 | $2.20 | Save 27% | "Best Value" |
| 10 Swatches | $18.99 | $1.90 | Save 37% | "Designer Pack" |
| 15 Swatches | $24.99 | $1.67 | Save 44% | "Pro Bundle" |
| 20 Swatches | $29.99 | $1.50 | Save 50% | "Studio Set" |

### Special Offers
- **First-Time Customer**: 3 samples for $5.99
- **Trade Members**: Additional 20% off bundles
- **Free Shipping**: On bundles of 10+ samples
- **Mix & Match**: Combine memo and standard samples in bundles

## Implementation Phases

### Phase 1: Backend Infrastructure (Week 1)

#### 1.1 Database Schema
```typescript
// Sample Bundle Product Type
{
  handle: "fabric-sample-bundle-5",
  title: "5 Fabric Swatches Bundle",
  description: "Choose any 5 fabric samples",
  price: 1099, // $10.99
  metadata: {
    bundle_size: 5,
    sample_types: ["memo", "standard"],
    savings_percentage: 27,
    badge_text: "Best Value"
  }
}
```

#### 1.2 Medusa Product Configuration
```typescript
// Create bundle products in Medusa
const bundles = [
  { size: 5, price: 10.99, badge: "Best Value" },
  { size: 10, price: 18.99, badge: "Designer Pack" },
  { size: 15, price: 24.99, badge: "Pro Bundle" },
  { size: 20, price: 29.99, badge: "Studio Set" }
];
```

#### 1.3 Cart Logic Enhancement
- Track bundle items vs individual samples
- Validate bundle contents
- Apply automatic discounts
- Handle mixed sample types

### Phase 2: Frontend Components (Week 2)

#### 2.1 SampleBundleSelector Component
```tsx
interface SampleBundleProps {
  productId: string;
  fabricDetails: Fabric;
  onAddToCart: (bundle: BundleSelection) => void;
}

const SampleBundleSelector: React.FC<SampleBundleProps> = ({
  productId,
  fabricDetails,
  onAddToCart
}) => {
  const [selectedBundle, setSelectedBundle] = useState<BundleOption | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<SampleSelection[]>([]);
  const [showFabricPicker, setShowFabricPicker] = useState(false);

  return (
    <div className="sample-bundle-selector">
      {/* Bundle Options Grid */}
      <div className="bundle-grid">
        {BUNDLE_OPTIONS.map(bundle => (
          <BundleCard
            key={bundle.size}
            bundle={bundle}
            isSelected={selectedBundle?.size === bundle.size}
            onClick={() => setSelectedBundle(bundle)}
          />
        ))}
      </div>

      {/* Sample Selection */}
      {selectedBundle && (
        <SamplePicker
          bundleSize={selectedBundle.size}
          selectedSamples={selectedSamples}
          onUpdate={setSelectedSamples}
          currentFabric={fabricDetails}
        />
      )}

      {/* Add to Cart */}
      <BundleCartButton
        bundle={selectedBundle}
        samples={selectedSamples}
        onAdd={onAddToCart}
      />
    </div>
  );
};
```

#### 2.2 Bundle Card Component
```tsx
const BundleCard: React.FC<BundleCardProps> = ({ bundle, isSelected, onClick }) => (
  <div
    className={`bundle-card ${isSelected ? 'selected' : ''}`}
    onClick={onClick}
  >
    {bundle.badge && (
      <span className="bundle-badge">{bundle.badge}</span>
    )}
    <h3>{bundle.size} Swatches</h3>
    <div className="bundle-price">
      <span className="current">${bundle.price}</span>
      <span className="per-sample">${bundle.perSample}/each</span>
    </div>
    <div className="bundle-savings">
      Save {bundle.savings}%
    </div>
    {bundle.size >= 10 && (
      <div className="free-shipping">✓ Free Shipping</div>
    )}
  </div>
);
```

#### 2.3 Smart Fabric Picker
```tsx
const FabricPicker: React.FC<FabricPickerProps> = ({
  bundleSize,
  currentFabric,
  onSelect
}) => {
  const [suggestions, setSuggestions] = useState<Fabric[]>([]);

  useEffect(() => {
    // Fetch coordinating fabrics
    fetchCoordinatingFabrics(currentFabric).then(setSuggestions);
  }, [currentFabric]);

  return (
    <div className="fabric-picker">
      <h4>Choose Your {bundleSize} Samples</h4>

      {/* Current Fabric (Auto-selected) */}
      <div className="current-fabric selected">
        <img src={currentFabric.thumbnail} alt={currentFabric.name} />
        <span>{currentFabric.name}</span>
        <span className="badge">Current</span>
      </div>

      {/* Coordinating Suggestions */}
      <div className="suggestions">
        <h5>Coordinating Fabrics</h5>
        <div className="fabric-grid">
          {suggestions.map(fabric => (
            <FabricOption
              key={fabric.id}
              fabric={fabric}
              onSelect={() => onSelect(fabric)}
            />
          ))}
        </div>
      </div>

      {/* Browse All */}
      <button className="browse-all">
        Browse All Fabrics →
      </button>
    </div>
  );
};
```

### Phase 3: Cart & Checkout Integration (Week 3)

#### 3.1 Cart Display Enhancement
```tsx
// Display bundle items specially in cart
const CartBundleItem: React.FC<CartBundleItemProps> = ({ bundle }) => (
  <div className="cart-bundle-item">
    <div className="bundle-header">
      <h4>{bundle.size} Swatch Bundle</h4>
      <span className="bundle-badge">{bundle.badge}</span>
    </div>

    <div className="bundle-contents">
      {bundle.samples.map(sample => (
        <div key={sample.id} className="bundle-sample">
          <img src={sample.thumbnail} alt={sample.name} />
          <div className="sample-details">
            <span className="sample-name">{sample.name}</span>
            <span className="sample-type">{sample.type}</span>
          </div>
        </div>
      ))}
    </div>

    <div className="bundle-pricing">
      <span className="bundle-total">${bundle.price}</span>
      <span className="bundle-savings">You saved ${bundle.savedAmount}</span>
    </div>
  </div>
);
```

#### 3.2 Checkout Modifications
- Special handling for sample bundles
- Shipping calculation based on bundle size
- Order confirmation with sample details
- Follow-up email with fabric care instructions

### Phase 4: Analytics & Optimization (Week 4)

#### 4.1 Tracking Implementation
```typescript
// Track bundle performance
const trackBundleMetrics = {
  bundle_view: (bundleSize: number) => {
    analytics.track('Bundle Viewed', {
      bundle_size: bundleSize,
      page: 'product_detail'
    });
  },

  bundle_add_to_cart: (bundle: Bundle) => {
    analytics.track('Bundle Added', {
      bundle_size: bundle.size,
      bundle_value: bundle.price,
      savings_amount: bundle.savedAmount,
      contains_current_fabric: true
    });
  },

  bundle_purchase: (orderData: Order) => {
    analytics.track('Bundle Purchased', {
      bundle_count: orderData.bundles.length,
      total_samples: orderData.totalSamples,
      revenue: orderData.bundleRevenue
    });
  }
};
```

#### 4.2 A/B Testing
- Test different bundle sizes (3, 5, 8 vs 5, 10, 15)
- Price point optimization
- Badge text variations
- Free shipping thresholds

## Marketing Integration

### Email Campaigns
1. **Abandoned Bundle Recovery**
   - Remind users of selected samples
   - Offer 10% discount to complete purchase

2. **Post-Purchase Follow-up**
   - "Complete your collection" suggestions
   - Trade account upgrade offer for 10+ sample buyers

### Landing Pages
- `/samples` - Bundle showcase page
- `/designer-program` - Trade member benefits
- `/sample-guide` - How to choose samples

## Success Metrics

### Key Performance Indicators
- **Average Sample Order Size**: Target 8+ samples (up from 2-3)
- **Bundle Adoption Rate**: 60% of sample orders as bundles
- **Cart Value Increase**: 40% higher AOV for sample orders
- **Conversion Rate**: 15% improvement in sample-to-purchase conversion

### Tracking Dashboard
```typescript
interface BundleMetrics {
  totalBundlesSold: number;
  averageBundleSize: number;
  bundleRevenue: number;
  savingsGiven: number;
  repeatBundleBuyers: number;
  bundleToOrderConversion: number;
}
```

## Technical Implementation Details

### API Endpoints
```typescript
// Bundle management endpoints
POST   /api/bundles/create
GET    /api/bundles/available
POST   /api/bundles/add-to-cart
GET    /api/bundles/recommendations/:fabricId
PUT    /api/bundles/:bundleId/update-samples
```

### State Management
```typescript
// Bundle context for managing selections
interface BundleContextType {
  availableBundles: Bundle[];
  selectedBundle: Bundle | null;
  selectedSamples: Sample[];
  selectBundle: (bundle: Bundle) => void;
  addSample: (sample: Sample) => void;
  removeSample: (sampleId: string) => void;
  clearBundle: () => void;
  addBundleToCart: () => Promise<void>;
}
```

### Database Schema Updates
```sql
-- Bundle orders tracking
CREATE TABLE sample_bundles (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  bundle_size INTEGER NOT NULL,
  bundle_price DECIMAL(10,2),
  savings_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bundle items
CREATE TABLE bundle_items (
  id UUID PRIMARY KEY,
  bundle_id UUID REFERENCES sample_bundles(id),
  product_id UUID REFERENCES products(id),
  sample_type VARCHAR(20),
  position INTEGER
);
```

## Risk Mitigation

### Potential Issues & Solutions
1. **Inventory Management**
   - Reserve samples when added to bundle
   - 15-minute reservation timeout

2. **Mixed Sample Types**
   - Clear UI distinction between memo/standard/large
   - Pricing transparency for upgrades

3. **International Shipping**
   - Weight-based calculation for bundles
   - Country-specific bundle offers

## Rollout Strategy

### Soft Launch (Week 1)
- Enable for 10% of traffic
- Monitor conversion metrics
- Gather user feedback

### Optimization (Week 2)
- Adjust pricing based on data
- Refine bundle sizes
- Improve fabric picker UX

### Full Launch (Week 3)
- 100% traffic
- Marketing campaign launch
- Email announcements

### Post-Launch (Week 4+)
- Seasonal bundle offers
- Collection-specific bundles
- Designer collaboration bundles

## Development Checklist

### Frontend Tasks
- [ ] Create SampleBundleSelector component
- [ ] Implement BundleCard component
- [ ] Build FabricPicker with smart suggestions
- [ ] Update cart to handle bundles
- [ ] Modify checkout for bundle shipping
- [ ] Add bundle tracking analytics
- [ ] Create bundle landing page

### Backend Tasks
- [ ] Set up bundle products in Medusa
- [ ] Implement bundle validation logic
- [ ] Create bundle API endpoints
- [ ] Add bundle inventory management
- [ ] Configure bundle shipping rules
- [ ] Set up bundle analytics events

### Testing Requirements
- [ ] Unit tests for bundle components
- [ ] Integration tests for cart operations
- [ ] E2E tests for complete bundle flow
- [ ] Load testing for concurrent bundle orders
- [ ] A/B test setup verification

## Timeline

### Week 1: Backend Setup
- Days 1-2: Database schema and Medusa products
- Days 3-4: API endpoints and validation
- Day 5: Testing and documentation

### Week 2: Frontend Development
- Days 1-2: Bundle selector components
- Days 3-4: Cart and checkout updates
- Day 5: Integration testing

### Week 3: Polish & Testing
- Days 1-2: UI/UX refinements
- Days 3-4: Full E2E testing
- Day 5: Performance optimization

### Week 4: Launch
- Day 1: Soft launch (10% traffic)
- Days 2-3: Monitor and adjust
- Days 4-5: Full rollout

## Success Criteria
✅ Bundle orders represent 60%+ of sample orders
✅ Average sample order size increases to 8+
✅ Sample-to-purchase conversion improves by 15%
✅ Customer satisfaction score maintains 4.5+
✅ No increase in support tickets

---

*Document Version: 1.0*
*Created: January 2025*
*Platform: Tara Hub - Fabric Store Sample Bundle System*