import { NextRequest, NextResponse } from 'next/server'
import jwt from '@tsndr/cloudflare-worker-jwt'

// Authorized admin emails - matches the admin whitelist
const adminEmails = [
  'varaku@gmail.com',
  'batchu.kedareswaraabhinav@gmail.com', 
  'vamsicheruku027@gmail.com',
  'admin@deepcrm.ai'
]

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user is authorized admin
    if (!adminEmails.includes(email)) {
      console.log(`Unauthorized magic link request by: ${email}`)
      // Return success to avoid revealing which emails are authorized
      return NextResponse.json({
        message: 'Magic link sent successfully',
        email
      })
    }

    // Create magic link token
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || ''
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const magicLinkPayload = {
      email,
      purpose: 'magic-link',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    }

    const magicToken = await jwt.sign(magicLinkPayload, jwtSecret)
    const magicLinkUrl = `${request.nextUrl.origin}/auth/verify?token=${magicToken}&email=${encodeURIComponent(email)}`

    // Send email using Resend
    try {
      const resendApiKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tara Hub Admin <admin@deepcrm.ai>'
      
      if (!resendApiKey) {
        console.error('RESEND_API_KEY not configured')
        throw new Error('Email service not configured')
      }

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Tara Hub Admin - Sign in to your account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937; margin-bottom: 24px;">Sign in to Tara Hub Admin</h2>
              
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                Hello! Click the button below to sign in to your Tara Hub admin account.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${magicLinkUrl}" 
                   style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Sign in to Admin Panel
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
                This link will expire in 15 minutes. If you didn't request this email, you can safely ignore it.
              </p>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 16px;">
                For security, you can also copy and paste this link into your browser:<br/>
                <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all;">${magicLinkUrl}</code>
              </p>
              
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Tara Hub. All rights reserved.
              </p>
            </div>
          `,
        }),
      })

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json()
        console.error('Failed to send email via Resend:', errorData)
        throw new Error('Failed to send magic link email')
      }

      const emailResult = await emailResponse.json()
      console.log('Magic link email sent successfully:', emailResult)
      
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send magic link email' },
        { status: 500 }
      )
    }
    
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