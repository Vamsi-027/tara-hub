# Tara Hub - CI/CD Automated Testing Setup

## Overview

Your project now has **fully automated testing** that runs on every push/PR using GitHub Actions. The workflow tests the Materials module with unit, integration, and E2E tests against your Neon cloud database.

## 🔧 GitHub Actions Workflow

**File**: `.github/workflows/materials-tests.yml`

**Triggers**:
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch
- Only when changes affect `medusa/**` files

**Test Suite**:
1. **Unit Tests** - Admin route handlers
2. **Integration Tests** - MaterialsService with real database
3. **E2E Tests** - Full HTTP requests with Supertest

## 🔐 Required GitHub Secrets

You need to configure **one** of these secrets in your GitHub repository:

### Priority Order (tests use first available):
1. `DATABASE_URL_TEST` - **Recommended** (dedicated test database)
2. `NEON_DATABASE_URL` - Neon cloud database
3. `DATABASE_URL` - Development database (fallback)

### How to Set GitHub Secrets:

1. **Go to your GitHub repository**
2. **Click Settings → Secrets and variables → Actions**
3. **Click "New repository secret"**
4. **Add one of these secrets:**

#### Option A: Dedicated Test Database (Recommended)
```
Name: DATABASE_URL_TEST
Value: postgresql://username:password@ep-xxx.neon.tech/test_database?sslmode=require
```

#### Option B: Shared Neon Database
```
Name: NEON_DATABASE_URL
Value: postgresql://username:password@ep-xxx.neon.tech/database?sslmode=require
```

#### Option C: Fallback Database
```
Name: DATABASE_URL
Value: postgresql://username:password@ep-xxx.neon.tech/database?sslmode=require
```

## 🧪 Test Isolation Features

### Smart Data Isolation:
- Test data uses unique prefixes: `mat_e2e_${GITHUB_RUN_ID || Date.now()}`
- Parallel CI runs don't interfere with each other
- Production data remains untouched

### Test Coverage:
- **Authentication**: 401 for unauthenticated requests
- **List Materials**: Pagination, search (`q` parameter)
- **Get Material**: Individual retrieval by ID
- **Error Handling**: 404 for non-existent materials
- **Database Schema**: Real migrations and SQL operations

## 🚀 CI/CD Workflow Execution

### What Happens on Every Push/PR:

1. **Checkout Code** - Latest changes
2. **Setup Node.js 20** - With npm caching
3. **Install Dependencies** - `npm ci` in medusa directory
4. **Run Unit Tests** - Route handler validation
5. **Run Integration Tests** - Service layer with database
6. **Run E2E Tests** - Full HTTP stack testing

### Execution Time:
- **Total Runtime**: ~5-10 minutes
- **Timeout**: 20 minutes maximum
- **Node.js Version**: 20 (matches production)

## 📊 Test Results & Monitoring

### GitHub Actions Dashboard:
- **Status Badges**: Visible on PRs and commits
- **Detailed Logs**: Step-by-step execution details
- **Failure Notifications**: Email alerts for failed builds
- **History**: Track test trends over time

### What Tests Validate:
```bash
✅ Unit Tests: Route handlers work correctly
✅ Integration Tests: Database operations function
✅ E2E Tests: Full API workflows succeed
✅ Schema Tests: Migrations apply correctly
✅ Security Tests: Authentication blocks unauthorized access
```

## 🔧 Local Development Integration

### Run Same Tests Locally:
```bash
# Set your database URL
export DATABASE_URL_TEST="postgresql://user:pass@neon-host/test_db?sslmode=require"

# Navigate to medusa
cd medusa

# Run the same test suite as CI
npm run test:unit -- src/api/admin/materials/__tests__/route.unit.spec.ts
npm run test:integration:materials
npm run test:e2e:materials
```

### Or Use Setup Script:
```bash
# Automated setup and testing
./setup-e2e-testing.sh --run
```

## 🎯 Deployment Integration

### CI/CD Gates:
- **All tests must pass** before merge
- **Database connectivity** verified in CI
- **Schema migrations** validated automatically
- **API contracts** tested end-to-end

### Production Deployment Flow:
1. **Developer pushes code** → GitHub Actions run tests
2. **Tests pass** → Code ready for deployment
3. **Manual deployment** → Use deployment scripts
4. **Production monitoring** → Verify deployed changes

## 🚨 Troubleshooting

### Common CI Issues:

#### Tests Timeout
```yaml
# Already configured: 20-minute timeout
timeout-minutes: 20
```

#### Database Connection Fails
- Verify GitHub secret is set correctly
- Check Neon database accessibility
- Ensure SSL mode is required in connection string

#### Node.js Version Mismatch
- CI uses Node.js 20 (matches Medusa requirements)
- Local development should use same version

#### Test Data Conflicts
- Tests use unique prefixes per CI run
- No manual cleanup needed

### Debug Commands:
```bash
# Check test configuration locally
npm run test:unit -- --verbose src/api/admin/materials/__tests__/route.unit.spec.ts

# Verify database connectivity
node -e "const { Pool } = require('pg'); new Pool({ connectionString: process.env.DATABASE_URL_TEST }).query('SELECT 1').then(() => console.log('Connected')).catch(console.error)"
```

## 📈 Optional Enhancements

### Future CI/CD Improvements:

1. **Coverage Reporting**:
   - Add test coverage collection
   - Upload coverage reports to Codecov
   - Set coverage thresholds

2. **Extended Test Suites**:
   - Add other module tests
   - Include frontend E2E tests
   - Performance testing

3. **Deployment Automation**:
   - Auto-deploy on successful tests
   - Staging environment deployment
   - Production deployment approval

4. **Notifications**:
   - Slack integration for test results
   - Discord webhooks for failures
   - Email notifications for team

## ✅ Current Status

**🎉 Your CI/CD pipeline is ready!**

- ✅ Automated testing on every push/PR
- ✅ Real database integration testing
- ✅ Isolated test data management
- ✅ Comprehensive test coverage
- ✅ GitHub Actions workflow configured

**Next Step**: Set up your GitHub repository secret and watch the tests run automatically on your next commit!