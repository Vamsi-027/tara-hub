# Enhanced E2E Testing Infrastructure

This directory contains a production-ready testing infrastructure that follows **Medusa v2** and **Neon DB** best practices.

## 🏗️ Architecture

### Core Components

1. **Database Lifecycle Manager** (`db-lifecycle.ts`)
   - Manages MikroORM connections
   - Handles Medusa container initialization
   - Provides transaction-based isolation

2. **Test Database Configuration** (`test-database.config.ts`)
   - Neon-optimized connection pooling
   - Performance monitoring utilities
   - Schema management

3. **Test Fixtures & Seeding** (`test-fixtures.ts`)
   - Faker-based data generation
   - Batch insert optimizations
   - Consistent test scenarios

4. **E2E Test Setup** (`e2e-test-setup.ts`)
   - Jest integration
   - Test session management
   - Global setup/teardown

## 🚀 Quick Start

### 1. Initialize Test Database

```bash
npm run test:db:init
```

### 2. Run Enhanced E2E Tests

```bash
npm run test:e2e:enhanced
```

### 3. Performance Monitoring

```bash
npm run test:e2e:performance
```

## 📝 Writing Tests

### Basic E2E Test

```typescript
import { useE2ETestSuite } from "../../test-utils/e2e-test-setup";

describe("My API", () => {
  const testSuite = useE2ETestSuite();

  beforeAll(async () => {
    // Setup test scenario
    await testSuite.setupScenario('basicMaterials');
  });

  it("should work", async () => {
    const pool = testSuite.getPool();
    const prefix = testSuite.getPrefix();

    // Your test logic here
  });
});
```

### Custom Test Data

```typescript
describe("Custom Data Test", () => {
  const testSuite = useE2ETestSuite();

  beforeAll(async () => {
    const factory = testSuite.getFactory();

    const materials = [
      factory.createMaterial({ name: "Custom Cotton" }),
      factory.createMaterial({ name: "Custom Silk" }),
    ];

    await testSuite.getSession().seedCustomData({ materials });
  });
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Required for cloud testing
DATABASE_URL_TEST=postgres://user:pass@host/database

# Optional debugging
DEBUG_ORM=true
DEBUG_PERFORMANCE=true
```

### Test Types

- `TEST_TYPE=e2e` - Enhanced E2E tests
- `TEST_TYPE=unit` - Unit tests
- `TEST_TYPE=integration:modules` - Module integration tests

## 🎯 Best Practices

### 1. Test Isolation

- Each test gets a unique prefix
- Automatic cleanup between tests
- Transaction-based isolation where possible

### 2. Performance Monitoring

```typescript
import { measureTestPerformance } from "../test-utils/e2e-test-setup";

it("should be fast", async () => {
  await measureTestPerformance(async () => {
    // Test operation
  }, "Operation name", 500); // Expect under 500ms
});
```

### 3. Database Operations

```typescript
// Use the pool for raw queries
const pool = testSuite.getPool();
const result = await pool.query("SELECT * FROM materials WHERE id = $1", [id]);

// Use the prefix for test data
const prefix = testSuite.getPrefix();
const testId = `${prefix}_material_1`;
```

### 4. Test Scenarios

Predefined scenarios for common test cases:

- `basicMaterials` - Simple materials list
- `productWithMaterials` - Products with material links
- `ecommerceFlow` - Full e-commerce scenario

## 🔍 Troubleshooting

### Connection Issues

1. Verify environment variables:
   ```bash
   echo $DATABASE_URL_TEST
   ```

2. Test connection:
   ```bash
   npm run test:db:init
   ```

### Performance Issues

1. Enable debug mode:
   ```bash
   DEBUG_PERFORMANCE=true npm run test:e2e:performance
   ```

2. Check Neon dashboard for connection metrics

### Memory Leaks

1. Ensure proper cleanup:
   ```typescript
   afterEach(async () => {
     await testSession.cleanup();
   });
   ```

2. Monitor Jest with:
   ```bash
   jest --detectOpenHandles --detectLeaks
   ```

## 📊 Neon DB Optimizations

### Connection Pooling

- Lower max connections (8 vs 20) for Neon
- Faster idle timeout (20s vs 30s)
- SSL configuration for cloud

### Query Performance

- Batch inserts for seeding
- Indexed queries for fast lookups
- Transaction grouping for consistency

### Cost Optimization

- Efficient connection reuse
- Minimal data seeding
- Prefix-based cleanup (no TRUNCATE)

## 🧪 Test Commands Reference

| Command | Description |
|---------|-------------|
| `npm run test:db:init` | Initialize test database schemas |
| `npm run test:db:setup` | Setup schemas only |
| `npm run test:db:cleanup <prefix>` | Clean test data |
| `npm run test:e2e:enhanced` | Run enhanced E2E tests |
| `npm run test:e2e:performance` | Run with performance monitoring |
| `npm run test:e2e:cloud` | Run legacy cloud tests |

## 🏷️ Migration from Legacy Tests

### Old Pattern
```typescript
// Legacy testcontainer approach
let container: PostgreSqlContainer;
let pool: Pool;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
});
```

### New Pattern
```typescript
// Enhanced cloud approach
const testSuite = useE2ETestSuite();

beforeAll(async () => {
  await testSuite.setupScenario('basicMaterials');
});
```

### Benefits
- ✅ No Docker dependency
- ✅ Cloud database testing
- ✅ Better performance monitoring
- ✅ Proper Medusa v2 integration
- ✅ Transaction-based isolation
- ✅ Consistent test data