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
│   │   ├── modules/        # Custom modules
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
- **Framework**: Next.js 15.1.0+ with App Router
- **React Versions**: Mixed (React 19 in fabric-store, React 18.2.0 in root/admin)
- **Backend**: MedusaJS v2.10.0 (Node.js commerce platform) + Clean Architecture service
- **Database**: PostgreSQL (Neon) with Drizzle ORM + MikroORM 6.4.3
- **Build**: Turbo 2.5.6 monorepo
- **Node**: >=18.0.0 (>=20.0.0 for Medusa)
- **Package Manager**: npm 10.2.0 with workspaces

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
cd medusa && npm run setup:inventory # Setup inventory system
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

# Testing - Root Level
npm run test              # Run tests with Turbo
npm run test:unit         # Run unit tests
npm run test:integration  # Run integration tests
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:headed   # Run E2E tests with browser UI

# Testing - Medusa Backend (from medusa/)
cd medusa && npm run test:unit                    # Unit tests
cd medusa && npm run test:integration:http        # HTTP integration tests
cd medusa && npm run test:integration:modules     # Module integration tests
cd medusa && npm run test:e2e:materials           # Materials E2E tests
cd medusa && npm run test:e2e:products            # Products E2E tests
cd medusa && npm run test:e2e:tax                 # Tax E2E tests
cd medusa && npm run test:e2e:shipping            # Shipping E2E tests
cd medusa && npm run test:e2e:inventory           # Inventory E2E tests
cd medusa && npm run test:e2e:all                 # All E2E tests (cloud DB)
cd medusa && npm run test:order-persistence       # Order persistence tests

# Deployment
npm run deploy            # Deploy all apps
npm run deploy:prod       # Production deployment
npm run deploy:fabric-store    # Deploy fabric store
npm run deploy:medusa     # Deploy Medusa backend
```

## Port Allocation
- 3000: Main admin app
- 3006: Fabric store experience
- 3007: Store guide experience
- 9000: Medusa backend API & Admin UI

## High-Level Architecture Patterns

### Multi-Tenant Fabric Marketplace
The platform supports multiple stores and brands with shared infrastructure. Each experience app is independently deployable while sharing core services through the Medusa backend.

### Clean Architecture Backend
Backend services follow Domain-Driven Design principles:
- **Domain Layer**: Business entities, value objects, domain events
- **Application Layer**: Use cases, CQRS commands/queries
- **Infrastructure Layer**: Database repos, caching, external services
- **Interface Layer**: HTTP controllers, middleware

### MedusaJS v2 Customization Pattern
Custom modules extend Medusa's core functionality:
- API routes in `/medusa/src/api/`
- Custom modules in `/medusa/src/modules/`
- Admin UI extensions in `/medusa/src/admin/`
- Scripts for data management in `/medusa/src/scripts/`

**Critical: MedusaService Deployment Issue**
- Avoid using `MedusaService` in custom modules for production deployments
- Use direct MikroORM repositories or plain API endpoints instead
- Materials module implemented without MedusaService to prevent Railway deployment failures
- See `/medusa/medusa-config.ts` comments for modules disabled due to this issue

### Experience Apps Architecture
Each experience app is a standalone Next.js application:
- **fabric-store**: Customer-facing e-commerce with Stripe payments, Sanity CMS, and Twilio SMS
- **store-guide**: Internal management dashboard with auth testing
- **sanity-studio**: Headless CMS for content management

### API Communication Pattern
- Frontend apps communicate with Medusa backend via REST APIs
- Authentication uses JWT tokens with magic links (admin) or SMS OTP (fabric-store)
- Real-time updates use polling strategies with Vercel KV caching

### Database Strategy
- PostgreSQL for persistent data (via Neon)
- Vercel KV (Redis) for caching and sessions
- Drizzle ORM for backend services
- MikroORM for Medusa modules

### Deployment Architecture
- Vercel for frontend apps (auto-deploy on push to main)
- Each experience app has independent Vercel project
- Environment variables synced via scripts
- Production URL: https://tara-hub.vercel.app

## Current Development State

### Recent Implementations (Session 4A)
- **Security & Legal Compliance Framework**: Production-ready security controls integrated into Medusa v2
- **Stripe Payment Integration**: Full payment flow with webhook handling
- **US Region Support**: Multi-region pricing with USD and tax handling
- **Production Deployment Infrastructure**: Railway (Medusa) + Vercel (frontend apps)

### Known Architectural Decisions
- **Redis Temporarily Disabled**: Upstash limits exceeded; using in-memory fallbacks for caching and events
- **MedusaService Avoided**: Custom modules use plain MikroORM to prevent deployment issues
- **Legacy Checkout Mode**: Feature flag `ENABLE_LEGACY_CHECKOUT` for backward compatibility

## Environment Variables

Key environment variables required:
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_URL` - Alternative PostgreSQL URL for Medusa
- `KV_REST_API_*` - Vercel KV/Redis configuration
- `JWT_SECRET` - Authentication secret
- `MEDUSA_ADMIN_EMAIL` - Admin user email
- `STRIPE_API_KEY` - Stripe payment integration
- `TWILIO_*` - SMS authentication
- `RESEND_API_KEY` - Email service
- `R2_*` - Cloudflare R2 storage
- `SANITY_*` - CMS configuration

