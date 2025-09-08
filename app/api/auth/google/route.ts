import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`
    
    if (!googleClientId) {
      console.error('GOOGLE_CLIENT_ID not configured')
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Build Google OAuth URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    googleAuthUrl.searchParams.set('client_id', googleClientId)
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
    googleAuthUrl.searchParams.set('response_type', 'code')
    googleAuthUrl.searchParams.set('scope', 'openid email profile')
    googleAuthUrl.searchParams.set('state', 'google-oauth')
    
    // Get the callback URL from the request
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/admin'
    
    // Store callback URL in session/cookie for later use
    const response = NextResponse.redirect(googleAuthUrl.toString())
    response.cookies.set('oauth-callback', callbackUrl, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600 // 10 minutes
    })
    
    return response
    
  } catch (error) {
    console.error('Google OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    )
  }
}