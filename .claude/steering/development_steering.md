# Tara Hub - Development Steering Context

**Last Updated**: 2025-08-21
**Dev Environment**: Node.js 18+, pnpm/npm, PostgreSQL

## Quick Start (What Actually Works)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Configure: DATABASE_URL, RESEND_API_KEY, JWT_SECRET, KV_* (optional)

# 3. Set up database
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio (visual DB browser)

# 4. Start development
npm run dev              # All apps (turbo parallel mode)
npm run dev:admin        # Just admin dashboard (port 3000)

# 5. Access applications
# Admin: http://localhost:3000
# Fabric Store: http://localhost:3006  
# Store Guide: http://localhost:3007
```

## Development Commands (Verified)

### Core Development
```bash
npm run dev              # Start all apps with Turbo
npm run dev:admin        # Admin app only
npm run build           # Build all apps
npm run lint            # ESLint across monorepo
npm run test            # Run Vitest tests
npm run test:ui         # Vitest UI browser
```

### Database Management
```bash
npm run db:generate     # Generate migrations from schema changes
npm run db:migrate      # Apply migrations (not commonly used)
npm run db:push        # Push schema directly (dev mode)
npm run db:studio      # Visual database browser
```

### Deployment & Environment
```bash
npm run deploy          # Deploy all to Vercel
npm run deploy:admin    # Deploy admin only
npm run env:pull       # Pull env vars from Vercel
npm run vercel:env     # Sync .env.local from Vercel
```

## Project Structure for Developers

### Where to Put New Code

```typescript
// NEW CODE - Use module structure
src/modules/[feature]/
  ├── components/     // React components
  ├── hooks/          // Custom React hooks  
  ├── services/       // Business logic
  ├── schemas/        // Zod validation
  └── repositories/   // Data access

// SHARED CODE
src/shared/
  ├── components/ui/  // Reusable UI components
  ├── hooks/          // Shared hooks
  └── utils/          // Helper functions

// AVOID creating new code in:
lib/                  // Legacy location
components/           // Legacy location
packages/             // Being phased out
```

### Import Path Guidelines

```typescript
// ✅ CORRECT - Use new module paths
import { FabricService } from '@/modules/fabrics/services/fabric.service'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/shared/hooks/use-auth'

// ⚠️ LEGACY - Still works but avoid for new code
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

// ❌ WRONG - Don't use relative paths across modules
import { FabricService } from '../../../modules/fabrics/services'
```

## Authentication Development

### Adding Protected Routes

```typescript
// In any admin page component
import { useAuth } from '@/shared/hooks/use-auth'

export default function AdminPage() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth({ 
    required: true,
    role: 'admin' 
  })

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated || !isAdmin) return null // Hook handles redirect

  return <div>Protected content</div>
}
```

### API Route Protection

```typescript
// In API routes
import { authMiddleware } from '@/modules/auth/middleware/auth.middleware'

export async function POST(request: Request) {
  const authResult = await authMiddleware(request)
  if (!authResult.authenticated) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Your API logic here
}
```

## Database Development

### Working with Drizzle ORM

```typescript
// Get database client
import { db } from '@/core/database/drizzle/client'
import { fabrics } from '@/core/database/schemas'

// Simple query
const allFabrics = await db.select().from(fabrics)

// With conditions
const activeFabrics = await db
  .select()
  .from(fabrics)
  .where(eq(fabrics.status, 'active'))
```

### Adding New Database Fields

1. Update schema in `src/core/database/schemas/[table].ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:push` to apply changes
4. Update relevant Zod schemas for validation

## Common Development Tasks

### Adding a New Feature Module

```bash
# 1. Create module structure
mkdir -p src/modules/myfeature/{components,hooks,services,schemas}

# 2. Create service
touch src/modules/myfeature/services/myfeature.service.ts

# 3. Create API route
mkdir -p app/api/v1/myfeature
touch app/api/v1/myfeature/route.ts

# 4. Add UI components
touch src/modules/myfeature/components/myfeature-list.tsx
```

### Working with Mock Features

**IMPORTANT**: Many UI features show mock data:
- AI content generation → `setTimeout` with fake response
- Analytics dashboards → Hardcoded chart data
- Social media metrics → Static numbers

When modifying these areas:
1. Check if feature is real or mock
2. Don't spend time "fixing" mock features
3. Ask before implementing real versions

### Testing Your Changes

```bash
# Run tests
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # Browser UI

# Test specific areas
npm run test -- auth     # Test auth module
npm run test -- fabrics  # Test fabrics module
```

## Environment Variables

### Required for Development
```env
# Database (use Neon or local PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication  
JWT_SECRET=your-secret-here
NEXTAUTH_SECRET=same-as-jwt-secret
NEXTAUTH_URL=http://localhost:3000

# Email (get from Resend dashboard)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=admin@yourdomain.com
```

### Optional (but recommended)
```env
# Vercel KV for caching
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=xxxx

# Cloudflare R2 for images
R2_ACCOUNT_ID=xxxx
R2_ACCESS_KEY_ID=xxxx
R2_SECRET_ACCESS_KEY=xxxx
R2_BUCKET_NAME=tara-hub
```

## Debugging Tips

### Common Issues

1. **Import errors during transition**
   - Try both old and new import paths
   - Check REFACTORING_ANALYSIS_REPORT.md

2. **Authentication not working**
   - Verify email in admin whitelist
   - Check RESEND_API_KEY is valid
   - Ensure JWT_SECRET is set

3. **Database connection issues**
   - Verify DATABASE_URL format
   - Check connection limits on Neon
   - Use `npm run db:studio` to debug

4. **Build errors**
   - TypeScript errors are currently ignored
   - Check next.config.mjs if adding new build issues

### Development Tools

- **Drizzle Studio**: Visual database browser (`npm run db:studio`)
- **React DevTools**: For component debugging
- **Network tab**: Check API calls for auth issues
- **Vercel CLI**: For deployment testing (`vercel dev`)

## Code Style Guidelines

### TypeScript
- Use strict types where possible
- Avoid `any` type
- Define interfaces for API responses
- Use Zod for runtime validation

### React Components
- Server components by default
- 'use client' only when needed
- Use shadcn/ui components
- Follow composition patterns

### API Routes
- Always validate input
- Return consistent error responses
- Use proper HTTP status codes
- Include error messages for debugging

## What NOT to Do

1. **Don't implement mock features** without checking if they should be real
2. **Don't trust old steering docs** - verify claims against actual code
3. **Don't add to legacy directories** - use new module structure
4. **Don't commit sensitive data** - use environment variables
5. **Don't bypass authentication** - maintain security even in dev

## Getting Help

- Check `CLAUDE.md` for project overview
- Read `REFACTORING_ANALYSIS_REPORT.md` for migration status
- Look at existing modules for patterns
- Test files show usage examples
- Use `npm run db:studio` to explore data structure