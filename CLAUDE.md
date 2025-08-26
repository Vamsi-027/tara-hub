# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tara Hub - A Next.js 15 fabric marketplace platform built with Turbo monorepo architecture, featuring admin dashboard, email-based authentication with magic links, and hybrid data persistence using PostgreSQL + Redis.

**Current State**: The codebase is in a transition period from a flat structure to a module-based architecture. Both old paths (lib/, components/) and new paths (src/modules/, src/shared/) coexist temporarily.

## Development Commands

```bash
# Install dependencies
npm install

# Development (Monorepo with Turbo)
npm run dev               # Start all apps in parallel
npm run dev:admin         # Start admin app only (port 3000)
npm run dev:all           # Explicit parallel start for all apps

# Individual experience apps
cd experiences/fabric-store && npm run dev    # Port 3006
cd experiences/store-guide && npm run dev     # Port 3007

# Build
npm run build             # Build all apps with Turbo
npm run build:admin       # Build admin app only
npm run build:all         # Build all apps explicitly

# Database (Drizzle ORM)
npm run db:generate       # Generate Drizzle migrations from schema
npm run db:migrate        # Apply pending migrations
npm run db:push           # Push schema changes directly (dev)
npm run db:studio         # Open Drizzle Studio GUI

# Code Quality
npm run lint              # ESLint via Turbo across all packages
npm run type-check        # TypeScript checking (if configured)

# Testing (Vitest)
npm run test              # Run Vitest tests
npm run test:unit         # Unit tests with coverage
npm run test:watch        # Watch mode for development
npm run test:ui           # Vitest UI interface

# Deployment (Vercel)
npm run deploy            # Deploy all apps
npm run deploy:prod       # Production deployment with parallel builds
npm run deploy:admin      # Deploy admin app only
npm run deploy:experiences # Deploy experience apps only
npm run deploy:quick      # Quick deployment script

# Environment Variables Management
npm run env:manage        # Interactive environment variable management
npm run env:generate      # Generate env configuration
npm run env:push          # Push env vars to Vercel
npm run env:pull          # Pull env vars from Vercel
npm run env:validate      # Validate environment configuration
npm run vercel:env        # Pull .env.local from Vercel
```

## High-Level Architecture

### Module-Based Structure (NEW)
```
src/
├── modules/                    # Feature modules
│   ├── fabrics/                # Fabric management
│   ├── auth/                   # Authentication & authorization
│   ├── blog/                   # Blog & content
│   ├── products/               # Product management
│   └── admin/                  # Admin features
├── core/                       # Core infrastructure
│   ├── database/               # Drizzle ORM & PostgreSQL
│   ├── cache/                  # Caching strategies (KV/Redis)
│   ├── storage/                # Cloudflare R2
│   └── email/                  # Resend email service
└── shared/                     # Shared resources
    ├── components/ui/          # shadcn/ui components
    ├── hooks/                  # Shared React hooks
    ├── utils/                  # Utilities
    └── types/                  # Shared TypeScript types
```

