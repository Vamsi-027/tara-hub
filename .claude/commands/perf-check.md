---
description: Performance monitoring and bottleneck analysis
argument-hint: [component]
allowed-tools: Bash, Read, Grep
---

# Performance Check

Analyze performance for: ${1:-all}

## Performance Targets:

### Frontend (Core Web Vitals)
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Backend (API Response)
- **P50**: < 200ms
- **P95**: < 500ms
- **P99**: < 1000ms

### Database
- **Query time**: < 50ms (P95 < 200ms)
- **Connection pool**: < 80% utilization
- **No deadlocks**

## Performance Analysis:

### 1. Frontend Performance
```bash
# Build analysis
npm run build
npx next-bundle-analyzer

# Lighthouse audit
npx lighthouse https://tara-hub.vercel.app --view
```

Check for:
- Large bundle sizes
- Unoptimized images
- Blocking resources
- Layout shifts

### 2. API Performance
```bash
# Request timing
curl -w "@curl-format.txt" -o /dev/null -s https://api.tara-hub.com/health

# Load testing
npm run test:load
```

### 3. Database Performance
```sql
-- Active queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;

-- Table bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Optimization Recommendations:

### High Priority
1. Slow queries (> 500ms)
2. Large bundle sizes (> 500KB)
3. Missing database indexes
4. High error rates (> 1%)

### Medium Priority
5. Unoptimized images
6. Unused dependencies
7. Cache miss rates
8. Connection pool tuning

### Low Priority
9. Minor layout shifts
10. Non-critical asset optimization

Use performance-monitoring-specialist agent for detailed analysis.