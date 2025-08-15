import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/auth-schema'
import { eq } from 'drizzle-orm'
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

    // Send invitation email using Resend (via nodemailer)
    if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT),
          secure: true,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        })

        const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/signin?email=${encodeURIComponent(email)}`
        
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'Admin <admin@yourdomain.com>',
          to: email,
          subject: 'You have been invited to join the team',
          html: `
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
          `,
        })
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Continue without email for now
      }
    }

    // Store invitation in database or memory
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
        message: 'Invitation sent successfully',
        user: newUser[0],
      })
    }

    return NextResponse.json({
      message: 'Invitation processed (email service not configured)',
      email,
      role,
    })
    
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}