## Testing Strategy

The project uses multiple testing frameworks:
- **Playwright**: E2E testing for frontend apps
- **Jest**: Unit and integration tests for Medusa backend
- **Vitest**: Unit tests for backend services
- **Supertest**: HTTP endpoint testing in Medusa

Test databases use dedicated cloud instances (Neon PostgreSQL) for E2E tests.

Before running tests, check available test commands:
```bash
# Check package.json for test scripts
cat package.json | grep "test"
cat medusa/package.json | grep "test"
```

## Important File Locations

- Medusa configuration: `/medusa/medusa-config.ts`
- Turbo configuration: `/turbo.json`
- Deployment configs: `/vercel.json`, `/railway.json`
- Deployment scripts: `/deployment/scripts/`
- Environment examples: `/.env.example`, `/medusa/.env.template`
- Sub-agent definitions: `/.claude/agents/`
- Development session logs: `/dev.sessions.log/` (create if missing)

## Development Logging Standard

All development activities (human developers, DevOps, analysts, architects, and sub-agents) must log to `/dev.sessions.log/` folder.

### Log File Naming Convention
```
/dev.sessions.log/YYYY-MM-DD-session-name.log
```

### Standard Log Entry Format
```
[TIMESTAMP] [TYPE] [ROLE/AGENT] Activity: <description>
Patterns: <identified patterns or technologies used>
Challenges: <encountered difficulties>
Gaps: <missing capabilities or tools>
Effectiveness: <high/medium/low>
Next Actions: <recommended follow-ups>
---
```

### Log Types
- `[HUMAN_DEV]` - Human developer activities
- `[DEVOPS]` - DevOps and infrastructure activities
- `[ANALYST]` - Business analysis and requirements
- `[ARCHITECT]` - Technical architecture decisions
- `[SUB_AGENT]` - Claude Code sub-agent activities

### Example Log Entries
```
[2024-09-29T10:30:00Z] [HUMAN_DEV] [developer] Activity: Fixed Stripe webhook timeout
Patterns: Webhook retry logic, async processing
Challenges: Production timeout issues, error handling
Gaps: Better webhook monitoring tools
Effectiveness: medium
Next Actions: Implement webhook health checks
---

[2024-09-29T11:15:00Z] [SUB_AGENT] [medusa-commerce-specialist] Activity: Implemented variant-material links
Patterns: defineLink(), MedusaJS v2 Link Module
Challenges: Complex relationship mapping
Gaps: None identified
Effectiveness: high
Next Actions: Document pattern for reuse
---
```

### Purpose
The `/dev.sessions.log/` folder serves as the central knowledge base for:
- The **Enricher agent** to monitor development patterns and evolve the sub-agent ecosystem
- Project stakeholders to track development progress and challenges
- Knowledge sharing across team members
- Identifying recurring issues that need specialized solutions

## Claude Code Sub-Agents

Specialized agents are available in `.claude/agents/` directory:
- **Enricher** - Monitors logs and evolves agent ecosystem
- **Medusa Commerce Specialist** - MedusaJS v2 expertise
- **Materials-Inventory Expert** - Fabric inventory management
- **Fabric Store Business Expert** - Textile business logic
- **API Security Specialist** - Security architecture
- **Legal Compliance Specialist** - Regulatory compliance
- **Deployment Specialist** - Production deployment
- **Database Migration Expert** - PostgreSQL optimization
- **Performance Monitoring Specialist** - System monitoring
- **E2E Testing Orchestrator** - Testing automation
- **Frontend Integration Specialist** - React/Next.js architecture

All sub-agents follow the standardized logging format above.

## Context7 MCP Server Integration

When working with external libraries or frameworks, automatically use Context7 MCP tools for:
- Code generation patterns and best practices
- Setup and configuration steps
- Library/API documentation lookup
- Framework-specific implementation guidance

Libraries commonly used in this project:
- MedusaJS v2.10.0
- Next.js 15
- Stripe (payment integration)
- MikroORM 6.4.3
- Drizzle ORM
- Radix UI components