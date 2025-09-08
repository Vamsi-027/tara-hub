# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

The `experiences/` directory contains independent Next.js micro-frontends that are part of the Tara Hub monorepo. Each app runs on a different port and can be deployed independently to Vercel.

## Development Commands

### Individual App Commands

**Fabric Store (Port 3006)**:
```bash
cd fabric-store
npm install                 # Install dependencies
npm run dev                # Start dev server on port 3006
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
npm run type-check         # TypeScript type checking
```

**Store Guide (Port 3007)**:
```bash
cd store-guide
npm install                 # Install dependencies
npm run dev                # Start dev server on port 3007
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run ESLint
npm run type-check         # TypeScript type checking
```

### Monorepo-Level Commands
From the root directory:
```bash
npm run dev:all            # Start all experiences in parallel
npm run build:all          # Build all experiences
```

## Architecture

### Micro-Frontend Structure
- **fabric-store/**: E-commerce experience for browsing and selecting fabric swatches
  - Browse page with filtering/search
  - Checkout flow for fabric samples
  - Swatch selection context (max 5 items)
  - Client-side state management with localStorage

- **store-guide/**: Store management and content guide
  - Multi-page app with auth integration
  - Blog system with dynamic routes
  - Calendar and post scheduling features
  - Test pages for auth and CRUD operations

### Shared Dependencies
Both apps use workspace packages from the monorepo:
- `@tara-hub/ui`: Shared UI components
- `@tara-hub/lib`: Shared business logic and utilities

### Configuration Patterns

**Next.js Config**:
- Both apps transpile monorepo packages: `['@tara-hub/components', '@tara-hub/lib']`
- External directory support enabled for monorepo structure
- Image domains configured for Unsplash

**Vercel Deployment**:
- Custom build commands that install from root: `cd ../.. && npm install && cd experiences/[app-name] && npm run build`
- Deploy ignores unless changes in `experiences/[app-name]` or `packages/`
- Regional deployment to `iad1`

### Port Allocation
- fabric-store: 3006
- store-guide: 3007
- Main app (root): 3000

## Key Implementation Details

### Fabric Store
- Uses `SwatchContext` for cart-like functionality
- Client-side only ('use client' components)
- Imports fabric data from `@tara-hub/lib/fabric-data`
- Mobile-first responsive design with separate mobile header
- localStorage persistence for selected swatches

### Store Guide
- Server components by default (Next.js 15 App Router)
- Multiple page routes including auth, blog, calendar
- NextAuth integration for authentication
- Test routes for development (`/test-auth`, `/test-crud`, `/test-google-auth`)

## Deployment

Each app has its own `vercel.json` configuration:
- Independent Vercel projects
- Custom environment variables per app
- Selective deployment based on git changes
- Monorepo-aware build commands

## Testing

Currently no test framework is configured. When adding tests:
- Consider Jest or Vitest for unit tests
- Playwright for E2E testing across experiences
- Test shared packages separately