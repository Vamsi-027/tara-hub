import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { legacyUsers } from '@/lib/legacy-auth-schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
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
    
    console.log('Adding admin user:', newUser.email);
    
    // Check if user already exists
    const existing = await db.select().from(legacyUsers).where(eq(legacyUsers.email, newUser.email)).limit(1);
    
    if (existing.length > 0) {
      console.log('User already exists, updating role to admin...');
      await db.update(legacyUsers)
        .set({ role: 'admin', updatedAt: new Date() })
        .where(eq(legacyUsers.email, newUser.email));
      
      return NextResponse.json({ 
        message: 'User already exists, updated to admin role',
        user: existing[0]
      });
    } else {
      console.log('Creating new admin user...');
      await db.insert(legacyUsers).values(newUser);
      
      return NextResponse.json({ 
        message: 'New admin user created successfully',
        user: newUser
      });
    }
  } catch (error: any) {
    console.error('Error adding admin user:', error);
    return NextResponse.json({ 
      error: 'Failed to add admin user',
      details: error.message
    }, { status: 500 });
  }
}