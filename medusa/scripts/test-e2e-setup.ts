#!/usr/bin/env node

/**
 * E2E Test Setup Script for Medusa with Cloud Database
 *
 * This script ensures proper environment and permissions for e2e testing
 * with Neon PostgreSQL cloud database instead of local Testcontainers.
 */

import fs from "fs";
import path from "path";
import os from "os";

const NEON_DB_URL = "postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require";

async function setupE2EEnvironment() {
  console.log("🔧 Setting up E2E testing environment with cloud database...");

  // 1. Ensure .env.test exists with correct configuration
  const envTestPath = path.join(process.cwd(), ".env.test");
  if (!fs.existsSync(envTestPath)) {
    console.log("❌ .env.test not found - creating it...");
    const envContent = `NODE_ENV=test
DATABASE_URL_TEST=${NEON_DB_URL}
NEON_DATABASE_URL=${NEON_DB_URL}
JWT_SECRET=test_jwt_secret
COOKIE_SECRET=test_cookie_secret
DISABLE_MEDUSA_ADMIN=true
`;
    fs.writeFileSync(envTestPath, envContent);
    console.log("✅ Created .env.test");
  }

  // 2. Ensure Medusa CLI config directory exists and is writable
  const medusaConfigDir = path.join(os.homedir(), ".config", "medusa");
  try {
    if (!fs.existsSync(medusaConfigDir)) {
      fs.mkdirSync(medusaConfigDir, { recursive: true });
      console.log("✅ Created Medusa CLI config directory");
    }

    // Test write access
    const testFile = path.join(medusaConfigDir, "test-write.tmp");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    console.log("✅ Medusa CLI config directory is writable");
  } catch (error) {
    console.log("❌ Medusa CLI config directory issue:", error.message);
    console.log("💡 You may need to run: mkdir -p ~/.config/medusa && chmod 755 ~/.config/medusa");
  }

  // 3. Test database connectivity
  console.log("🔍 Testing database connectivity...");
  try {
    const { Pool } = require("pg");
    const pool = new Pool({ connectionString: NEON_DB_URL });

    const result = await pool.query("SELECT NOW() as current_time, version()");
    console.log("✅ Database connection successful");
    console.log(`📡 Connected to: ${result.rows[0].version.split(',')[0]}`);

    await pool.end();
  } catch (error) {
    console.log("❌ Database connection failed:", error.message);
    console.log("💡 Check your network connection and ensure the Neon database is accessible");
    throw error;
  }

  // 4. Set environment variables for current process
  process.env.DATABASE_URL_TEST = NEON_DB_URL;
  process.env.NODE_ENV = "test";

  console.log("🎉 E2E testing environment setup complete!");
  console.log("");
  console.log("Available test commands:");
  console.log("  npm run test:e2e:cloud     - Run all e2e tests with cloud DB");
  console.log("  npm run test:e2e:materials - Run materials e2e tests");
  console.log("  npm run test:e2e:products  - Run products e2e tests");
  console.log("");
}

// Run setup if called directly
if (require.main === module) {
  setupE2EEnvironment().catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });
}

export { setupE2EEnvironment };