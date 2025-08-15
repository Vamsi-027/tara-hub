const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function addRoleField() {
  const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL found');
    return;
  }
  
  console.log('🔧 Adding role field to users table...\n');
  
  try {
    const sql = neon(databaseUrl);
    
    // Check if role column already exists
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'role';
    `;
    
    if (columns.length > 0) {
      console.log('✓ Role column already exists');
    } else {
      console.log('Adding role column to users table...');
      await sql`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'viewer';`;
      console.log('✓ Added role column with default value "viewer"');
    }
    
    // Update existing admin users
    const adminEmails = [
      'varaku@gmail.com',
      'batchu.kedareswaraabhinav@gmail.com',
      'vamsicheruku027@gmail.com',
      'admin@deepcrm.ai',
    ];
    
    console.log('\nUpdating admin users...');
    for (const email of adminEmails) {
      await sql`
        UPDATE users 
        SET role = 'admin' 
        WHERE email = ${email.toLowerCase()};
      `;
      console.log(`  ✓ Updated ${email} to admin role`);
    }
    
    // Check current users and their roles
    const users = await sql`
      SELECT email, role 
      FROM users 
      ORDER BY created_at DESC;
    `;
    
    if (users.length > 0) {
      console.log('\n📋 Current users and roles:');
      users.forEach(u => {
        console.log(`  - ${u.email}: ${u.role || 'viewer'}`);
      });
    }
    
    console.log('\n✅ Role field added successfully!');
    console.log('Team management is now ready to use.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addRoleField();