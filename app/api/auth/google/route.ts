import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!

const adminEmails = [
  'varaku@gmail.com',
  'batchu.kedareswaraabhinav@gmail.com',
  'vamsicheruku027@gmail.com',
  'admin@deepcrm.ai',
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  
  if (error) {
    return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', request.url))
  }
  
  if (!code) {
    // Redirect to Google OAuth
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${request.nextUrl.origin}/api/auth/google`,
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
    })
    
    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  }
  
  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${request.nextUrl.origin}/api/auth/google`,
      }),
    })
    
    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      throw new Error('No access token received')
    }
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    
    const user = await userResponse.json()
    
    // Check if user is authorized
    if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    
    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'admin',
        image: user.picture,
      },
      NEXTAUTH_SECRET,
      { expiresIn: '30d' }
    )
    
    // Set cookie
    const response = NextResponse.redirect(new URL('/admin', request.url))
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })
    
    return response
    
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(new URL('/auth/error?error=Configuration', request.url))
  }
}