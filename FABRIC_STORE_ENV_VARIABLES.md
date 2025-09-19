# 🔐 Fabric Store Environment Variables - PRODUCTION READY

## ✅ Verified Working Configuration

These values have been retrieved from your production Medusa deployment and tested to be working.

### Copy these exact values to Vercel:

```env
# Medusa Backend Connection
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_886803c4ee7b036666c8fdb0e8d8aa0c20ae0772b20ba26c046aaca6adf79810

# Region IDs (for multi-currency support)
NEXT_PUBLIC_MEDUSA_REGION_ID_USD=reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ
NEXT_PUBLIC_MEDUSA_REGION_ID_EUR=reg_01K5G0Q46WPAVMFCSE676D4SVM
NEXT_PUBLIC_MEDUSA_DEFAULT_REGION=usd

# Optional - keep your existing values for these
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your_existing_stripe_key]
```

## 📋 How to Update in Vercel

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard

2. **Select your fabric-store project**
   - Look for `fabric-store` or similar project name

3. **Navigate to Settings → Environment Variables**

4. **Update or Add each variable**:
   - Click "Edit" for existing variables
   - Click "Add" for new ones
   - Paste the exact values above

5. **Important**: Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. **Click "Save"**

7. **Redeploy your application**:
   - Go to Deployments tab
   - Click "..." on the latest deployment
   - Select "Redeploy"

## ✅ Verification

After updating and redeploying, test:

### 1. Test the API directly:
```bash
curl "https://fabric-store-ten.vercel.app/api/fabrics?limit=5"
```

Expected: Should return fabric products data

### 2. Check the browse page:
- https://fabric-store-ten.vercel.app/browse
- Should display fabric products

### 3. Test product details:
- Click on any product
- Should show pricing in USD

## 🔍 What These Variables Do

- **NEXT_PUBLIC_MEDUSA_BACKEND_URL**: Points to your Railway-hosted Medusa backend
- **NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY**: Authentication key for store API (Webshop key)
- **NEXT_PUBLIC_MEDUSA_REGION_ID_USD**: US region for USD pricing
- **NEXT_PUBLIC_MEDUSA_REGION_ID_EUR**: Europe region for EUR pricing
- **NEXT_PUBLIC_MEDUSA_DEFAULT_REGION**: Default to USD for US customers

## ✅ Status Check

- ✅ Medusa backend: Live at https://medusa-backend-production-3655.up.railway.app
- ✅ Products in database: 13 products confirmed
- ✅ API key: Working and tested
- ✅ Regions: USD and EUR regions exist
- ✅ API endpoint: Fixed (using /store/products instead of /store/products-with-metadata)

## 🚨 Troubleshooting

If products still don't show after updating:

1. **Clear Vercel cache**:
   ```bash
   # Trigger a fresh deployment
   git commit --allow-empty -m "chore: force redeploy"
   git push
   ```

2. **Check browser console** for errors on https://fabric-store-ten.vercel.app/browse

3. **Verify API response**:
   ```bash
   # This should return products
   curl https://medusa-backend-production-3655.up.railway.app/store/products \
     -H "x-publishable-api-key: pk_886803c4ee7b036666c8fdb0e8d8aa0c20ae0772b20ba26c046aaca6adf79810"
   ```

## 🎉 Expected Result

Once these environment variables are updated in Vercel:
1. The fabric store will fetch products from Medusa
2. Browse page will show all 13 products
3. Products will display with proper USD pricing
4. Cart and checkout will work with the Medusa backend