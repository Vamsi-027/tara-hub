# Manual Verification Guide - No Scripts Required

This guide allows you to verify the multi-material implementation manually without running any scripts, perfect for extremely restricted sandbox environments.

## 📋 Manual Verification Checklist

### ✅ File Structure Verification

Check that these files exist:

```bash
# Core implementation files
ls src/api/admin/products/[id]/route.ts           # ✅ Should exist
ls src/api/admin/products/route.ts                # ✅ Should exist
ls src/admin/widgets/product-material-select.tsx  # ❓ May not exist yet
ls src/migrations/20250927195901-create-product-variant-material-link.sql  # ✅ Should exist

# Migration and sandbox scripts
ls scripts/migrate-to-multi-material.ts           # ✅ Should exist
ls scripts/apply-migration.ts                     # ✅ Should exist
ls scripts/sandbox-workarounds.ts                 # ✅ Should exist
ls scripts/sandbox-verification.ts                # ✅ Should exist

# Documentation and setup
ls SANDBOX-SETUP.md                               # ✅ Should exist
ls MANUAL-VERIFICATION.md                         # ✅ Should exist (this file)
ls sandbox-verify.sh                              # ✅ Should exist

# Test infrastructure
ls src/test-utils/jest-setup.ts                   # ✅ Should exist
ls src/test-utils/jest-e2e-setup.ts              # ✅ Should exist
ls src/test-utils/test-fixtures.ts               # ✅ Should exist
ls src/api/admin/products/__tests__/offline.test.ts  # ✅ Should exist after sandbox setup
```

**Expected Result:** Most files should exist. Missing files indicate incomplete setup.

### ✅ Migration SQL Analysis

Examine the migration file content:

```bash
cat src/migrations/20250927195901-create-product-variant-material-link.sql
```

**Check for these key elements:**

1. **Primary Key with ID:**
   ```sql
   id TEXT PRIMARY KEY DEFAULT concat('pvmat_', md5(random()::text))
   ```

2. **Soft Deletion Support:**
   ```sql
   deleted_at TIMESTAMP NULL
   ```

3. **Unique Constraint for Active Records:**
   ```sql
   CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL
   ```

4. **Foreign Key Constraints:**
   ```sql
   FOREIGN KEY (product_variant_id) REFERENCES product_variant(id)
   FOREIGN KEY (material_id) REFERENCES materials(id)
   ```

**Expected Result:** All four elements should be present for proper multi-material support.

### ✅ Package.json Configuration

Check sandbox scripts are configured:

```bash
grep "sandbox:" package.json
```

**Expected Output:**
```json
"sandbox:setup": "npx ts-node --transpile-only scripts/sandbox-workarounds.ts",
"sandbox:verify": "npx ts-node --transpile-only scripts/sandbox-verification.ts",
"sandbox:test:offline:fixed": "SANDBOX_MODE=true jest --testPathPattern=\"offline\\.test\\.ts\" --testTimeout=10000 --no-coverage",
"sandbox:postgres:start": "docker-compose -f docker-compose.test.yml up -d postgres-test",
"sandbox:postgres:stop": "docker-compose -f docker-compose.test.yml down",
"sandbox:postgres:logs": "docker-compose -f docker-compose.test.yml logs postgres-test",
"sandbox:medusa": "XDG_CONFIG_HOME=./.medusa-config DATABASE_URL_TEST=\"postgresql://medusa:medusa@localhost:5433/medusa_test\" npx medusa"
```

### ✅ Code Implementation Analysis

#### Product API Routes

Check the main product route:

```bash
grep -n "material" src/api/admin/products/route.ts
```

**Look for:**
- Material queries in SELECT statements
- LEFT JOIN with materials table
- Multi-material support in response

Check the single product route:

```bash
grep -n "material_ids\|DELETE FROM product_variant_material_link\|INSERT INTO product_variant_material_link" src/api/admin/products/[id]/route.ts
```

