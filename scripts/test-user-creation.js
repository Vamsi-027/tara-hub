const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testUserCreation() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL found');
    return;
  }
  
  console.log('🧪 Testing user creation in database...\n');
  
  try {
    const sql = neon(databaseUrl);
    
    // Check if test user exists
    const existingUser = await sql`
      SELECT * FROM users 
      WHERE email = 'test@example.com';
    `;
    
    if (existingUser.length > 0) {
      console.log('Cleaning up existing test user...');
      await sql`DELETE FROM users WHERE email = 'test@example.com';`;
    }
    
    // Test creating a user with proper UUID
    console.log('Creating test user...');
    const testUserId = crypto.randomUUID();
    
    const newUser = await sql`
      INSERT INTO users (id, email, name, email_verified, created_at, updated_at)
      VALUES (
        ${testUserId},
        'test@example.com',
        'Test User',
        ${new Date()},
        ${new Date()},
        ${new Date()}
      )
      RETURNING *;
    `;
    
    console.log('✓ Test user created successfully:');
    console.log('  ID:', newUser[0].id);
    console.log('  Email:', newUser[0].email);
    console.log('  Name:', newUser[0].name);
    
    // Clean up test user
    console.log('\nCleaning up test user...');
    await sql`DELETE FROM users WHERE id = ${testUserId};`;
    console.log('✓ Test user deleted');
    
    console.log('\n✅ User creation test passed!');
    console.log('The database can successfully create users.');
    
    // Check for any existing users
    const realUsers = await sql`
      SELECT email, name, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5;
    `;
    
    if (realUsers.length > 0) {
      console.log('\n📋 Existing users in database:');
      realUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name || 'No name'})`);
      });
    } else {
      console.log('\n📋 No users in database yet.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nDetails:', error);
  }
}

testUserCreation();