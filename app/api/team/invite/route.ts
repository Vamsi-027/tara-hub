import { NextRequest, NextResponse } from 'next/server';
import { legacyUsers } from '@/lib/legacy-auth-schema';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

// POST /api/team/invite - Invite new team member
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    // Only admin roles can invite team members
    if (!['admin', 'platform_admin', 'tenant_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { email, role } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }
    
    // Validate role
    const validRoles = ['platform_admin', 'tenant_admin', 'admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await db.select().from(legacyUsers).where(eq(legacyUsers.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Create new user with the specified role
    const newUser = await db.insert(legacyUsers).values({
      email,
      role,
      name: email.split('@')[0], // Default name from email
      emailVerified: null, // Not verified until they login
    }).returning();
    
    console.log('✅ Team member invited:', newUser[0].email, 'with role:', newUser[0].role);
    
    // For now, we're just creating the user. In a full implementation,
    // you would send an actual email invitation here.
    
    return NextResponse.json({ 
      message: 'Team member invited successfully',
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        role: newUser[0].role,
        status: 'pending',
        joinedAt: newUser[0].createdAt.toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: 'Failed to invite team member' }, 
      { status: 500 }
    );
  }
}
