# 🌱 Tara Hub Seed Data Analysis & Execution Plan

**Analysis Date:** 2025-09-29
**Database Status:** Empty - Needs Population
**MedusaJS Version:** v2.10.0

---

## 📊 Current Database Status

### ❌ What's Missing (Database is Empty)
- ❌ **Regions:** 0 regions (need US region with USD)
- ❌ **Products:** 0 products
- ❌ **Collections:** 0 collections
- ❌ **Categories:** 0 categories
- ❌ **Inventory Locations:** Not set up
- ❌ **Shipping Options:** Not configured
- ❌ **Tax Regions:** Not configured
- ❌ **Publishable API Keys:** May not be configured

---

## 🗂️ Available Seed Scripts Inventory

### 📁 Core Medusa Scripts (medusa/src/scripts/)

#### 1. **Primary Seed Scripts** (npm run commands)

| Script | Command | Purpose | Status |
|--------|---------|---------|--------|
| `seed.ts` | `npm run seed` | 🎯 **Master seed** - Complete Medusa setup | ⭐ **USE THIS FIRST** |
| `seed-admin-user.ts` | `npm run seed:admin` | Create admin user with Google auth | Optional |
| `seed-fabrics.ts` | `npm run seed:fabrics` | Seed fabric products | After main seed |
| `import-fabric-data.ts` | `npm run import:fabrics` | Import fabrics from CSV/data source | After main seed |
| `sync-materials.ts` | `npm run sync:materials` | Sync fabrics to materials module | After fabrics |

#### 2. **Setup Scripts** (Regional & Infrastructure)

| Script | Command | Purpose | Priority |
|--------|---------|---------|----------|
| `setup-us-region.ts` | `npm run setup:us-region` | Setup US region with USD pricing | 🔴 **HIGH** |
| `setup-inventory.ts` | `npm run setup:inventory` | Create inventory locations & stock | 🔴 **HIGH** |
| `setup-regions-complete.ts` | Manual | Complete region setup with shipping | Medium |
| `seed-us-state-tax-regions.ts` | Manual | US state tax configuration | Medium |
| `seed-shipping-options.ts` | Manual | Shipping methods | Medium |
| `seed-main-warehouse.ts` | Manual | Main warehouse location | Low (covered by setup:inventory) |

#### 3. **Specialized Seed Scripts**

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `seed-bundles.ts` | Create fabric bundle products | After individual fabrics |
| `seed-home-fabrics.ts` | Home textile specific fabrics | Optional - specific niche |
| `seed-fabric-products.ts` | Additional fabric products | After main fabrics |
| `add-sample-fabrics.ts` | Quick sample fabric data | Testing/development |
| `add-fabrics-with-swatches.ts` | Fabrics with swatch images | Production-ready fabrics |

#### 4. **Management Scripts**

| Script | Purpose |
|--------|---------|
| `get-api-keys.ts` | Retrieve publishable API keys |
| `manage-api-keys.ts` | Create/manage API keys |
| `create-regions.ts` | Alternative region creation |
| `setup-pricing.ts` | Configure product pricing |
| `test-materials-sync.ts` | Test materials synchronization |

---

## 🎯 Recommended Execution Plan

### Phase 1: Core Infrastructure Setup ⭐ **START HERE**

```bash
# Navigate to medusa directory
cd medusa

# 1. Run master seed (creates everything needed for Medusa)
npm run seed
```

**What `seed.ts` creates:**
- ✅ Default sales channel
- ✅ Store configuration (EUR + USD currencies)
- ✅ Europe region with countries (gb, de, dk, se, fr, es, it)
- ✅ Tax regions for all countries
- ✅ Stock location (European Warehouse)
- ✅ Fulfillment sets and service zones
- ✅ Shipping profiles
- ✅ Shipping options (Standard + Express)
- ✅ Publishable API key ("Webshop")
- ✅ Product categories (Shirts, Sweatshirts, Pants, Merch)
- ✅ Sample products (T-Shirt, Sweatshirt, Sweatpants, Shorts)
- ✅ Inventory levels (1M units per product)

**Time:** ~2-3 minutes

---

### Phase 2: US Region Setup 🇺🇸 **REQUIRED FOR YOUR STORE**

```bash
# 2. Setup US region with USD pricing
npm run setup:us-region
```

**What this creates:**
- ✅ United States region
- ✅ USD currency
- ✅ US country mapping
- ✅ US-specific payment providers (Stripe)
- ✅ US tax configuration
- ✅ US shipping zones

**Time:** ~30 seconds

---

### Phase 3: Fabric Store Setup 🧵 **YOUR MAIN PRODUCTS**

```bash
# 3. Import fabric data from source files
npm run import:fabrics

# 4. Sync fabrics to materials module
npm run sync:materials

# 5. Seed additional fabric products
npm run seed:fabrics
```

