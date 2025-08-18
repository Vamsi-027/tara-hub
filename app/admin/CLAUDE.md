# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tara Hub Admin - Admin dashboard for managing a fabric marketplace built with Next.js 15, Turbo monorepo, Drizzle ORM, and hybrid data persistence using PostgreSQL and Vercel KV.

## Development Commands

```bash
# Install dependencies
npm install

# Development
npm run dev               # Start admin dev server (default)
npm run dev:all          # Start all apps in parallel (monorepo)

# Build
npm run build            # Build with Turbo
npm run build:admin      # Build admin only
npm run build:all        # Build all apps

# Database (Drizzle ORM)
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio GUI

# Code Quality
npm run lint             # Run ESLint via Turbo
```

## Architecture

### Monorepo Structure
- **Root app**: Admin dashboard (this directory)
- **experiences/**: Independent Next.js apps
  - `fabric-store/` - Customer-facing fabric store
  - `store-guide/` - Store guide application
- **packages/**: Shared libraries
- Uses Turbo for orchestration (`turbo.json`)

### Data Persistence Strategy
1. **PostgreSQL** (via Drizzle ORM) - Users, sessions, relational data
2. **Vercel KV** (Redis) - Fast reads, caching, fabric catalog
3. **Fallback** - In-memory store when KV unavailable (dev mode)
4. **Seed data** - Auto-loads from `lib/fabric-seed-data.ts`

### Authentication
- NextAuth.js with JWT strategy
- Google OAuth provider
- Admin whitelist in `lib/auth.ts`:
  - varaku@gmail.com
  - batchu.kedareswaraabhinav@gmail.com
  - vamsicheruku027@gmail.com
  - admin@deepcrm.ai

### API Routes Structure
All routes in `app/api/`:
- **Public**: `/api/fabrics` (GET), `/api/blog` (GET)
- **Admin Protected**: All POST/PUT/DELETE operations
- **Bulk Operations**: `/api/v1/fabrics/bulk`
- Uses ISR with 60s revalidation for performance

## Environment Variables

Required in `.env.local`:
```env
# Database
DATABASE_URL=postgresql://...
# OR
POSTGRES_URL=postgresql://...

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Google OAuth
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...

# Vercel KV (Optional - falls back to memory)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Cloudflare R2 (Image Storage)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

## Key Files & Directories

### Configuration
- `turbo.json` - Monorepo task orchestration
- `drizzle.config.ts` - Database configuration
- `next.config.mjs` - Next.js config (has ESLint/TS errors temporarily ignored)

### Database
- `lib/db.ts` - Database client
- `lib/auth-schema.ts` - Auth tables
- `lib/db/schema/*.schema.ts` - Domain schemas

### Services & Repositories
- `lib/services/fabric.service.ts` - Fabric business logic
- `lib/repositories/fabric.repository.ts` - Data access layer
- `lib/cache/redis.ts` - Caching layer

### Authentication
- `lib/auth.ts` - NextAuth configuration
- `components/auth/protected-route.tsx` - Route protection

### Data Management
- `lib/fabric-kv.ts` - KV operations for fabrics
- `lib/memory-store.ts` - In-memory fallback
- `lib/fabric-seed-data.ts` - Initial fabric data

## Admin Features

### Fabric Management
- CRUD operations via `/admin/fabrics`
- Bulk import/export
- Image upload to Cloudflare R2

### Blog System
- Create/edit posts at `/admin/blog`
- Draft/published states
- Rich text editing

### Team Management
- Invite team members via email
- Role-based access control
- Located at `/admin/team`

## Common Development Tasks

### Add New Admin User
1. Add email to `adminEmails` array in `lib/auth.ts`
2. Restart dev server

### Test KV Connection
```bash
curl http://localhost:3000/api/test-kv
```

### Seed Fabric Data
```bash
curl -X POST http://localhost:3000/api/seed
```

### Access Admin Dashboard
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/admin`
3. Sign in with whitelisted Google account

## Deployment

- **Platform**: Vercel
- **Auto-deploy**: Push to `main` branch
- **Production**: https://tara-hub.vercel.app/admin