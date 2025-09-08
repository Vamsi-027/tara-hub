# Materials Module - Simplified Implementation
*For 1000 fabrics dataset*

## Key Insight: 1000 Records = Keep It Simple

With only 1000 fabrics, we can skip complex optimizations and focus on clean, simple code.

## Simplified Architecture

### 1. Storage
```typescript
// Simple materials table - no fancy indexes needed
CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  properties JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Single GIN index is enough for 1000 records
CREATE INDEX idx_materials_properties ON materials USING GIN (properties);
```

### 2. Sync Strategy (Super Simple)
```typescript
// One sync endpoint - that's it
POST /api/admin/sync-materials

// Sync all 1000 records in one batch (takes <1 second)
async function syncMaterials() {
  const adminFabrics = await db.query('SELECT * FROM fabrics');
  
  // Bulk upsert all records
  await materialsService.bulkUpsert(
    adminFabrics.map(f => ({
      id: f.id,
      name: f.name,
      properties: f
    }))
  );
}
```

### 3. Caching (In-Memory)
```typescript
// Cache entire collection in memory (1-2MB)
let materialsCache = null;
let cacheTime = null;

async function getMaterials() {
  // Refresh cache every 5 minutes
  if (!materialsCache || Date.now() - cacheTime > 300000) {
    materialsCache = await materialsService.list();
    cacheTime = Date.now();
  }
  return materialsCache;
}
```

### 4. API Response
```typescript
// Direct pass-through - no transformation
async function getFabrics(req, res) {
  const materials = await getMaterials(); // From cache
  
  // Filter if needed (still fast with 1000 records)
  let filtered = materials;
  if (req.query.category) {
    filtered = materials.filter(m => 
      m.properties.category === req.query.category
    );
  }
  
  return res.json({
    fabrics: filtered.map(m => ({
      ...m.properties,
      id: m.id,
      name: m.name
    }))
  });
}
```

## What We DON'T Need (Due to Small Dataset)

❌ **Materialized Views** - Overkill for 1000 records
❌ **Complex Indexes** - Single GIN index is enough
❌ **Redis/External Cache** - In-memory is fine
❌ **Pagination** - Frontend can handle 1000 items
❌ **Query Optimization** - Already fast enough
❌ **Gradual Migration** - Can switch immediately
❌ **A/B Testing** - Low risk with simple data

## Implementation Steps (1-2 Days Total)

### Day 1: Build & Test
1. Create materials table with single GIN index
2. Build sync endpoint (< 50 lines of code)
3. Add in-memory cache
4. Create API compatibility layer

### Day 2: Deploy
1. Run initial sync (takes 1 second)
2. Switch API to use materials
3. Monitor for 1 hour
4. Remove fabric-details module

## Performance Expectations

With 1000 fabrics:
- **Full sync**: <1 second
- **Query time**: <10ms (even complex filters)
- **Memory usage**: 1-2MB
- **Cache refresh**: Instant
- **API response**: <20ms total

## Monitoring (Simple)

```typescript
// Just log basic metrics
console.log({
  total_materials: materials.length,
  sync_duration_ms: syncTime,
  cache_size_mb: JSON.stringify(materialsCache).length / 1048576
});
```

## The Beauty of This Approach

✅ **Dead Simple**: ~200 lines of code total
✅ **Fast**: Everything under 20ms
✅ **Reliable**: No complex systems to fail
✅ **Maintainable**: Anyone can understand it
✅ **Extensible**: Easy to add features later

## Future Growth Path

If you ever exceed 1000 fabrics:
- 10,000 fabrics: Add pagination
- 100,000 fabrics: Add Redis cache
- 1M fabrics: Add search engine

But for now, with 1000 fabrics, keep it simple!

## Complete Implementation

### 1. Sync Script
```typescript
// scripts/sync-materials.ts
export async function syncMaterials() {
  const pg = new Client({ connectionString: process.env.ADMIN_DB_URL });
  await pg.connect();
  
  const { rows } = await pg.query('SELECT * FROM fabrics WHERE deleted_at IS NULL');
  
  const materials = rows.map(fabric => ({
    id: fabric.id,
    name: fabric.name,
    properties: fabric
  }));
  
  await materialsService.bulkUpsert(materials);
  await pg.end();
  
  console.log(`Synced ${materials.length} materials`);
}
```

### 2. API Endpoint
```typescript
// api/store/fabrics/route.ts
const cache = { data: null, time: 0 };

export async function GET(req, res) {
  // Refresh cache every 5 minutes
  if (!cache.data || Date.now() - cache.time > 300000) {
    cache.data = await materialsService.list();
    cache.time = Date.now();
  }
  
  // Return in expected format
  return res.json({
    fabrics: cache.data.map(m => ({
      ...m.properties,
      id: m.id,
      name: m.name
    }))
  });
}
```

That's it! No over-engineering needed for 1000 records.