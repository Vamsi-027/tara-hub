# Development Steering Document - Tara Hub

## Development Stack

### Core Technologies
- **Build System**: Turborepo 2.5+ with NPM Workspaces
- **Package Manager**: NPM 10.2.0 with workspace support
- **Runtime**: Node.js 18+ 
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS 3.4
- **UI Library**: @tara-hub/ui (internal package with shadcn/ui components)

## Turborepo Development Workflow

### Quick Start Commands
```bash
# Install all dependencies (from root)
npm install

# Start all applications in parallel
npx turbo dev

# Start specific applications
npm run dev:admin                        # Admin dashboard only
cd experiences/fabric-store && npm run dev  # Fabric store only
cd experiences/store-guide && npm run dev   # Store guide only

# Build all applications
npx turbo build

# Build specific application
npm run build:admin
cd experiences/fabric-store && npm run build

# Run linting across all packages
npx turbo lint

# Type checking
npx turbo type-check
```

### Port Allocation
| Application | Development Port | Purpose |
|------------|------------------|---------|
| Admin Dashboard | 3000 | Main admin interface |
| Fabric Store | 3006 | Customer fabric ordering |
| Store Guide | 3007 | Customer store interface |
| Future Apps | 3008+ | Additional experiences |

## NPM Workspace Structure

### Package Architecture
```
packages/
├── @tara-hub/ui       # Shared UI components
├── @tara-hub/lib      # Shared utilities, types, hooks
└── @tara-hub/config   # Shared configurations
```

### Working with Packages

#### Adding Dependencies to Packages
```bash
# Add to specific package
npm install [package-name] -w @tara-hub/ui
npm install [package-name] -w @tara-hub/lib

# Add to specific experience
npm install [package-name] -w @tara-hub/fabric-store

# Add to root/admin
npm install [package-name]
```

#### Creating New Shared Components
1. Add component to `packages/ui/components/`
2. Export from `packages/ui/index.ts`
3. Import in experiences: `import { NewComponent } from '@tara-hub/ui'`

#### Adding Utilities
1. Add to `packages/lib/utils/`
2. Export from `packages/lib/utils/index.ts`
3. Import: `import { newUtil } from '@tara-hub/lib/utils'`

## Development Patterns

### Import Conventions
```typescript
// ✅ CORRECT - Import from packages
import { Button, Card } from '@tara-hub/ui'
import { cn, formatCurrency } from '@tara-hub/lib/utils'
import type { SwatchFabric } from '@tara-hub/lib/types'

// ❌ INCORRECT - Don't use relative imports for shared code
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
```

### Component Development
```typescript
// packages/ui/components/new-component.tsx
'use client'  // Only if needed

import { cn } from '@tara-hub/lib/utils'
import type { ComponentProps } from '@tara-hub/lib/types'

export function NewComponent({ className, ...props }: ComponentProps) {
  return (
    <div className={cn('default-styles', className)} {...props}>
      {/* Component content */}
    </div>
  )
}
```

### Adding New Experience
```bash
# Create new experience
mkdir -p experiences/new-app
cd experiences/new-app

# Initialize package.json
npm init -y

# Update package.json name
# "name": "@tara-hub/new-app"

# Add dependencies
npm install next react react-dom @tara-hub/ui @tara-hub/lib

# Create Next.js structure
mkdir app
echo "export default function Home() { return <h1>New App</h1> }" > app/page.tsx
```

## Turborepo Configuration

### Cache Management
```bash
# Clear Turborepo cache
npx turbo daemon clean

# Run without cache
npx turbo dev --no-cache

# See what's cached
npx turbo run build --dry-run
```

### Filtering Builds
```bash
# Build only changed packages
npx turbo build --filter=[HEAD^1]

# Build specific package and dependencies
npx turbo build --filter=@tara-hub/fabric-store...

# Build without dependencies
npx turbo build --filter=@tara-hub/fabric-store --no-deps
```

## Environment Variables

### Local Development Setup
```bash
# Root .env.local (for admin app)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-dev-secret
DATABASE_URL=your-database-url
KV_REST_API_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-token

# experiences/fabric-store/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Fabric Store

# experiences/store-guide/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Store Guide
```

