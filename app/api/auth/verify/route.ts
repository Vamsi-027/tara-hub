import { NextRequest, NextResponse } from 'next/server'
import jwt from '@tsndr/cloudflare-worker-jwt'

// Authorized admin emails - matches the admin whitelist
const adminEmails = [
  'varaku@gmail.com',
  'batchu.kedareswaraabhinav@gmail.com', 
  'vamsicheruku027@gmail.com',
  'admin@deepcrm.ai'
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!token || !email) {
      return NextResponse.redirect('/auth/verify?error=invalid')
    }

    // Verify the magic link token
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ''
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return NextResponse.redirect('/auth/verify?error=server')
    }

    try {
      const isValid = await jwt.verify(token, jwtSecret)
      
      if (!isValid) {
        console.log('Invalid magic link token')
        return NextResponse.redirect('/auth/verify?error=invalid')
      }

      // Decode the JWT to get the payload
      const payload = jwt.decode(token)
      
      if (!payload || !payload.payload) {
        console.log('Invalid magic link payload')
        return NextResponse.redirect('/auth/verify?error=invalid')
      }

      const tokenData = payload.payload as any
      
      // Verify this is a magic link token and check expiration
      if (tokenData.purpose !== 'magic-link') {
        console.log('Invalid token purpose')
        return NextResponse.redirect('/auth/verify?error=invalid')
      }

      if (tokenData.exp < Math.floor(Date.now() / 1000)) {
        console.log('Magic link token expired')
        return NextResponse.redirect('/auth/verify?error=expired')
      }

      // Verify email matches
      if (tokenData.email !== email) {
        console.log('Email mismatch in magic link')
        return NextResponse.redirect('/auth/verify?error=invalid')
      }

      // Check if user is authorized admin
      if (!adminEmails.includes(email)) {
        console.log(`Unauthorized magic link verification by: ${email}`)
        return NextResponse.redirect('/auth/verify?error=unauthorized')
      }

      // Create session JWT token
      const sessionPayload = {
        id: email, // Use email as ID for admin users
        email: email,
        name: email.split('@')[0], // Use username part as display name
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      }

      const sessionToken = await jwt.sign(sessionPayload, jwtSecret)
      
      // Instead of redirect, return HTML page that sets cookie via JavaScript
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Success</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(to bottom right, #dbeafe, #e0e7ff); }
            .container { text-align: center; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .spinner { border: 4px solid #f3f4f6; border-left: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>Authentication Successful!</h2>
            <p>Redirecting you to the admin panel...</p>
          </div>
          <script>
            // Set auth cookie
            document.cookie = 'auth-token=${sessionToken}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax';
            console.log('Auth cookie set successfully');
            
            // Wait a moment then redirect
            setTimeout(() => {
              window.location.href = '/admin';
            }, 2000);
          </script>
        </body>
        </html>
      `;
      
      console.log(`Magic link verification successful for: ${email}, serving auth page`)
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      })
      
    } catch (verifyError) {
      console.error('Magic link token verification failed:', verifyError)
      return NextResponse.redirect('/auth/verify?error=invalid')
    }
    
  } catch (error) {
    console.error('Magic link verification error:', error)
    return NextResponse.redirect('/auth/verify?error=server')
  }
}