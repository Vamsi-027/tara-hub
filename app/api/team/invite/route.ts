import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/auth-schema'
import { eq } from 'drizzle-orm'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user has admin privileges (platform_admin, tenant_admin, or admin)
    const userRole = (session.user as any)?.role
    const hasAdminAccess = userRole && ['platform_admin', 'tenant_admin', 'admin'].includes(userRole)
    
    if (!session || !hasAdminAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, role } = await request.json()
    
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    if (db) {
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1)
      
      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare invitation details
    const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/signin?email=${encodeURIComponent(email)}`
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Team Invitation</h2>
        <p>You have been invited by ${session.user?.email} to join the team as a${role === 'admin' ? 'n' : ''} <strong>${role}</strong>.</p>
        <p>Click the link below to accept the invitation and create your account:</p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          Accept Invitation
        </a>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          ${inviteUrl}
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          This invitation was sent from The Hearth & Home Store admin panel.
        </p>
      </div>
    `

    let emailSent = false
    let emailError = null

    // Try Resend first if API key is available
    if (process.env.RESEND_API_KEY) {
      console.log('Attempting to send email via Resend API...')
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        
        const { data, error } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Hearth & Home <onboarding@resend.dev>',
          to: [email],
          subject: 'You have been invited to join the team',
          html: emailHtml,
        })

        if (error) {
          console.error('Resend API error:', error)
          emailError = error
        } else {
          console.log('Email sent successfully via Resend:', data)
          emailSent = true
        }
      } catch (error) {
        console.error('Resend API exception:', error)
        emailError = error
      }
    }
    
    // Fallback to SMTP if Resend fails or not configured
    if (!emailSent && process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_PASSWORD) {
      console.log('Attempting to send email via SMTP...')
      try {
        // Determine secure setting based on port
        const port = Number(process.env.EMAIL_SERVER_PORT) || 587
        const isSecure = port === 465
        
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: port,
          secure: isSecure, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
          // Add these for better compatibility
          tls: {
            rejectUnauthorized: false // Accept self-signed certificates
          }
        })

        // Verify connection configuration
        await transporter.verify()
        console.log('SMTP connection verified')
        
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'Admin <admin@yourdomain.com>',
          to: email,
          subject: 'You have been invited to join the team',
          html: emailHtml,
        })
        
        console.log('Email sent successfully via SMTP:', info.messageId)
        emailSent = true
      } catch (smtpError) {
        console.error('SMTP email error:', smtpError)
        emailError = smtpError
      }
    }

    // Log detailed error if email failed
    if (!emailSent) {
      console.error('Failed to send invitation email:', {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasSmtpHost: !!process.env.EMAIL_SERVER_HOST,
        hasSmtpPassword: !!process.env.EMAIL_SERVER_PASSWORD,
        error: emailError
      })
    }

    // Store invitation in database regardless of email status
    if (db) {
      // Create a pending user entry with the specified role
      const newUser = await db.insert(users).values({
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        name: null,
        emailVerified: null,
        image: null,
        role: role, // Set the role from the invitation
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()
      
      return NextResponse.json({
        message: emailSent 
          ? 'Invitation sent successfully' 
          : 'User created but email could not be sent. Please check email configuration.',
        user: newUser[0],
        emailSent,
        emailError: emailError ? String(emailError) : null,
      })
    }

    return NextResponse.json({
      message: emailSent 
        ? 'Invitation processed successfully'
        : 'Invitation processed but email could not be sent. Please check email configuration.',
      email,
      role,
      emailSent,
      emailError: emailError ? String(emailError) : null,
    })
    
  } catch (error) {
    console.error('Error in invitation process:', error)
    return NextResponse.json(
      { error: 'Failed to process invitation', details: String(error) },
      { status: 500 }
    )
  }
}