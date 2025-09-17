# Setting Up US Region for American Customers

## Quick Setup Guide

### Step 1: Create US Region in Medusa Admin

1. **Login to Medusa Admin**
   - URL: https://medusa-backend-production-3655.up.railway.app/admin
   - Use your admin credentials

2. **Navigate to Settings → Regions**

3. **Click "Add Region" and configure:**
   - **Name**: United States
   - **Currency**: USD
   - **Tax Rate**: 0% (or your preferred default, US shows pre-tax prices)
   - **Countries**: Add "United States"
   - **Payment Providers**: Enable "Stripe" and "Manual"
   - **Fulfillment Providers**: Enable "Manual"

4. **Save the region**

5. **Copy the Region ID** (it will look like `reg_01K5...`)

### Step 2: Update Your Environment Variables

1. Open `/frontend/experiences/fabric-store/.env.local`

2. Replace the placeholder with your actual region ID:
   ```
   NEXT_PUBLIC_MEDUSA_REGION_ID_USD=reg_YOUR_ACTUAL_REGION_ID_HERE
   ```

### Step 3: Set USD Prices for Your Products

1. **In Medusa Admin, go to Products**

2. **For each product:**
   - Click on the product
   - Go to the "Prices" section
   - Click "Add price"
   - Select "United States (USD)" region
   - Add prices for each variant:
     - **Fabric Per Yard**: Your per-yard price (e.g., $530)
     - **Swatch**: Your swatch price (e.g., $4.50)
   - Save changes

### Step 4: Restart Fabric Store

```bash
# Stop the current process (Ctrl+C) then:
cd frontend/experiences/fabric-store
npm run dev
```

### Step 5: Test

1. Open http://localhost:3006/browse
2. Products should now show USD prices
3. Check browser console - you should see: "🇺🇸 Using US region for pricing"

## Verification Checklist

- [ ] US Region created in Medusa Admin
- [ ] Region ID added to `.env.local`
- [ ] USD prices set for all product variants
- [ ] Fabric store restarted
- [ ] Prices displaying in USD ($) not EUR (€)

## Troubleshooting

### If prices still show as 0 or fallback values:

1. **Clear browser cache** or use incognito mode
2. **Check region ID** is correct in `.env.local`
3. **Verify prices** are set for the US region in Medusa Admin
4. **Check console** for any error messages

### To verify the API is working:

Visit: http://localhost:3006/api/fabrics

You should see products with non-zero prices in the response.

## Currency Display

The fabric-store is now configured to:
- Default to USD for all visitors
- Show prices without tax (US standard)
- Display "$" symbol for prices
- Free shipping threshold at $500

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify the region ID matches exactly (case-sensitive)
3. Ensure all products have USD prices set in Medusa Admin