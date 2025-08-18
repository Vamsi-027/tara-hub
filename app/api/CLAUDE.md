# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## API Directory Overview

This is the Next.js 15 API routes directory for Tara Hub, implementing a RESTful API architecture with authentication, bulk operations, and multi-version support.

## Development Commands

```bash
# Start development server (API routes available at localhost:3000/api)
npm run dev

# Run linting
npm run lint

# Database operations
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations  
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio GUI

# Build and test
npm run build            # Build with Turbo
npm run start            # Start production server
```

## API Architecture

### Route Structure
- **Standard routes**: `/api/{resource}` - Simple CRUD operations
- **Versioned routes**: `/api/v1/{resource}` - Advanced features with bulk operations
- **Nested resources**: `/api/{resource}/[id]` - Single resource operations
- **Special endpoints**: Test routes for debugging integrations

### Authentication Pattern
All protected routes follow this pattern:
```typescript
const session = await getServerSession(authOptions)
if (!session || (session.user as any)?.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Admin emails configured in `lib/auth.ts`:
- varaku@gmail.com
- batchu.kedareswaraabhinav@gmail.com
- vamsicheruku027@gmail.com
- admin@deepcrm.ai

### Response Patterns

**Standard Response**:
```typescript
// Success
NextResponse.json(data, { status: 200 })

// Error
NextResponse.json({ error: 'Error message' }, { status: 400 })
```

**V1 API Response** (structured):
```typescript
// Success
{
  success: true,
  data: {...},
  meta: {...},
  timestamp: "ISO-8601"
}

// Error
{
  success: false,
  error: {
    message: "...",
    details: {...}
  },
  timestamp: "ISO-8601"
}
```

## Key API Routes

### Public Endpoints
- `GET /api/fabrics` - Fabric catalog (with filtering)
- `GET /api/blog` - Published blog posts
- `GET /api/strategy` - Business strategy content

### Protected Endpoints (Admin Only)
- **Fabrics Management**:
  - `POST/PUT/DELETE /api/fabrics` - CRUD operations
  - `POST /api/v1/fabrics/bulk` - Bulk operations (create/update/delete/updateStock/updatePricing)
  
- **Content Management**:
  - `/api/blog/[id]` - Blog post CRUD
  - `/api/posts/[id]` - Social media posts
  - `/api/products` - Product management
  - `/api/etsy-products` - Etsy integration

- **Team Management**:
  - `/api/team` - Team members CRUD
  - `/api/team/invite` - Send invitations

### Test/Debug Endpoints
- `/api/test-kv` - Vercel KV connectivity
- `/api/test-r2*` - Cloudflare R2 storage tests
- `/api/test-email*` - Email configuration tests
- `/api/seed` - Database seeding

## Data Persistence Strategy

### Dual Storage System
1. **Drizzle ORM (PostgreSQL)**: User sessions, auth data
2. **Vercel KV (Redis)**: Content caching with in-memory fallback

### Initialization Pattern
```typescript
// Lazy initialization for seed data
let initialized = false
if (!initialized) {
  await initializeFabrics()
  initialized = true
}
```

### ISR Revalidation
After mutations, trigger revalidation:
```typescript
revalidatePath('/fabrics')
revalidatePath(`/fabric/[id]`, 'page')
revalidateTag('fabrics')
```

## Bulk Operations (V1 API)

The `/api/v1/fabrics/bulk` endpoint supports:
- **create**: Batch create up to 100 items
- **update**: Batch update with partial data
- **delete**: Batch delete by IDs
- **updateStock**: Inventory management (add/remove/set)
- **updatePricing**: Batch price updates

Permission hierarchy:
- `create/update`: editor, admin, tenant_admin, platform_admin
- `delete`: admin, tenant_admin, platform_admin

Multi-status responses (207) for partial success operations.

## Service Layer Integration

API routes use service layer from `lib/services/`:
- `fabric.service.ts` - Fabric business logic
- Other services follow similar patterns

## Error Handling

Consistent error handling across all routes:
```typescript
try {
  // Operation logic
} catch (error) {
  console.error(`${method} ${path} error:`, error)
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    )
  }
  
  return NextResponse.json(
    { error: error.message || 'Operation failed' },
    { status: 500 }
  )
}
```

## CORS Configuration

V1 endpoints include OPTIONS handlers:
```typescript
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

## Testing API Routes

```bash
# Test public endpoint
curl http://localhost:3000/api/fabrics

# Test authenticated endpoint (requires session)
curl -H "Cookie: next-auth.session-token=..." \
     http://localhost:3000/api/fabrics \
     -X POST \
     -d '{"name":"Test","category":"cotton","color":"blue"}'

# Test bulk operations
curl http://localhost:3000/api/v1/fabrics/bulk \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"operation":"create","items":[...]}'
```

## Environment Dependencies

Required environment variables:
- `NEXTAUTH_SECRET` - Auth encryption
- `GOOGLE_CLIENT_ID/SECRET` - OAuth provider
- `DATABASE_URL` - PostgreSQL connection
- `KV_REST_API_URL/TOKEN` - Vercel KV (optional)
- `R2_*` - Cloudflare R2 storage credentials