/**
 * API Test Data Setup for Playwright E2E Tests
 *
 * This connects Playwright tests with our Jest API infrastructure
 * to ensure consistent test data across both testing approaches.
 */

import { DatabaseSeeder, TestDataFactory } from '../../medusa/src/test-utils/test-fixtures';
import { Pool } from 'pg';

export class PlaywrightTestDataSetup {
  private pool: Pool;
  private seeder: DatabaseSeeder;
  private factory: TestDataFactory;
  private testPrefix: string;

  constructor() {
    this.testPrefix = `pw_e2e_${Date.now()}`;

    // Use same Neon DB as Jest tests
    const databaseUrl = process.env.DATABASE_URL_TEST ||
      process.env.NEON_DATABASE_URL ||
      process.env.DATABASE_URL;

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 5, // Lower for Playwright
      ssl: databaseUrl?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    });

    this.seeder = new DatabaseSeeder(this.pool, this.testPrefix);
    this.factory = new TestDataFactory(this.testPrefix);
  }

  /**
   * Setup test data for Playwright scenarios
   */
  async setupEcommerceScenario() {
    // Create materials
    const materials = [
      this.factory.createMaterial({
        name: 'Premium Cotton Canvas',
        type: 'cotton',
        code: 'PCC-001'
      }),
      this.factory.createMaterial({
        name: 'Luxury Silk Fabric',
        type: 'silk',
        code: 'LSF-002'
      }),
    ];

    // Create products with variants
    const products = [
      this.factory.createProduct({
        title: 'Fabric Bundle Collection',
        handle: 'fabric-bundle-collection',
        variants: [
          this.factory.createProductVariant({
            title: 'Cotton Bundle',
            sku: 'FB-COTTON-001',
            materialId: materials[0].id,
          }),
          this.factory.createProductVariant({
            title: 'Silk Bundle',
            sku: 'FB-SILK-002',
            materialId: materials[1].id,
          }),
        ],
      }),
    ];

    // Seed the data
    await this.seeder.seedMaterials(materials);
    await this.seeder.seedProducts(products);

    return {
      materials,
      products,
      testPrefix: this.testPrefix,
    };
  }

  /**
   * Setup customer and order scenario
   */
  async setupCustomerScenario() {
    const customer = this.factory.createCustomer({
      email: 'test@playwright-e2e.com',
      firstName: 'Playwright',
      lastName: 'Tester',
    });

    // Note: Would need customer seeding in the seeder
    // For now, return the customer data for API calls
    return {
      customer,
      testPrefix: this.testPrefix,
    };
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    await this.seeder.cleanTestData();
    await this.pool.end();
  }

  /**
   * Get test prefix for API calls
   */
  getTestPrefix() {
    return this.testPrefix;
  }

  /**
   * Get database connection for direct queries
   */
  getPool() {
    return this.pool;
  }
}