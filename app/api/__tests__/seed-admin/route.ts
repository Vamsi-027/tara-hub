import { NextRequest, NextResponse } from 'next/server';
import { legacyUsers } from '@/modules/auth';
import { db } from '@/core/database/drizzle/client';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const initialAdminEmail = 'varaku@gmail.com';
    
    console.log('🌱 Seeding initial admin user:', initialAdminEmail);
    
    // Check if admin already exists
    const existingUser = await db.select().from(legacyUsers).where(eq(legacyUsers.email, initialAdminEmail)).limit(1);
    
    if (existingUser.length > 0) {
      console.log('✅ Admin user already exists');
      return NextResponse.json({ 
        message: 'Initial admin user already exists', 
        user: existingUser[0] 
      });
    }
    
    // Create initial admin user
    const newAdmin = await db.insert(legacyUsers).values({
      email: initialAdminEmail,
      role: 'platform_admin', // Highest level admin
      emailVerified: new Date(),
      name: 'Admin User',
    }).returning();
    
    console.log('✅ Initial admin user created:', newAdmin[0].id);
    
    return NextResponse.json({ 
      message: 'Initial admin user created successfully', 
      user: newAdmin[0] 
    });
    
  } catch (error) {
    console.error('💥 Error seeding admin user:', error);
    return NextResponse.json(
      { error: 'Failed to seed admin user' }, 
      { status: 500 }
    );
  }
}