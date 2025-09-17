# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tara Hub - A Next.js 15 fabric marketplace platform with Turbo monorepo architecture, featuring admin dashboard, MedusaJS v2 backend, and multiple experience apps.

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
│   │   ├── modules/        # Custom modules (Contact, Fabric Details, Resend)
│   │   └── scripts/        # Utility scripts
│   └── package.json
├── frontend/
│   ├── experiences/        # Micro-frontend apps
│   │   ├── fabric-store/   # E-commerce (port 3006)
│   │   ├── store-guide/    # Management (port 3007)
│   │   └── sanity-studio/  # Content management
│   └── package.json
├── backend/                # Clean Architecture service
│   ├── domain/             # Business logic
│   ├── application/        # Use cases
│   ├── infrastructure/     # External implementations
│   └── fabric-api/         # Fabric-specific API service
├── components/             # Shared UI components
├── scripts/                # Database and deployment utilities
└── deployment/             # Deployment configurations
    └── scripts/            # Deployment shell scripts
```

### Technology Stack
- **Framework**: Next.js 15.1.0+ with App Router, React 19.1.1
- **Backend**: MedusaJS v2.10.0 (Node.js commerce platform) + Clean Architecture service
- **Database**: PostgreSQL (Neon) with Drizzle ORM + MikroORM 6.4.3
- **Caching**: Vercel KV (Redis)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: JWT-based magic links + NextAuth 4.24.11
- **SMS**: Twilio integration (fabric-store)
- **Payment**: Stripe integration (Medusa + fabric-store)
- **UI**: Radix UI + shadcn/ui + Tailwind CSS
- **Email**: Resend API (primary), Sendgrid (secondary)
- **Build**: Turbo 2.5.6 monorepo
- **Testing**: Vitest 3.2.4, Jest (Medusa)
- **Content**: Sanity CMS (fabric-store)
- **Node**: >=18.0.0 (>=20.0.0 for Medusa)
- **Package Manager**: npm 10.2.0

## Development Commands

### Quick Start
```bash
# Install dependencies (from root - uses npm workspaces)
npm install

# Start main admin app (port 3000)
npm run dev

# Start Medusa backend (port 9000)
cd medusa && npm run dev

# Start experience apps (from root)
npm run dev:fabric-store    # Port 3006
npm run dev:store-guide     # Port 3007

# Or navigate to each app directory
cd frontend/experiences/fabric-store && npm run dev
cd frontend/experiences/store-guide && npm run dev

# Start all services in parallel (requires multiple terminals)
npm run dev                  # Terminal 1: Main admin
cd medusa && npm run dev     # Terminal 2: Medusa backend
npm run dev:fabric-store     # Terminal 3: Fabric store
```

### Complete Command Reference
```bash
# Main Admin App
npm run dev               # Start admin app (port 3000)
npm run lint              # Run ESLint across monorepo
npm run type-check        # TypeScript checking
npm run format            # Format code with Prettier
npm run format:check      # Check code formatting

# Medusa Backend
cd medusa && npm run dev             # Start Medusa (port 9000)
cd medusa && npm run seed:fabrics    # Seed fabric data
cd medusa && npm run import:fabrics  # Import CSV data
cd medusa && npm run sync:materials  # Sync materials data
cd medusa && npm run test:materials  # Test materials sync
cd medusa && npm run setup:contacts  # Setup contact module
cd medusa && npm run test:contacts   # Test contact integration
cd medusa && npm run setup:us-region # Setup US region with USD pricing
cd medusa && npm run build:admin     # Build admin UI

# Database Operations
npm run db:push           # Push schema changes
npm run db:migrate        # Run migrations
npm run db:studio         # Open Drizzle Studio GUI
npm run db:seed           # Seed sample data

# Materials & Product Management
npm run sync:materials          # Sync fabrics to materials
npm run sync:materials:dry      # Dry run sync
npm run clear:products          # Clear Medusa products
npm run clear:products:dry      # Dry run clear
npm run clear:products:force    # Force clear all products

# Testing
npm run test              # Run tests with Turbo
npm run test:unit         # Run unit tests
npm run test:integration  # Run integration tests

# Deployment
npm run deploy            # Deploy all apps
npm run deploy:prod       # Production deployment
npm run deploy:fabric-store    # Deploy fabric store

# Environment Management
node scripts/sync-env-from-vercel.js  # Pull env vars from Vercel
node scripts/sync-env-to-vercel.js    # Push env vars to Vercel
node scripts/check-db-tables.js       # Inspect database schema
```

## Port Allocation
- 3000: Main admin app
- 3006: Fabric store experience
- 3007: Store guide experience
- 9000: Medusa backend API & Admin UI

## Environment Variables

Key variables needed in `.env.local` (see `.env.example` for complete list):
```env
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Medusa Backend
MEDUSA_BACKEND_URL=http://localhost:9000
REDIS_URL=rediss://...  # For Medusa caching

# Email (Resend primary for fabric-store)
RESEND_API_KEY=re_...

# Twilio (SMS - fabric-store only)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Stripe Payments (Medusa + fabric-store)
STRIPE_API_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

## API Architecture

### Main Admin API Routes
- **Public API**: `/api/` - Legacy KV-based endpoints
- **Admin API**: `/api/v1/` - PostgreSQL-based CRUD
- **Auth Routes**: `/api/auth/` - Magic link authentication

### Medusa API
- **Store API**: `http://localhost:9000/store/`
- **Admin API**: `http://localhost:9000/admin/`
- **Custom Routes**: `/medusa/src/api/`
- **Custom Modules**: Contact, Fabric Details, Resend Notification

