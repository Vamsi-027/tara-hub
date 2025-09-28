/**
 * Database Lifecycle Management for E2E Tests
 *
 * Follows Medusa v2 and Neon DB best practices:
 * - Uses proper MikroORM migrations
 * - Implements transaction-based test isolation
 * - Leverages Neon's connection pooling
 * - Proper cleanup and seeding strategies
 */

import { MikroORM, EntityManager, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Pool } from "pg";
import { createMedusaContainer } from "@medusajs/framework";
import { ModuleRegistrationName } from "@medusajs/framework/utils";

export interface TestContext {
  orm: MikroORM<PostgreSqlDriver>;
  em: EntityManager;
  pool: Pool;
  container: any;
  testPrefix: string;
}

export class DatabaseLifecycleManager {
  private static instance: DatabaseLifecycleManager;
  private orm: MikroORM<PostgreSqlDriver> | null = null;
  private pool: Pool | null = null;
  private container: any = null;

  static getInstance(): DatabaseLifecycleManager {
    if (!DatabaseLifecycleManager.instance) {
      DatabaseLifecycleManager.instance = new DatabaseLifecycleManager();
    }
    return DatabaseLifecycleManager.instance;
  }

  /**
   * Initialize test database with proper Medusa v2 configuration
   */
  async initialize(): Promise<TestContext> {
    const databaseUrl = process.env.DATABASE_URL_TEST ||
      process.env.NEON_DATABASE_URL ||
      process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("No test database URL provided. Set DATABASE_URL_TEST for cloud testing.");
    }

    // Initialize PostgreSQL connection pool (Neon best practices)
    this.pool = new Pool({
      connectionString: databaseUrl,
      // Neon-specific optimizations
      max: 10, // Neon recommends lower connection counts
      idleTimeoutMillis: 30000, // Close idle connections quickly
      connectionTimeoutMillis: 5000, // Fast connection timeout
      statement_timeout: 30000, // 30s query timeout
      query_timeout: 30000,
      // SSL for Neon
      ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    // Initialize MikroORM with Medusa configuration
    this.orm = await MikroORM.init({
      type: 'postgresql',
      clientUrl: databaseUrl,
      entities: [], // Medusa entities will be loaded by container
      migrations: {
        path: './src/migrations',
        transactional: true,
        disableForeignKeys: false,
        allOrNothing: true,
      },
      pool: {
        min: 2,
        max: 10,
      },
      debug: process.env.NODE_ENV === 'test' && process.env.DEBUG_ORM === 'true',
    });

    // Initialize Medusa container for proper DI
    this.container = createMedusaContainer();

    // Run pending migrations (Medusa v2 way)
    await this.runMigrations();

    const testPrefix = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      orm: this.orm,
      em: this.orm.em.fork(),
      pool: this.pool,
      container: this.container,
      testPrefix,
    };
  }

  /**
   * Run database migrations using Medusa CLI approach
   */
  private async runMigrations(): Promise<void> {
    if (!this.orm) throw new Error("ORM not initialized");

    try {
      const migrator = this.orm.getMigrator();

      // Check for pending migrations
      const pendingMigrations = await migrator.getPendingMigrations();

      if (pendingMigrations.length > 0) {
        console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);
        await migrator.up();
        console.log("✅ Migrations completed");
      } else {
        console.log("✅ Database schema is up to date");
      }
    } catch (error) {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  }

  /**
   * Create test transaction for isolated testing
   */
  async beginTestTransaction(context: TestContext): Promise<EntityManager> {
    const em = context.em.fork();
    await em.begin();
    return em;
  }

  /**
   * Rollback test transaction
   */
  async rollbackTestTransaction(em: EntityManager): Promise<void> {
    if (em.isInTransaction()) {
      await em.rollback();
    }
  }

  /**
   * Clean test data using prefixes (safe for shared database)
   */
  async cleanTestData(pool: Pool, prefix: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Clean test data in dependency order
      const cleanupQueries = [
        `DELETE FROM product_variant_material_link WHERE product_variant_id LIKE '${prefix}%'`,
        `DELETE FROM product_variant WHERE id LIKE '${prefix}%'`,
        `DELETE FROM product WHERE id LIKE '${prefix}%'`,
        `DELETE FROM materials WHERE id LIKE '${prefix}%'`,
        `DELETE FROM orders WHERE id LIKE '${prefix}%'`,
        `DELETE FROM customers WHERE id LIKE '${prefix}%'`,
        // Add more cleanup as needed
      ];

      for (const query of cleanupQueries) {
        try {
          await client.query(query);
        } catch (error) {
          // Ignore errors for tables that don't exist
          if (!error.message.includes('does not exist')) {
            console.warn(`Cleanup warning: ${error.message}`);
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed test data using Medusa services
   */
  async seedTestData(context: TestContext, data: any): Promise<void> {
    const { container, em, testPrefix } = context;

    try {
      await em.begin();

      // Seed materials using proper Medusa service pattern
      if (data.materials) {
        for (const material of data.materials) {
          await em.execute(
            `INSERT INTO materials (id, name, properties, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING`,
            [`${testPrefix}_${material.id}`, material.name, JSON.stringify(material.properties || {})]
          );
        }
      }

      // Seed products using Medusa product service pattern
      if (data.products) {
        for (const product of data.products) {
          await em.execute(
            `INSERT INTO product (id, title, handle, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING`,
            [`${testPrefix}_${product.id}`, product.title, `${testPrefix}_${product.handle}`]
          );

          // Seed variants
          if (product.variants) {
            for (const variant of product.variants) {
              await em.execute(
                `INSERT INTO product_variant (id, product_id, title, sku, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 ON CONFLICT (id) DO NOTHING`,
                [
                  `${testPrefix}_${variant.id}`,
                  `${testPrefix}_${product.id}`,
                  variant.title,
                  `${testPrefix}_${variant.sku}`
                ]
              );
            }
          }
        }
      }

      await em.commit();
    } catch (error) {
      await em.rollback();
      throw error;
    }
  }

  /**
   * Cleanup and close connections
   */
  async cleanup(): Promise<void> {
    try {
      if (this.orm) {
        await this.orm.close();
        this.orm = null;
      }

      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) return false;

      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as health');
      client.release();

      return result.rows[0]?.health === 1;
    } catch {
      return false;
    }
  }
}

/**
 * Jest setup helper for E2E tests
 */
export async function setupTestDatabase(): Promise<TestContext> {
  const manager = DatabaseLifecycleManager.getInstance();
  return await manager.initialize();
}

/**
 * Jest teardown helper
 */
export async function teardownTestDatabase(): Promise<void> {
  const manager = DatabaseLifecycleManager.getInstance();
  await manager.cleanup();
}

/**
 * Test isolation helper - use in beforeEach
 */
export async function isolateTest(context: TestContext): Promise<EntityManager> {
  const manager = DatabaseLifecycleManager.getInstance();

  // Clean any previous test data
  await manager.cleanTestData(context.pool, context.testPrefix);

  // Start fresh transaction
  return await manager.beginTestTransaction(context);
}

/**
 * Test cleanup helper - use in afterEach
 */
export async function cleanupTest(context: TestContext, em?: EntityManager): Promise<void> {
  const manager = DatabaseLifecycleManager.getInstance();

  if (em) {
    await manager.rollbackTestTransaction(em);
  }

  // Clean test data
  await manager.cleanTestData(context.pool, context.testPrefix);
}