### Monorepo Structure (Turbo)
- **Root App**: Admin dashboard at `/app/` (main auth and management)
- **experiences/fabric-store**: Customer-facing fabric browsing (port 3006)
- **experiences/store-guide**: Store guide application (port 3007)  
- **packages/**: Legacy shared libraries (being migrated to src/shared)
- **api-service/**: Railway-deployed backend service for heavy operations
- **Workspace orchestration**: Turbo with parallel builds and dev servers

### Core Technology Stack
- **Framework**: Next.js 15 with App Router and React 19
- **Monorepo**: Turbo for build orchestration and workspace management
- **Database**: Drizzle ORM with PostgreSQL (Neon) + Vercel KV (Redis) for caching
- **Authentication**: Custom email-based magic link system with JWT (replaced NextAuth)
- **UI**: Radix UI primitives + shadcn/ui components + Tailwind CSS
- **Storage**: Cloudflare R2 for image uploads and asset management
- **Email**: Resend API for magic link delivery and notifications
- **Deployment**: 
  - Vercel for Next.js apps (admin, experiences)
  - Railway for backend API service (heavy operations)
- **Background Jobs**: Bull/BullMQ (planned) for async processing

### Authentication Architecture

**Custom Magic Link System** (replaces NextAuth due to Jest worker conflicts):
- Email-based passwordless authentication using Resend API
- JWT tokens with HTTP-only cookies (30-day expiry)
- Admin whitelist enforcement in auth service
- Custom middleware for route protection
- Backward compatibility with legacy database schema
- Migration from NextAuth due to Jest worker thread incompatibility

**Key Authentication Files** (Updated Paths):
- `src/modules/auth/services/auth.service.ts` - Main authentication service
- `src/modules/auth/utils/token.utils.ts` - Token generation and verification
- `src/modules/auth/middleware/auth.middleware.ts` - Route protection
- `src/core/email/resend.service.ts` - Professional HTML email templates
- `app/api/auth/signin/route.ts` - Magic link generation endpoint
- `app/api/auth/verify/route.ts` - Token verification and session creation
- `middleware.ts` - Custom JWT-based route protection
- `src/modules/auth/components/magic-link-form.tsx` - Client-side auth UI
- `src/modules/auth/schemas/legacy-auth.schema.ts` - NextAuth compatibility

Note: NextAuth dependency still exists in package.json but is not actively used.

### Data Persistence Strategy

**Hybrid Architecture**:
- **PostgreSQL** (Drizzle ORM): User accounts, sessions, relational data
- **Vercel KV** (Redis): Content caching, fabric catalog, performance optimization
- **In-memory fallback**: Development mode when KV unavailable
- **Static seed data**: `src/modules/fabrics/data/seed-data.ts` for initial fabric catalog

**Database Schema** (`src/modules/fabrics/schemas/fabric.schema.ts`):
- Comprehensive fabric schema with 60+ fields including inventory, performance ratings, certifications
- Full-text search with PostgreSQL GIN indexes
- Audit trails, price history, stock movement tracking
- Zod validation schemas for type safety

### API Architecture

**Three-Layer API Design**:

1. **Legacy API (`/api/fabrics/`)**: Simple KV-store based for experience apps
2. **Admin API (`/api/v1/fabrics/`)**: Full PostgreSQL + Drizzle ORM for admin
3. **Railway Backend (`api-service/`)**: Heavy operations, bulk imports, async jobs

**RESTful Design** in `app/api/`:
- **Public routes**: Fabric catalog, blog posts (GET only)
- **Admin-protected routes**: All CUD operations require authentication
- **Bulk operations**: `/api/v1/fabrics/bulk` for mass import/export
- **ISR integration**: 60-second revalidation for performance
- **Error handling**: Standardized responses with proper HTTP status codes

**Railway Backend Routes**:
- `/api/sync` - Data synchronization
- `/api/jobs` - Background job management
- `/api/webhooks` - External integrations
- `/api/analytics` - Heavy analytics processing

### Component Patterns

**Next.js 15 App Router**:
- Server components by default for optimal performance
- Client components with explicit 'use client' directive
- Async/await searchParams handling for Next.js 15 compatibility
- Suspense boundaries for loading states

**UI Architecture**:
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS with custom design system
- Responsive design patterns optimized for fabric marketplace
- Custom hooks in `src/shared/hooks/` for data fetching and state management

### Admin Dashboard Features

**Core Admin Functionality**:
- **Fabric Management**: Advanced CRUD with bulk operations, CSV/Excel import/export
- **Inventory Tracking**: Real-time stock levels with visual indicators
- **Content Management**: Blog posts, social media content, product promos
- **Team Management**: Role-based access control (platform_admin, tenant_admin, admin, editor, viewer)
- **Analytics Dashboard**: Performance metrics and reporting (in development)

**Admin UI Patterns**:
```typescript
// Authentication check pattern used in all admin pages
const { isLoading, isAuthenticated, isAdmin } = useAuth({ 
  required: true,
  role: 'admin' 
})

// API permission pattern for admin routes
const { allowed, userId, error } = await checkPermission('create')
if (!allowed) return error
```

**Advanced Features**:
- **Bulk Import System**: Drag-and-drop CSV/Excel with row-level error feedback
- **Multi-view Layouts**: Toggle between card and list views for fabric management
- **Smart Filtering**: Advanced search with category, status, and treatment filters
- **Toast Notifications**: Consistent feedback using Sonner library
- **Empty States**: Custom components with contextual CTAs

**Navigation Structure**:
- Dashboard (overview and metrics)
- Team (member management)
- Calendar (scheduling)
- Blog & Posts (content management)
- Strategy (business planning)
- Products & Promos
- Fabrics (inventory)
- Etsy Products (integration)

## Architecture Transition Status

The codebase is undergoing a migration from flat structure to module-based architecture:
- **165 imports fixed** from old paths to new module paths
- **Mixed import paths** currently exist (both work during transition)
- **Reference**: See `REFACTORING_ANALYSIS_REPORT.md` for migration details

## Critical Configuration

### Environment Variables (.env.local)
```env
# Database (PostgreSQL - Required)
DATABASE_URL=postgresql://user:password@host:5432/database
POSTGRES_URL=postgresql://...  # Alternative name (same database)

# Authentication (Required)
NEXTAUTH_URL=http://localhost:3000  # or production domain
NEXTAUTH_SECRET=your-jwt-secret  # Generate: openssl rand -base64 32
JWT_SECRET=your-jwt-secret      # Same as NEXTAUTH_SECRET

# Email Authentication (Required for magic links)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Tara Hub Admin <admin@deepcrm.ai>"

# Google OAuth (Legacy - still used for fallback)
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...

# Vercel KV (Optional - improves performance)
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...

# Cloudflare R2 (Required for image uploads)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# Railway Backend (For heavy operations)
RAILWAY_API_URL=https://your-backend.railway.app
```

### Admin Access Configuration
**Whitelisted admin emails** in `src/modules/auth/services/auth.service.ts`:
- varaku@gmail.com
- batchu.kedareswaraabhinav@gmail.com  
- vamsicheruku027@gmail.com
- admin@deepcrm.ai

### Build Configuration
**Known Issues in next.config.mjs**:
- ESLint and TypeScript errors temporarily ignored for builds
- Address these when making significant architectural changes

### Path Aliases & Import Paths

**Main App (tsconfig.json)**:
```typescript
"@/*": ["./*"]                    // Project root
"@/modules/*": ["./src/modules/*"] // Feature modules
"@/core/*": ["./src/core/*"]      // Core infrastructure
"@/shared/*": ["./src/shared/*"]  // Shared resources
```

**Import Examples**:
```typescript
// Feature modules
import { FabricService } from '@/modules/fabrics/services/fabric.service';
import { AuthService } from '@/modules/auth/services/auth.service';

// Core services
import { getR2Client } from '@/core/storage/r2/client';
import { createCacheStrategy } from '@/core/cache/strategies/cache-strategy';

// Shared resources
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';
```

## Key API Endpoints

### API Versions - IMPORTANT

**Three Different API Layers:**

1. **Legacy API (`/api/fabrics/`)**:
   - Simple KV-store based
   - Basic fabric schema
   - Used by experience apps (store-guide, fabric-store)
   - Public read-only access

2. **Admin API (`/api/v1/fabrics/`)**:
   - Full PostgreSQL + Drizzle ORM
   - Comprehensive 60+ field schema
   - Used by admin dashboard
   - Full authentication and CRUD

3. **Railway Backend (`api-service/`)**:
   - Heavy operations and background jobs
   - Bulk imports and exports
   - Analytics processing
   - Webhook handling

### Public Routes
- `GET /api/fabrics` - Legacy fabric catalog (KV-based)
- `GET /api/blog` - Published blog posts
- `GET /api/auth/session` - Current user session info

### Admin-Protected Routes  
- `POST/PUT/DELETE /api/v1/fabrics` - Full fabric management
- `POST /api/v1/fabrics/bulk` - Bulk fabric operations
- `POST /api/v1/fabrics/import` - CSV/Excel import
- `POST/PUT/DELETE /api/blog/[id]` - Blog content management
- `POST/PUT/DELETE /api/posts` - Social media posts
- `POST/PUT/DELETE /api/products` - Product management

### Authentication Routes
- `POST /api/auth/signin` - Generate magic link for email
- `GET /api/auth/verify` - Verify magic link token and create session
- `POST /api/auth/signout` - Destroy session

### Test Endpoints (Development Only)
All test endpoints are isolated in `app/api/__tests__/` to keep production routes clean:
- Test R2 storage, KV cache, email configuration
- Not accessible in production builds

## Development Workflow

### Initial Setup
1. **Clone and install**: `git clone ... && cd tara-hub && npm install`
2. **Environment setup**: Copy `.env.example` to `.env.local` and configure
3. **Database setup**: `npm run db:push` to sync schema
4. **Start development**: `npm run dev:admin` for admin, or `npm run dev` for all apps

### Common Development Tasks

**Adding new fabric data**:
1. Update schema in `src/modules/fabrics/schemas/fabric.schema.ts`
2. Generate migration: `npm run db:generate`  
3. Apply migration: `npm run db:push`
4. Update seed data in `src/modules/fabrics/data/seed-data.ts`

**Bulk importing fabrics**:
1. Navigate to `/admin/fabrics/import`
2. Download CSV template for correct format
3. Fill template with fabric data
4. Drag-and-drop or select file to upload
5. Review import preview and handle any errors
6. Confirm import to add fabrics to database

**Testing authentication**:
1. Ensure RESEND_API_KEY is configured
2. Visit `http://localhost:3000/auth/signin`
3. Enter whitelisted admin email for magic link
4. Check email for magic link (15-minute expiry)

**Working with admin features**:
1. All admin pages require authentication
2. Use `useAuth({ required: true, role: 'admin' })` hook
3. API routes check permissions with JWT verification
4. Toast notifications via `sonner` for user feedback

**Monorepo development**:
- Use `npm run dev` to start all apps simultaneously
- Individual apps run on different ports (admin: 3000, fabric-store: 3006, store-guide: 3007)
- Turbo handles dependency management and build optimization

### Database Management

**Schema Evolution**:
- Primary schemas in `src/core/database/schemas/` with comprehensive Drizzle definitions
- Legacy compatibility maintained in `src/modules/auth/schemas/legacy-auth.schema.ts`
- Use `npm run db:studio` for visual database inspection
- Seed data management via scripts in `scripts/` directory

**Performance Optimization**:
- KV caching layer for frequently accessed data
- ISR with 60-second revalidation for fabric pages
- Full-text search indexes on fabric content
- Optimistic concurrency control with version fields

## Deployment

**Vercel Configuration**:
- Auto-deploy on push to main branch
- Environment variables configured in Vercel dashboard
- Turbo build optimization for faster deployments
- Custom domains and SSL handled by Vercel
- Sophisticated deployment scripts in `deployment/vercel/scripts/`

**Production URLs**:
- Main site: https://tara-hub.vercel.app
- Admin panel: https://tara-hub.vercel.app/admin

**Deployment Scripts**:
- Parallel deployment support for performance
- Environment variable synchronization between local and Vercel
- Selective deployment of admin or experience apps
- Quick deploy option for rapid iterations

## Testing Strategy

**Framework Setup**:
- Vitest configured for unit testing
- Testing Library for React component tests
- Coverage reporting available via `npm run test:unit`
- Test UI dashboard via `npm run test:ui`

**Key Testing Areas**:
- Authentication flow (magic links, JWT tokens)
- Database schema validation (Zod + Drizzle)
- API endpoint authentication and authorization
- Component rendering and user interactions

## Troubleshooting

### Common Import Path Errors
During the architecture transition, you may encounter import errors:
- Try both old paths (`lib/`, `components/`) and new paths (`src/modules/`, `src/shared/`)
- Check `REFACTORING_ANALYSIS_REPORT.md` for specific file mappings

### Authentication Issues
- Ensure email is in the admin whitelist
- Check RESEND_API_KEY is valid
- Verify JWT_SECRET matches NEXTAUTH_SECRET

### Database Connection
- Both DATABASE_URL and POSTGRES_URL work (same connection)
- Check Neon dashboard for connection limits
- Use `npm run db:studio` to debug schema issues

### API Version Confusion
- Experience apps use `/api/fabrics/` (simple KV)
- Admin uses `/api/v1/fabrics/` (full PostgreSQL)
- Don't mix the two API versions

### Build Errors
- TypeScript/ESLint errors are currently ignored
- Check `next.config.mjs` for build configuration
- Railway backend requires separate deployment