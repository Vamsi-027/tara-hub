# QWEN.md - Project Context for Qwen Code

## Project Overview

**Tara Hub** is a production-ready Next.js 15 fabric marketplace platform with a MedusaJS v2 backend, built as a monorepo using Turbo. The platform features a multi-tenant architecture supporting multiple stores and brands, with an extensive fabric catalog system containing 60+ field comprehensive inventory management.

### Core Applications

1. **Main Admin Dashboard** (port 3000) - Comprehensive admin interface for managing fabrics, products, and content
2. **Medusa Backend** (port 9000) - E-commerce backend with custom modules
3. **Fabric Store Experience** (port 3006) - Customer-facing e-commerce store
4. **Store Guide Experience** (port 3007) - Store management and content platform

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Clean Architecture with Domain-Driven Design principles
- **Database**: PostgreSQL (Neon) with Drizzle ORM and MikroORM
- **Caching**: Vercel KV (Redis) with hybrid strategy
- **Authentication**: JWT-based magic links
- **UI**: Radix UI + shadcn/ui + Tailwind CSS
- **Storage**: Cloudflare R2
- **Email**: Resend API
- **Payment**: Stripe integration
- **Build System**: Turbo monorepo
- **Deployment**: Vercel

## Project Structure

```
tara-hub/
├── app/                    # Main admin dashboard (Next.js 15 App Router)
│   ├── admin/              # Admin pages and components
│   ├── api/                # API routes
│   └── auth/               # Authentication pages
├── medusa/                 # MedusaJS v2 backend
│   ├── src/
│   │   ├── admin/          # Admin UI customizations
│   │   ├── api/            # API endpoints
│   │   └── modules/        # Custom modules
├── frontend/
│   └── experiences/        # Micro-frontend apps
│       ├── fabric-store/   # E-commerce (port 3006)
│       └── store-guide/    # Management (port 3007)
├── backend/                # Clean Architecture service
│   ├── domain/             # Business logic
│   ├── application/        # Use cases
│   ├── infrastructure/     # External implementations
│   └── fabric-api/         # Fabric-specific API service
├── components/             # Shared UI components
└── scripts/                # Utility scripts
```

## Key Development Commands

### Starting Development Servers

```bash
# Start everything with Turbo
npm run dev

# Start individual services
npm run dev:admin         # Admin dashboard (port 3000)
npm run dev:fabric-store  # Fabric store (port 3006)
npm run dev:store-guide   # Store guide (port 3007)
npm run dev:backend       # Backend services

# Start Medusa backend directly
cd medusa && npm run dev
```

### Database Operations

```bash
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio GUI
npm run db:seed      # Seed sample data
```

### Testing

```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
```

### Building and Deployment

```bash
npm run build:frontend    # Build frontend apps
npm run build:backend     # Build backend services
npm run deploy            # Deploy all apps
npm run deploy:prod       # Production deployment
```

## Environment Configuration

The project uses multiple environment files:

1. **Root** (`/.env.local`) - Main admin dashboard
2. **Medusa** (`/medusa/.env`) - Medusa backend
3. **Fabric Store** (`/frontend/experiences/fabric-store/.env.local`) - Customer store

Key variables include:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Authentication secret
- `RESEND_API_KEY` - Email service
- `STRIPE_API_KEY` - Payment processing
- `R2_*` - Cloudflare R2 storage

## Authentication & Multi-tenancy

The platform uses JWT-based magic link authentication with multi-tenancy support. The middleware (`middleware.ts`) handles:
- Route protection for admin areas
- Public routes for customer-facing content
- Tenant resolution based on subdomains/ports

## Development Conventions

- **Code Style**: ESLint and Prettier (temporarily ignored during builds)
- **Type Safety**: TypeScript with strict mode
- **Component Library**: shadcn/ui components with Radix UI primitives
- **State Management**: React hooks and context
- **Testing**: Vitest for unit tests, Jest for integration
- **API Design**: RESTful APIs with versioning

## Recent Development Focus

1. **Fabric Store Experience**: Enhanced filter system with categories, colors, patterns
2. **Component Updates**: New filter components in `frontend/experiences/fabric-store/components/filters/`
3. **Module Refactoring**: Ongoing reorganization of Medusa modules
4. **UI Enhancements**: Tailwind configuration updates

## Critical Considerations

- Use npm 10.2.0 (as specified in packageManager field)
- Node.js >=18.0.0 (>=20.0.0 for Medusa)
- Always run `npm install` from root for workspace dependencies
- Check `.env.example` for required environment variables
- Experience apps have nested directory structure
- TypeScript errors are temporarily ignored during builds (fix before production)