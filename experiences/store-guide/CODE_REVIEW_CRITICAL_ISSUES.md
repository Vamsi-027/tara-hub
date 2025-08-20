# Critical Code Review - Store Guide Experience

## 🔴 CRITICAL ISSUES (Must Fix Immediately)

### 1. **Missing Component Files**
- **Issue**: Core components referenced but don't exist
  - `@/components/fabrics-listing-page` - NOT FOUND
  - `@/components/fabric-detail-page` - NOT FOUND  
  - `@/components/header` - NOT FOUND
  - `@/components/footer` - NOT FOUND
  - `@/lib/fabric-seed-data` - NOT FOUND
- **Impact**: Application will crash with module not found errors
- **Fix**: Create these components or update imports to use shared components

### 2. **Broken Data Integration**
- **Issue**: `fabric/[id]/page.tsx` uses static seed data instead of API
  ```typescript
  const fabric = fabricSeedData.find(f => f.id === params.id) // Wrong!
  ```
- **Impact**: Won't display real data from admin app
- **Fix**: Fetch from API using the apiClient

### 3. **No Error Boundaries**
- **Issue**: No error handling for component failures
- **Impact**: Entire app crashes on any component error
- **Fix**: Add error.tsx files and proper error boundaries

### 4. **CORS Issues**
- **Issue**: API client makes cross-origin requests (3007 → 3000)
- **Impact**: Browser will block requests without proper CORS headers
- **Fix**: Configure CORS in admin API or use Next.js API routes as proxy

## 🟠 HIGH PRIORITY ISSUES

### 5. **Type Safety Problems**
- **Issue**: Using `any` types and missing type definitions
  - `formData: any` in fabric-form-tabs
  - No proper Fabric type imports in components
- **Impact**: Runtime errors, no IntelliSense, maintenance nightmare
- **Fix**: Use proper TypeScript types from schema

### 6. **Client-Side Only Architecture**
- **Issue**: "use client" on pages that should be server components
  ```typescript
  "use client" // fabrics/page.tsx shouldn't be client-only
  ```
- **Impact**: Poor SEO, slow initial load, no SSR benefits
- **Fix**: Make pages server components, move interactivity to child components

### 7. **API Client Security Issues**
- **Issue**: No authentication headers in API requests
- **Impact**: Can't access protected endpoints
- **Fix**: Add auth token handling or use public endpoints

### 8. **Missing Loading States**
- **Issue**: Minimal loading UI (`<div>Loading...</div>`)
- **Impact**: Poor UX, no skeleton screens
- **Fix**: Implement proper loading components

## 🟡 MEDIUM PRIORITY ISSUES

### 9. **Performance Problems**
- **Issue**: No pagination in fabric listing
- **Impact**: Loading ALL fabrics at once will crash with large datasets
- **Fix**: Implement pagination or infinite scroll

### 10. **Cache Strategy Missing**
- **Issue**: `cache: 'no-store'` in API client
- **Impact**: Unnecessary API calls, poor performance
- **Fix**: Implement proper caching strategy

### 11. **No Data Validation**
- **Issue**: No validation of API responses
- **Impact**: Runtime errors with malformed data
- **Fix**: Use Zod schemas to validate API responses

### 12. **Accessibility Issues**
- **Issue**: Missing ARIA labels, keyboard navigation
- **Impact**: Not accessible to screen readers
- **Fix**: Add proper ARIA attributes and keyboard support

## 🟢 CODE QUALITY ISSUES

### 13. **Inconsistent Error Handling**
- **Issue**: Some places throw, others console.error
- **Impact**: Inconsistent error behavior
- **Fix**: Standardize error handling approach

### 14. **No Environment Configuration**
- **Issue**: Hardcoded URLs and ports
- **Impact**: Won't work in production
- **Fix**: Use environment variables

### 15. **Missing Tests**
- **Issue**: No test files found
- **Impact**: No confidence in changes
- **Fix**: Add unit and integration tests

## RECOMMENDED FIXES (Priority Order)

### Immediate (Block Testing):
```typescript
// 1. Create missing components
// experiences/store-guide/components/fabrics-listing-page.tsx
export function FabricsListingPage() {
  // Implement with API integration
}

// 2. Fix data fetching
// experiences/store-guide/app/fabric/[id]/page.tsx
import { apiClient } from '@/lib/api-client'

export default async function FabricPage({ params }: FabricPageProps) {
  const fabric = await apiClient.fetchFabricById(params.id)
  if (!fabric) notFound()
  return <FabricDetailPage fabric={fabric} />
}

// 3. Add CORS handling
// app/api/fabrics/route.ts (admin)
headers.set('Access-Control-Allow-Origin', 'http://localhost:3007')
```

### High Priority:
```typescript
// 4. Fix type safety
import { Fabric } from '@/shared/lib/db/schema/fabrics.schema'
interface Props {
  fabric: Fabric // Not any!
}

// 5. Server components for pages
// Remove "use client" from page components
// Move client logic to child components

// 6. Add error boundaries
// app/error.tsx
'use client'
export default function Error({ error, reset }) {
  return <ErrorUI error={error} onReset={reset} />
}
```

### Medium Priority:
```typescript
// 7. Add pagination
const { fabrics, page, totalPages } = await apiClient.fetchFabrics({
  page: searchParams.page || 1,
  limit: 20
})

// 8. Implement caching
fetch(url, {
  next: { revalidate: 60 } // ISR caching
})

// 9. Add loading skeletons
<Suspense fallback={<FabricGridSkeleton />}>
```

## Summary

The codebase has **15+ critical to high-priority issues** that need immediate attention. The most critical are:
1. Missing component files (app won't run)
2. Broken data integration (using seed data instead of API)
3. No error handling (app crashes easily)
4. CORS issues (API calls will fail)

The application is currently **NOT production-ready** and has significant architectural issues that need to be addressed before it can be reliably used.