# Tara Hub - Main Steering Context

**Last Updated**: 2025-08-21
**Status**: ACTIVE DEVELOPMENT - Architecture in transition

## What Tara Hub Actually Is

Tara Hub is a **fabric marketplace platform** with an admin dashboard for inventory and content management. It consists of three Next.js applications in a Turborepo monorepo structure.

### Current Business Purpose
- Primary: Fabric inventory management and sample ordering system
- Secondary: Content management for blog posts and marketing materials
- Tertiary: Basic Etsy product integration for external sales

### What It's NOT (Despite Legacy Documentation)
- NOT an AI-powered platform (mock implementations only)
- NOT a social media management tool (UI exists but no API integrations)
- NOT a payment processing system (redirects to Etsy for purchases)
- NOT a real-time analytics platform (displays mock data)

## Actual Applications

### 1. Admin Dashboard (Port 3000)
**Path**: `/app/admin/`
**Purpose**: Central management interface for fabric inventory and content
**Key Features**:
- Fabric CRUD with 60+ field schema
- CSV/Excel import/export for bulk operations
- Blog post management
- Product/promotion content management
- Team member management
- Basic Etsy product catalog integration

### 2. Fabric Store (Port 3006)
**Path**: `/experiences/fabric-store/`
**Domain**: Custom Design Fabrics
**Purpose**: Customer-facing fabric sample ordering
**Key Features**:
- Browse fabric collections
- Order up to 5 free fabric samples
- Static catalog from seed data

### 3. Store Guide (Port 3007)
**Path**: `/experiences/store-guide/`
**Brand**: The Hearth & Home Store
**Purpose**: Premium fabric showcase and marketing
**Key Features**:
- Featured fabric collections
- Custom cushion/pillow marketing
- Blog integration

## Architecture State

**CRITICAL**: The codebase is mid-transition from flat to module-based architecture:
- 165 import paths already migrated
- Both old (`lib/`, `components/`) and new (`src/modules/`) paths work
- Some files exist in both locations temporarily
- TypeScript/ESLint errors temporarily ignored in builds

## Technology Stack (Verified)

### Core Technologies
- **Framework**: Next.js 15.1.6 with App Router
- **Runtime**: React 19.0.0
- **Monorepo**: Turborepo 2.3.4
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Caching**: Vercel KV (Redis) with in-memory fallback
- **Styling**: Tailwind CSS + shadcn/ui components
- **Authentication**: Custom magic link system (JWT-based)
- **Email**: Resend API
- **Storage**: Cloudflare R2 for images

### Deployment
- **Platform**: Vercel (all three apps)
- **Backend Service**: Railway (minimal Express API for future features)
- **Production URL**: https://tara-hub.vercel.app

## Authentication Reality

Custom magic link implementation (replaced NextAuth):
- Email-based passwordless authentication
- 30-day JWT session tokens
- Hardcoded admin whitelist in `src/modules/auth/services/auth.service.ts`
- Professional HTML email templates via Resend

**Admin Emails**:
- varaku@gmail.com
- batchu.kedareswaraabhinav@gmail.com
- vamsicheruku027@gmail.com
- admin@deepcrm.ai

## Data Persistence Strategy

### PostgreSQL (Primary)
- Comprehensive fabric schema with inventory tracking
- User accounts and sessions
- Blog posts and content
- Full-text search capabilities

### Vercel KV (Caching)
- Fabric catalog caching
- Performance optimization
- Fallback to in-memory cache in development

### Static Data
- Initial fabric catalog in `src/modules/fabrics/data/seed-data.ts`
- Used for demo and development

## Current Development Focus

1. **Architecture Migration**: Completing transition to module-based structure
2. **Feature Cleanup**: Removing mock/aspirational features from UI
3. **Business Clarity**: Aligning the three apps under coherent branding
4. **Performance**: Implementing proper caching strategies
5. **Testing**: Building out Vitest test coverage

## Known Issues

1. **Mixed Import Paths**: Both old and new paths work during transition
2. **Build Warnings**: TypeScript/ESLint errors temporarily ignored
3. **Mock Features**: UI shows features that aren't implemented (AI, analytics)
4. **Branding Confusion**: Three apps have different branding/purposes
5. **Incomplete Features**: Many database fields exist but aren't used

## Next Session Priorities

When continuing development:
1. Check `REFACTORING_ANALYSIS_REPORT.md` for migration status
2. Use new module paths for any new code
3. Don't implement AI/social media features without explicit request
4. Focus on core fabric marketplace functionality
5. Clean up mock implementations if modifying those areas