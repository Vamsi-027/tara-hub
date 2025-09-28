#!/usr/bin/env node

/**
 * Migration Validation Script
 *
 * Validates the multi-material migration against the ops checklist:
 * - Verifies schema changes are applied correctly
 * - Tests constraint enforcement
 * - Validates index creation
 * - Checks data integrity
 */

import { Pool } from "pg";
import fs from "fs";
import path from "path";

const NEON_DB_URL = process.env.DATABASE_URL_TEST ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL;

interface ValidationResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

class MigrationValidator {
  private pool: Pool;
  private results: ValidationResult[] = [];

  constructor() {
    if (!NEON_DB_URL) {
      throw new Error("Database URL required for validation");
    }

    this.pool = new Pool({
      connectionString: NEON_DB_URL,
      max: 5,
      ssl: NEON_DB_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
    });
  }

  async validate(): Promise<ValidationResult[]> {
    console.log('🔍 Starting migration validation...\n');

    try {
      await this.validateTableStructure();
      await this.validateIndexes();
      await this.validateConstraints();
      await this.validateMigrationFile();
      await this.validateDataIntegrity();
      await this.performanceTests();
    } catch (error) {
      this.addResult('GENERAL', 'FAIL', `Validation failed: ${error.message}`);
    } finally {
      await this.pool.end();
    }

    return this.results;
  }

