import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check which email environment variables are set
    const emailConfig = {
      EMAIL_SERVER_HOST: !!process.env.EMAIL_SERVER_HOST,
      EMAIL_SERVER_PORT: !!process.env.EMAIL_SERVER_PORT,
      EMAIL_SERVER_USER: !!process.env.EMAIL_SERVER_USER,
      EMAIL_SERVER_PASSWORD: !!process.env.EMAIL_SERVER_PASSWORD,
      EMAIL_FROM: !!process.env.EMAIL_FROM,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    }

    // Show actual values (masked for security)
    const configDetails = {
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST || 'NOT SET',
      EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || 'NOT SET',
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER || 'NOT SET',
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD ? '***SET***' : 'NOT SET',
      EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '***SET***' : 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    }

    return NextResponse.json({
      message: 'Email configuration check',
      configured: emailConfig,
      details: configDetails,
      recommendation: getRecommendation(emailConfig),
    })
  } catch (error) {
    console.error('Error checking email config:', error)
    return NextResponse.json(
      { error: 'Failed to check email configuration' },
      { status: 500 }
    )
  }
}

function getRecommendation(config: Record<string, boolean>) {
  if (config.RESEND_API_KEY) {
    return 'Resend API key detected. Use Resend SDK for best results.'
  }
  
  if (config.EMAIL_SERVER_HOST && config.EMAIL_SERVER_PASSWORD) {
    if (config.EMAIL_SERVER_HOST) {
      return 'SMTP configuration detected. Ensure port and security settings are correct for your provider.'
    }
  }
  
  return 'Email configuration incomplete. Please set either RESEND_API_KEY or complete SMTP settings.'
}