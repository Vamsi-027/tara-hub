import { NextRequest, NextResponse } from 'next/server'
import jwt from '@tsndr/cloudflare-worker-jwt'

// Authorized admin emails - matches the admin whitelist from CLAUDE.md
const adminEmails = [
  'varaku@gmail.com',
  'batchu.kedareswaraabhinav@gmail.com', 
  'vamsicheruku027@gmail.com',
  'admin@deepcrm.ai'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    if (!code || state !== 'google-oauth') {
      return NextResponse.redirect('/auth/signin?error=invalid_request')
    }

    // Exchange code for access token
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`
    
    if (!googleClientId || !googleClientSecret) {
      console.error('Google OAuth credentials not configured')
      return NextResponse.redirect('/auth/signin?error=configuration_error')
    }

    // Get access token from Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get access token from Google')
      return NextResponse.redirect('/auth/signin?error=token_exchange_failed')
    }

    const tokenData = await tokenResponse.json()
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to get user info from Google')
      return NextResponse.redirect('/auth/signin?error=user_info_failed')
    }

    const userData = await userResponse.json()
    
    // Check if user is authorized admin
    if (!adminEmails.includes(userData.email)) {
      console.log(`Unauthorized access attempt by: ${userData.email}`)
      return NextResponse.redirect('/auth/signin?error=unauthorized')
    }

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ''
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return NextResponse.redirect('/auth/signin?error=configuration_error')
    }

    const userPayload = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: 'admin',
      picture: userData.picture,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }

    const token = await jwt.sign(userPayload, jwtSecret)
    
    // Get the original callback URL
    const callbackUrl = request.cookies.get('oauth-callback')?.value || '/admin'
    
    // Set auth cookie and redirect
    const response = NextResponse.redirect(new URL(callbackUrl, request.url))
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })
    
    // Clear the oauth callback cookie
    response.cookies.delete('oauth-callback')
    
    return response
    
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect('/auth/signin?error=callback_failed')
  }
}