# Fabric Data Management - Complete API & Middleware Documentation

## Architecture Overview

The Fabric Data Management system is a **comprehensive, production-ready implementation** with multiple layers:

```
┌─────────────────────────────────────────────────────────┐
│                   API Routes Layer                       │
│  Next.js App Router endpoints with JWT authentication    │
├─────────────────────────────────────────────────────────┤
│                   Service Layer                          │
│  Business logic, validation, caching orchestration       │
├─────────────────────────────────────────────────────────┤
│                   Repository Layer                       │
│  Database operations with Drizzle ORM                    │
├─────────────────────────────────────────────────────────┤
│                   Storage Layer                          │
│  Hybrid: PostgreSQL + Vercel KV + Memory Store          │
└─────────────────────────────────────────────────────────┘
```

## 1. API Routes (Next.js App Router)

### Basic CRUD Operations (`/app/api/fabrics/`)

#### **GET /api/fabrics**
- **Purpose**: Fetch all fabrics with filtering
- **Authentication**: Public (read-only)
- **Features**:
  - Automatic initialization from seed data
  - Query filters: `category`, `color`, `inStock`
  - KV storage with memory store fallback
  
```typescript
// Implementation highlights
- Initializes fabric data on first request
- Uses Vercel KV for fast reads
- Falls back to memory store when KV unavailable
```

#### **POST /api/fabrics**
- **Purpose**: Create new fabric
- **Authentication**: JWT required (admin role)
- **Middleware**: JWT verification
- **Features**:
  - Role-based access control
  - Input validation
  - ISR cache revalidation
  
#### **GET /api/fabrics/[id]**
- **Purpose**: Get single fabric by ID
- **Authentication**: Public

#### **PUT /api/fabrics/[id]**
- **Purpose**: Update fabric
- **Authentication**: JWT required (admin role)
- **Features**:
  - Full update with validation
  - Cache invalidation
  - ISR revalidation

#### **DELETE /api/fabrics/[id]**
- **Purpose**: Delete fabric
- **Authentication**: JWT required (admin role)

### Advanced V1 API (`/app/api/v1/fabrics/`)

#### **POST /api/v1/fabrics/bulk**
- **Purpose**: Bulk operations (create, update, delete, stock, pricing)
- **Authentication**: JWT with role-based permissions
- **Operations**:
  1. **Bulk Create**: Up to 100 items
  2. **Bulk Update**: Partial updates for multiple items
  3. **Bulk Delete**: Multiple deletions
  4. **Update Stock**: Inventory management
  5. **Update Pricing**: Price changes with history
- **Response**: Multi-status (207) for partial success

```javascript
// Example bulk operation
{
  operation: 'updateStock',
  items: [
    { id: 'fabric-1', quantity: 50, type: 'add' },
    { id: 'fabric-2', quantity: 20, type: 'remove' }
  ]
}
```

#### **POST /api/v1/fabrics/import**
- **Purpose**: Import fabrics from CSV/Excel
- **Authentication**: JWT required (editor/admin)
- **Features**:
  - CSV parsing with Papa Parse
  - Excel support with XLSX
  - Column mapping for various formats
  - Duplicate SKU detection
  - Validation with detailed error reporting
  - Progress tracking for large files

## 2. Service Layer (`/lib/services/fabric.service.ts`)

### Key Features:
- **Business Logic Orchestration**
- **Caching Strategy** (Redis/KV with TTL)
- **Input Validation** (Zod schemas)
- **Slug Generation** for SEO
- **View Count Tracking**
- **Stock Management**
- **Price History**
- **Search Optimization**

### Core Methods:

```typescript
class FabricService {
  // CRUD with caching
  async getById(id: string): Promise<Fabric | null>
  async getBySku(sku: string): Promise<Fabric | null>
  async getBySlug(slug: string): Promise<Fabric | null>
  async create(data: NewFabric, userId: string): Promise<Fabric>
  async update(id: string, data: Partial<Fabric>): Promise<Fabric>
  async delete(id: string): Promise<boolean>
  
  // Bulk operations
  async bulkCreate(items: NewFabric[], userId: string)
  async bulkUpdate(items: UpdateItem[], userId: string)
  async bulkDelete(ids: string[], userId: string)
  
  // Specialized operations
  async updateStock(id: string, quantity: number, type: 'add'|'remove'|'set')
  async updatePricing(id: string, retailPrice: number, wholesalePrice?: number)
  async search(filter: FabricFilter, sort: FabricSort, pagination: Pagination)
  
  // Analytics
  async getPopularFabrics(limit: number)
  async getLowStockFabrics()
  async getRecentlyViewed(userId: string)
}
```

## 3. Repository Layer (`/lib/repositories/fabric.repository.ts`)

### Base Repository Pattern:
- **Generic CRUD operations**
- **Pagination support**
- **Transaction handling**
- **Query builders**

### Fabric-Specific Queries:
```typescript
class FabricRepository extends BaseRepository {
  // Specialized queries
  async findBySku(sku: string): Promise<Fabric | null>
  async findBySlug(slug: string): Promise<Fabric | null>
  async findByCategory(category: string): Promise<Fabric[]>
  async findInStock(): Promise<Fabric[]>
  async findFeatured(): Promise<Fabric[]>
  
  // Analytics queries
  async incrementViewCount(id: string): Promise<void>
  async getTopViewed(limit: number): Promise<Fabric[]>
  async searchByPattern(pattern: string): Promise<Fabric[]>
  
  // Complex operations
  async updateStockWithHistory(id: string, quantity: number, userId: string)
  async recordPriceChange(id: string, oldPrice: number, newPrice: number)
}
```