**What this creates:**
- ✅ Fabric collections (Essential, Luxury, Outdoor, Trending)
- ✅ Fabric categories (Cotton, Silk, Velvet, Linen, etc.)
- ✅ Fabric products with detailed properties
- ✅ Material synchronization for inventory
- ✅ Product variants with pricing
- ✅ Fabric-specific metadata

**Time:** ~2-5 minutes

---

### Phase 4: Inventory Management 📦

```bash
# 6. Setup inventory locations and stock
npm run setup:inventory
```

**What this creates:**
- ✅ Main Warehouse location
- ✅ Overflow Storage location
- ✅ Stock levels for all products
- ✅ Inventory tracking system

**Time:** ~1 minute

---

### Phase 5: Optional Enhancements 🎁

```bash
# 7. (Optional) Create fabric bundles
npm run seed:bundles

# 8. (Optional) Add admin user with Google auth
npm run seed:admin

# 9. (Optional) Setup additional shipping options
npx medusa exec ./src/scripts/seed-shipping-options.ts

# 10. (Optional) US state-specific tax regions
npx medusa exec ./src/scripts/seed-us-state-tax-regions.ts
```

---

## 🚀 Quick Start: One-Command Setup

Run all essential seed scripts in sequence:

```bash
cd medusa

# Complete setup script
npm run seed && \
npm run setup:us-region && \
npm run import:fabrics && \
npm run sync:materials && \
npm run setup:inventory

echo "✅ Database seeding complete!"
```

**Total Time:** ~5-8 minutes

---

## 📝 Detailed Script Analysis

### 1. `seed.ts` - Master Seed Script ⭐

**File:** `medusa/src/scripts/seed.ts`
**Command:** `npm run seed`

**Purpose:** Complete MedusaJS v2 e-commerce foundation setup

**Creates:**
1. **Store Configuration**
   - Default sales channel
   - Multi-currency support (EUR primary, USD secondary)

2. **Regions & Geography**
   - Europe region with 7 countries
   - Tax configuration per country

3. **Fulfillment & Shipping**
   - European Warehouse stock location
   - Fulfillment sets and service zones
   - Standard shipping (€10/shipment, 2-3 days)
   - Express shipping (€10/shipment, 24 hours)

4. **Product Catalog**
   - 4 product categories
   - 4 sample products (Medusa branded apparel)
   - Variants with Size/Color options
   - Dual currency pricing (EUR/USD)

5. **API & Integration**
   - Publishable API key for storefront
   - Sales channel linkage

**Important Notes:**
- ⚠️ Creates demo products (Medusa T-Shirts) - you'll replace with fabrics
- ⚠️ Creates EUROPE region by default - you need US region separately
- ✅ Safe to run multiple times (checks for existing data)

---

### 2. `setup-us-region.ts` - US Market Setup

**File:** `medusa/src/scripts/setup-us-region.ts`
**Command:** `npm run setup:us-region`

**Purpose:** Configure United States as a selling region

**Creates:**
1. US Region with USD currency
2. United States country mapping
3. Stripe payment provider for US
4. US tax configuration
5. US shipping zones

**Prerequisites:** None (can run after main seed)

**Important for:** US-based fabric store customers

---

### 3. `import-fabric-data.ts` - Fabric Product Import

**File:** `medusa/src/scripts/import-fabric-data.ts`
**Command:** `npm run import:fabrics`

**Purpose:** Import comprehensive fabric catalog from data sources

**Expected Data:**
- CSV files with fabric specifications
- Fabric images from R2 storage
- Material properties and metadata
- Pricing information
- Inventory quantities

**Creates:**
- Fabric collections
- Fabric product categories
- Individual fabric products
- Product variants (by color, width, etc.)

---

### 4. `sync-materials.ts` - Material Synchronization

**File:** `medusa/src/scripts/sync-materials.ts`
**Command:** `npm run sync:materials`

**Purpose:** Sync fabric products to materials inventory module

**What it does:**
- Creates material records from fabric products
- Links materials to product variants
- Enables advanced inventory tracking
- Syncs material properties (composition, weight, etc.)

**Run after:** `import:fabrics`

---

### 5. `setup-inventory.ts` - Inventory System

**File:** `medusa/src/scripts/setup-inventory.ts`
**Command:** `npm run setup:inventory`

**Purpose:** Initialize warehouse locations and stock levels

**Creates:**
1. **Main Warehouse**
   - Name: "Main Warehouse"
   - Location: New York, US
   - Status: Active

2. **Overflow Storage**
   - Name: "Overflow Storage"
   - Location: New Jersey, US
   - Status: Active

3. **Stock Levels**
   - Links all products to locations
   - Sets initial quantities
   - Enables inventory tracking

---

## 🔍 Verification After Seeding

### Check What Was Created

```bash
# 1. Check regions
curl https://medusa-backend-production-3655.up.railway.app/admin/regions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 2. Check products (requires publishable key)
curl https://medusa-backend-production-3655.up.railway.app/store/products \
  -H "x-publishable-api-key: YOUR_KEY"

# 3. Check via Admin UI
open https://medusa-backend-production-3655.up.railway.app/app
```

