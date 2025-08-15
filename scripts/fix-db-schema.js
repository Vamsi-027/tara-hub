const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function fixSchema() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL found');
    return;
  }
  
  console.log('🔧 Fixing database schema...\n');
  
  try {
    const sql = neon(databaseUrl);
    
    // Check if email unique constraint exists
    const constraints = await sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND constraint_type = 'UNIQUE';
    `;
    
    const hasEmailUnique = constraints.some(c => c.constraint_name === 'users_email_unique');
    
    if (!hasEmailUnique) {
      console.log('Adding unique constraint to users.email...');
      await sql`ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE(email);`;
      console.log('✓ Added unique constraint to email');
    } else {
      console.log('✓ Email unique constraint already exists');
    }
    
    // Check if foreign keys exist
    console.log('\nChecking foreign keys...');
    
    // Add foreign key for accounts.user_id if not exists
    const accountsFks = await sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'accounts' 
      AND constraint_type = 'FOREIGN KEY';
    `;
    
    if (accountsFks.length === 0) {
      console.log('Adding foreign key to accounts.user_id...');
      await sql`
        ALTER TABLE accounts 
        ADD CONSTRAINT accounts_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
      `;
      console.log('✓ Added foreign key to accounts');
    } else {
      console.log('✓ Accounts foreign key exists');
    }
    
    // Add foreign key for sessions.user_id if not exists
    const sessionsFks = await sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'sessions' 
      AND constraint_type = 'FOREIGN KEY';
    `;
    
    if (sessionsFks.length === 0) {
      console.log('Adding foreign key to sessions.user_id...');
      await sql`
        ALTER TABLE sessions 
        ADD CONSTRAINT sessions_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
      `;
      console.log('✓ Added foreign key to sessions');
    } else {
      console.log('✓ Sessions foreign key exists');
    }
    
    // Add unique constraint to sessions.session_token if not exists
    const sessionTokenUnique = await sql`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'sessions' 
      AND constraint_type = 'UNIQUE';
    `;
    
    if (!sessionTokenUnique.some(c => c.constraint_name === 'sessions_session_token_unique')) {
      console.log('Adding unique constraint to sessions.session_token...');
      await sql`ALTER TABLE sessions ADD CONSTRAINT sessions_session_token_unique UNIQUE(session_token);`;
      console.log('✓ Added unique constraint to session_token');
    } else {
      console.log('✓ Session token unique constraint exists');
    }
    
    // Create migration tracking table if not exists
    console.log('\nCreating migration tracking table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint DEFAULT extract(epoch from now()) * 1000
      );
    `;
    console.log('✓ Migration tracking table ready');
    
    // Mark migrations as applied
    await sql`
      INSERT INTO "__drizzle_migrations" (hash) 
      VALUES ('0000_silent_mattie_franklin')
      ON CONFLICT DO NOTHING;
    `;
    
    await sql`
      INSERT INTO "__drizzle_migrations" (hash) 
      VALUES ('0001_third_thing')
      ON CONFLICT DO NOTHING;
    `;
    console.log('✓ Marked migrations as applied');
    
    console.log('\n✅ Database schema fixed successfully!');
    console.log('\nYour database is now ready for authentication.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === '23505') {
      console.log('Note: Constraint already exists (this is OK)');
    }
  }
}

fixSchema();