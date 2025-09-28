#!/usr/bin/env node

/**
 * Multi-Material Migration Script
 *
 * Safely migrates existing product_variant_material_link table
 * to support the new multi-material schema
 */

import { Pool } from "pg";

const NEON_DB_URL = process.env.DATABASE_URL_TEST ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL;

async function migrateToMultiMaterial() {
  if (!NEON_DB_URL) {
    throw new Error("Database URL required for migration");
  }

  const pool = new Pool({
    connectionString: NEON_DB_URL,
    ssl: NEON_DB_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔧 Migrating to multi-material schema...');

    // Check current table structure
    const existingColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'product_variant_material_link';
    `);

    const columnNames = existingColumns.rows.map(row => row.column_name);
    console.log('📋 Current columns:', columnNames);

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Step 1: Drop existing primary key first if it exists
      const primaryKeys = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'product_variant_material_link'
          AND constraint_type = 'PRIMARY KEY';
      `);

      if (primaryKeys.rows.length > 0) {
        for (const pk of primaryKeys.rows) {
          console.log(`🔧 Dropping existing primary key: ${pk.constraint_name}`);
          await pool.query(`
            ALTER TABLE product_variant_material_link
            DROP CONSTRAINT ${pk.constraint_name};
          `);
        }
      }

      // Step 2: Add missing columns if they don't exist
      if (!columnNames.includes('id')) {
        console.log('➕ Adding id column...');
        await pool.query(`
          ALTER TABLE product_variant_material_link
          ADD COLUMN id TEXT DEFAULT concat('pvmat_', md5(random()::text));
        `);

        // Populate existing records with IDs
        await pool.query(`
          UPDATE product_variant_material_link
          SET id = concat('pvmat_', md5(random()::text))
          WHERE id IS NULL;
        `);

        // Now make it primary key
        await pool.query(`
          ALTER TABLE product_variant_material_link
          ADD PRIMARY KEY (id);
        `);
      }

      if (!columnNames.includes('deleted_at')) {
        console.log('➕ Adding deleted_at column...');
        await pool.query(`
          ALTER TABLE product_variant_material_link
          ADD COLUMN deleted_at TIMESTAMP NULL;
        `);
      }

      // Step 2: Drop old primary key constraint if it exists
      const oldConstraints = await pool.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'product_variant_material_link'
          AND constraint_type = 'PRIMARY KEY'
          AND constraint_name != 'product_variant_material_link_pkey';
      `);

      for (const constraint of oldConstraints.rows) {
        console.log(`🔧 Dropping old constraint: ${constraint.constraint_name}`);
        await pool.query(`
          ALTER TABLE product_variant_material_link
          DROP CONSTRAINT IF EXISTS ${constraint.constraint_name};
        `);
      }

      // Step 3: Remove unique constraint on product_variant_id if it exists
      await pool.query(`
        ALTER TABLE product_variant_material_link
        DROP CONSTRAINT IF EXISTS product_variant_material_link_product_variant_id_key;
      `);

      // Step 4: Create new indexes
      console.log('🗂️  Creating indexes...');

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_pvml_material_id
        ON product_variant_material_link (material_id);
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_pvml_deleted_at
        ON product_variant_material_link (deleted_at)
        WHERE deleted_at IS NULL;
      `);

      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS uq_pvml_variant_material_active
        ON product_variant_material_link (product_variant_id, material_id)
        WHERE deleted_at IS NULL;
      `);

      // Step 5: Update existing records to have proper IDs if needed
      const recordsWithoutId = await pool.query(`
        SELECT COUNT(*) as count
        FROM product_variant_material_link
        WHERE id IS NULL;
      `);

      if (parseInt(recordsWithoutId.rows[0].count) > 0) {
        console.log('🔧 Updating existing records with IDs...');
        await pool.query(`
          UPDATE product_variant_material_link
          SET id = concat('pvmat_', md5(random()::text))
          WHERE id IS NULL;
        `);
      }

      await pool.query('COMMIT');
      console.log('✅ Migration completed successfully');

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

    // Verify final structure
    console.log('\n📊 Final table structure:');
    const finalColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'product_variant_material_link'
      ORDER BY ordinal_position;
    `);

    finalColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n🗂️  Indexes:');
    const finalIndexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'product_variant_material_link';
    `);

    finalIndexes.rows.forEach(idx => {
      console.log(`  ${idx.indexname}`);
    });

  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  migrateToMultiMaterial().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

export { migrateToMultiMaterial };