### Backend Clean Architecture
- **Domain Layer**: Business entities, value objects, domain events
- **Application Layer**: Use cases, CQRS commands/queries
- **Infrastructure Layer**: Database repos, caching, external services
- **Interface Layer**: HTTP controllers, middleware

## Testing

### Available Test Commands
```bash
# Main repository (uses Turbo)
npm run test              # Run all tests via Turbo
npm run test:unit         # Unit tests across workspace
npm run test:integration  # Integration tests

# Medusa specific
cd medusa && npm run test:integration:http    # HTTP integration tests
cd medusa && npm run test:integration:modules # Module tests  
cd medusa && npm run test:unit               # Unit tests

# Experience apps (when configured)
cd frontend/experiences/fabric-store && npm run test
cd frontend/experiences/store-guide && npm run test
```

## Build Configuration

### Next.js (next.config.mjs)
- ESLint and TypeScript errors temporarily ignored for builds
- Image domains configured for Unsplash and deployment
- Webpack configured to prevent worker conflicts

### TypeScript Path Aliases
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

### Turbo Configuration
- Parallel builds and dev servers
- Environment variable passthrough
- Build output caching enabled

## Deployment

### Vercel Deployment
- Auto-deploy on push to main branch
- Production URL: https://tara-hub.vercel.app
- Deployment scripts in `deployment/vercel/scripts/`
- Each experience app has independent Vercel project

### Deployment Scripts
```bash
deployment/scripts/
├── deploy.sh              # Deploy specified app or all apps
├── deploy-production.sh   # Production deployment with safety checks
└── railway-deploy.sh      # Railway platform deployment
```

## Key Features & Recent Updates

### Authentication
- Magic link authentication for admin
- NextAuth integration
- SMS authentication with Twilio (fabric-store)
- Google SSO (Medusa admin - in progress)

### Medusa Customizations
- Custom admin routes and widgets
- Product management with SKU fixes
- Inventory tracking enhancements
- R2 storage integration
- Contact module implementation

### Experience Apps
- **Fabric Store**: E-commerce with swatch selection (max 5), Stripe payments, Sanity CMS
- **Store Guide**: Management dashboard with blog, calendar, auth testing
- **Sanity Studio**: Content management for fabric-store

## Recent Changes & Current State

### Module Refactoring in Progress
The codebase is currently undergoing module reorganization:
- **Fabric Details module**: Being refactored from `fabric-details` to `fabric_details`
- **Fabric Products module**: Being refactored from `fabric-products` to `fabric_products`
- **Materials module**: Enhanced with new models and sync capabilities
- Several old module files have been deleted and are being replaced with updated implementations

### Active Development Areas
- **Multi-Region Support**: US region setup with USD pricing implementation
  - Region creation and configuration scripts
  - Dynamic pricing based on customer location
  - Tax handling for different regions
- **Fabric Store Experience**: Modern filter system implementation in browse page
  - Enhanced filtering with categories, colors, patterns, price ranges
  - Sort functionality and search improvements
  - Mobile-responsive filter drawer
  - Active filter badges display
- **Order Management**: Transitioning from custom fabric-orders to native Medusa order service
- **Component Updates**: New filter components in `frontend/experiences/fabric-store/components/filters/`
- **UI Enhancements**: Tailwind configuration updates for improved styling

## Development Notes

### Critical Considerations
- Use npm 10.2.0 (specified in packageManager field)
- Node.js >=18.0.0 (>=20.0.0 for Medusa)
- Always run `npm install` from root for workspace dependencies
- Check `.env.example` for required environment variables
- Experience apps have nested directory structure: `frontend/experiences/[app-name]/`

### Common Issues & Solutions
- **Port conflicts**: Check individual app package.json for custom port configurations
- **Database migrations**: Run migrations before starting Medusa development
- **Medusa admin build**: Use `npm run build:admin` if admin UI doesn't load
- **Environment variables**: Copy `.env.example` to `.env.local` and fill required values
- **Experience app dependencies**: Each experience app has its own node_modules and package.json
- **Webpack issues**: Next.js config has Jest worker fallback disabled to prevent build conflicts
- **TypeScript errors**: Build errors temporarily ignored (see next.config.mjs) - fix before production
- **Twilio build errors**: Fabric-store webpack externals configured for xmlbuilder compatibility

## Utility Scripts

Located in `/scripts/`:
- `seed-data.js` - Comprehensive data seeding
- `sync-env-from-vercel.js` - Pull env vars from Vercel
- `sync-env-to-vercel.js` - Push env vars to Vercel
- `check-db-tables.js` - Database schema inspection
- `create-us-region.js` - Create US region with USD pricing
- `set-medusa-prices.js` - Set product prices for regions
- `setup-medusa-pricing.js` - Configure multi-currency pricing
- `clear-medusa-products.js` - Clear product catalog (with dry-run option)
- `sync-fabrics-to-materials.ts` - Sync fabric data to materials module

## Code Quality & Standards

### Linting and Formatting
```bash
npm run lint              # Run ESLint across monorepo
npm run format            # Format with Prettier
npm run format:check      # Check formatting without changes
npm run type-check        # TypeScript type checking
```

### Git Workflow
- Main branch: `main`
- Feature branches: `feature/[feature-name]`
- Commit messages: Descriptive with scope prefix (e.g., "feat(fabric-store): add filter system")
- Pre-deployment: Run `npm run lint` and `npm run type-check`

## Repository Information

- **GitHub URL**: https://github.com/Vamsi-027/tara-hub.git
- **Production URL**: https://tara-hub.vercel.app
- **Main Branch**: main
- **Package Manager**: npm 10.2.0 (enforced via packageManager field)