---
description: Diagnose and fix build errors across monorepo
argument-hint: [app-name]
allowed-tools: Bash, Read, Grep, Glob
---

# Fix Build Errors

Diagnose and fix build for: ${1:-all apps}

## Build Diagnosis:

### 1. Check Build Status
!`npm run build 2>&1 | head -n 50`

### 2. Common Build Issues:

#### TypeScript Errors
```bash
npm run type-check
```

Common fixes:
- Missing type definitions: `npm install --save-dev @types/[package]`
- Type mismatches: Check function signatures
- Strict mode violations: Review tsconfig.json

#### Module Resolution
```bash
# Check for missing dependencies
npm ls [package-name]

# Install missing packages
npm install [package-name]
```

#### Next.js Build Issues
```bash
# Clear cache
rm -rf .next
npm run build

# Check for circular dependencies
npx madge --circular --extensions ts,tsx ./app
```

#### Medusa Build Issues
```bash
cd medusa
npm run build

# Common issues:
# - MikroORM configuration
# - Module resolution in custom modules
# - TypeScript strict mode
```

### 3. Turbo Cache Issues
```bash
# Clear turbo cache
rm -rf node_modules/.cache/turbo
npx turbo clean

# Rebuild
npm run build
```

## Monorepo Specific:

### Check Workspace Dependencies
```bash
# Verify workspace structure
npm ls --workspaces

# Check for version conflicts
npm dedupe
```

### Fix Dependency Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf medusa/node_modules medusa/package-lock.json
npm install

# Rebuild from scratch
npm run clean && npm install && npm run build
```

## Environment-Specific:

### Development Build
```bash
npm run dev
```

### Production Build
```bash
NODE_ENV=production npm run build
```

### Vercel Build (Frontend)
```bash
# Simulate Vercel build
VERCEL=1 npm run build
```

### Railway Build (Medusa)
```bash
# Simulate Railway build
cd medusa
npm ci --only=production
npm run build
```

## Build Optimization:

After fixing:
```bash
# Check bundle size
npm run build
npx next-bundle-analyzer

# Optimize imports
npx depcheck
```

## Common Solutions:

1. **React Version Conflicts**: Ensure consistent React versions
2. **Path Aliases**: Check tsconfig paths configuration
3. **Environment Variables**: Verify all required env vars
4. **Node Version**: Check .nvmrc and package.json engines
5. **Memory Issues**: Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"`

If build continues to fail, use frontend-integration-specialist or medusa-commerce-specialist agents.