**Look for:**
- `material_ids` parameter handling
- DELETE statements for existing links
- INSERT statements for new links
- Transaction support (BEGIN/COMMIT)

#### Migration Script Quality

Check the migration script:

```bash
grep -n "BEGIN\|COMMIT\|ROLLBACK\|information_schema" scripts/migrate-to-multi-material.ts
```

**Look for:**
- Transaction support (BEGIN/COMMIT)
- Error handling (ROLLBACK)
- Schema validation (information_schema queries)
- Idempotent operations (IF NOT EXISTS)

### ✅ Jest Configuration

Check Jest setup:

```bash
grep -A 10 -B 5 "setupFilesAfterEnv\|TEST_TYPE.*e2e" jest.config.js
```

**Expected:**
- `setupFilesAfterEnv` pointing to test-utils files
- E2E test type configuration
- Proper timeout settings

### ✅ TypeScript Compilation Test

Test that key files compile without errors:

```bash
# Test individual files (if TypeScript is available)
npx tsc --noEmit --skipLibCheck scripts/sandbox-verification.ts
npx tsc --noEmit --skipLibCheck scripts/migrate-to-multi-material.ts
npx tsc --noEmit --skipLibCheck src/test-utils/jest-setup.ts
```

**Expected Result:** No compilation errors.

### ✅ Dependency Check

Verify required dependencies:

```bash
grep -E "pg|@medusajs|jest|typescript" package.json
```

**Expected:** All necessary dependencies for database operations, Medusa, and testing should be present.

## 🎯 Manual Test Execution (When Possible)

### Option 1: Direct Script Execution (Most Compatible)

If npm scripts fail but ts-node works:

```bash
# Comprehensive verification
npx ts-node --transpile-only scripts/sandbox-verification.ts

# Setup sandbox environment
npx ts-node --transpile-only scripts/sandbox-workarounds.ts

# Offline tests (if created)
SANDBOX_MODE=true npx jest --testPathPattern="offline\.test\.ts" --testTimeout=10000 --no-coverage
```

### Option 2: Shell Script (Intermediate Compatibility)

```bash
# Interactive verification script
./sandbox-verify.sh
```

### Option 3: Fixed npm Scripts (Updated for ts-node)

```bash
# Now using ts-node instead of tsx
npm run sandbox:verify
npm run sandbox:test:offline:fixed
```

## 📊 Verification Results Interpretation

### ✅ What Should Work in Sandbox Environments:

1. **File Structure Check** - All required files exist
2. **Static Code Analysis** - Code contains multi-material logic
3. **TypeScript Compilation** - No syntax/type errors
4. **Offline Jest Tests** - Pure JavaScript validation tests
5. **Configuration Verification** - Scripts and settings are correct

### ❌ What's Blocked by Sandbox Restrictions:

1. **Docker Operations** - PostgreSQL container startup
2. **Database Connectivity** - Live database operations
3. **Medusa CLI** - Backend service operations
4. **E2E Tests** - Tests requiring database

### 🎯 Success Criteria (Without Docker):

- ✅ 15+ verification checks should pass
- ✅ 5 offline tests should pass
- ✅ TypeScript compilation should succeed
- ✅ Migration SQL should have all required elements
- ✅ API routes should contain multi-material logic

## 🚀 Next Steps After Manual Verification

1. **Document Results:** Note which checks pass/fail
2. **Report Status:** Share verification results
3. **Request Docker Access:** For full E2E testing
4. **Prepare for Production:** When all verifications pass

## 💡 Troubleshooting

**If scripts fail:**
- Use direct `npx ts-node --transpile-only` commands
- Use the interactive shell script `./sandbox-verify.sh`
- Perform manual file/code inspection

**If compilation fails:**
- Check TypeScript is installed: `npx tsc --version`
- Verify node_modules are complete: `ls node_modules/@types`

**If nothing works:**
- Perform purely manual verification using file inspection
- Document findings and share with team
- Wait for less restrictive environment access

This manual approach ensures you can verify the multi-material implementation regardless of sandbox restrictions!