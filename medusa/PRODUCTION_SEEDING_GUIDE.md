# 🌱 Production Database Seeding Guide

## Current Issue
The fabric-store API is returning empty results because the production Medusa database doesn't have any products seeded.

## Solution: Seed Production Database via Railway

### Prerequisites
- Railway CLI installed and logged in
- Access to the Railway project

### Step 1: Login to Railway
```bash
railway login
railway link
```

### Step 2: Run Database Migrations (if not done already)
```bash
railway run npx medusa db:migrate
```

### Step 3: Create Admin User (if not done already)
```bash
railway run npx medusa user -e admin@yourdomain.com -p yourpassword --invite
```

### Step 4: Seed Base Data
Run the main seed script first to set up regions, shipping profiles, etc.:
```bash
railway run npx medusa exec ./src/scripts/seed.ts
```

Expected output:
- ✅ Seeding store data
- ✅ Seeding region data
- ✅ Seeding tax regions
- ✅ Seeding stock location data
- ✅ Seeding fulfillment data
- ✅ Seeding publishable API key data
- ✅ Seeding product data
- ✅ Seeding inventory levels

### Step 5: Seed Fabric Products
Now seed the fabric-specific products:
```bash
railway run npx medusa exec ./src/scripts/seed-fabric-products.ts
```

Expected output:
- ✅ Created 8 fabric products
- ✅ Created 4 fabric categories

### Step 6: Verify Seeding Success

#### Option A: Check via Admin Panel
1. Open: https://medusa-backend-production-3655.up.railway.app/app
2. Login with your admin credentials
3. Navigate to Products section
4. You should see 8+ fabric products

#### Option B: Check via API
```bash
# Get publishable key from admin panel first, then:
curl https://medusa-backend-production-3655.up.railway.app/store/products \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY"
```

### Step 7: Verify Fabric Store API
Once products are seeded, test the fabric-store API:
```bash
curl "https://fabric-store-ten.vercel.app/api/fabrics?limit=12"
```

You should now see fabric products returned!

## 🔄 Alternative: Direct Database Seeding

If Railway CLI is not working, you can connect directly to the database:

### 1. Get Database Credentials
From Railway dashboard, get your `DATABASE_URL`

### 2. Run Seeding Locally with Production DB
```bash
# Set production database URL
export DATABASE_URL="your_production_database_url"

# Run seeding scripts locally
cd medusa
npx medusa exec ./src/scripts/seed.ts
npx medusa exec ./src/scripts/seed-fabric-products.ts
```

## 📝 What Gets Seeded

### Main Seed Script (`seed.ts`):
- Default store configuration
- EUR and USD regions
- Tax regions
- Stock locations
- Fulfillment profiles
- Publishable API keys
- Sample products

### Fabric Products Script (`seed-fabric-products.ts`):
- 8 fabric products including:
  - Emerald Velvet Upholstery
  - Natural Linen Curtain Fabric
  - Moroccan Tile Pattern
  - Coastal Stripe Outdoor
  - Vintage Floral Chintz
  - Herringbone Wool Blend
  - Bamboo Silk Luxury
  - Recycled Denim Canvas
- Each product has:
  - Per Yard variant
  - Sample Swatch variant
  - Proper pricing in USD and EUR
  - Inventory management
  - Rich metadata for filtering

## 🚨 Troubleshooting

### "No shipping profile found"
Run the main seed script first: `railway run npx medusa exec ./src/scripts/seed.ts`

### "Unauthorized" errors
Make sure you're logged into Railway: `railway login`

### Products not showing in fabric-store
1. Check if products exist in Medusa admin panel
2. Verify the publishable API key is correct in fabric-store environment
3. Check if the region IDs match between Medusa and fabric-store

### Empty API responses
The fabric-store API fetches from `/store/products-with-metadata` endpoint. Make sure:
1. Products are published (status: "published")
2. Products have proper metadata
3. The publishable API key has access to products

## 🎉 Success Verification

After successful seeding, you should see:
1. **Admin Panel**: 8+ fabric products visible
2. **Fabric Store Browse**: Products displayed with images
3. **API Response**: Returns fabric data with proper filtering

## 📞 Need Help?

If you encounter issues:
1. Check Railway logs: `railway logs --service medusa-backend`
2. Verify database connection: `railway run npx medusa db:migrate`
3. Check environment variables in Railway dashboard