### Expected Results After Full Seed

```
📊 Database Contents:
  ✅ Regions: 2 (Europe, United States)
  ✅ Countries: 8 (7 EU + US)
  ✅ Products: 50+ (Demo products + Fabrics)
  ✅ Categories: 10+ (Demo + Fabric categories)
  ✅ Collections: 4+ (Fabric collections)
  ✅ Stock Locations: 3 (European Warehouse + 2 US warehouses)
  ✅ Shipping Options: 2+ (Standard, Express)
  ✅ Publishable Keys: 1+ (Webshop)
```

---

## ⚠️ Important Notes & Warnings

### 1. Seed Scripts Are Idempotent (Mostly)
- ✅ `seed.ts` checks for existing data
- ✅ `setup-us-region.ts` checks for existing region
- ⚠️ Some scripts may create duplicates if run multiple times
- 💡 Always check database before re-running

### 2. Demo Products vs Real Products
- The main `seed.ts` creates demo products (T-shirts, etc.)
- These are for testing Medusa functionality
- Replace/supplement with fabric products via `import:fabrics`

### 3. API Key Requirement
- After seeding, get your publishable API key:
  ```bash
  npx medusa exec ./src/scripts/get-api-keys.ts
  ```
- Update frontend environment variables with the key

### 4. MedusaService Limitation
- Some scripts avoid using `MedusaService` (deployment issues)
- Use plain MikroORM or direct API calls instead
- See `CLAUDE.md` for details

### 5. Production vs Development
- Seed scripts work on CURRENT database
- ⚠️ Be careful when running on production!
- Consider using Railway CLI to target specific environment:
  ```bash
  railway run npm run seed
  ```

---

## 🗑️ Clean Up Scripts (Use with Caution!)

If you need to reset the database:

```bash
# Clear all products
npm run clear:products

# Force delete (dangerous!)
npm run clear:products:force

# Delete all orders (for testing)
npx medusa exec ./src/scripts/delete-all-orders.ts
```

---

## 📚 Additional Scripts Available

### Testing & Verification
- `test-materials-sync.ts` - Test material synchronization
- `test-contact-integration.ts` - Test contact module
- `check-products.ts` - Verify product data
- `verify-product-count.ts` - Count products in DB

### Data Management
- `cleanup-unused-images.ts` - Remove orphaned images from R2
- `migrate-to-multi-material.ts` - Migration script for materials
- `sync-all-fabrics.ts` - Sync all fabric data

### Admin & Auth
- `seed-admin-user.ts` - Create admin user
- `link-google-auth.ts` - Link Google authentication
- `setup-email-auth.ts` - Email/password auth setup

---

## 🎯 Recommended: Run These Scripts Now

### For New Empty Database:

```bash
cd medusa

# 1. Core setup (REQUIRED)
npm run seed

# 2. US region (REQUIRED for US customers)
npm run setup:us-region

# 3. Fabric products (YOUR MAIN PRODUCTS)
npm run import:fabrics
npm run sync:materials

# 4. Inventory management (RECOMMENDED)
npm run setup:inventory

# 5. Get your API key
npx medusa exec ./src/scripts/get-api-keys.ts
```

### Verification:
```bash
# Check admin dashboard
open https://medusa-backend-production-3655.up.railway.app/app

# Login and verify:
# ✅ Products exist
# ✅ Regions (Europe + US)
# ✅ Categories and collections
# ✅ Inventory locations
```

---

## 🚨 Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` in Railway environment variables
- Verify Neon database is accessible

### "Publishable key required"
- Run `get-api-keys.ts` to retrieve key
- Add to Vercel environment variables

### "Products not showing"
- Check if products are linked to sales channel
- Verify products are published (status = 'published')
- Check region/currency configuration

### "Seed script hangs"
- Check Railway logs: `railway logs`
- Verify no database locks
- Try restarting Medusa: `railway service restart`

---

## 📊 Execution Time Estimates

| Phase | Scripts | Estimated Time |
|-------|---------|----------------|
| Core Setup | seed.ts | 2-3 minutes |
| US Region | setup-us-region.ts | 30 seconds |
| Fabric Import | import:fabrics, sync:materials | 2-5 minutes |
| Inventory | setup:inventory | 1 minute |
| **Total** | **All required scripts** | **~5-10 minutes** |

---

## ✅ Success Criteria

After running all recommended scripts, you should have:

- [x] ✅ Europe region with EUR currency
- [x] ✅ US region with USD currency
- [x] ✅ 50+ fabric products
- [x] ✅ Product categories and collections
- [x] ✅ Stock locations configured
- [x] ✅ Shipping options available
- [x] ✅ Publishable API key created
- [x] ✅ Tax regions configured
- [x] ✅ Inventory tracking enabled

---

**Ready to Seed?**

```bash
cd /mnt/c/Users/varak/repos/tara-hub-1/medusa
npm run seed
```

🎉 Your database will be populated and ready for production!