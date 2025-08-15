import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/auth-schema'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user has admin privileges (platform_admin, tenant_admin, or admin)
    const userRole = (session.user as any)?.role
    const hasAdminAccess = userRole && ['platform_admin', 'tenant_admin', 'admin'].includes(userRole)
    
    if (!session || !hasAdminAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!db) {
      // Fallback to static list if no database
      const adminEmails = [
        'varaku@gmail.com',
        'batchu.kedareswaraabhinav@gmail.com',
        'vamsicheruku027@gmail.com',
        'admin@deepcrm.ai',
      ]
      
      const mockTeamMembers = adminEmails.map((email, index) => ({
        id: `user-${index + 1}`,
        email,
        name: email.split('@')[0].replace('.', ' ').split(' ').map(w => 
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' '),
        role: 'admin',
        status: 'active',
        joinedAt: new Date(Date.now() - index * 86400000).toISOString(),
      }))
      
      return NextResponse.json(mockTeamMembers)
    }

    // Fetch all users from database
    const teamMembers = await db.select().from(users)
    
    // Map users to team member format with roles from database
    const adminEmails = [
      'varaku@gmail.com',
      'batchu.kedareswaraabhinav@gmail.com',
      'vamsicheruku027@gmail.com',
      'admin@deepcrm.ai',
    ]
    
    const formattedMembers = teamMembers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      // Use role from database, fallback to admin check for legacy users
      role: user.role || (adminEmails.includes(user.email.toLowerCase()) ? 'admin' : 'viewer'),
      status: 'active',
      joinedAt: user.createdAt?.toISOString() || new Date().toISOString(),
    }))
    
    return NextResponse.json(formattedMembers)
    
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}