### Environment Variable Loading
- Turborepo automatically loads `.env` files
- Each app can have its own `.env.local`
- Shared env vars can be in root `.env`

## Database Development

### Running Migrations
```bash
# Generate migration
npm run db:generate

# Push to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Database Schema Location
- Main schemas: `/lib/db-schema.ts`
- Auth schema: `/lib/auth-schema.ts`
- Migrations: `/drizzle/`

## Testing Workflow

### Unit Testing
```bash
# Run all tests
npx turbo test

# Run specific package tests
npx turbo test --filter=@tara-hub/ui

# Watch mode
npm test -- --watch
```

### E2E Testing
```bash
# Run Playwright tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test auth.spec.ts
```

## Common Development Tasks

### Adding Authentication to Experience
```typescript
// Use shared auth from @tara-hub/lib
import { authConfig } from '@tara-hub/lib/auth'
import NextAuth from 'next-auth'

export const { auth, handlers } = NextAuth(authConfig)
```

### Sharing Data Between Apps
```typescript
// packages/lib/data/shared-data.ts
export const sharedData = {
  // Shared data structure
}

// In any app
import { sharedData } from '@tara-hub/lib/data'
```

### Creating Shared API Client
```typescript
// packages/lib/api/client.ts
export class APIClient {
  constructor(private baseURL: string) {}
  
  async fetchFabrics() {
    // Implementation
  }
}

// In experience
import { APIClient } from '@tara-hub/lib/api'
const client = new APIClient(process.env.NEXT_PUBLIC_API_URL)
```

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -aon | findstr :3006
taskkill //PID [pid] //F

# Mac/Linux
lsof -i :3006
kill -9 [pid]
```

### Package Not Found
```bash
# Reinstall workspaces
npm install

# Clear node_modules
rm -rf node_modules packages/*/node_modules experiences/*/node_modules
npm install
```

### TypeScript Errors with Packages
```bash
# Rebuild TypeScript references
npx turbo type-check

# Restart TS Server in VS Code
Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

### Turborepo Not Working
```bash
# Check package manager field
# package.json should have: "packageManager": "npm@10.2.0"

# Clear turbo cache
rm -rf .turbo node_modules/.cache/turbo
```

## Performance Optimization

### Development Speed
- Turborepo caches unchanged packages
- Parallel execution speeds up multi-app development
- Hot reload works across all apps

### Build Optimization
```bash
# Analyze bundle size
ANALYZE=true npm run build

# Check build output
npx turbo build --summarize
```

### Memory Management
```bash
# Increase Node memory for large builds
NODE_OPTIONS="--max-old-space-size=4096" npx turbo build
```

## VS Code Configuration

### Recommended Extensions
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Turbo Console Log
- Prettier
- ESLint

### Workspace Settings
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.configFile": "./tailwind.config.ts"
}
```

## Best Practices

### DO's
✅ Use Turborepo commands for development and builds
✅ Import shared code from `@tara-hub/*` packages
✅ Keep experience-specific code in experience folders
✅ Run `npm install` from root directory
✅ Use `npx turbo dev` for parallel development

### DON'Ts
❌ Don't duplicate code - add to packages instead
❌ Don't use relative imports for shared code
❌ Don't install dependencies in wrong workspace
❌ Don't commit `.turbo` cache folder
❌ Don't bypass Turborepo for builds

## Continuous Integration

### GitHub Actions Example
```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm ci
      - run: npx turbo build
      - run: npx turbo test
      - run: npx turbo lint
```

## Monitoring & Debugging

### Development Logs
```bash
# Verbose Turborepo output
TURBO_LOG_LEVEL=debug npx turbo dev

# See task execution order
npx turbo dev --graph
```

### Performance Monitoring
- Use Chrome DevTools for client performance
- Check Next.js build output for bundle sizes
- Monitor Turborepo cache hit rates

## Migration Guide

### From Old Structure to Packages
1. Move UI components to `packages/ui/components`
2. Move utilities to `packages/lib/utils`
3. Update all imports from `@/components` to `@tara-hub/ui`
4. Update imports from `@/lib` to `@tara-hub/lib`
5. Test with `npx turbo dev`

This development guide ensures efficient development with Turborepo and NPM Workspaces while maintaining code quality and performance.