# 🚀 **FABRIC STORE GO-LIVE IMPLEMENTATION PLAN**

## **Project Overview**
**Target:** fabric-store frontend experience (port 3006)
**Timeline:** 2 weeks (80 development hours)
**Go-Live Date:** End of January 2025
**Team:** Frontend + Backend developers

---

## 📋 **EXECUTIVE SUMMARY**

This implementation plan focuses on fabric-specific commerce features that differentiate Tara Hub from generic e-commerce platforms. We're building for the fabric industry's unique requirements: sample ordering, visual discovery, mobile browsing, and B2B trade accounts.

**Key Success Metrics:**
- Homepage conversion rate > 3%
- Sample order rate > 15% of product views
- Mobile experience score > 90
- Checkout completion rate > 70%

---

## 🎯 **FEATURE SPECIFICATIONS**

### **WEEK 1: FOUNDATION + FABRIC-SPECIFIC FEATURES**

#### **Feature 1: Fabric-Focused Homepage (Days 1-2)**

**Technical Requirements:**
- CMS-driven content management via Sanity
- Mobile-first responsive design
- Core Web Vitals optimization
- Fabric-specific messaging and imagery

**Component Architecture:**
```typescript
// Homepage Component Structure
components/homepage/
├── HeroSection.tsx          // Fabric-specific hero with CTA
├── FeaturedCollections.tsx  // Curated fabric collections
├── SampleShowcase.tsx       // Sample ordering prominence
├── TrustSignals.tsx         // Quality indicators, certifications
├── NewsletterSignup.tsx     // Trade account newsletter
└── index.tsx               // Main homepage orchestrator
```

**Content Strategy:**
```typescript
const fabricMessaging = {
  hero: {
    headline: "Premium Fabrics for Professional Projects",
    subline: "Designer collections • Free samples • Fast shipping",
    cta: ["Shop Fabrics", "Order Samples", "Trade Login"]
  },
  trustSignals: [
    "Free samples with $50+ order",
    "Same-day sample dispatch",
    "Easy returns on yardage",
    "Trade pricing available"
  ],
  featuredCategories: [
    "Upholstery Weight",
    "Drapery & Sheers",
    "Designer Collections",
    "Performance Fabrics"
  ]
}
```

**Sanity CMS Integration:**
```typescript
// lib/sanity/schemas/homepage.ts
export const homepageSchema = {
  name: 'homepage',
  type: 'document',
  fields: [
    { name: 'heroTitle', type: 'string' },
    { name: 'heroSubtitle', type: 'string' },
    { name: 'heroCTA', type: 'array', of: [{ type: 'string' }] },
    { name: 'featuredCollections', type: 'array', of: [{ type: 'reference', to: [{ type: 'collection' }] }] },
    { name: 'trustBadges', type: 'array', of: [{ name: 'badge', type: 'object', fields: [
      { name: 'text', type: 'string' },
      { name: 'icon', type: 'image' }
    ]}]}
  ]
}
```

**Performance Requirements:**
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Hero images optimized (WebP/AVIF)
- Above-fold content prioritized

---

#### **Feature 2: Sample Ordering System (Days 3-4)**

**Business Logic:**
```typescript
// Sample ordering rules
const sampleRules = {
  freeThreshold: 50, // Free samples with $50+ order
  maxFreeSamples: 10,
  paidSamplePrice: 5, // $5 per sample
  sampleSizes: {
    standard: '4x4 inches',
    large: '9x9 inches' // Premium option
  },
  fulfillment: 'same_day' // Ship samples same day
}
```

**Component Architecture:**
```typescript
components/samples/
├── SampleOrderButton.tsx     // Main CTA on product pages
├── SampleCart.tsx           // Separate sample cart management
├── SampleOrderModal.tsx     // Sample ordering modal
├── SampleSizeSelector.tsx   // Sample size options
├── SampleShipping.tsx       // Sample shipping calculator
└── SampleHistory.tsx        // Customer sample order history
```

**API Integration:**
```typescript
// API endpoints for sample management
/api/samples/
├── add-to-sample-cart      // POST: Add sample to cart
├── remove-sample          // DELETE: Remove sample
├── calculate-shipping     // GET: Sample shipping costs
├── create-sample-order    // POST: Complete sample order
└── sample-history         // GET: Customer sample history

// Medusa integration
const sampleProduct = {
  type: 'sample',
  sku: `SAMPLE-${fabricSku}`,
  price: sampleRules.paidSamplePrice * 100, // cents
  weight: 10, // grams for shipping
  metadata: {
    parent_product_id: fabricProductId,
    sample_size: 'standard'
  }
}
```

