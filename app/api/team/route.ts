import { NextRequest, NextResponse } from 'next/server';
import { legacyUsers } from '@/modules/auth';
import { db } from '@/core/database/drizzle/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// GET /api/team - List all team members
export async function GET() {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    // Only admin roles can view team members
    if (!['admin', 'platform_admin', 'tenant_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get all users
    const users = await db.select().from(legacyUsers);
    
    // Transform to match TeamMember interface
    const teamMembers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'viewer',
      status: 'active', // For now, all users are active
      joinedAt: user.createdAt.toISOString(),
    }));
    
    return NextResponse.json(teamMembers);
    
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' }, 
      { status: 500 }
    );
  }
}
