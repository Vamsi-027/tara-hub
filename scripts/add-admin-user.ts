// Script to add new admin user to database
import { db } from '../lib/db';
import { legacyUsers } from '../lib/legacy-auth-schema';
import { eq } from 'drizzle-orm';

async function addAdminUser() {
  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    name: 'RK Vankayalapati',
    email: 'rkvankayalapati@gemini-us.com',
    emailVerified: new Date(),
    image: null,
    role: 'admin' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    console.log('Adding admin user:', newUser.email);
    
    // Check if user already exists
    const existing = await db.select().from(legacyUsers).where(eq(legacyUsers.email, newUser.email)).limit(1);
    
    if (existing.length > 0) {
      console.log('User already exists, updating role to admin...');
      await db.update(legacyUsers)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(legacyUsers.email, newUser.email));
    } else {
      console.log('Creating new admin user...');
      await db.insert(legacyUsers).values(newUser);
    }
    
    console.log('✅ Admin user added successfully!');
  } catch (error) {
    console.error('Error adding admin user:', error);
  }
  
  process.exit(0);
}

addAdminUser();