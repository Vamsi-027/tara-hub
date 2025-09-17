# Medusa Inventory Management Guide

## Overview
This guide explains how to set up and manage inventory in Medusa v2 to ensure products show as "in stock" in the fabric-store frontend.

## Current Issue
Products are showing as "out of stock" because inventory hasn't been configured in Medusa Admin. The fabric-store checks `inventory_quantity` on variants to determine stock availability.

## How Inventory Works

### Stock Calculation Logic
The fabric-store determines if a product is in stock based on:
```javascript
// For fabric variant (by the yard)
fabricInStock = (variant.inventory_quantity > 0) || (variant.allow_backorder === true)

// For swatch variant (sample)
swatchInStock = (variant.inventory_quantity > 0) || (variant.allow_backorder === true)
```

### Fallback Values
If `inventory_quantity` is null, the system assumes:
- Fabric variant: 50 units available
- Swatch variant: 100 units available

## Step-by-Step Setup

### 1. Access Medusa Admin
Navigate to: https://medusa-backend-production-3655.up.railway.app/admin

### 2. Enable Inventory Management

#### Option A: Quick Fix (Allow Backorders)
1. Go to **Products** → Select your product
2. Click on each variant (e.g., "By the Yard", "Swatch")
3. In the **Inventory** section:
   - Toggle **"Allow backorders"** to ON
   - This allows ordering even when stock is 0
4. Save changes

#### Option B: Set Actual Inventory Quantities
1. Go to **Products** → Select your product
2. Click on each variant
3. In the **Inventory** section:
   - Toggle **"Manage inventory"** to ON
   - Set **"Inventory quantity"** (e.g., 100 for yards, 500 for swatches)
4. Save changes

### 3. Configure Inventory Locations (Advanced)

If using Medusa's inventory module:

1. Go to **Settings** → **Locations**
2. Create a location (e.g., "Main Warehouse")
3. Go back to your product
4. For each variant:
   - Link to the location
   - Set stock quantity at that location

## Recommended Settings

### For Fabric Products

#### By the Yard Variant:
- **Manage inventory**: ON
- **Inventory quantity**: 100-500 (based on actual stock)
- **Allow backorders**: ON (if you can fulfill on demand)
- **SKU**: FABRIC-[PRODUCT-ID]-YARD

#### Swatch Variant:
- **Manage inventory**: ON
- **Inventory quantity**: 500-1000 (swatches are usually plentiful)
- **Allow backorders**: ON
- **SKU**: FABRIC-[PRODUCT-ID]-SWATCH

## API Verification

After setting inventory, verify it's working:

```bash
# Check product with inventory
curl "https://medusa-backend-production-3655.up.railway.app/store/products-with-metadata?id=prod_01K5C2CN06C8E90SGS1NY77JQD" \
  -H "x-publishable-api-key: pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538"
```

Look for in the response:
```json
"variants": [{
  "title": "By the Yard",
  "inventory_quantity": 100,
  "allow_backorder": true,
  "manage_inventory": true
}]
```

## Troubleshooting

### Products Still Show "Out of Stock"
1. Clear fabric-store cache:
   ```bash
   cd frontend/experiences/fabric-store
   rm -rf .next
   npm run dev
   ```

2. Check the API response:
   - Visit: http://localhost:3006/api/fabrics/[product-id]
   - Verify `in_stock: true` in response

### Inventory Not Updating
1. In Medusa Admin, ensure "Manage inventory" is toggled ON
2. Save the product after making changes
3. Wait 30 seconds for cache to clear
4. Refresh fabric-store

## Quick Setup Script

For bulk inventory setup, you can use this script:

```javascript
// scripts/setup-inventory.js
const axios = require('axios');

async function setupInventory() {
  const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app';
  const API_TOKEN = 'your-admin-api-token';

  const products = [
    { id: 'prod_01K5C2CN06C8E90SGS1NY77JQD', yardStock: 100, swatchStock: 500 },
    { id: 'prod_01K5C2E6HXN139VDX9HH82NTWG', yardStock: 75, swatchStock: 300 }
  ];

  for (const product of products) {
    // Update each variant's inventory
    await axios.post(`${MEDUSA_URL}/admin/inventory-items`, {
      variant_id: `${product.id}_yard`,
      quantity: product.yardStock,
      location_id: 'default'
    }, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });
  }

  console.log('Inventory setup complete!');
}

setupInventory();
```

## Best Practices

1. **Always enable "Manage inventory"** for accurate tracking
2. **Set realistic quantities** based on actual stock
3. **Enable backorders** for made-to-order fabrics
4. **Use SKUs consistently** for easy tracking
5. **Update inventory regularly** through admin or API
6. **Monitor low stock** and reorder proactively

## Next Steps

1. Set inventory for both products in Medusa Admin
2. Add metadata fields (color, pattern, etc.) while you're there
3. Verify changes in fabric-store
4. Consider automating inventory updates via API

## Summary

To fix "out of stock" immediately:
1. Login to Medusa Admin
2. Edit each product variant
3. Either:
   - Enable "Allow backorders" (quickest)
   - Set "Inventory quantity" > 0
4. Save and refresh fabric-store

The fabric-store will immediately show products as "in stock" once these changes are made!