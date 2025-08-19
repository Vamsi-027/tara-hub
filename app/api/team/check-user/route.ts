import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/auth-schema'
import { eq } from 'drizzle-orm'
import { checkJWTAuth, PERMISSIONS } from '@/lib/auth-utils-jwt'

export async function POST(request: Request) {
  try {
    const { allowed, error } = await checkJWTAuth(PERMISSIONS.ADMIN_ONLY);
    if (!allowed) {
      return error!;
    }

    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!db) {
      return NextResponse.json({
        error: 'Database not configured',
        message: 'No database connection available. Users cannot be stored.',
      }, { status: 500 })
    }

    // Check if user exists in database
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)
    
    if (existingUser.length > 0) {
      return NextResponse.json({
        exists: true,
        user: {
          id: existingUser[0].id,
          email: existingUser[0].email,
          name: existingUser[0].name,
          role: existingUser[0].role,
          emailVerified: existingUser[0].emailVerified,
          createdAt: existingUser[0].createdAt,
        },
        message: `User found with role: ${existingUser[0].role}`,
      })
    }

    return NextResponse.json({
      exists: false,
      message: 'User not found in database',
    })
    
  } catch (error) {
    console.error('Error checking user:', error)
    return NextResponse.json(
      { error: 'Failed to check user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}