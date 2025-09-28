/**
 * Test Database Configuration
 *
 * Medusa v2 + Neon DB best practices for testing:
 * - Connection pooling optimization for Neon
 * - Proper migration handling
 * - Transaction-based test isolation
 * - Performance optimizations for cloud database
 */

import { MikroORM } from "@mikro-orm/postgresql";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Pool, PoolConfig } from "pg";

export interface TestDatabaseConfig {
  connection: string;
  poolConfig: PoolConfig;
  mikroOrmConfig: Parameters<typeof MikroORM.init>[0];
  testSettings: {
    isolationLevel: string;
    transactionTimeout: number;
    cleanupStrategy: 'prefix' | 'transaction' | 'truncate';
    seedingStrategy: 'fixtures' | 'factories' | 'minimal';
  };
}

/**
 * Neon Database Configuration for Testing
 */
export function createNeonTestConfig(): TestDatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL_TEST ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL_TEST is required for cloud testing");
  }

  const isNeonDatabase = databaseUrl.includes('neon.tech');

  return {
    connection: databaseUrl,

    // Optimized for Neon's connection limits and performance
    poolConfig: {
      connectionString: databaseUrl,
      // Neon-specific optimizations
      max: isNeonDatabase ? 8 : 20, // Lower for Neon
      min: 2,
      idleTimeoutMillis: isNeonDatabase ? 20000 : 30000, // Faster cleanup for Neon
      connectionTimeoutMillis: 5000,
      statement_timeout: 30000,
      query_timeout: 30000,
      // SSL configuration for Neon
      ssl: isNeonDatabase ? { rejectUnauthorized: false } : false,
      // Neon connection optimizations
      ...(isNeonDatabase && {
        application_name: 'medusa_e2e_tests',
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
      }),
    },

    // MikroORM configuration following Medusa v2 patterns
    mikroOrmConfig: {
      type: 'postgresql' as const,
      clientUrl: databaseUrl,
      entities: [], // Will be populated by Medusa container
      migrations: {
        path: './src/migrations',
        pathTs: './src/migrations',
        transactional: true,
        disableForeignKeys: false,
        allOrNothing: true,
        emit: 'js' as const,
      },
      pool: {
        min: 2,
        max: isNeonDatabase ? 8 : 15,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: isNeonDatabase ? 20000 : 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
        propagateCreateError: false,
      },
      driverOptions: {
        connection: {
          ssl: isNeonDatabase ? { rejectUnauthorized: false } : false,
          // Neon performance optimizations
          ...(isNeonDatabase && {
            application_name: 'medusa_e2e_orm',
            keepAlive: true,
            statement_timeout: 30000,
          }),
        },
      },
      debug: process.env.DEBUG_ORM === 'true',
      allowGlobalContext: true, // For testing
      forceEntityConstructor: true,
    },

    // Test-specific settings
    testSettings: {
      isolationLevel: 'READ COMMITTED', // Good balance for testing
      transactionTimeout: 30000, // 30 seconds for complex tests
      cleanupStrategy: 'prefix', // Safe for shared database
      seedingStrategy: 'minimal', // Fast seeding for tests
    },
  };
}

/**
 * Test Schema Definitions for E2E Testing
 */
export const TEST_SCHEMA_DEFINITIONS = {
  // Core tables needed for testing
  materials: `
    CREATE TABLE IF NOT EXISTS materials (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100),
      type VARCHAR(100),
      properties JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
    CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
    CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
    CREATE INDEX IF NOT EXISTS idx_materials_properties ON materials USING GIN(properties);
  `,

  product: `
    CREATE TABLE IF NOT EXISTS product (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      handle VARCHAR(255) UNIQUE,
      description TEXT,
      status VARCHAR(50) DEFAULT 'draft',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_product_handle ON product(handle);
    CREATE INDEX IF NOT EXISTS idx_product_status ON product(status);
  `,

  product_variant: `
    CREATE TABLE IF NOT EXISTS product_variant (
      id VARCHAR(255) PRIMARY KEY,
      product_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      sku VARCHAR(255) UNIQUE,
      barcode VARCHAR(255),
      inventory_quantity INTEGER DEFAULT 0,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_product_variant_product FOREIGN KEY (product_id)
        REFERENCES product(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_product_variant_product_id ON product_variant(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_variant_sku ON product_variant(sku);
  `,

  product_variant_material_link: `
    CREATE TABLE IF NOT EXISTS product_variant_material_link (
      id TEXT PRIMARY KEY DEFAULT concat('pvmat_', md5(random()::text)),
      product_variant_id VARCHAR(255) NOT NULL,
      material_id VARCHAR(255) NOT NULL,
      quantity DECIMAL(10,2) DEFAULT 1.0,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      CONSTRAINT fk_pvml_variant FOREIGN KEY (product_variant_id)
        REFERENCES product_variant(id) ON DELETE CASCADE,
      CONSTRAINT fk_pvml_material FOREIGN KEY (material_id)
        REFERENCES materials(id) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_pvml_material_id ON product_variant_material_link(material_id);
    CREATE INDEX IF NOT EXISTS idx_pvml_deleted_at ON product_variant_material_link(deleted_at) WHERE deleted_at IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS uq_pvml_variant_material_active
      ON product_variant_material_link (product_variant_id, material_id)
      WHERE deleted_at IS NULL;
  `,
};

/**
 * Performance monitoring for Neon database
 */
export async function measureQueryPerformance<T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> {
  const startTime = process.hrtime.bigint();

  try {
    const result = await operation();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms

    if (process.env.DEBUG_PERFORMANCE === 'true') {
      console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
    }

    // Log slow queries (>1000ms)
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected: ${label} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    console.error(`❌ Query failed: ${label} after ${duration.toFixed(2)}ms:`, error.message);
    throw error;
  }
}

/**
 * Neon-specific connection validation
 */
export async function validateNeonConnection(pool: Pool): Promise<void> {
  const client = await pool.connect();

  try {
    // Test basic connectivity
    await client.query('SELECT NOW() as current_time');

    // Check if we're on Neon
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0]?.version || '';

    // Validate permissions for testing
    const permissionsResult = await client.query(`
      SELECT has_database_privilege(current_database(), 'CREATE') as can_create,
             has_database_privilege(current_database(), 'TEMP') as can_temp
    `);

    const permissions = permissionsResult.rows[0];

    if (!permissions.can_create || !permissions.can_temp) {
      throw new Error('Insufficient database permissions for testing');
    }

    console.log('✅ Neon database connection validated');
    console.log(`📊 Database: ${version.split(',')[0]}`);

  } finally {
    client.release();
  }
}