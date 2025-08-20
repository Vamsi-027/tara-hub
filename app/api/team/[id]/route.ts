import { NextRequest, NextResponse } from 'next/server';
import { legacyUsers } from '@/modules/auth';
import { db } from '@/core/database/drizzle/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

// PATCH /api/team/[id] - Update team member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    // Only admin roles can update team members
    if (!['admin', 'platform_admin', 'tenant_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { role } = await request.json();
    
    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }
    
    // Validate role
    const validRoles = ['platform_admin', 'tenant_admin', 'admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // Prevent self-modification of role (to avoid locking oneself out)
    const userToUpdate = await db.select().from(legacyUsers).where(eq(legacyUsers.id, params.id)).limit(1);
    if (userToUpdate.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (userToUpdate[0].email === decoded.email) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
    }
    
    // Update user role
    const updatedUser = await db
      .update(legacyUsers)
      .set({ 
        role,
        updatedAt: new Date()
      })
      .where(eq(legacyUsers.id, params.id))
      .returning();
    
    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('✅ Team member role updated:', updatedUser[0].email, 'to role:', updatedUser[0].role);
    
    return NextResponse.json({ 
      message: 'Role updated successfully',
      user: {
        id: updatedUser[0].id,
        email: updatedUser[0].email,
        name: updatedUser[0].name,
        role: updatedUser[0].role,
        status: 'active',
        joinedAt: updatedUser[0].createdAt.toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/team/[id] - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    // Only admin roles can remove team members
    if (!['admin', 'platform_admin', 'tenant_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Prevent self-deletion (to avoid locking oneself out)
    const userToDelete = await db.select().from(legacyUsers).where(eq(legacyUsers.id, params.id)).limit(1);
    if (userToDelete.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (userToDelete[0].email === decoded.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    // Delete user
    const deletedUser = await db
      .delete(legacyUsers)
      .where(eq(legacyUsers.id, params.id))
      .returning();
    
    if (deletedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('✅ Team member removed:', deletedUser[0].email);
    
    return NextResponse.json({ 
      message: 'Team member removed successfully',
      user: deletedUser[0]
    });
    
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' }, 
      { status: 500 }
    );
  }
}