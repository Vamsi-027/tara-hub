#!/usr/bin/env node

/**
 * Test Database Setup - Safe Cloud Database Operations
 *
 * This script ensures cloud database tests are isolated and safe.
 * Uses unique prefixes for test data to avoid conflicts.
 */

import { Pool } from "pg";
import fs from "fs";
import path from "path";

const NEON_DB_URL = process.env.DATABASE_URL_TEST ||
  "postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require";

async function ensureTestSchema(pool: Pool) {
  console.log("🔧 Ensuring test schema exists...");

  // 1. Ensure materials table and indexes exist
  const schemaSql = fs.readFileSync(
    path.join(process.cwd(), "src/modules/materials/migrations/create-materials-schema.sql"),
    "utf-8"
  );

  try {
    await pool.query(schemaSql);
    console.log("✅ Materials schema ready");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("✅ Materials schema already exists");
    } else {
      throw error;
    }
  }

  // 2. Ensure product tables exist for product tests
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_variant (
      id VARCHAR(255) PRIMARY KEY,
      product_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      sku VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_product_variant_product FOREIGN KEY (product_id)
        REFERENCES product(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_variant_material_link (
      product_variant_id VARCHAR(255) PRIMARY KEY,
      material_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_pvml_variant FOREIGN KEY (product_variant_id)
        REFERENCES product_variant(id) ON DELETE CASCADE,
      CONSTRAINT fk_pvml_material FOREIGN KEY (material_id)
        REFERENCES materials(id) ON DELETE RESTRICT
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pvml_material_id ON product_variant_material_link (material_id);`);

  console.log("✅ All test schemas ready");
}

async function cleanupTestData(pool: Pool, prefix?: string) {
  if (!prefix) {
    console.log("⚠️  No prefix provided - skipping cleanup for safety");
    return;
  }

  console.log(`🧹 Cleaning up test data with prefix: ${prefix}`);

  // Delete test data in correct order (foreign keys)
  await pool.query(`DELETE FROM product_variant_material_link WHERE product_variant_id LIKE '${prefix}%'`);
  await pool.query(`DELETE FROM product_variant WHERE id LIKE '${prefix}%'`);
  await pool.query(`DELETE FROM product WHERE id LIKE '${prefix}%'`);
  await pool.query(`DELETE FROM materials WHERE id LIKE '${prefix}%'`);

  console.log("✅ Test data cleaned up");
}

async function main() {
  const command = process.argv[2];
  const prefix = process.argv[3];

  const pool = new Pool({ connectionString: NEON_DB_URL });

  try {
    switch (command) {
      case "setup":
        await ensureTestSchema(pool);
        break;
      case "cleanup":
        await cleanupTestData(pool, prefix);
        break;
      case "init":
        await ensureTestSchema(pool);
        console.log("🎉 Test database initialized for cloud e2e tests");
        break;
      default:
        console.log("Usage:");
        console.log("  npm run test:db:setup    - Ensure test schemas exist");
        console.log("  npm run test:db:cleanup <prefix> - Clean test data");
        console.log("  npm run test:db:init     - Full initialization");
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { ensureTestSchema, cleanupTestData };