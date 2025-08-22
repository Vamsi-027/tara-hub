# Tara Hub - Architecture Migration Steering Context

**Last Updated**: 2025-08-21
**Migration Status**: IN PROGRESS - 165 imports completed

## Migration Overview

The codebase is transitioning from a flat file structure to a module-based architecture. This migration is partially complete with both old and new patterns coexisting.

## Current State

### What's Been Migrated
- ✅ 165 import paths updated to new structure
- ✅ Core module directories created (`src/modules/`, `src/core/`, `src/shared/`)
- ✅ Path aliases configured in tsconfig.json
- ✅ Database schemas consolidated in new structure
- ✅ Authentication service partially migrated

### What's Still Legacy
- ⚠️ `lib/` directory still contains active code
- ⚠️ `components/` directory still has UI components
- ⚠️ `packages/` workspace still referenced by experience apps
- ⚠️ Some files exist in BOTH locations
- ⚠️ Mixed import patterns throughout codebase

## Migration Patterns

### Import Path Mapping

```typescript
// OLD PATTERN → NEW PATTERN

// Components
'@/components/ui/*' → '@/src/shared/components/ui/*'
'@/components/*' → '@/src/shared/components/*'

// Hooks
'@/hooks/*' → '@/src/shared/hooks/*'

// Libraries
'@/lib/utils' → '@/src/shared/utils'
'@/lib/cn' → '@/src/shared/utils/cn'
'@/lib/types' → '@/src/shared/types'

// Services
'@/lib/services/*' → '@/src/modules/*/services/*'
'@/lib/auth' → '@/src/modules/auth'

// Database
'@/lib/db' → '@/src/core/database'
'@/db/schema' → '@/src/core/database/schemas'
```

### Dual Import Support

During transition, both paths work:
```typescript
// Both of these work currently:
import { Button } from '@/components/ui/button'        // OLD
import { Button } from '@/src/shared/components/ui/button'  // NEW

// Prefer NEW pattern for any new code
```

## Directory Structure Mapping

### Old Structure (Being Deprecated)
```
/
├── lib/                    # LEGACY - Business logic
│   ├── auth.ts            # → src/modules/auth/
│   ├── db.ts              # → src/core/database/
│   ├── services/          # → src/modules/*/services/
│   └── utils/             # → src/shared/utils/
├── components/            # LEGACY - UI components
│   ├── ui/               # → src/shared/components/ui/
│   └── *.tsx             # → src/shared/components/
├── hooks/                # LEGACY - React hooks
│   └── *.ts              # → src/shared/hooks/
└── packages/             # LEGACY - Workspace packages
    ├── ui/               # → src/shared/components/
    └── lib/              # → src/shared/
```

### New Structure (Target)
```
src/
├── modules/              # Feature-based modules
│   ├── fabrics/         # Fabric management domain
│   ├── auth/            # Authentication domain
│   ├── blog/            # Blog content domain
│   ├── products/        # Product management
│   └── admin/           # Admin-specific features
├── core/                # Infrastructure services
│   ├── database/        # Database client & config
│   ├── cache/           # Caching strategies
│   ├── storage/         # File storage (R2)
│   └── email/           # Email services
└── shared/              # Cross-cutting concerns
    ├── components/ui/   # Reusable UI components
    ├── hooks/           # Shared React hooks
    ├── utils/           # Utility functions
    └── types/           # Shared TypeScript types
```

## Migration Strategy

### Phase 1: Dual Support (CURRENT)
- Both import paths work
- New code uses new paths
- Existing code gradually updated
- No breaking changes

### Phase 2: Active Migration
- Systematic file moving
- Update all imports
- Remove duplicates
- Test thoroughly

### Phase 3: Cleanup
- Remove legacy directories
- Update documentation
- Fix build configuration
- Remove path aliases for old structure

## Known Issues During Migration

### 1. Duplicate Files
Some files exist in both locations:
- Check modification dates
- Newer version is usually in `src/`
- Legacy version often outdated

### 2. Import Resolution
When you see import errors:
1. Try the new path first
2. Fall back to old path if needed
3. Check if file was moved but not updated
4. Look for typos in migration

### 3. Type Conflicts
- Same types defined in multiple places
- Import from new location preferred
- Will be consolidated in cleanup phase

### 4. Build Warnings
- TypeScript errors temporarily ignored
- ESLint warnings about import paths
- Will be fixed after migration complete

## Migration Checklist for Developers

When working on a file:
- [ ] Update all imports to new paths
- [ ] Move file to new location if in legacy dir
- [ ] Update any files that import it
- [ ] Remove old file after verification
- [ ] Update related tests

When creating new files:
- [ ] Always use new structure
- [ ] Follow module organization
- [ ] Use new import paths
- [ ] Don't add to legacy directories

## Files Needing Special Attention

### High-Priority Migrations
1. **Authentication System**
   - `lib/auth.ts` → `src/modules/auth/services/auth.service.ts`
   - Still has NextAuth remnants
   - Custom auth partially migrated

2. **Database Client**
   - `lib/db.ts` → `src/core/database/drizzle/client.ts`
   - Schema files consolidated
   - Some imports still use old path

3. **UI Components**
   - Heavily used across all apps
   - Need careful migration
   - Update experience apps after

### Experience Apps Dependencies
The experience apps still depend on `packages/`:
- `fabric-store` imports from `@tara-hub/ui`
- `store-guide` imports from `@tara-hub/lib`
- Need to update after main app migration

## Scripts and Tools

### Find Old Imports
```bash
# Find files still using old imports
grep -r "@/components" --include="*.ts" --include="*.tsx" .
grep -r "@/lib" --include="*.ts" --include="*.tsx" .
grep -r "@/hooks" --include="*.ts" --include="*.tsx" .
```

### Update Imports Script
A script exists at `scripts/fix-imports-refactor.js` for bulk updates.

## Post-Migration Cleanup

Once migration is complete:
1. Remove `/lib`, `/components`, `/hooks` directories
2. Remove old path aliases from tsconfig.json
3. Update all documentation
4. Remove dual import support
5. Enable strict TypeScript/ESLint rules
6. Update experience apps to use new structure

## Current Migration Status Details

From `REFACTORING_ANALYSIS_REPORT.md`:
- Total imports found and fixed: 165
- Files that may need manual review: Check report
- Most common import patterns updated
- Some edge cases may remain

## Next Steps

1. **Complete import migration** for remaining files
2. **Move remaining files** from legacy directories
3. **Update experience apps** to new imports
4. **Remove legacy directories**
5. **Update all documentation**
6. **Enable strict linting**