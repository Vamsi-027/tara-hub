import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/auth-schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user has admin privileges (platform_admin, tenant_admin, or admin)
    const userRole = (session.user as any)?.role
    const hasAdminAccess = userRole && ['platform_admin', 'tenant_admin', 'admin'].includes(userRole)
    
    if (!session || !hasAdminAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await request.json()
    
    // Extended role list with SaaS roles
    const validRoles = ['platform_admin', 'tenant_admin', 'admin', 'editor', 'viewer']
    
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    if (!db) {
      return NextResponse.json({
        message: 'Role updated (no database)',
        userId: params.id,
        newRole: role,
      })
    }

    // Update the user's role in the database
    const updatedUser = await db.update(users)
      .set({ 
        role: role,
        updatedAt: new Date()
      })
      .where(eq(users.id, params.id))
      .returning()
    
    if (!updatedUser.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Role updated successfully',
      userId: params.id,
      newRole: role,
      user: updatedUser[0],
    })
    
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user has admin privileges (platform_admin, tenant_admin, or admin)
    const userRole = (session.user as any)?.role
    const hasAdminAccess = userRole && ['platform_admin', 'tenant_admin', 'admin'].includes(userRole)
    
    if (!session || !hasAdminAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prevent self-deletion
    if (params.id === (session.user as any)?.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      )
    }

    if (!db) {
      return NextResponse.json({
        message: 'Member removed (no database)',
      })
    }

    // Delete user from database
    await db.delete(users).where(eq(users.id, params.id))
    
    return NextResponse.json({
      message: 'Team member removed successfully',
    })
    
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}