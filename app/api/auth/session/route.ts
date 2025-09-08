import { NextRequest, NextResponse } from 'next/server'
import jwt from '@tsndr/cloudflare-worker-jwt'

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('auth-token')
    
    if (!authCookie?.value) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ''
    
    if (!jwtSecret) {
      console.error('JWT_SECRET or NEXTAUTH_SECRET not configured')
      return NextResponse.json({ user: null }, { status: 500 })
    }

    try {
      const isValid = await jwt.verify(authCookie.value, jwtSecret)
      
      if (!isValid) {
        return NextResponse.json({ user: null }, { status: 401 })
      }

      // Decode the JWT to get user info
      const payload = jwt.decode(authCookie.value)
      
      if (!payload || !payload.payload) {
        return NextResponse.json({ user: null }, { status: 401 })
      }

      const user = payload.payload as any
      
      return NextResponse.json({
        user: {
          id: user.id || user.sub,
          email: user.email,
          name: user.name,
          role: user.role || 'admin'
        }
      })
      
    } catch (verifyError) {
      console.error('JWT verification failed:', verifyError)
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}