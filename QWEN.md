# QWEN.md - Tara Hub Project Context

This document provides comprehensive context for the Tara Hub project, a sophisticated multi-tenant fabric marketplace platform built with Next.js 15 and Clean Architecture principles.

## Project Overview

Tara Hub is a multi-tenant fabric marketplace platform with a sophisticated architecture featuring:
- Main admin dashboard (Next.js 15 with App Router)
- MedusaJS v2 e-commerce backend
- Multiple frontend experience applications
- Clean Architecture backend with Domain-Driven Design
- Enterprise-grade patterns and technologies

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
├── frontend/
│   ├── experiences/        # Micro-frontend apps
│   │   ├── fabric-store/   # E-commerce (port 3006)
│   │   ├── store-guide/    # Management (port 3007)
│   │   └── sanity-studio/  # Content management
├── backend/                # Clean Architecture service
│   ├── domain/             # Business logic
│   ├── application/        # Use cases
│   ├── infrastructure/     # External implementations
│   └── fabric-api/         # Fabric-specific API service
├── components/             # Shared UI components
├── scripts/                # Database and deployment utilities
└── deployment/             # Deployment configurations
```

### Key Technologies
- **Framework**: Next.js 15.1.0 with App Router, React 19.1.1
- **Backend**: MedusaJS v2.10.0 (Node.js commerce platform)
- **Database**: PostgreSQL (Neon) with Drizzle ORM + MikroORM 6.4.3
- **Caching**: Vercel KV (Redis)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: JWT-based magic links + NextAuth 4.24.11
- **SMS**: Twilio integration (fabric-store)
- **Payment**: Stripe integration
- **UI**: Radix UI + shadcn/ui + Tailwind CSS
- **Email**: Resend API (primary), Sendgrid (secondary)
- **Build**: Turbo 2.5.6 monorepo
- **Content**: Sanity CMS (fabric-store)

## Development Environment

### Port Allocation
- 3000: Main admin app
- 3006: Fabric store experience
- 3007: Store guide experience
- 9000: Medusa backend API
- 9000/app: Medusa Admin UI

### Environment Variables
The project uses a distributed environment variable architecture:
- Root: `.env.local` (global configurations)
- Frontend: `frontend/.env` (frontend-specific)
- Medusa: `medusa/.env` (ecommerce backend)
- Backend: `backend/.env` (API service)
- Fabric Store: `frontend/experiences/fabric-store/.env.local` (experience app)

Key variables include:
- Database URLs (PostgreSQL)
- Authentication secrets (JWT, NextAuth)
- Email service keys (Resend)
- Cache configuration (Redis/Vercel KV)
- Storage credentials (Cloudflare R2)
- Payment processing (Stripe)
- CORS configuration

## Development Commands

### Main Development Commands
```bash
# Install dependencies (from root)
npm install

# Start main admin app
npm run dev               # Start admin app (port 3000)
npm run dev:admin         # Alternative command for admin app

# Start Medusa backend
npm run dev:medusa        # Start Medusa (port 9000)
cd medusa && npm run dev  # Alternative command

# Start experience apps
npm run dev:fabric-store  # Start fabric store (port 3006)
npm run dev:store-guide   # Start store guide (port 3007)

# Start all frontend/backend services
npm run dev:frontend      # Start all frontend experiences
npm run dev:backend       # Start all backend services
```

### Database Operations
```bash
# Database operations (run from root)
npm run db:push           # Push schema changes
npm run db:migrate        # Run migrations
npm run db:studio         # Open Drizzle Studio GUI
npm run db:seed           # Seed sample data

# Medusa-specific database operations
cd medusa && npm run seed:fabrics    # Seed fabric data
cd medusa && npm run import:fabrics  # Import CSV data
cd medusa && npm run seed:admin      # Seed admin user
```

### Testing
```bash
# Run tests
npm run test              # Run tests with Turbo
npm run test:unit         # Run unit tests (backend)
npm run test:integration  # Run integration tests

# Medusa-specific tests
cd medusa && npm run test:integration:http    # HTTP integration tests
cd medusa && npm run test:integration:modules # Module tests
cd medusa && npm run test:unit               # Unit tests
```

### Building
```bash
# Build commands
npm run build:frontend    # Build frontend packages
npm run build:backend     # Build backend packages
npm run lint              # Run ESLint across monorepo
npm run type-check        # TypeScript checking
npm run format            # Format code with Prettier
```

### Deployment
```bash
# Deployment commands
npm run deploy            # Deploy all apps
npm run deploy:prod       # Production deployment (parallel)
npm run deploy:admin      # Deploy admin only
npm run deploy:fabric-store    # Deploy fabric store
npm run deploy:store-guide     # Deploy store guide
```

## Project Components

### Main Admin Dashboard (app/)
- Built with Next.js 15 App Router
- Magic link authentication with JWT
- Protected routes requiring authentication
- Multi-tenant architecture with tenant resolution

### Medusa Backend (medusa/)
- E-commerce platform with custom modules
- PostgreSQL database with MikroORM
- Cloudflare R2 storage integration
- Stripe payment processing
- Twilio SMS integration
- Custom modules: Contact, Fabric Details, Resend Notification

### Clean Architecture Backend (backend/)
- Domain-Driven Design implementation
- Repository pattern with Drizzle ORM
- Use case pattern for business operations
- Value objects for type-safe validation
- Domain events for decoupling side effects
- Result pattern for error handling

### Experience Apps (frontend/experiences/)
1. **Fabric Store** (port 3006):
   - Customer-facing e-commerce application
   - Sanity CMS integration for content
   - Stripe payment integration
   - Twilio SMS authentication

2. **Store Guide** (port 3007):
   - Store management application
   - Multi-tenant features

3. **Sanity Studio**:
   - Content management system
   - Hero carousel content management

## Key Design Patterns

### Clean Architecture (backend/)
1. **Domain Layer**: Business entities, value objects, domain events
2. **Application Layer**: Use cases, commands/queries, DTOs
3. **Infrastructure Layer**: Database implementations, caching, external services
4. **Interface Layer**: HTTP controllers, middleware, routes

### Authentication
- JWT-based magic link system
- Multi-tenant authentication with tenant resolution
- Protected routes with role-based access control
- Google SSO integration (in progress)

### Data Management
- Rich domain models with business logic
- Repository pattern for data access
- Hybrid caching strategy (Redis + memory)
- Event-driven architecture with domain events

## Important Notes

### Package Manager
- Required: npm 10.2.0 (specified in packageManager field)
- Use `npm install` from root to maintain workspace dependencies

### Build Configuration
- ESLint and TypeScript errors temporarily ignored for quick deployment
- Webpack configured to prevent worker conflicts
- Jest workers disabled to prevent conflicts

### Current Development Status
- Repository: https://github.com/varaku1012/tara-hub.git
- Production deployment on Vercel
- Google SSO integration in progress
- Admin login override components in development

### Work in Progress
- Google SSO integration for Medusa admin
- Admin login override components
- Inventory management enhancements
- Public API endpoints for fabric data