import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('No database connection string found');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function applyMigration() {
  try {
    console.log('Applying supplier fields migration...');
    
    // Add supplier fields to fabrics table
    await db.execute(sql`ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS supplier_id varchar(255)`);
    console.log('✅ Added supplier_id column');
    
    await db.execute(sql`ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS supplier_name varchar(255)`);
    console.log('✅ Added supplier_name column');
    
    await db.execute(sql`ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS procurement_cost numeric(10, 2)`);
    console.log('✅ Added procurement_cost column');
    
    console.log('\n✅ Migration applied successfully!');
    
    // Verify the columns were added
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'fabrics' 
      AND column_name IN ('supplier_id', 'supplier_name', 'procurement_cost')
      ORDER BY column_name
    `);
    
    console.log('\nVerified columns in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();