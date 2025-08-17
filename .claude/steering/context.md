# AI Context Engineering Document - Tara Hub

## Purpose

This document provides optimal context for Claude Code and other AI assistants working with the Tara Hub codebase. It defines the architecture, patterns, and conventions to ensure consistent and accurate AI assistance.

## Critical Context for AI Assistants

### Architecture Summary
- **Monorepo** with Turborepo and NPM Workspaces
- **Multi-experience** platform with independent deployments
- **Shared packages** (@tara-hub/ui, @tara-hub/lib, @tara-hub/config)
- **Three applications**: Admin (port 3000), Fabric Store (3006), Store Guide (3007)
- **Vercel deployment** with separate projects per experience

### Key Commands AI Should Use
```bash
# ALWAYS use these commands
npx turbo dev              # Start all apps
npx turbo build            # Build all apps
npm install                # Install from root only
npm run dev:admin          # Start admin only

# NEVER use these
cd experiences/[name] && npm install  # Wrong - use root install
npm run dev                # Wrong - use turbo dev
```

### Import Pattern Recognition
```typescript
// ✅ CORRECT - AI should suggest these
import { Button } from '@tara-hub/ui'
import { cn } from '@tara-hub/lib/utils'
import type { SwatchFabric } from '@tara-hub/lib/types'

// ❌ INCORRECT - AI should fix these
import { Button } from '../../components/ui/button'
import { cn } from '@/lib/utils'
```

## Project Structure Mental Model

### Directory Hierarchy
```
tara-hub/                      # Root monorepo
├── app/                       # Admin dashboard ONLY
├── packages/                  # Shared NPM packages
│   ├── ui/                   # @tara-hub/ui
│   ├── lib/                  # @tara-hub/lib
│   └── config/               # @tara-hub/config
├── experiences/              # Customer-facing apps
│   ├── fabric-store/         # Independent Next.js app
│   └── store-guide/          # Independent Next.js app
└── [legacy folders]          # components/, lib/, hooks/ (being migrated)
```

### Package Resolution
- Shared code MUST be in `/packages`
- Each experience uses `@tara-hub/*` packages
- Legacy folders are being migrated to packages

## Common AI Tasks & Solutions

### Task: Add New UI Component
```typescript
// 1. Create in packages/ui/components/new-component.tsx
export function NewComponent() { }

// 2. Export from packages/ui/index.ts
export * from './components/new-component'

// 3. Use in any app
import { NewComponent } from '@tara-hub/ui'
```

### Task: Add New Experience
```bash
# Create structure
mkdir -p experiences/new-app/app
cd experiences/new-app

# Create package.json
{
  "name": "@tara-hub/new-app",
  "dependencies": {
    "@tara-hub/ui": "*",
    "@tara-hub/lib": "*"
  }
}

# Install from root
cd ../..
npm install
```

### Task: Fix Import Errors
```typescript
// If AI sees: Module not found '@/components/ui/button'
// AI should suggest: Change to '@tara-hub/ui'

// If AI sees: Cannot find module '../../lib/utils'
// AI should suggest: Change to '@tara-hub/lib/utils'
```

### Task: Deploy to Vercel
```bash
# AI should know each app deploys separately
vercel --prod  # In each experience folder

# Build commands for experiences
cd ../.. && npm install && cd experiences/[name] && npm run build
```

## Technology Stack Context

### Core Technologies
| Technology | Version | Purpose | AI Notes |
|-----------|---------|---------|----------|
| Next.js | 15.2.4 | Framework | Use App Router, not Pages Router |
| React | 19 | UI Library | Use modern hooks, no class components |
| TypeScript | 5 | Type Safety | Strict mode enabled |
| Turborepo | 2.5+ | Build System | Always use for dev/build |
| NPM Workspaces | 10.2.0 | Package Management | Root-level installs only |
| Tailwind CSS | 3.4 | Styling | Utility-first, no inline styles |
| Shadcn/ui | Latest | Components | In @tara-hub/ui package |
| Vercel | - | Deployment | Multi-project strategy |

### Database & Auth
- **Database**: Drizzle ORM with Neon Postgres
- **Auth**: NextAuth.js with Google OAuth
- **Storage**: Vercel KV for caching
- **Admin Email**: varaku@gmail.com

## Pattern Recognition for AI

### File Naming Patterns
```
✅ kebab-case.tsx         # Components
✅ utils.ts               # Utilities
✅ page.tsx              # Next.js pages
❌ ComponentName.tsx     # Wrong - use kebab-case
❌ utility_functions.ts  # Wrong - no snake_case
```