**UX Flow:**
1. Customer browses fabric product page
2. "Order Sample" CTA prominent next to "Add to Cart"
3. Sample cart management (separate from main cart)
4. Sample checkout with different shipping logic
5. Sample fulfillment tracking

---

#### **Feature 3: Essential Business Pages (Day 5)**

**Required Legal Pages:**
```typescript
const businessPages = {
  '/privacy': 'GDPR/CCPA privacy policy with fabric data handling',
  '/terms': 'Terms of service with fabric-specific policies',
  '/shipping': 'Shipping rates by fabric weight and type',
  '/returns': 'Return policy for samples vs yardage orders',
  '/care': 'Fabric care and maintenance guide',
  '/trade': 'Wholesale and trade account information',
  '/about': 'Company story and fabric expertise'
}
```

**Content Templates:**
```typescript
// components/legal/
├── PrivacyPolicy.tsx        // GDPR compliant privacy policy
├── TermsOfService.tsx       // Fabric-specific terms
├── ShippingPolicy.tsx       // Weight-based shipping explanation
├── ReturnPolicy.tsx         // Sample vs yardage return rules
├── FabricCareGuide.tsx      // Care instruction templates
├── TradeProgram.tsx         // B2B account information
└── AboutUs.tsx             // Brand story and expertise
```

---

### **WEEK 2: DISCOVERY + COMMERCE OPTIMIZATION**

#### **Feature 4: Mobile-First Product Discovery (Days 1-3)**

**Search Implementation:**
```typescript
// Search functionality
components/search/
├── SearchBar.tsx            // Header search with autocomplete
├── SearchResults.tsx        // Search results page
├── SearchSuggestions.tsx    // Fabric-specific search suggestions
├── RecentSearches.tsx       // Recent search history
└── SearchFilters.tsx        // Search result filtering

const searchConfig = {
  autocomplete: {
    fabricTypes: ['Cotton', 'Linen', 'Wool', 'Silk', 'Velvet'],
    patterns: ['Solid', 'Stripe', 'Floral', 'Geometric'],
    uses: ['Upholstery', 'Drapery', 'Apparel', 'Crafts']
  },
  searchFields: ['title', 'description', 'fabric_type', 'composition', 'tags']
}
```

**Mobile-Optimized Filtering:**
```typescript
// Mobile-first filter design
components/filters/
├── MobileFilterDrawer.tsx   // Slide-up filter panel
├── VisualColorFilter.tsx    // Color swatch selection
├── FabricTypeFilter.tsx     // Fabric type chips
├── PriceRangeSlider.tsx     // Price range selection
├── WeightFilter.tsx         // Fabric weight (GSM) ranges
├── WidthFilter.tsx          // Fabric width options
├── CompositionFilter.tsx    // Material composition filters
└── FilterChips.tsx          // Applied filter indicators

const fabricFilters = {
  essential: {
    fabric_type: ['Cotton', 'Linen', 'Wool', 'Silk', 'Synthetic'],
    color: ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Natural'],
    width: ['45"', '54"', '60"', '108"', '120"'],
    price: { min: 5, max: 200, step: 5 }
  },
  advanced: {
    weight_gsm: { min: 100, max: 800, step: 50 },
    composition: ['100% Cotton', '100% Linen', 'Cotton Blend', 'Performance'],
    pattern: ['Solid', 'Stripe', 'Floral', 'Geometric', 'Abstract'],
    care: ['Machine Wash', 'Dry Clean Only', 'Hand Wash']
  }
}
```

**Product Grid Optimization:**
```typescript
// Mobile-optimized product display
components/products/
├── ProductGrid.tsx          // Responsive grid layout
├── ProductCard.tsx          // Fabric product card
├── ProductImage.tsx         // Optimized fabric imagery
├── SampleCTA.tsx           // Quick sample ordering
├── FabricSpecs.tsx         // Key fabric specifications
├── PriceDisplay.tsx        // Per-yard pricing
└── LoadMoreButton.tsx      // Infinite scroll alternative

const productCardData = {
  image: 'Optimized fabric swatch image',
  title: 'Fabric name and collection',
  specs: 'Key specs (width, composition, weight)',
  price: 'Per yard pricing with quantity breaks',
  ctas: ['Order Sample', 'View Details', 'Add to Cart']
}
```

---

