const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables');
    return;
  }
  
  console.log('🔍 Checking Neon Database Tables...\n');
  console.log('Database URL:', databaseUrl.replace(/:[^:]*@/, ':****@'));
  
  try {
    const sql = neon(databaseUrl);
    
    // Check what tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('\n📊 Existing tables in database:');
    if (tables.length === 0) {
      console.log('   ❌ No tables found!');
    } else {
      tables.forEach(t => console.log(`   ✓ ${t.table_name}`));
    }
    
    // Check required auth tables
    const requiredTables = ['users', 'accounts', 'sessions', 'verification_tokens'];
    const existingTableNames = tables.map(t => t.table_name);
    
    console.log('\n🔐 Auth tables status:');
    requiredTables.forEach(tableName => {
      if (existingTableNames.includes(tableName)) {
        console.log(`   ✓ ${tableName} - exists`);
      } else {
        console.log(`   ❌ ${tableName} - MISSING`);
      }
    });
    
    // If tables exist, check their structure
    if (existingTableNames.includes('users')) {
      const userColumns = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      console.log('\n📋 Users table structure:');
      userColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
      });
    }
    
    // Check if we need to create tables
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));
    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing tables detected. Run the following commands:');
      console.log('   1. npm run db:generate');
      console.log('   2. npm run db:migrate');
      console.log('   OR');
      console.log('   npm run db:push (to push schema directly)');
    } else {
      console.log('\n✅ All required tables exist!');
    }
    
  } catch (error) {
    console.error('\n❌ Error connecting to database:', error.message);
    console.error('\nMake sure:');
    console.error('1. Your database URL is correct');
    console.error('2. The database is accessible');
    console.error('3. You have the correct permissions');
  }
}

checkTables();