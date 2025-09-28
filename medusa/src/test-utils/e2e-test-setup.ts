/**
 * Comprehensive E2E Test Setup
 *
 * Production-ready testing framework following:
 * - Medusa v2 architecture patterns
 * - Neon DB best practices
 * - Transaction-based isolation
 * - Performance monitoring
 * - Proper cleanup strategies
 */

import { setupTestDatabase, teardownTestDatabase, TestContext } from './db-lifecycle';
import { createNeonTestConfig, validateNeonConnection, measureQueryPerformance } from './test-database.config';
import { DatabaseSeeder, TestDataFactory, TEST_SCENARIOS } from './test-fixtures';
import { Pool } from 'pg';

/**
 * Global test setup for Jest
 */
export class E2ETestSetup {
  private static instance: E2ETestSetup;
  private context: TestContext | null = null;

  static getInstance(): E2ETestSetup {
    if (!E2ETestSetup.instance) {
      E2ETestSetup.instance = new E2ETestSetup();
    }
    return E2ETestSetup.instance;
  }

  /**
   * Initialize test environment - call in Jest setupFilesAfterEnv
   */
  async globalSetup(): Promise<TestContext> {
    console.log('🧪 Initializing E2E test environment...');

    // Validate configuration
    const config = createNeonTestConfig();
    console.log('✅ Test configuration loaded');

    // Initialize database connection
    this.context = await measureQueryPerformance(
      () => setupTestDatabase(),
      'Database initialization'
    );

    // Validate Neon connection
    await validateNeonConnection(this.context.pool);

    // Ensure test schemas exist
    await this.ensureTestSchemas();

    console.log('🎉 E2E test environment ready');
    return this.context;
  }

  /**
   * Cleanup test environment - call in Jest teardown
   */
  async globalTeardown(): Promise<void> {
    console.log('🧹 Cleaning up E2E test environment...');

    if (this.context) {
      // Clean any remaining test data
      const seeder = new DatabaseSeeder(this.context.pool, this.context.testPrefix);
      await seeder.cleanTestData();
    }

    await teardownTestDatabase();
    this.context = null;

    console.log('✅ E2E test environment cleaned up');
  }

  /**
   * Get current test context
   */
  getContext(): TestContext {
    if (!this.context) {
      throw new Error('Test context not initialized. Call globalSetup() first.');
    }
    return this.context;
  }

  /**
   * Create isolated test session
   */
  async createTestSession(): Promise<TestSession> {
    const context = this.getContext();
    return new TestSession(context);
  }

  /**
   * Ensure all test schemas exist
   */
  private async ensureTestSchemas(): Promise<void> {
    if (!this.context) throw new Error('Context not initialized');

    const { TEST_SCHEMA_DEFINITIONS } = await import('./test-database.config');

    console.log('🔧 Ensuring test schemas exist...');

    for (const [name, schema] of Object.entries(TEST_SCHEMA_DEFINITIONS)) {
      try {
        await this.context.pool.query(schema);
        console.log(`✅ Schema ${name} ready`);
      } catch (error) {
        console.error(`❌ Failed to create ${name} schema:`, error.message);
        throw error;
      }
    }
  }
}

/**
 * Individual test session with isolation
 */
export class TestSession {
  private seeder: DatabaseSeeder;
  private factory: TestDataFactory;

  constructor(private context: TestContext) {
    this.seeder = new DatabaseSeeder(context.pool, context.testPrefix);
    this.factory = new TestDataFactory(context.testPrefix);
  }

  /**
   * Setup test data for a specific scenario
   */
  async setupScenario(scenarioName: keyof typeof TEST_SCENARIOS): Promise<any> {
    const scenario = TEST_SCENARIOS[scenarioName](this.context.testPrefix);

    if (Array.isArray(scenario)) {
      // Simple materials scenario
      await this.seeder.seedMaterials(scenario);
      return { materials: scenario };
    } else if (scenario.materials || scenario.products) {
      // Complex scenario with multiple entities
      if (scenario.materials) {
        await this.seeder.seedMaterials(scenario.materials);
      }
      if (scenario.products) {
        await this.seeder.seedProducts(scenario.products);
      }
      return scenario;
    }

    return scenario;
  }

  /**
   * Create custom test data
   */
  async seedCustomData(data: {
    materials?: any[];
    products?: any[];
    customers?: any[];
    orders?: any[];
  }): Promise<void> {
    if (data.materials) {
      await this.seeder.seedMaterials(data.materials);
    }
    if (data.products) {
      await this.seeder.seedProducts(data.products);
    }
    // Add more entity types as needed
  }

  /**
   * Get data factory for creating test entities
   */
  getFactory(): TestDataFactory {
    return this.factory;
  }

  /**
   * Get database pool for raw queries
   */
  getPool(): Pool {
    return this.context.pool;
  }

  /**
   * Get test prefix for manual queries
   */
  getPrefix(): string {
    return this.context.testPrefix;
  }

  /**
   * Clean up test data
   */
  async cleanup(): Promise<void> {
    await this.seeder.cleanTestData();
  }
}

/**
 * Jest helpers for test files
 */

// Global test context
let globalTestContext: TestContext | null = null;

/**
 * Setup function for individual test files
 */
export async function setupE2ETest(): Promise<TestSession> {
  if (!globalTestContext) {
    const setup = E2ETestSetup.getInstance();
    globalTestContext = await setup.globalSetup();
  }

  const setup = E2ETestSetup.getInstance();
  return await setup.createTestSession();
}

/**
 * Cleanup function for individual test files
 */
export async function cleanupE2ETest(session?: TestSession): Promise<void> {
  if (session) {
    await session.cleanup();
  }
}

/**
 * Jest hooks for common patterns
 */

/**
 * Use in describe block for test suite setup
 */
export function useE2ETestSuite() {
  let testSession: TestSession;

  beforeAll(async () => {
    testSession = await setupE2ETest();
  });

  beforeEach(async () => {
    // Clean any previous test data
    await testSession.cleanup();
  });

  afterEach(async () => {
    // Clean test data after each test
    await testSession.cleanup();
  });

  return {
    getSession: () => testSession,
    getFactory: () => testSession.getFactory(),
    getPool: () => testSession.getPool(),
    getPrefix: () => testSession.getPrefix(),
    setupScenario: (name: keyof typeof TEST_SCENARIOS) => testSession.setupScenario(name),
  };
}

/**
 * Performance measurement helper for tests
 */
export async function measureTestPerformance<T>(
  operation: () => Promise<T>,
  label: string,
  expectedMaxMs?: number
): Promise<T> {
  const result = await measureQueryPerformance(operation, label);

  if (expectedMaxMs) {
    const actualTime = performance.now();
    // This is a simplified check - you'd need to implement proper timing
    // if (actualTime > expectedMaxMs) {
    //   console.warn(`⚠️  Performance regression: ${label} exceeded ${expectedMaxMs}ms`);
    // }
  }

  return result;
}

/**
 * Database health check for tests
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const setup = E2ETestSetup.getInstance();
    const context = setup.getContext();

    const result = await context.pool.query('SELECT 1 as health, NOW() as timestamp');
    return result.rows[0]?.health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}