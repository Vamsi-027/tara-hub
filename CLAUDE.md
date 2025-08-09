# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 e-commerce application for The Hearth & Home Store (custom cushions and pillows). The application features product catalogs, admin dashboard, blog functionality, and SEO optimization.

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives wrapped in shadcn/ui components
- **Authentication**: NextAuth.js with Google OAuth provider
- **Database**: Vercel KV with fallback to in-memory storage
- **Deployment**: Vercel

### Directory Structure
- `app/` - Next.js App Router pages and API routes
  - `admin/` - Protected admin dashboard pages
  - `api/` - API endpoints for posts, products, blog, strategy
  - `auth/` - Authentication pages
  - `blog/` - Public blog pages with dynamic routes
- `components/` - React components
  - `ui/` - Reusable UI primitives from shadcn/ui
- `lib/` - Core utilities and business logic
  - `auth.ts` - NextAuth configuration (admin: varaku@gmail.com)
  - `kv.ts` - Database abstraction layer with Vercel KV
  - `blog-model.ts` - Blog post data model
  - `types.ts` - TypeScript type definitions
- `hooks/` - Custom React hooks for data fetching

### Key Architectural Patterns

1. **Data Layer**: The application uses Vercel KV for persistence with graceful fallback to in-memory storage when KV is unavailable. All data operations go through `lib/kv.ts`.

2. **Authentication**: Admin access is restricted to specific email addresses defined in `lib/auth.ts`. The admin role is added to the session based on email matching.

3. **API Routes**: RESTful API endpoints in `app/api/` handle CRUD operations. Admin endpoints check session authentication before allowing modifications.

4. **Component Architecture**: Uses composition pattern with shadcn/ui components built on Radix UI primitives. Components are in `components/` with UI primitives in `components/ui/`.

5. **Type Safety**: Comprehensive TypeScript types in `lib/types.ts` and `lib/db-schema.ts` ensure type safety across the application.

## Environment Variables

Required environment variables (set in `.env.local`):

```env
# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# Google OAuth (for admin access)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Vercel KV (optional, falls back to in-memory)
KV_REST_API_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-token
```

## Important Configuration

### Build Configuration
The project has TypeScript and ESLint errors temporarily ignored in `next.config.mjs`:
- `eslint.ignoreDuringBuilds: true`
- `typescript.ignoreBuildErrors: true`

These should be addressed when making significant changes.

### Admin Access
Admin functionality is restricted to users with emails listed in `lib/auth.ts`. Currently set to `varaku@gmail.com`.

### Path Aliases
The project uses `@/` as a path alias for the root directory, configured in `tsconfig.json`.

## API Endpoints

Key API routes:
- `/api/auth/[...nextauth]` - Authentication endpoints
- `/api/blog` - Blog post CRUD operations
- `/api/posts` - Social media post management
- `/api/products` - Product catalog management
- `/api/strategy` - Marketing strategy content

All modification endpoints require admin authentication.

## Deployment

The application auto-deploys to Vercel on push to the `main` branch. Configuration is in `vercel.json`.

## Current Status

The repository has uncommitted changes:
- Modified `.claude/settings.local.json`
- New directories: `.claude/deep research/`, `app/api/blog/`, `creatives/`
- New files: `etsy searches.docx`, `lib/blog-model.ts`

These changes appear to be adding blog functionality and creative assets.