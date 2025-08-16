# Quick Setup Guide - Shared Resources

## 🚀 Immediate Solution (5 minutes)

### Option A: Symlinks (Windows)

Run these commands for each experience:

```powershell
# For Fabric Store
cd experiences\fabric-store
cmd /c mklink /D shared-components ..\..\components
cmd /c mklink /D shared-lib ..\..\lib
cmd /c mklink /D shared-hooks ..\..\hooks

# For Store Guide
cd ..\store-guide
cmd /c mklink /D shared-components ..\..\components
cmd /c mklink /D shared-lib ..\..\lib
cmd /c mklink /D shared-hooks ..\..\hooks
```

Then update imports in your experiences:
```typescript
// Instead of: import { Button } from '@/components/ui/button'
import { Button } from './shared-components/ui/button'
```

### Option B: Path Aliases (No file changes needed)

Update each experience's `tsconfig.json`:

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

And update `next.config.js`:

```javascript
module.exports = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, '../../components'),
      '@/lib': path.resolve(__dirname, '../../lib'),
      '@/hooks': path.resolve(__dirname, '../../hooks'),
    }
    return config
  }
}
```

## 📦 NPM Workspaces Solution (30 minutes)

### Step 1: Enable Workspaces

Update root `package.json`:
```json
{
  "workspaces": [
    "packages/*",
    "experiences/*",
    "."
  ]
}
```

### Step 2: Move Shared Code

```bash
# Copy UI components
xcopy components\ui packages\ui\components /E /I

# Copy lib utilities  
xcopy lib packages\lib\utils /E /I

# Copy hooks
xcopy hooks packages\lib\hooks /E /I
```

### Step 3: Install Workspace Dependencies

```bash
# From root directory
npm install

# This links all workspace packages automatically
```

### Step 4: Update Experience Dependencies

**experiences/fabric-store/package.json:**
```json
{
  "dependencies": {
    "@tara-hub/ui": "workspace:*",
    "@tara-hub/lib": "workspace:*"
  }
}
```

### Step 5: Update Imports

```typescript
// Old way
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// New way
import { Button } from '@tara-hub/ui/button'
import { cn } from '@tara-hub/lib/utils'
```

## 🏗️ Build Configuration for Vercel

### For Symlinks/Path Aliases

No changes needed - Vercel follows symlinks during build.

### For NPM Workspaces

Update each experience's `vercel.json`:

```json
{
  "buildCommand": "cd ../.. && npm install && cd experiences/fabric-store && npm run build"
}
```

Or use Turborepo (add to root):

```json
{
  "scripts": {
    "build:fabric": "turbo run build --filter=@tara-hub/fabric-store",
    "build:guide": "turbo run build --filter=@tara-hub/store-guide"
  }
}
```

## 🎯 Which Solution to Choose?

### Use Symlinks if:
- You need a quick fix right now
- You're deploying today
- You don't want to change import statements

### Use Path Aliases if:
- You want zero file structure changes
- You're OK with updating config files
- You want to keep existing import patterns

### Use NPM Workspaces if:
- You have time for proper setup
- You want the most scalable solution
- You plan to add more experiences
- You want proper versioning

## ⚡ Fastest Path Forward

1. **Right Now**: Use symlinks - takes 2 minutes
2. **This Week**: Migrate to NPM workspaces
3. **Next Month**: Add Turborepo for faster builds

## 🔧 Troubleshooting

### Symlinks not working on Windows?
Run PowerShell as Administrator:
```powershell
New-Item -ItemType SymbolicLink -Path "shared-components" -Target "..\..\components"
```

### Vercel build failing?
Add to `vercel.json`:
```json
{
  "functions": {
    "experiences/*/app/**/*.{js,ts,tsx}": {
      "includeFiles": "../../{components,lib,hooks}/**"
    }
  }
}
```

### TypeScript errors?
Update `tsconfig.json`:
```json
{
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "../../packages/**/*.ts",
    "../../packages/**/*.tsx"
  ]
}
```