# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tara Hub - A Next.js 15 fabric marketplace platform with Turbo monorepo architecture, featuring admin dashboard, MedusaJS v2 backend, and multiple experience apps.

## 🚨 CRITICAL: Current Project Structure

**Main Admin App (Next.js 15)**:
- **Location**: `/app/` directory (App Router)
- **Start Command**: `npx next dev` (from repository root)
- **Port**: 3000
- **Components**: `/components/ui/` with relative imports
- **Auth**: Magic link authentication with JWT

**Medusa Backend (MedusaJS v2)**:
- **Location**: `/medusa/` directory
- **Start Command**: `cd medusa && npm run dev` 
- **Ports**: API on 9000, Admin UI on 9000/app
- **Database**: PostgreSQL with MikroORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Key Scripts**:
  - `npm run seed` - Seed database
  - `npm run seed:fabrics` - Seed fabric data
  - `npm run import:fabrics` - Import fabric CSV data

**Experience Apps**:
- **Fabric Store**: `/frontend/experiences/fabric-store/` (port 3006)
- **Store Guide**: `/frontend/experiences/store-guide/` (port 3007)
- **Sanity Studio**: `/frontend/experiences/sanity-studio/`

**Backend Service (Clean Architecture)**:
- **Location**: `/backend/` directory
- **Purpose**: Domain-driven design implementation
- **Deployment**: Railway platform

## Development Commands

```bash
# Install dependencies (from root)
npm install

# Main Admin App
npx next dev              # Start admin app (port 3000)
npm run build             # Build with Turbo
npm run lint              # Run ESLint across monorepo
npm run type-check        # TypeScript checking

# Medusa Backend
cd medusa && npm run dev  # Start Medusa (port 9000)
cd medusa && npm run seed:fabrics  # Seed fabric data
cd medusa && npm run import:fabrics # Import CSV data

# Experience Apps
npm run dev:fabric-store  # Start fabric store (port 3006)
npm run dev:store-guide   # Start store guide (port 3007)

# Database Operations
npm run db:push           # Push schema changes
npm run db:migrate        # Run migrations
npm run db:studio         # Open Drizzle Studio GUI
npm run db:seed           # Seed sample data

# Testing
npm run test              # Run Vitest tests
npm run test:unit         # Unit tests with coverage
npm run test:watch        # Watch mode
npm run test:ui           # Vitest UI

# Deployment
npm run deploy            # Deploy all apps
npm run deploy:prod       # Production deployment
npm run deploy:admin      # Deploy admin only

# Environment Management
npm run env:manage        # Interactive env var management
npm run env:validate      # Validate environment
npm run env:push          # Push to Vercel
npm run env:pull          # Pull from Vercel
```

## Architecture

### Monorepo Structure
```
tara-hub/
├── app/                    # Main admin dashboard (Next.js 15)
│   ├── admin/              # Admin pages
│   ├── api/                # API routes
│   └── auth/               # Auth pages
├── medusa/                 # MedusaJS v2 backend
│   ├── src/
│   │   ├── admin/          # Admin UI customizations
│   │   ├── api/            # API endpoints
│   │   ├── modules/        # Custom modules
│   │   └── scripts/        # Utility scripts
│   └── package.json
├── frontend/
│   └── experiences/        # Micro-frontend apps
│       ├── fabric-store/   # E-commerce (port 3006)
│       └── store-guide/    # Management (port 3007)
├── backend/                # Clean Architecture service
│   ├── domain/             # Business logic
│   ├── application/        # Use cases
│   └── infrastructure/     # External implementations
├── components/             # Shared UI components
├── src/                    # Legacy/planned module structure
└── deployment/             # Deployment configurations
```

### Technology Stack
- **Framework**: Next.js 15 with App Router, React 19
- **Backend**: MedusaJS v2 (Node.js commerce platform)
- **Database**: PostgreSQL (Neon) with Drizzle ORM + MikroORM
- **Caching**: Vercel KV (Redis)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: JWT-based magic links
- **UI**: Radix UI + shadcn/ui + Tailwind CSS
- **Email**: Resend API
- **Deployment**: Vercel (frontend) + Railway (backend)
- **Build**: Turbo monorepo

## Key Configuration Files

### Environment Variables (.env.local)
```env
# Database
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...

# Authentication
JWT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Tara Hub <admin@deepcrm.ai>"

# Vercel KV
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Cloudflare R2 (Medusa)
S3_REGION=auto
S3_BUCKET_NAME=store
S3_ENDPOINT=https://...r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_URL=https://pub-...r2.dev

# Medusa Backend
MEDUSA_BACKEND_URL=http://localhost:9000
```

### TypeScript Path Aliases (tsconfig.json)
```json
{
  "paths": {
    "@/*": ["./*"],
    "@/modules/*": ["./src/modules/*"],
    "@/core/*": ["./src/core/*"],
    "@/shared/*": ["./src/shared/*"]
  }
}
```

### Turbo Configuration (turbo.json)
- Configured for parallel builds and dev servers
- Environment variable passthrough for all tasks
- Caching enabled for build outputs

## API Architecture

### API Routes Structure
- **Public API**: `/api/` - Legacy KV-based endpoints
- **Admin API**: `/api/v1/` - PostgreSQL-based CRUD
- **Medusa API**: `localhost:9000/admin/` - Commerce API
- **Auth Routes**: `/api/auth/` - Magic link authentication

### Medusa Admin Customizations
- Custom routes in `/medusa/src/admin/routes/`
- Custom widgets in `/medusa/src/admin/widgets/`
- Product management with SKU generation fixes
- Inventory tracking enhancements

## Important Notes

### Build Configuration (next.config.mjs)
- ESLint and TypeScript errors temporarily ignored for builds
- Image domains configured for Unsplash and deployment
- Webpack configured to prevent worker conflicts

### Admin Access
Whitelisted admin emails (configured in middleware.ts):
- varaku@gmail.com
- vamsicheruku027@gmail.com
- admin@deepcrm.ai
- batchu.kedareswaraabhinav@gmail.com

### Port Allocation
- 3000: Main admin app
- 3006: Fabric store experience
- 3007: Store guide experience
- 9000: Medusa backend API

### Recent Fixes
- **Product SKU Duplication** (2025-08-31): Fixed SKU generation in Medusa admin
- **Authentication Flow**: Simplified magic link system for admin access
- **R2 Storage**: Fully integrated with Medusa file service

## Deployment

### Vercel Deployment
- Auto-deploy on push to main branch
- Environment variables configured in Vercel dashboard
- Production URL: https://tara-hub.vercel.app

### Railway Backend
- Clean Architecture backend service
- Heavy operations and async processing
- Separate deployment from frontend

## Testing

### Available Test Commands
- `npm run test` - Run all tests
- `npm run test:unit` - Unit tests with coverage
- `npm run test:watch` - Watch mode for development
- `npm run test:ui` - Vitest UI interface

### Medusa Testing
- Integration tests: `npm run test:integration:http`
- Module tests: `npm run test:integration:modules`
- Unit tests: `npm run test:unit`