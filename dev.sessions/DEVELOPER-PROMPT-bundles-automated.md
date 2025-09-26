# Developer Implementation: Automated Bundle Setup (5 Minutes)

## Objective
Deploy curated fabric sample bundles using automated seeding - no manual data entry required!

## Quick Start (Total Time: 5 minutes)

### Step 1: Seed Bundle Products (1 minute)

```bash
# Navigate to Medusa backend
cd medusa

# Run the bundle seed script
npm run seed:bundles
```

This command will automatically:
- ✅ Create 4 curated bundle products
- ✅ Set proper prices ($10.99, $18.99, $24.99, $29.99)
- ✅ Configure inventory tracking
- ✅ Add detailed descriptions
- ✅ Set up metadata for future enhancements

Expected output:
```
🚀 Starting bundle products seed...
📍 Medusa Backend URL: http://localhost:9000
🌍 Fetching regions...
✅ Found USD region: United States (region_id)

📦 Creating bundle products...
✅ Created bundle: Designer's Choice - 5 Swatch Bundle
✅ Created bundle: Color Explorer - 10 Swatch Bundle
✅ Created bundle: Texture Collection - 15 Swatch Bundle
✅ Created bundle: Professional Pack - 20 Swatch Bundle

📊 Seeding Summary:
✅ Created: 4 bundles
⏭️ Skipped: 0 bundles (already exist)
❌ Failed: 0 bundles

✨ Bundle products seed completed!
🎉 Done!
```

### Step 2: Verify Products Created (1 minute)

Option A: Check via Medusa Admin
```bash
# Visit Medusa Admin
open http://localhost:9000/app
# Navigate to Products
# Verify 4 bundle products exist
```

Option B: Check via API
```bash
# Test API endpoint
curl http://localhost:9000/store/products?handle=designers-choice-5-bundle
```

### Step 3: Test Frontend Display (2 minutes)

```bash
# In another terminal, start frontend
cd frontend/experiences/fabric-store
npm run dev

# Visit bundles page
open http://localhost:3006/bundles
```

Verify:
- [ ] All 4 bundles display correctly
- [ ] Prices show as $10.99, $18.99, $24.99, $29.99
- [ ] Descriptions are visible
- [ ] "View Bundle" buttons work

### Step 4: Test Purchase Flow (1 minute)

1. Click "View Bundle" on any product
2. Click "Add to Cart"
3. Proceed to checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete order

## What the Seed Script Does

The `npm run seed:bundles` command executes `/medusa/scripts/seed-bundles.js` which:

1. **Connects to Medusa** using your configured backend URL
2. **Finds USD region** to set proper pricing
3. **Creates 4 bundle products** with:
   - Unique handles for URL routing
   - Detailed descriptions listing all included samples
   - Proper SKUs for inventory tracking
   - Metadata for future features
4. **Skips existing bundles** to prevent duplicates
5. **Reports results** with clear success/failure messages

## Bundle Products Created

| Bundle | SKU | Price | Samples | Special |
|--------|-----|-------|---------|---------|
| Designer's Choice | BUNDLE-CURATED-5 | $10.99 | 5 | Best for starters |
| Color Explorer | BUNDLE-CURATED-10 | $18.99 | 10 | Most popular |
| Texture Collection | BUNDLE-CURATED-15 | $24.99 | 15 | Free shipping |
| Professional Pack | BUNDLE-CURATED-20 | $29.99 | 20 | Best value |

## Troubleshooting

### "No USD region found" Error
```bash
# Create US region first
cd medusa
npm run setup:us-region
# Then retry bundles
npm run seed:bundles
```

### "Authentication failed" Warning
This is OK! The script will:
- Try admin authentication first
- Fall back to store API if needed
- Still create products successfully

### Bundles Not Appearing on Frontend
1. Check Medusa is running: `cd medusa && npm run dev`
2. Verify products exist: Visit http://localhost:9000/app
3. Check console for API errors
4. Ensure frontend is using correct backend URL

### Products Already Exist
The script safely skips existing products. To reset:
```bash
# Remove existing bundles via Admin UI
# Or use database query
# Then re-run seed script
npm run seed:bundles
```

## Manual Fallback (If Automation Fails)

If the seed script fails, you can quickly create products manually:

1. Go to http://localhost:9000/app → Products → New Product
2. Copy details from `/medusa/scripts/seed-bundles.js`
3. Create 4 products (takes ~10 minutes manual vs 1 minute automated)

## Production Deployment

### For Staging/Production:
```bash
# Set production environment
export MEDUSA_BACKEND_URL=https://your-production-url.com
export MEDUSA_ADMIN_EMAIL=admin@yoursite.com
export MEDUSA_ADMIN_PASSWORD=your-secure-password

# Run seed script
npm run seed:bundles

# Verify in production admin
open https://your-production-url.com/app
```

## Code Files Reference

### Created/Modified Files:
1. `/medusa/scripts/seed-bundles.js` - Main seed script
2. `/medusa/package.json` - Added `seed:bundles` script
3. `/frontend/experiences/fabric-store/app/bundles/page.tsx` - Bundles display page

### No Manual Editing Required!
The seed script handles everything automatically.

## Success Checklist

✅ **MVP is complete when:**
- [ ] `npm run seed:bundles` runs successfully
- [ ] 4 bundle products visible in Medusa Admin
- [ ] Bundles page shows all products at `/bundles`
- [ ] Can add bundle to cart
- [ ] Can complete checkout with test payment
- [ ] Order appears in Medusa Admin

## Time Saved

**Manual approach:** 30-45 minutes
**Automated approach:** 5 minutes
**Time saved:** 25-40 minutes ⚡

## Next Steps (After MVP)

Once bundles are live:
1. Add product images (optional)
2. Create marketing banner
3. Add to homepage
4. Track conversion metrics
5. Consider custom bundle builder (Phase 2)

---

**Start now: Just run `npm run seed:bundles` and you're done! 🚀**