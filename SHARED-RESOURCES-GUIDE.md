# Shared Resources Guide - Avoiding Duplication

## Overview

When deploying multiple experiences to separate Vercel projects, you need strategies to share common components, utilities, and assets without duplicating code. Here are the best approaches:

## Strategy 1: Internal NPM Packages (Best for Large Teams)

### Setup Shared Packages

Create a packages directory structure:

```
tara-hub/
├── packages/
│   ├── ui/                    # Shared UI components
│   │   ├── package.json
│   │   ├── components/
│   │   └── index.ts
│   ├── lib/                   # Shared utilities
│   │   ├── package.json
│   │   ├── utils/
│   │   └── index.ts
│   └── config/                # Shared configs
│       ├── package.json
│       ├── tailwind/
│       └── typescript/
```

### 1. Create UI Package

```bash
mkdir -p packages/ui
```

**packages/ui/package.json:**
```json
{
  "name": "@tara-hub/ui",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./button": "./components/button.tsx",
    "./card": "./components/card.tsx"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19"
  }
}
```

**packages/ui/index.ts:**
```typescript
export * from './components/button'
export * from './components/card'
export * from './components/dialog'
// ... export all shared components
```

### 2. Create Lib Package

**packages/lib/package.json:**
```json
{
  "name": "@tara-hub/lib",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "exports": {
    ".": "./index.ts",
    "./utils": "./utils/index.ts",
    "./types": "./types/index.ts",
    "./hooks": "./hooks/index.ts"
  }
}
```

### 3. Update Root package.json

```json
{
  "name": "tara-hub",
  "private": true,
  "workspaces": [
    "packages/*",
    "experiences/*",
    "."
  ]
}
```

### 4. Use in Experiences

**experiences/fabric-store/package.json:**
```json
{
  "dependencies": {
    "@tara-hub/ui": "workspace:*",
    "@tara-hub/lib": "workspace:*"
  }
}
```

**In your code:**
```typescript
import { Button, Card } from '@tara-hub/ui'
import { cn, formatCurrency } from '@tara-hub/lib/utils'
import type { Fabric, SwatchOrder } from '@tara-hub/lib/types'
```

## Strategy 2: Symlinks (Quick Solution)

### For Development

```bash
# Create symlinks for shared resources
cd experiences/fabric-store
mklink /D components ..\..\components
mklink /D lib ..\..\lib
mklink /D hooks ..\..\hooks
```

### Update tsconfig.json

**experiences/fabric-store/tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["../../components/*"],
      "@/lib/*": ["../../lib/*"],
      "@/hooks/*": ["../../hooks/*"]
    }
  }
}
```

## Strategy 3: Build-Time Copying (Simple but Effective)

### Add Build Scripts

**experiences/fabric-store/package.json:**
```json
{
  "scripts": {
    "prebuild": "node ../../scripts/copy-shared.js fabric-store",
    "build": "next build",
    "postbuild": "node ../../scripts/cleanup-shared.js fabric-store"
  }
}
```

**scripts/copy-shared.js:**
```javascript
const fs = require('fs-extra');
const path = require('path');

const experience = process.argv[2];
const experiencePath = path.join(__dirname, '..', 'experiences', experience);

// Copy shared resources
fs.copySync(
  path.join(__dirname, '..', 'components'),
  path.join(experiencePath, 'components-shared')
);

fs.copySync(
  path.join(__dirname, '..', 'lib'),
  path.join(experiencePath, 'lib-shared')
);
```

## Strategy 4: Git Submodules (For Separate Repos)

### Create Shared Repository

```bash
# Create new repo for shared resources
git init tara-hub-shared
cd tara-hub-shared
# Move shared components here
git add .
git commit -m "Initial shared resources"
git remote add origin https://github.com/yourusername/tara-hub-shared.git
git push -u origin main
```

### Add as Submodule

```bash
cd tara-hub
git submodule add https://github.com/yourusername/tara-hub-shared.git shared
git submodule update --init --recursive
```

### Use in Experiences

```typescript
import { Button } from '../../shared/components/ui/button'
import { cn } from '../../shared/lib/utils'
```

## Strategy 5: Turborepo (Monorepo Build System)

### Install Turborepo

```bash
npm install turbo --save-dev
```

### Create turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "@tara-hub/ui#build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Benefits
- Cached builds
- Parallel execution
- Smart dependency tracking
- Remote caching (Vercel)

## Strategy 6: Module Federation (Advanced)

### Next.js Module Federation

**Install Plugin:**
```bash
npm install @module-federation/nextjs-mf
```

**experiences/fabric-store/next.config.js:**
```javascript
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config) {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'fabricStore',
        remotes: {
          ui: `ui@${process.env.NEXT_PUBLIC_UI_HOST}/_next/static/chunks/remoteEntry.js`,
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true }
        }
      })
    );
    return config;
  }
}
```

## Recommended Approach

### For Your Current Setup

**Phase 1: Immediate (Use Symlinks)**
```bash
# Quick setup for development
cd experiences/fabric-store
mklink /D shared-components ..\..\components
mklink /D shared-lib ..\..\lib
```

**Phase 2: Short-term (NPM Workspaces)**
1. Convert to NPM workspaces
2. Create @tara-hub/ui and @tara-hub/lib packages
3. Import as dependencies

**Phase 3: Long-term (Turborepo)**
1. Add Turborepo for optimized builds
2. Enable remote caching
3. Implement parallel builds

## Vercel Deployment with Shared Resources

### Using NPM Workspaces

**vercel.json (for each experience):**
```json
{
  "buildCommand": "npm install --workspace=@tara-hub/ui --workspace=@tara-hub/lib && npm run build",
  "installCommand": "npm install --workspaces"
}
```

### Using Build-Time Copy

**vercel.json:**
```json
{
  "buildCommand": "cp -r ../../components ./components-shared && cp -r ../../lib ./lib-shared && npm run build"
}
```

## Cost & Performance Comparison

| Strategy | Build Time | Bundle Size | Complexity | Maintenance |
|----------|------------|-------------|------------|-------------|
| NPM Packages | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Symlinks | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Build Copy | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Submodules | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Turborepo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Module Fed | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐ |

## Example: Converting Current Setup

### Step 1: Create UI Package

```bash
mkdir -p packages/ui/components
cp -r components/ui/* packages/ui/components/
```

### Step 2: Create package.json

```json
// packages/ui/package.json
{
  "name": "@tara-hub/ui",
  "version": "1.0.0",
  "main": "index.ts",
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.454.0",
    "tailwind-merge": "^2.5.5"
  }
}
```

### Step 3: Update Imports

```typescript
// Before
import { Button } from '@/components/ui/button'

// After
import { Button } from '@tara-hub/ui/button'
```

## Benefits Summary

1. **No Code Duplication**: Single source of truth
2. **Consistent Updates**: Change once, deploy everywhere
3. **Smaller Git Repo**: No repeated code
4. **Type Safety**: Shared TypeScript definitions
5. **Independent Versioning**: Can version packages separately
6. **Better Caching**: Vercel caches unchanged packages

## Quick Start Commands

```bash
# Option 1: NPM Workspaces
npm init -w ./packages/ui
npm init -w ./packages/lib
npm install

# Option 2: Turborepo
npx create-turbo@latest --example with-shared-ui
npm install turbo --save-dev
npx turbo build

# Option 3: Symlinks (Windows)
cd experiences/fabric-store
mklink /D shared ..\..\packages

# Option 4: Build Script
node scripts/setup-shared.js
```

Choose based on your team size and deployment frequency!