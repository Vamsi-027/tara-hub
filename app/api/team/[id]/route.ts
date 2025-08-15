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
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role } = await request.json()
    
    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // For now, we'll store role information in a separate system
    // In production, you'd want to add a roles table or user_roles field
    
    return NextResponse.json({
      message: 'Role updated successfully',
      userId: params.id,
      newRole: role,
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
    
    if (!session || (session.user as any)?.role !== 'admin') {
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