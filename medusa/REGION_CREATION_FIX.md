# 🌍 Region Creation Fix

## Issue
The Medusa admin panel crashes when trying to access the regions page at:
`https://medusa-backend-production-3655.up.railway.app/app/settings/regions`

## Root Cause
This is likely due to:
1. Redis connection issues (already disabled)
2. Missing initial data/configuration
3. Admin UI bundle issues

## Solution: Create Regions via Railway CLI

### Step 1: Connect to Railway
```bash
railway login
railway link
```

### Step 2: Run the Region Creation Script
```bash
# Option A: Use the custom script we created
railway run npx medusa exec ./src/scripts/create-regions.ts

# Option B: Run the main seed script (includes regions)
railway run npx medusa exec ./src/scripts/seed.ts
```

### Step 3: Alternative - Direct API Creation
If Railway CLI doesn't work, use the Medusa Admin API directly:

```bash
# First, get your admin JWT token by logging in
curl -X POST https://medusa-backend-production-3655.up.railway.app/admin/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "yourpassword"
  }'

# Save the token from the response, then create a region:
curl -X POST https://medusa-backend-production-3655.up.railway.app/admin/regions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "United States",
    "currency_code": "usd",
    "tax_rate": 0,
    "payment_providers": ["pp_system_default"],
    "fulfillment_providers": ["manual-fulfillment"],
    "countries": ["us"]
  }'
```

### Step 4: Use Medusa CLI Instead of Admin UI
Since the admin UI is having issues, use the CLI to manage regions:

```bash
# List existing regions
railway run npx medusa exec -c "
  const regionModule = container.resolve('region')
  const regions = await regionModule.listRegions()
  console.log(JSON.stringify(regions, null, 2))
"
```

## Quick Fix Script
Create `fix-regions-production.sh`:
```bash
#!/bin/bash

echo "🔧 Fixing Medusa Regions in Production"

# Set Railway token
export RAILWAY_TOKEN=9d1ca706-d735-4a7c-bc65-f571111b8141

# Run the seed script which creates regions
echo "📦 Running seed script..."
railway run npx medusa exec ./src/scripts/seed.ts

echo "✅ Regions created!"
echo "📊 Checking regions..."
railway run npx medusa exec ./src/scripts/get-regions.ts
```

## Temporary Workaround

Until the admin panel is fixed, manage regions via:

1. **Railway CLI** - Use scripts to create/modify regions
2. **Direct Database** - Connect to PostgreSQL and modify regions table
3. **API Calls** - Use Admin API endpoints with JWT authentication

## Get Existing Region IDs

Create `src/scripts/get-regions.ts`:
```typescript
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function getRegions({ container }: ExecArgs) {
  const regionModule = container.resolve(Modules.REGION)

  const regions = await regionModule.listRegions()

  console.log("📍 Existing Regions:")
  regions.forEach(region => {
    console.log(`\n${region.name}:`)
    console.log(`  ID: ${region.id}`)
    console.log(`  Currency: ${region.currency_code}`)
    console.log(`  Countries: ${region.countries?.map(c => c.iso_2).join(", ") || "None"}`)
  })

  console.log("\n📝 Environment variables for fabric-store:")
  const usdRegion = regions.find(r => r.currency_code === "usd")
  const eurRegion = regions.find(r => r.currency_code === "eur")

  if (usdRegion) {
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_USD=${usdRegion.id}`)
  }
  if (eurRegion) {
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_EUR=${eurRegion.id}`)
  }
}
```

Then run:
```bash
railway run npx medusa exec ./src/scripts/get-regions.ts
```

## Expected Result

After running the scripts, you should have:
1. ✅ US Region with USD currency
2. ✅ EUR Region with EUR currency
3. ✅ Region IDs to use in fabric-store environment variables

## Why Admin Panel Fails

The admin panel issue is likely because:
1. **Missing Redux/State Management**: Without Redis, some admin features break
2. **Region Component Error**: The regions UI component may have dependencies on missing services
3. **Custom Service Issues**: Our disabled custom services might affect admin UI

## Next Steps

1. Create regions via CLI/script (not admin UI)
2. Get the region IDs
3. Update fabric-store environment variables
4. Products will then show with proper regional pricing