#### **Feature 5: Checkout Optimization (Days 4-5)**

**Fabric-Specific Checkout Flow:**
```typescript
// Enhanced checkout for fabric commerce
components/checkout/
├── FabricCartSummary.tsx    // Cart with fabric specifications
├── ShippingCalculator.tsx   // Weight-based shipping
├── YardageValidator.tsx     // Minimum order quantities
├── SampleCheckout.tsx       // Separate sample checkout
├── TradeAccountForm.tsx     // B2B account information
└── OrderConfirmation.tsx    // Fabric care instructions

const checkoutEnhancements = {
  fabricCalculations: {
    pricePerYard: 'Calculate total based on yardage',
    minimumOrders: 'Enforce minimum order quantities',
    cuttingFees: 'Add cutting fees for specific lengths'
  },
  shipping: {
    weightBased: 'Calculate shipping by fabric weight',
    rollCharges: 'Additional fees for fabric rolls',
    sampleShipping: 'Free sample shipping over threshold'
  },
  tradeAccounts: {
    netTerms: 'NET 30 payment terms for approved accounts',
    volumeDiscounts: 'Automatic tiered pricing',
    taxExemption: 'Tax-exempt status handling'
  }
}
```

**Payment Enhancement:**
```typescript
// Enhanced payment processing
const paymentConfig = {
  stripe: {
    paymentMethods: ['card', 'bank_transfer'], // ACH for large orders
    tradeAccounts: 'NET payment terms integration',
    recurringOrders: 'Subscription fabric deliveries'
  },
  orderTypes: {
    sample: 'Low-cost sample orders',
    yardage: 'Standard fabric orders',
    trade: 'Wholesale/bulk orders with special pricing'
  }
}
```

---

## 🔧 **TECHNICAL ARCHITECTURE**

### **Frontend Stack Enhancement:**
```typescript
// Updated dependencies for fabric commerce
const dependencies = {
  '@medusajs/js-sdk': '^2.10.1',     // Medusa API integration
  '@sanity/client': '^7.10.0',        // CMS integration
  '@stripe/stripe-js': '^7.9.0',      // Payment processing
  'swr': '^2.2.5',                    // Data fetching
  'use-debounce': '^10.0.0',          // Search optimization
  'react-hook-form': '^7.51.0',       // Form management
  'zod': '^3.25.76',                  // Validation
  'cmdk': '^1.0.0'                    // Command palette for search
}
```

### **API Integration Layer:**
```typescript
// lib/services/fabric.service.ts
export class FabricService {
  async searchFabrics(query: string, filters: FabricFilters): Promise<FabricProduct[]>
  async getFabricDetails(id: string): Promise<FabricDetails>
  async createSampleOrder(samples: SampleItem[]): Promise<SampleOrder>
  async calculateShipping(items: CartItem[], address: Address): Promise<ShippingRates>
  async getTradeAccount(customerId: string): Promise<TradeAccount>
}

// lib/services/inventory.service.ts
export class InventoryService {
  async checkAvailability(variantId: string, quantity: number): Promise<boolean>
  async getStockLevels(productId: string): Promise<StockLevel[]>
  async reserveInventory(items: CartItem[]): Promise<ReservationResult>
}
```

### **State Management:**
```typescript
// hooks/use-fabric-store.ts
export const useFabricStore = create<FabricStore>((set, get) => ({
  // Product browsing state
  filters: initialFilters,
  searchQuery: '',
  sortBy: 'newest',
  products: [],

  // Sample cart state
  sampleCart: [],
  sampleTotal: 0,

  // Main cart state
  cart: [],
  cartTotal: 0,

  // User state
  isTradeAccount: false,
  tradeDiscount: 0,

  // Actions
  updateFilters: (filters) => set({ filters }),
  addToSampleCart: (sample) => set((state) => ({
    sampleCart: [...state.sampleCart, sample]
  })),
  // ... other actions
}))
```

---

## 🗃️ **DATABASE SCHEMA ENHANCEMENTS**

