# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Store Guide is a Next.js 15 micro-frontend within the Tara Hub monorepo, running on port 3007. It provides store management and content guide functionality with authentication integration, blog system, and multiple test pages for development.

## Development Commands

```bash
# Development
npm run dev                # Start dev server on port 3007
npm run build              # Build for production
npm run start              # Start production server on port 3007
npm run lint               # Run ESLint
npm run type-check         # TypeScript type checking with tsc --noEmit

# Monorepo-level commands (from root)
npm run dev                # Starts all apps including store-guide
npm run dev:all            # Explicit parallel start for all experiences
```

## Architecture

### Technology Stack
- **Framework**: Next.js 15.2.4 with App Router
- **React**: Version 19
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Date handling**: date-fns v4
- **Validation**: Zod
- **Notifications**: Sonner
- **Theme management**: next-themes
- **Caching**: Vercel KV (Redis)

### Monorepo Integration
- Uses workspace packages: `@tara-hub/ui` and `@tara-hub/lib`
- Transpiles monorepo packages via `transpilePackages` in next.config.js
- External directory support enabled for accessing root-level files
- Path aliases configured for both local and shared components

### Path Aliases
```typescript
"@/*": ["./*"]                              // Local files
"@/components/*": ["./components/*"]        // Local components
"@/lib/*": ["./lib/*"]                      // Local lib
"@/shared/components/*": ["../../components/*"]  // Root components
"@/shared/lib/*": ["../../lib/*"]           // Root lib
"@/shared/hooks/*": ["../../hooks/*"]       // Root hooks
"@/shared/ui/*": ["../../components/ui/*"]  // Root UI components
```

## Application Structure

### Main Routes
- `/` - Homepage with navigation to all sections
- `/fabrics` - Fabric browsing
- `/fabric/[id]` - Individual fabric details
- `/products` - Product listing
- `/blog` - Blog post listing
- `/blog/[slug]` - Individual blog post
- `/calendar` - Post scheduling calendar
- `/posts` - Social media posts
- `/strategy` - Strategy page

### Authentication Routes
- `/auth/signin` - Sign in page
- `/auth/verify-request` - Email verification pending
- `/auth/error` - Authentication error handling
- `/unauthorized` - Unauthorized access page

### Test Routes (Development)
- `/test-auth` - Authentication testing
- `/test-crud` - CRUD operations testing
- `/test-google-auth` - Google OAuth testing
- `/test-admin` - Admin features testing

## Deployment Configuration

### Vercel Setup
- **Project name**: tara-hub-store-guide
- **Build command**: `cd ../.. && npm install && cd experiences/store-guide && npm run build`
- **Output directory**: `.next`
- **Region**: `iad1`
- **Deploy ignores**: Only deploys when changes in `experiences/store-guide` or `packages/`

### Environment Variables
- `NEXT_PUBLIC_APP_NAME`: "Store Guide"
- Inherits database and auth variables from root `.env.local`
- NextAuth configuration required for authentication features

## Configuration Details

### Next.js Configuration
- Strict mode enabled
- External directory support for monorepo structure
- Image domains configured for Unsplash
- Transpiles `@tara-hub/components` and `@tara-hub/lib` packages

### TypeScript Configuration
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler
- JSX: preserve
- Incremental compilation enabled

## Development Workflow

1. **Start development server**: `npm run dev` (runs on port 3007)
2. **Type checking**: `npm run type-check` before committing
3. **Linting**: `npm run lint` to check code quality
4. **Building**: `npm run build` to verify production build

## Key Implementation Notes

- Server components by default (Next.js 15 App Router)
- Client components require explicit `'use client'` directive
- Authentication integration with NextAuth.js
- Multiple test pages available for development and debugging
- Minimal root layout (`app/layout.tsx`) passes through children
- Homepage (`app/page.tsx`) provides navigation hub to all features