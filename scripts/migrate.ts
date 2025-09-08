/**
 * Database Migration Runner
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found');
    process.exit(1);
  }

  console.log('🔄 Starting database migration...');
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL !== 'false' ? {
      rejectUnauthorized: false
    } : undefined,
  });

  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();