### **Medusa Custom Fields:**
```sql
-- Product metadata for fabrics
ALTER TABLE product ADD COLUMN fabric_type VARCHAR(50);
ALTER TABLE product ADD COLUMN fabric_width DECIMAL(5,2);
ALTER TABLE product ADD COLUMN fabric_weight DECIMAL(7,2);
ALTER TABLE product ADD COLUMN composition JSONB;
ALTER TABLE product ADD COLUMN care_instructions JSONB;
ALTER TABLE product ADD COLUMN minimum_order DECIMAL(7,2);

-- Sample order tracking
CREATE TABLE sample_orders (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255),
  items JSONB NOT NULL,
  total DECIMAL(10,2),
  shipping_address JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade account management
CREATE TABLE trade_accounts (
  id VARCHAR(255) PRIMARY KEY,
  customer_id VARCHAR(255) UNIQUE,
  business_name VARCHAR(255),
  tax_id VARCHAR(50),
  credit_limit DECIMAL(10,2),
  payment_terms VARCHAR(20) DEFAULT 'NET_30',
  discount_tier VARCHAR(20) DEFAULT 'standard',
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📱 **MOBILE OPTIMIZATION STRATEGY**

### **Performance Requirements:**
```typescript
const mobileOptimization = {
  imageOptimization: {
    formats: ['avif', 'webp', 'jpg'],
    sizes: '(max-width: 768px) 100vw, 50vw',
    quality: 85,
    placeholder: 'blur' // Base64 blur placeholder
  },

  loadingStrategy: {
    homepage: 'Critical path CSS inline',
    productPages: 'Progressive image loading',
    search: 'Debounced search with loading states',
    filters: 'Lazy load non-essential filters'
  },

  touchOptimization: {
    filterTaps: 'Minimum 44px touch targets',
    swipeGestures: 'Swipe navigation for product images',
    scrolling: 'Smooth scroll for long product lists'
  }
}
```

### **Progressive Web App (PWA) Features:**
```typescript
// next.config.js PWA configuration
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

module.exports = withPWA({
  experimental: {
    appDir: true
  }
})
```

---

## 🧪 **TESTING STRATEGY**

### **Unit Testing:**
```typescript
// __tests__/components/SampleOrderButton.test.tsx
describe('SampleOrderButton', () => {
  it('should add sample to cart when clicked', async () => {
    // Test sample cart functionality
  })

  it('should show free sample indicator when applicable', () => {
    // Test free sample logic
  })
})

// __tests__/services/fabric.service.test.ts
describe('FabricService', () => {
  it('should search fabrics with filters', async () => {
    // Test search functionality
  })

  it('should calculate sample shipping correctly', async () => {
    // Test shipping calculations
  })
})
```

### **E2E Testing:**
```typescript
// e2e/fabric-store-flow.spec.ts
test('complete fabric purchase flow', async ({ page }) => {
  // Test homepage -> product browse -> sample order -> checkout
  await page.goto('/');
  await page.click('[data-testid=shop-fabrics-cta]');
  await page.click('[data-testid=product-card]:first-child');
  await page.click('[data-testid=order-sample-button]');
  await page.click('[data-testid=checkout-button]');
  // ... complete flow assertion
});
```

---

## 🚀 **DEPLOYMENT STRATEGY**

### **Build Optimization:**
```typescript
// next.config.js production optimizations
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizeImages: true
  },

  images: {
    domains: ['cdn.sanity.io', 'tara-hub-images.s3.amazonaws.com'],
    formats: ['image/avif', 'image/webp']
  },

  compress: true,

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all'
    }
    return config
  }
}
```

### **Environment Configuration:**
```bash
# Production environment variables
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_WRITE_TOKEN=...
STRIPE_SECRET_KEY=sk_...
```

---

## 📊 **SUCCESS METRICS & KPIs**

### **Business Metrics:**
```typescript
const successMetrics = {
  conversion: {
    homepageToProduct: '>5%',
    productToSample: '>15%',
    sampleToOrder: '>25%',
    overallConversion: '>3%'
  },

  userExperience: {
    pageLoadSpeed: '<3s',
    mobileScore: '>90',
    bounceRate: '<60%',
    sessionDuration: '>3min'
  },

  commerce: {
    averageOrderValue: '>$150',
    sampleConversionRate: '>20%',
    repeatCustomerRate: '>30%',
    cartAbandonmentRate: '<70%'
  }
}
```

### **Technical Monitoring:**
```typescript
// Analytics and monitoring setup
const monitoring = {
  googleAnalytics: 'GA4 with enhanced ecommerce',
  performance: 'Core Web Vitals tracking',
  errors: 'Sentry error monitoring',
  uptime: 'Vercel deployment monitoring',
  business: 'Custom fabric commerce events'
}
```

---

This implementation plan provides the development team with comprehensive technical specifications, component architecture, and success criteria for launching a professional fabric commerce experience. The focus on fabric-specific features and mobile-first design will differentiate Tara Hub from generic e-commerce platforms.