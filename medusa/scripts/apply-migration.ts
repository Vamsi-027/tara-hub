#!/usr/bin/env node

/**
 * Apply Migration Script
 *
 * Applies the multi-material migration to the database
 */

import { Pool } from "pg";
import fs from "fs";
import path from "path";

const NEON_DB_URL = process.env.DATABASE_URL_TEST ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL;

async function applyMigration() {
  if (!NEON_DB_URL) {
    throw new Error("Database URL required for migration");
  }

  const pool = new Pool({
    connectionString: NEON_DB_URL,
    ssl: NEON_DB_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔧 Applying multi-material migration...');

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'src/migrations/20250927195901-create-product-variant-material-link.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    // Apply migration
    await pool.query(migrationSql);

    console.log('✅ Migration applied successfully');

    // Verify the table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_variant_material_link'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Verify indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'product_variant_material_link';
    `);

    console.log('\n🗂️  Indexes:');
    indexes.rows.forEach(idx => {
      console.log(`  ${idx.indexname}`);
    });

  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  applyMigration().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

export { applyMigration };