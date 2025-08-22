# Tara Hub - Architecture Steering Context

**Last Updated**: 2025-08-21
**Architecture State**: TRANSITIONING - Flat to Module-based

## Actual Architecture Overview

```
tara-hub/
├── app/                      # Main Next.js app (admin dashboard)
│   ├── admin/               # Admin routes (authenticated)
│   ├── api/                 # API routes
│   └── auth/                # Authentication pages
├── experiences/             # Monorepo workspace apps
│   ├── fabric-store/        # Customer sample ordering (port 3006)
│   └── store-guide/         # Marketing showcase (port 3007)
├── src/                     # NEW module-based structure
│   ├── modules/             # Feature modules
│   │   ├── fabrics/        # Fabric management
│   │   ├── auth/           # Authentication
│   │   ├── blog/           # Blog content
│   │   ├── products/       # Product management
│   │   └── admin/          # Admin features
│   ├── core/               # Infrastructure
│   │   ├── database/       # Drizzle ORM setup
│   │   ├── cache/          # KV/Redis caching
│   │   ├── storage/        # Cloudflare R2
│   │   └── email/          # Resend service
│   └── shared/             # Shared resources
│       ├── components/ui/   # shadcn/ui components
│       ├── hooks/          # React hooks
│       ├── utils/          # Utilities
│       └── types/          # TypeScript types
├── packages/               # LEGACY shared packages (being migrated)
├── api-service/            # Express backend (Railway)
├── lib/                    # LEGACY - old structure (being migrated)
├── components/             # LEGACY - old components (being migrated)
└── drizzle/               # Database migrations
```

## Module Architecture (NEW - In Transition)

### Feature Modules (`src/modules/`)
Each module is self-contained with:
```
fabrics/
├── components/      # UI components
├── hooks/          # Custom hooks
├── services/       # Business logic
├── repositories/   # Data access
├── schemas/        # Validation schemas
└── data/          # Static/seed data
```

### Core Services (`src/core/`)
Infrastructure services used across modules:
- **database/**: PostgreSQL connection, Drizzle client
- **cache/**: Multi-strategy caching (KV, memory, Redis)
- **storage/**: Cloudflare R2 for file uploads
- **email/**: Resend API integration

### Shared Resources (`src/shared/`)
Cross-cutting concerns:
- **components/ui/**: shadcn/ui component library
- **hooks/**: Common React hooks (useAuth, useApi, etc.)
- **utils/**: Helper functions and utilities
- **types/**: Shared TypeScript definitions

## API Architecture Layers

### 1. Legacy API (`/api/fabrics/`)
- Simple KV-based storage
- Used by experience apps
- Basic fabric data only
- Public read access

### 2. Admin API (`/api/v1/fabrics/`)
- Full PostgreSQL with Drizzle ORM
- Comprehensive CRUD operations
- Authentication required
- 60+ field fabric schema

### 3. Backend Service (`api-service/`)
- Express.js on Railway
- Placeholder for heavy operations
- Currently minimal implementation
- Future: bulk imports, webhooks

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser       │     │   Next.js       │     │   Database      │
│                 │────▶│   App Router    │────▶│   PostgreSQL    │
│                 │     │                 │     │   (Neon)        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │                        │
                                 ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Vercel KV     │     │   Drizzle ORM   │
                        │   (Cache)       │     │                 │
                        └─────────────────┘     └─────────────────┘
```

## Authentication Architecture

### Current Implementation (Custom)
```typescript
// Magic Link Flow
1. User enters email → POST /api/auth/signin
2. Generate JWT token with 15min expiry
3. Send magic link via Resend
4. User clicks link → GET /api/auth/verify
5. Verify token & create 30-day session
6. Set HTTP-only cookie with session JWT
```

### Middleware Protection
- Custom middleware.ts using JWT verification
- Role-based access control (admin whitelist)
- Protected routes: /admin/*, /api/v1/*

## Database Architecture

### Schema Design (Drizzle ORM)
```typescript
// Main tables (verified to exist)
- users          // User accounts
- sessions       // Active sessions  
- fabrics        // 60+ field comprehensive schema
- fabricImages   // Image associations
- blogPosts      // Content management
- products       // Product catalog
- etsyProducts   // Etsy integration
```

### Fabric Schema Highlights
- Comprehensive inventory tracking
- Price history and stock movements
- Performance ratings and certifications
- Full-text search indexes
- Audit fields (created/updated)

## Caching Strategy

### Multi-Layer Caching
1. **Vercel KV** (Production)
   - Redis-based persistent cache
   - Fabric catalog caching
   - 60-second TTL for ISR

2. **In-Memory** (Development)
   - Fallback when KV unavailable
   - Simple Map-based cache
   - Auto-cleanup on TTL

3. **Static Data** (Fallback)
   - Seed data for demos
   - Development testing
   - Initial catalog data

## Component Architecture

### Server Components (Default)
- All pages are RSC by default
- Data fetching at component level
- Streaming and suspense enabled

### Client Components
- Explicitly marked with 'use client'
- Form interactions
- Dynamic UI updates
- Auth-aware components

### UI Component Library
- Built on Radix UI primitives
- Styled with Tailwind CSS
- Consistent design system
- Accessible by default

## Build & Deployment Architecture

### Monorepo with Turborepo
```json
// Parallel task execution
"pipeline": {
  "build": { "dependsOn": ["^build"] },
  "dev": { "cache": false },
  "lint": {},
  "type-check": {}
}
```

### Deployment Strategy
- **Vercel**: All Next.js apps
- **Railway**: Backend API service
- **Neon**: PostgreSQL database
- **Cloudflare**: R2 storage

## Performance Optimizations

### Implemented
- ISR with 60-second revalidation
- KV caching for fabric data
- Image optimization via Next.js
- Lazy loading for client components

### Not Implemented (But Claimed)
- Edge functions
- Multi-region deployment
- WebSocket connections
- Real-time updates

## Security Architecture

### Implemented
- JWT-based authentication
- HTTP-only secure cookies
- Admin email whitelist
- Environment variable validation
- CORS configuration

### Not Implemented (But Documented)
- Row-level security
- Multi-factor authentication
- API rate limiting (basic only)
- SIEM integration

## Migration Status

### Completed
- 165 import paths migrated
- Core module structure created
- New path aliases configured
- Dual import support enabled

### In Progress
- Moving remaining components
- Updating import paths
- Consolidating duplicate code
- Test coverage migration

### Not Started
- Removing legacy directories
- Full TypeScript strict mode
- Comprehensive testing
- Documentation updates