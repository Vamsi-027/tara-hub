# 🔧 Fabric Store API Fix Summary

## Problem
The fabric-store API at https://fabric-store-ten.vercel.app/api/fabrics returns empty results even though you have products in Medusa admin.

## Root Causes Identified

1. **❌ Invalid API Endpoint**: The fabric-store was trying to fetch from `/store/products-with-metadata` which doesn't exist in Medusa v2
   - **Fixed**: Changed to standard `/store/products` endpoint

2. **❌ Invalid Publishable API Key**: The hardcoded key in fabric-store doesn't match production
   - **Action Needed**: Get the correct key from production

## Changes Made

### 1. Fixed API Endpoint
**File**: `/frontend/experiences/fabric-store/app/api/fabrics/route.ts`
```diff
- const medusaUrl = new URL(`${medusaBackendUrl}/store/products-with-metadata`)
+ const medusaUrl = new URL(`${medusaBackendUrl}/store/products`)
```

## Actions Required

### 1. Get Production API Key

#### Option A: From Railway CLI
```bash
# Login to Railway
railway login
railway link

# Get the API key
railway run npx medusa exec ./src/scripts/get-api-keys.ts
```

#### Option B: From Admin Panel
1. Go to: https://medusa-backend-production-3655.up.railway.app/app
2. Login with your admin credentials
3. Navigate to Settings → API Keys
4. Copy the "Webshop" publishable key

### 2. Update Vercel Environment Variables
1. Go to Vercel Dashboard → fabric-store project
2. Settings → Environment Variables
3. Update:
```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_YOUR_ACTUAL_KEY_HERE
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app
```

### 3. Deploy fabric-store Changes
```bash
cd frontend/experiences/fabric-store
git add .
git commit -m "fix: use standard Medusa products endpoint"
git push
```

Vercel will auto-deploy the changes.

### 4. Ensure Products Exist in Production
If you still don't see products after fixing the API key:

```bash
# Seed production database
railway run npx medusa exec ./src/scripts/seed.ts
railway run npx medusa exec ./src/scripts/seed-fabric-products.ts
```

## Testing

### Test Medusa API Directly
```bash
# Replace with your actual API key
curl https://medusa-backend-production-3655.up.railway.app/store/products \
  -H "x-publishable-api-key: YOUR_KEY_HERE"
```

### Test Fabric Store API
```bash
curl https://fabric-store-ten.vercel.app/api/fabrics
```

## Expected Result

After completing these steps:
1. ✅ Medusa API returns products
2. ✅ Fabric store API returns transformed fabric data
3. ✅ Browse page shows fabric products

## Summary of Files Created

1. **PRODUCTION_SEEDING_GUIDE.md** - How to seed production database
2. **GET_API_KEY_GUIDE.md** - How to get publishable API key
3. **get-api-keys.ts** - Script to retrieve API keys
4. **FABRIC_STORE_API_FIX.md** - This summary

## Next Steps

1. ✅ Commit the API endpoint fix
2. ⏳ Get production publishable API key
3. ⏳ Update Vercel environment variables
4. ⏳ Redeploy fabric-store
5. ⏳ Verify products are displayed