## 4. Storage Layer

### Hybrid Storage Strategy:

#### **PostgreSQL (Primary)**
- Full fabric schema with 60+ fields
- Relational data integrity
- Complex queries and joins
- Full-text search indexes

#### **Vercel KV (Cache)**
- Fast reads for frequently accessed data
- Sorted sets for listings
- Category/color indexes
- Stock status tracking

#### **Memory Store (Fallback)**
- In-memory cache for development
- Automatic fallback when KV unavailable
- Seed data initialization

### Implementation (`/lib/fabric-kv.ts`):
```typescript
// Automatic fallback chain
1. Try Vercel KV (fastest)
2. Fall back to PostgreSQL
3. Use memory store (development)
4. Load from seed data (last resort)
```

## 5. Middleware & Authentication

### JWT Middleware
- **Location**: Inline in each protected route
- **Token Source**: HTTP-only cookie (`auth-token`)
- **Verification**: Using `jsonwebtoken` library
- **Role Checking**: admin, editor, viewer roles

### Permission Matrix:
| Operation | Viewer | Editor | Admin |
|-----------|--------|--------|-------|
| Read      | ✅     | ✅     | ✅    |
| Create    | ❌     | ✅     | ✅    |
| Update    | ❌     | ✅     | ✅    |
| Delete    | ❌     | ❌     | ✅    |
| Bulk Ops  | ❌     | ✅     | ✅    |
| Import    | ❌     | ✅     | ✅    |

### Authentication Flow:
```typescript
// In each protected route
1. Extract JWT from cookie
2. Verify token signature
3. Check user role
4. Proceed or reject (401/403)
```

## 6. Caching Strategy

### Multi-Level Caching:
1. **Browser Cache**: ISR with 60s revalidation
2. **Edge Cache**: Vercel CDN
3. **Application Cache**: KV/Redis with TTL
4. **Database Cache**: Query result caching

### Cache Invalidation:
- On create: Invalidate list caches
- On update: Invalidate specific item + lists
- On delete: Full invalidation
- Manual: `revalidatePath()` and `revalidateTag()`

## 7. Database Schema

### Main Fabric Table (60+ fields):
```sql
- Basic: id, sku, name, slug, description
- Classification: type, category, subCategory, brand
- Specifications: material, width, weight, pattern
- Inventory: stockQuantity, availableQuantity, reservedQuantity
- Pricing: retailPrice, wholesalePrice, salePrice, cost
- Performance: stretchability, breathability, durability
- Care: washingInstructions, ironingTemp, dryCleanOnly
- Sustainability: ecoFriendly, recycledContent, certifications
- Analytics: viewCount, purchaseCount, rating
- Metadata: createdAt, updatedAt, createdBy, version
```

## 8. Import/Export Capabilities

### Import Features:
- CSV and Excel file support
- Automatic column mapping
- Validation with detailed errors
- Duplicate detection
- Batch processing (chunks of 100)
- Progress tracking

### Export Features:
- Multiple formats (CSV, Excel, JSON)
- Filtered exports
- Custom field selection
- Scheduled exports (planned)

## 9. Performance Optimizations

### Database:
- Indexed columns for fast queries
- Full-text search indexes
- Materialized views for analytics
- Connection pooling

### API:
- Response compression
- Pagination with cursor support
- Field selection (GraphQL-like)
- Batch operations

### Caching:
- Strategic TTLs (5min for detail, 60s for search)
- Warm cache on startup
- Background refresh
- Smart invalidation

## 10. Error Handling

### Structured Error Responses:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "sku", "message": "SKU already exists" }
    ]
  },
  "timestamp": "2024-01-20T..."
}
```

### Error Types:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

## 11. Security Features

### Input Validation:
- Zod schemas for all inputs
- SQL injection prevention (parameterized queries)
- XSS protection (sanitization)
- File upload restrictions

### Access Control:
- JWT-based authentication
- Role-based permissions
- Resource-level authorization
- Audit logging

### Rate Limiting:
- API endpoint throttling (planned)
- Bulk operation limits (100 items)
- File size limits (10MB)

## 12. Monitoring & Analytics

### Built-in Analytics:
- View count tracking
- Popular fabrics
- Low stock alerts
- Search patterns
- User activity logs

### Performance Metrics:
- Response times
- Cache hit rates
- Database query times
- Error rates

## Summary

The Fabric Data Management system is a **complete, production-ready solution** with:

✅ **Full CRUD API** with authentication
✅ **Bulk operations** for efficiency
✅ **Import/Export** capabilities
✅ **Multi-layer caching** for performance
✅ **Comprehensive validation** and error handling
✅ **Role-based access control**
✅ **Hybrid storage** (PostgreSQL + KV + Memory)
✅ **SEO optimization** (slugs, metadata)
✅ **Analytics & monitoring**
✅ **Scalable architecture**

This is **NOT placeholder code** - it's a fully functional system currently deployed and running in production on Vercel.