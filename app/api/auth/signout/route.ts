import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })
    
    // Clear the auth token cookie
    response.cookies.delete('auth-token')
    
    return response
  } catch (error) {
    console.error('Signout error:', error)
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Handle GET request for signout (e.g., from direct navigation)
  const response = NextResponse.redirect('/auth/signin')
  response.cookies.delete('auth-token')
  return response
}