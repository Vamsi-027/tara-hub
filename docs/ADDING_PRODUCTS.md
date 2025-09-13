# Adding Products to Medusa - SKU Selection Workflow

This document explains the new SKU-based product creation workflow in Medusa Admin.

## Overview

Instead of manually entering product details, administrators can now select a fabric SKU from the main fabrics database (neondb) to automatically populate all product fields. This ensures consistency and saves time when creating products in Medusa.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Medusa Admin   │────▶│  Fabric API      │────▶│  NeonDB         │
│  Product Form   │     │  /admin/fabrics  │     │  fabrics table  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                                                 │
         │                    Fetch Details               │
         └─────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Auto-populated     │
                    │  Product Form       │
                    └─────────────────────┘
```

## Features

### 1. SKU Search and Selection
- **Search by SKU or Name**: Type-ahead search functionality
- **Browse Fabrics**: View and select from available fabrics
- **Real-time Search**: Results update as you type (300ms debounce)

### 2. Auto-Population
When a fabric SKU is selected, the following fields are automatically filled:

#### Basic Product Info
- Title (fabric name)
- Handle (URL-friendly version)
- Description
- Status (draft/published based on fabric status)
- Thumbnail image
- Product images

#### Pricing
- Yard price (from yardage_price or retail_price)
- Swatch price (from swatch_price, default $5)

#### Inventory
- Stock quantity
- Available quantity
- Minimum order quantity
- Stock unit (yards, meters, etc.)

#### Metadata (All Fabric Properties)
- Physical properties (width, weight, composition)
- Performance ratings (martindale, durability)
- Features (stain/fade/water resistant)
- Certifications
- Care instructions
- And 50+ other fabric-specific fields

### 3. Editable Fields
After auto-population, administrators can:
- Edit any populated field before saving
- Add additional images
- Modify pricing
- Update descriptions
- Change status

## User Workflow

### Step 1: Access Product Creation
Navigate to Medusa Admin → Products → Create New Product

### Step 2: Select Fabric SKU
You have two options:

#### Option A: Search
1. Type SKU or fabric name in search box
2. Select from dropdown results
3. Form auto-populates

#### Option B: Browse
1. Click "Browse Fabrics" button
2. View available fabrics
3. Click to select
4. Form auto-populates

### Step 3: Review and Edit
1. Review auto-populated fields
2. Make any necessary edits
3. Verify pricing for variants
4. Check inventory levels

### Step 4: Save Product
1. Click "Create Product" button
2. Product is created with:
   - Two variants (Swatch and Fabric)
   - All metadata preserved
   - Proper SKU mapping

## API Endpoints

### Search Fabrics
```
GET /admin/fabrics?q=<search>&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "fabrics": [
    {
      "id": "uuid",
      "sku": "FAB-001",
      "name": "Premium Cotton",
      "category": "Upholstery",
      "price": "45.00",
      "stock": 100,
      "label": "FAB-001 - Premium Cotton",
      "value": "FAB-001"
    }
  ],
  "pagination": {
    "total": 649,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Fabric Details
```
GET /admin/fabrics/:sku
```

**Response:**
```json
{
  "success": true,
  "fabric": {
    "title": "Premium Cotton",
    "handle": "premium-cotton",
    "description": "High-quality cotton fabric",
    "status": "published",
    "thumbnail": "https://...",
    "images": ["https://..."],
    "prices": {
      "yard": { "amount": 45, "currency_code": "USD" },
      "swatch": { "amount": 5, "currency_code": "USD" }
    },
    "inventory": {
      "quantity": 100,
      "available": 95,
      "min_order": 1,
      "stock_unit": "yards"
    },
    "metadata": {
      "sku": "FAB-001",
      "composition": "100% Cotton",
      "width": "54 inches",
      // ... all other fabric properties
    }
  }
}
```

## Clear Selection

To clear a selected SKU and start fresh:
1. Click "Clear Selection" button
2. Form resets to empty state
3. Select a different SKU or enter manually

## Error Handling

### Common Issues

#### SKU Not Found
- **Error**: "Fabric with SKU 'XXX' not found"
- **Solution**: Verify SKU exists in fabrics database

#### Connection Error
- **Error**: "Failed to fetch fabric details"
- **Solution**: Check database connection and network

#### Authentication Required
- **Error**: "Unauthorized"
- **Solution**: Ensure you're logged into Medusa Admin

## Database Sync

### Materials Table
The materials table maintains a 1:1 sync with fabrics:
```bash
npm run sync:materials
```

### Product Creation
Products are created in Medusa with:
- Unique SKUs (base-SWATCH, base-YARD)
- Proper variant structure
- Complete metadata preservation

## Technical Details

### Files Modified
- `/medusa/src/admin/routes/products/create/page.tsx` - UI updates
- `/medusa/src/api/admin/fabrics/route.ts` - Search API
- `/medusa/src/api/admin/fabrics/[sku]/route.ts` - Details API

### Authentication
All fabric API endpoints require authentication:
- Session-based (admin UI)
- Bearer token (API access)

### Performance
- Search debounced at 300ms
- Max 100 results per query
- Pagination supported
- SSL connections required

## Best Practices

1. **Always verify fabric data** before saving product
2. **Use search for known SKUs** for faster selection
3. **Check inventory levels** match current stock
4. **Review pricing** for both variants
5. **Test images load** correctly

## Troubleshooting

### Form doesn't auto-populate
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Confirm authentication is valid

### Search returns no results
1. Check fabric exists in database
2. Verify search term matches SKU or name
3. Try partial search terms

### Images don't display
1. Verify image URLs are valid
2. Check CORS settings
3. Ensure images are publicly accessible

## Related Documentation

- [RESET_PRODUCTS.md](./RESET_PRODUCTS.md) - Clearing product data
- [MATERIALS_MODULE.md](../medusa/src/modules/materials/README.md) - Materials sync
- [FABRIC_SYNC.md](./FABRIC_SYNC.md) - Fabric synchronization

## Support

For issues or questions:
- Check Medusa logs: `.medusa/server/logs/`
- Review browser console for client errors
- Verify database connectivity
- Ensure proper environment variables are set