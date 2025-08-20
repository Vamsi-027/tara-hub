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
    console.log('Applying store-guide JSON fields migration...');
    
    // Add JSON fields for store-guide experience
    await db.execute(sql`ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS performance_metrics jsonb`);
    console.log('✅ Added performance_metrics column');
    
    await db.execute(sql`ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS usage_suitability jsonb`);
    console.log('✅ Added usage_suitability column');
    
    await db.execute(sql`ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS additional_features jsonb`);
    console.log('✅ Added additional_features column');
    
    await db.execute(sql`ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS technical_documents jsonb`);
    console.log('✅ Added technical_documents column');
    
    console.log('\n✅ Migration applied successfully!');
    
    // Verify the columns were added
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'fabrics' 
      AND column_name IN ('performance_metrics', 'usage_suitability', 'additional_features', 'technical_documents')
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