  private async validateTableStructure(): Promise<void> {
    console.log('📋 Validating table structure...');

    // Check if table exists
    const tableExists = await this.pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'product_variant_material_link'
      );
    `);

    if (!tableExists.rows[0].exists) {
      this.addResult('TABLE_EXISTS', 'FAIL', 'product_variant_material_link table does not exist');
      return;
    }

    this.addResult('TABLE_EXISTS', 'PASS', 'product_variant_material_link table exists');

    // Check required columns
    const columns = await this.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'product_variant_material_link'
      ORDER BY ordinal_position;
    `);

    const requiredColumns = [
      { name: 'id', type: 'text', nullable: 'NO' },
      { name: 'product_variant_id', type: 'character varying', nullable: 'NO' },
      { name: 'material_id', type: 'character varying', nullable: 'NO' },
      { name: 'created_at', type: 'timestamp without time zone', nullable: 'YES' },
      { name: 'updated_at', type: 'timestamp without time zone', nullable: 'YES' },
      { name: 'deleted_at', type: 'timestamp without time zone', nullable: 'YES' },
    ];

    const existingColumns = columns.rows.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable,
    }));

    for (const required of requiredColumns) {
      const existing = existingColumns.find(col => col.name === required.name);
      if (!existing) {
        this.addResult('COLUMN_STRUCTURE', 'FAIL', `Missing column: ${required.name}`);
      } else if (existing.type !== required.type) {
        this.addResult('COLUMN_STRUCTURE', 'FAIL',
          `Column ${required.name} has wrong type: ${existing.type} (expected ${required.type})`);
      } else {
        this.addResult('COLUMN_STRUCTURE', 'PASS', `Column ${required.name} is correctly defined`);
      }
    }

    // Check ID default value
    const idColumn = columns.rows.find(col => col.column_name === 'id');
    if (idColumn?.column_default?.includes("concat('pvmat_'")) {
      this.addResult('ID_DEFAULT', 'PASS', 'ID column has correct default value');
    } else {
      this.addResult('ID_DEFAULT', 'FAIL', `ID column default value issue: ${idColumn?.column_default}`);
    }
  }

  private async validateIndexes(): Promise<void> {
    console.log('🗂️  Validating indexes...');

    const indexes = await this.pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'product_variant_material_link';
    `);

    const requiredIndexes = [
      'idx_pvml_material_id',
      'idx_pvml_deleted_at',
      'uq_pvml_variant_material_active',
    ];

    const existingIndexes = indexes.rows.map(idx => idx.indexname);

    for (const required of requiredIndexes) {
      if (existingIndexes.includes(required)) {
        this.addResult('INDEX_EXISTS', 'PASS', `Index ${required} exists`);
      } else {
        this.addResult('INDEX_EXISTS', 'FAIL', `Missing index: ${required}`);
      }
    }

    // Validate unique constraint index specifically
    const uniqueIndex = indexes.rows.find(idx => idx.indexname === 'uq_pvml_variant_material_active');
    if (uniqueIndex && uniqueIndex.indexdef.includes('WHERE (deleted_at IS NULL)')) {
      this.addResult('UNIQUE_CONSTRAINT', 'PASS', 'Unique constraint with deleted_at filter is correct');
    } else {
      this.addResult('UNIQUE_CONSTRAINT', 'FAIL', 'Unique constraint missing or incorrect');
    }
  }

  private async validateConstraints(): Promise<void> {
    console.log('🔐 Validating foreign key constraints...');

    const constraints = await this.pool.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'product_variant_material_link'
        AND tc.constraint_type = 'FOREIGN KEY';
    `);

    const requiredConstraints = [
      { column: 'product_variant_id', foreign_table: 'product_variant' },
      { column: 'material_id', foreign_table: 'materials' },
    ];

    for (const required of requiredConstraints) {
      const constraint = constraints.rows.find(c =>
        c.column_name === required.column &&
        c.foreign_table_name === required.foreign_table
      );

      if (constraint) {
        this.addResult('FOREIGN_KEY', 'PASS',
          `Foreign key constraint for ${required.column} -> ${required.foreign_table} exists`);
      } else {
        this.addResult('FOREIGN_KEY', 'FAIL',
          `Missing foreign key constraint for ${required.column} -> ${required.foreign_table}`);
      }
    }
  }

  private async validateMigrationFile(): Promise<void> {
    console.log('📄 Validating migration file...');

    const migrationPath = path.join(process.cwd(), 'src/migrations/20250927195901-create-product-variant-material-link.sql');

    if (!fs.existsSync(migrationPath)) {
      this.addResult('MIGRATION_FILE', 'FAIL', 'Migration file does not exist');
      return;
    }

    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

    // Check for required SQL statements
    const requiredStatements = [
      'CREATE TABLE IF NOT EXISTS product_variant_material_link',
      'id TEXT PRIMARY KEY DEFAULT',
      'deleted_at TIMESTAMP NULL',
      'CREATE INDEX IF NOT EXISTS idx_pvml_material_id',
      'CREATE INDEX IF NOT EXISTS idx_pvml_deleted_at',
      'CREATE UNIQUE INDEX IF NOT EXISTS uq_pvml_variant_material_active',
      'WHERE deleted_at IS NULL',
    ];

    for (const statement of requiredStatements) {
      if (migrationContent.includes(statement)) {
        this.addResult('MIGRATION_CONTENT', 'PASS', `Migration contains: ${statement}`);
      } else {
        this.addResult('MIGRATION_CONTENT', 'FAIL', `Migration missing: ${statement}`);
      }
    }
  }

  private async validateDataIntegrity(): Promise<void> {
    console.log('🔍 Validating data integrity...');

    try {
      // Test unique constraint
      const testId = `test_${Date.now()}`;
      const variantId = `${testId}_variant`;
      const materialId = `${testId}_material`;

      // Insert test data
      await this.pool.query(`
        INSERT INTO product (id, title, handle) VALUES ($1, 'Test Product', $2)
        ON CONFLICT (id) DO NOTHING
      `, [testId, `test-handle-${testId}`]);

      await this.pool.query(`
        INSERT INTO product_variant (id, product_id, title, sku) VALUES ($1, $2, 'Test Variant', $3)
        ON CONFLICT (id) DO NOTHING
      `, [variantId, testId, `TEST-SKU-${testId}`]);

      await this.pool.query(`
        INSERT INTO materials (id, name, properties) VALUES ($1, 'Test Material', '{}')
        ON CONFLICT (id) DO NOTHING
      `, [materialId]);

      // Test duplicate constraint
      try {
        await this.pool.query(`
          INSERT INTO product_variant_material_link (id, product_variant_id, material_id, deleted_at)
          VALUES ($1, $2, $3, NULL)
        `, [`${testId}_link1`, variantId, materialId]);

        await this.pool.query(`
          INSERT INTO product_variant_material_link (id, product_variant_id, material_id, deleted_at)
          VALUES ($1, $2, $3, NULL)
        `, [`${testId}_link2`, variantId, materialId]);

        this.addResult('UNIQUE_CONSTRAINT_TEST', 'FAIL', 'Unique constraint not enforced - duplicate insert succeeded');
      } catch (error) {
        if (error.message.includes('duplicate key value')) {
          this.addResult('UNIQUE_CONSTRAINT_TEST', 'PASS', 'Unique constraint properly enforced');
        } else {
          this.addResult('UNIQUE_CONSTRAINT_TEST', 'FAIL', `Unexpected error: ${error.message}`);
        }
      }

      // Cleanup test data
      await this.pool.query(`DELETE FROM product_variant_material_link WHERE id LIKE $1`, [`${testId}%`]);
      await this.pool.query(`DELETE FROM product_variant WHERE id = $1`, [variantId]);
      await this.pool.query(`DELETE FROM product WHERE id = $1`, [testId]);
      await this.pool.query(`DELETE FROM materials WHERE id = $1`, [materialId]);

    } catch (error) {
      this.addResult('DATA_INTEGRITY', 'FAIL', `Data integrity test failed: ${error.message}`);
    }
  }

  private async performanceTests(): Promise<void> {
    console.log('⚡ Running performance tests...');

    // Test index performance
    const start = performance.now();

    await this.pool.query(`
      SELECT COUNT(*)
      FROM product_variant_material_link
      WHERE deleted_at IS NULL
    `);

    const queryTime = performance.now() - start;

    if (queryTime < 100) {
      this.addResult('QUERY_PERFORMANCE', 'PASS', `Query executed in ${queryTime.toFixed(2)}ms`);
    } else {
      this.addResult('QUERY_PERFORMANCE', 'WARNING', `Query took ${queryTime.toFixed(2)}ms - consider optimization`);
    }
  }

  private addResult(check: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any): void {
    this.results.push({ check, status, message, details });

    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${check}: ${message}`);
  }
}

async function main() {
  const validator = new MigrationValidator();
  const results = await validator.validate();

  console.log('\n📊 Validation Summary:');
  console.log('='.repeat(50));

  const summary = {
    PASS: results.filter(r => r.status === 'PASS').length,
    FAIL: results.filter(r => r.status === 'FAIL').length,
    WARNING: results.filter(r => r.status === 'WARNING').length,
  };

  console.log(`✅ Passed: ${summary.PASS}`);
  console.log(`❌ Failed: ${summary.FAIL}`);
  console.log(`⚠️  Warnings: ${summary.WARNING}`);

  if (summary.FAIL > 0) {
    console.log('\n🚨 Migration validation FAILED. Please address the issues above.');
    process.exit(1);
  } else if (summary.WARNING > 0) {
    console.log('\n⚠️  Migration validation PASSED with warnings. Review recommendations above.');
    process.exit(0);
  } else {
    console.log('\n🎉 Migration validation PASSED completely!');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Validation script failed:', error);
    process.exit(1);
  });
}

export { MigrationValidator };