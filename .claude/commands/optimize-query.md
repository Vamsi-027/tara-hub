---
description: Analyze and optimize database query performance
argument-hint: [query-or-file]
allowed-tools: Bash, Read, Grep
---

# Database Query Optimization

Analyze and optimize query: $ARGUMENTS

## Query Analysis Steps:

### 1. Explain Plan Analysis
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
[YOUR QUERY HERE]
```

Check for:
- Sequential scans on large tables
- Missing indexes
- Nested loop joins on large datasets
- High planning/execution time ratio

### 2. Index Strategy
```sql
-- Check existing indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### 3. Query Statistics
```sql
-- Slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;
```

## Optimization Techniques:

1. **Add Indexes**:
   - B-tree for equality/range queries
   - GIN for JSONB columns
   - Partial indexes for filtered queries

2. **Query Rewrite**:
   - Use JOINs instead of subqueries
   - Limit result sets early
   - Avoid SELECT *

3. **Connection Pooling**:
   - Check pool size and usage
   - Monitor connection wait times

4. **Caching**:
   - Add Redis caching for hot queries
   - Use materialized views for complex aggregations

## Validation:
- Compare before/after execution times
- Monitor production query performance
- Set up alerts for slow queries

Use database-migration-expert agent for complex optimization.