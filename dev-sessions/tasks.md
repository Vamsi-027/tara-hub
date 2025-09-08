# Implementation Tasks - Simplified for 1000 Fabrics

## Phase 1: Materials Module Setup ✅
- [x] Create simple materials model (id, name, properties)
- [x] Create materials service extending MedusaService
- [x] Create materials module index file
- [x] Add materials module to medusa-config.ts

## Phase 2: Simple Bulk Sync (1 Hour)
- [ ] Create bulk sync script (50 lines)
- [ ] Implement simple UPSERT for all 1000 records
- [ ] Add sync API endpoint `/api/admin/sync-materials`
- [ ] Test sync (<1 second for 1000 records)

## Phase 3: Minimal Database Setup (30 mins)
- [ ] Add single GIN index for JSON properties
- [ ] Verify query performance (<10ms)

## Phase 4: In-Memory Caching (30 mins)
- [ ] Implement in-memory cache (1-2MB)
- [ ] Set 5-minute cache refresh
- [ ] Test cache performance

## Phase 5: API Compatibility (1 Hour)
- [ ] Update `/api/store/fabrics/` to use materials cache
- [ ] Update `/api/store/fabrics/[id]/` to use materials
- [ ] Ensure response format matches frontend
- [ ] Test with fabric-store (<20ms response)

## Phase 6: Fix Fabric-Products References (1 Hour)
- [ ] Update migrations to reference materials table
- [ ] Change `fabric_id` to `material_id`
- [ ] Update service to use materials module
- [ ] Test configurable products

## Phase 7: Quick Cleanup (30 mins)
- [ ] Remove fabric-details module
- [ ] Update medusa-config.ts
- [ ] Deploy and monitor (1 hour)

## Dropped (Not Needed for 1000 Records)
- ~~Complex indexes~~ → Single GIN index sufficient
- ~~Redis cache~~ → In-memory is fine (1-2MB)
- ~~Materialized views~~ → Direct queries fast enough
- ~~Pagination~~ → Frontend handles 1000 items
- ~~A/B testing~~ → Low risk, direct switch
- ~~4-week migration~~ → 1-2 day implementation
- ~~Product-Material Links~~ → Keep it simple for now
- ~~Complex workflows~~ → Direct implementation

## Current Status
- ✅ Materials module created
- 🔄 Starting bulk sync implementation
- ⏳ Total time: 1-2 days (not 4 weeks!)

## Simplified Targets
- Sync time: <1 second
- Query time: <10ms  
- API response: <20ms
- Memory: ~1-2MB
- Total code: ~200 lines