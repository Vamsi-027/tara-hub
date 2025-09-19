# 🔑 Getting Your Publishable API Key

## Issue
The fabric-store needs a valid publishable API key to fetch products from Medusa.

## Steps to Get Your API Key

### 1. Access Medusa Admin Panel
Open: https://medusa-backend-production-3655.up.railway.app/app

### 2. Login
Use the admin credentials you created earlier

### 3. Navigate to API Key Management
1. Click on **Settings** (gear icon) in the sidebar
2. Look for **API Key Management** or **Publishable API Keys**
3. If no menu item exists, try **Store Settings** → **API Keys**

### 4. Create or Copy API Key
- If a key exists, copy it
- If no key exists, create one:
  - Click **Create API Key** or **Add Publishable Key**
  - Give it a name like "Fabric Store Production"
  - Save and copy the generated key

### 5. Update Environment Variables

#### For Local Development
Update `/frontend/experiences/fabric-store/.env.local`:
```env
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_actual_key_here
```

#### For Production (Vercel)
1. Go to Vercel Dashboard
2. Select fabric-store project
3. Settings → Environment Variables
4. Update `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`

## Alternative: Check Database Directly

If you have Railway CLI access:
```bash
# Connect to production database
railway run npx medusa exec ./scripts/check-api-keys.ts
```

Create `scripts/check-api-keys.ts`:
```typescript
import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkApiKeys({ container }: ExecArgs) {
  const apiKeyModule = container.resolve(Modules.API_KEY)

  const keys = await apiKeyModule.listApiKeys({
    type: "publishable"
  })

  console.log("Publishable API Keys:")
  keys.forEach(key => {
    console.log(`- Title: ${key.title}`)
    console.log(`  Token: ${key.token}`)
    console.log(`  Created: ${key.created_at}`)
  })
}
```

## Testing Your Key

Once you have the correct key, test it:
```bash
curl https://medusa-backend-production-3655.up.railway.app/store/products \
  -H "x-publishable-api-key: YOUR_KEY_HERE"
```

You should see product data returned.

## Common Issues

### "A valid publishable key is required"
The key is invalid or doesn't exist. Create a new one in admin panel.

### No API Keys section in admin
The publishable key might have been created during seeding. Check the seed script output or database directly.

### Key works but no products returned
- Check if products are published
- Verify region_id is correct
- Ensure products have proper sales channels assigned