# Fabric to Medusa Product Sync Architecture

## Overview

This document describes the synchronization system between the Admin fabric database and Medusa's product catalog.

## Architecture Principle

**Single Source of Truth**: The admin fabric database (`/app/admin`) is the master data source. Medusa products are synchronized copies.

## Sync Flow

```
[Admin Fabric] → [Save/Update] → [Push to Medusa] → [Product Created/Updated]
  (PostgreSQL)     (Admin UI)      (HTTP POST)         (MedusaJS)
```

## Components

### 1. Admin Database (`fabrics` table)
- PostgreSQL table with 90+ fields
- Complete fabric information including:
  - Basic info (SKU, name, description)
  - Pricing (retail, wholesale, cost)
  - Inventory (stock quantity, availability)
  - Composition (`fiber_content` JSONB)
  - Performance metrics (martindale, wyzenbeek)
  - Features (stain resistant, outdoor safe, etc.)
  - Images and metadata

### 2. Sync Triggers

#### Automatic Push on Save
- **Location**: `/app/admin/fabrics/[id]/edit/page.tsx`
- **Function**: `syncFabricToMedusa()`
- **Behavior**: Fire-and-forget after successful save
- **No UI blocking**: Sync happens in background

#### Automatic Push on Create
- **Location**: `/app/admin/fabrics/new/page.tsx`
- **Function**: Same `syncFabricToMedusa()`
- **Behavior**: Triggers after new fabric creation

### 3. Medusa Sync Endpoint
- **Route**: `POST /admin/fabric-sync`
- **Location**: `/medusa/src/api/admin/fabric-sync/route.ts`
- **Features**:
  - Idempotent upsert (by handle/SKU)
  - Version checking to avoid unnecessary updates
  - Complete data preservation in metadata

### 4. Bulk Sync Script
- **Command**: `npm run sync:fabrics`
- **Location**: `/medusa/scripts/sync-all-fabrics.ts`
- **Purpose**: Initial migration or full resync
- **Features**:
  - Syncs all active fabrics
  - Progress tracking
  - Error handling per fabric

## Data Mapping

### Product Structure
```typescript
{
  // Core fields from fabric
  title: fabric.name,
  handle: fabric.slug || slugify(fabric.sku),
  description: fabric.description,
  status: fabric.isActive ? "published" : "draft",
  
  // ALL fabric data preserved in metadata
  metadata: {
    fabric_id: fabric.id,
    sku: fabric.sku,
    fiber_content: fabric.fiber_content,  // Complete composition
    width: fabric.width,
    weight: fabric.weight,
    // ... all 90+ fields
  },
  
  // Variants
  variants: [
    {
      title: "Per Yard",
      sku: `${fabric.sku}-YARD`,
      price: fabric.retail_price * 100  // Convert to cents
    },
    {
      title: "Sample Swatch",
      sku: `${fabric.sku}-SWATCH`,
      price: 500  // Fixed $5.00
    }
  ]
}
```

## Idempotency

The sync is idempotent using these keys:
1. **Primary**: Product `handle` (from fabric.slug or SKU)
2. **Secondary**: `metadata.sku`
3. **Version**: Checks `metadata.version` to skip unnecessary updates

## Usage

### Manual Sync Single Fabric
1. Edit fabric in admin
2. Click Save
3. Sync happens automatically

### Bulk Sync All Fabrics
```bash
cd medusa
npm run sync:fabrics
```

### Test Sync
```bash
cd medusa
npx tsx scripts/test-fabric-sync.ts
```

## Benefits

1. **No Schema Duplication**: Medusa stores everything in metadata
2. **Complete Data Preservation**: All 90+ fields preserved
3. **Automatic Updates**: Every save triggers sync
4. **No ORM Conflicts**: Direct SQL for reading
5. **Simple Maintenance**: Single sync function

## Monitoring

Check sync status in browser console:
- `✅ Fabric synced to Medusa:` - Success
- `Failed to sync to Medusa:` - Error (non-blocking)

Check Medusa logs:
```bash
docker logs medusa_container
```

## Troubleshooting

### Sync Not Working
1. Check Medusa is running: `http://localhost:9000`
2. Check environment variable: `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
3. Check browser console for errors
4. Run test script: `npx tsx scripts/test-fabric-sync.ts`

### Data Mismatch
1. Run bulk sync: `npm run sync:fabrics`
2. Check product metadata in Medusa admin
3. Verify fabric data in admin database

### Performance
- Sync is async and non-blocking
- Each sync takes ~200-500ms
- Bulk sync processes ~100 fabrics/minute

## Future Enhancements

1. **Webhook Support**: Database triggers for real-time sync
2. **Batch Updates**: Queue multiple changes
3. **Bi-directional Sync**: Inventory updates from Medusa back to admin
4. **Sync Status UI**: Show sync status in admin UI
5. **Retry Logic**: Automatic retry on failure