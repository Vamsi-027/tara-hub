import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // For now, just return success to test the UI
    // In a real implementation, this would send the magic link via email
    console.log('Magic link requested for:', email)
    
    return NextResponse.json({
      message: 'Magic link sent successfully',
      email
    })
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Failed to process signin request' },
      { status: 500 }
    )
  }
}