---
description: Execute database migration with safety checks and rollback plan
argument-hint: [migration-name] [--rollback]
allowed-tools: Bash, Read, Grep
---

# Database Migration

Execute database migration: $1 ${2}

## Pre-Migration Checklist:

### 1. Backup & Safety
- [ ] Database backup created
- [ ] Migration tested on staging
- [ ] Rollback procedure documented
- [ ] Maintenance window scheduled

### 2. Review Migration
```bash
# Show pending migrations
cd medusa && npx mikro-orm migration:pending

# Check migration content
cat medusa/src/migrations/$1.ts
```

### 3. Impact Analysis
- [ ] Locking behavior analyzed
- [ ] Estimated duration calculated
- [ ] Dependent services identified
- [ ] Downtime requirements confirmed

## Migration Execution:

### Run Migration
```bash
cd medusa && npx mikro-orm migration:up
```

### Monitor Progress
```sql
-- Check for blocking queries
SELECT pid, usename, state, query, now() - query_start AS duration
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Check table locks
SELECT relation::regclass, mode, granted
FROM pg_locks
WHERE locktype = 'relation';
```

## Rollback Procedure:

If migration fails or issues detected:

```bash
cd medusa && npx mikro-orm migration:down
```

## Post-Migration Validation:

1. **Data Integrity**:
   ```sql
   -- Verify row counts
   SELECT COUNT(*) FROM [affected_table];

   -- Check constraints
   SELECT conname, contype FROM pg_constraint WHERE conrelid = '[table]'::regclass;
   ```

2. **Performance Check**:
   ```bash
   npm run perf-check database
   ```

3. **Application Health**:
   ```bash
   curl https://[domain]/health
   ```

## Batch Migration Pattern:

For large data migrations:
```typescript
const batchSize = 1000;
let offset = 0;

while (true) {
  const records = await em.find(Entity, {}, { limit: batchSize, offset });
  if (records.length === 0) break;

  // Process batch
  await processBatch(records);

  offset += batchSize;
  await sleep(100); // Rate limiting
}
```

Use database-migration-expert agent for complex migrations.