### Component Patterns
```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetch()
  return <div>{data}</div>
}

// Client Component (only when needed)
'use client'
import { useState } from 'react'
export function Interactive() {
  const [state, setState] = useState()
}
```

### API Route Patterns
```typescript
// app/api/[resource]/route.ts
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session) return new Response('Unauthorized', { status: 401 })
  // Handle request
}
```

## Error Resolution Guide

### Common Errors & AI Solutions

#### "Module not found" Errors
```
Error: Cannot find module '@/components/ui/button'
Solution: Change import to '@tara-hub/ui'
```

#### "Port already in use" Errors
```bash
# Windows solution
netstat -aon | findstr :3006
taskkill //PID [pid] //F
```

#### "Workspace not found" Errors
```bash
# Solution
cd [root]
npm install
```

#### Build Failures
```json
// Add to experience vercel.json
"buildCommand": "cd ../.. && npm install && cd experiences/[name] && npm run build"
```

## AI Behavioral Guidelines

### DO's for AI Assistants
✅ Use Turborepo commands (`npx turbo dev`)
✅ Import from `@tara-hub/*` packages
✅ Create shared code in `/packages`
✅ Install dependencies from root
✅ Check existing patterns before suggesting new ones
✅ Use TypeScript for all new code
✅ Follow existing file naming conventions

### DON'Ts for AI Assistants
❌ Don't duplicate code - use packages
❌ Don't install in experience folders
❌ Don't use relative imports for shared code
❌ Don't suggest Pages Router patterns
❌ Don't create components outside packages/ui
❌ Don't bypass Turborepo for builds
❌ Don't mix styling approaches (use Tailwind)

## Context Optimization Tips

### When AI Should Check Context
1. **Before creating files** - Check if similar exists in packages
2. **Before suggesting imports** - Verify package structure
3. **Before running commands** - Use Turborepo equivalents
4. **Before deployment advice** - Remember multi-project strategy

### Information Hierarchy for AI
1. **Primary**: Turborepo, NPM Workspaces, Package structure
2. **Secondary**: Next.js 15, TypeScript, Tailwind
3. **Tertiary**: Specific component implementations

### Response Optimization
- Keep responses concise (avoid over-explanation)
- Show code examples over descriptions
- Use proper import paths immediately
- Suggest Turborepo commands by default

## Debugging Assistance Patterns

### AI Debugging Workflow
1. Check if using correct imports (`@tara-hub/*`)
2. Verify running from correct directory (root for installs)
3. Ensure using Turborepo commands
4. Check port availability (3000, 3006, 3007)
5. Verify environment variables are set

### Build Error Analysis
```bash
# AI should suggest this sequence
npx turbo build --filter=[app] --verbose
npm ls @tara-hub/ui  # Check package linking
npx turbo dev --filter=[app]  # Test in dev mode
```

## Version Control Context

### Branch Strategy
- `main` - Production deployments
- `feature/*` - Feature development
- No direct commits to main

### Commit Message Format
```
feat: Add new component to @tara-hub/ui
fix: Resolve import error in fabric-store
chore: Update turborepo configuration
```

## Performance Optimization Context

### Build Performance
- Turborepo caches unchanged packages
- Remote caching available with Vercel
- Parallel builds for all experiences

### Runtime Performance
- Use Server Components by default
- Client Components only for interactivity
- Image optimization with Next.js Image
- Static generation where possible

## Security Context for AI

### Sensitive Information
- Never expose API keys in code
- Environment variables in `.env.local`
- Use `NEXT_PUBLIC_` prefix for client variables
- Admin restricted to varaku@gmail.com

### Security Patterns
```typescript
// Always check authentication
const session = await auth()
if (!session?.user) {
  return new Response('Unauthorized', { status: 401 })
}
```

## Future-Proofing Guidelines

### When Adding Features
1. Add to packages, not root folders
2. Follow existing patterns
3. Use TypeScript strictly
4. Document in steering files
5. Update this context document

### Scalability Considerations
- Each experience can scale independently
- Shared packages versioned separately
- Database connections pooled
- CDN for static assets

## Summary for AI Quick Reference

**Project Type**: Turborepo Monorepo with Multi-Experience Architecture
**Build Command**: `npx turbo build`
**Dev Command**: `npx turbo dev`
**Package Prefix**: `@tara-hub/`
**Deployment**: Separate Vercel projects per experience
**Ports**: Admin (3000), Fabric Store (3006), Store Guide (3007)
**Import From**: `@tara-hub/ui`, `@tara-hub/lib`
**Never**: Use relative imports for shared code

This context document should be the primary reference for AI assistants working with the Tara Hub codebase.