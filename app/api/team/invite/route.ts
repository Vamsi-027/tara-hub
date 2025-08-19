import { NextRequest, NextResponse } from 'next/server';
import { legacyUsers } from '@/lib/legacy-auth-schema';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

// POST /api/team/invite - Invite new team member
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    // Only admin roles can invite team members
    if (!['admin', 'platform_admin', 'tenant_admin'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { email, role } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }
    
    // Validate role
    const validRoles = ['platform_admin', 'tenant_admin', 'admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await db.select().from(legacyUsers).where(eq(legacyUsers.email, email)).limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Create new user with the specified role
    const newUser = await db.insert(legacyUsers).values({
      email,
      role,
      name: email.split('@')[0], // Default name from email
      emailVerified: null, // Not verified until they login
    }).returning();
    
    console.log('✅ Team member invited:', newUser[0].email, 'with role:', newUser[0].role);
    
    // Track email sending status
    let emailSent = false;
    let emailError = null;
    
    // Send invitation email using Resend
    const resendApiKey = process.env.RESEND_API_KEY || 
      (process.env.EMAIL_SERVER_HOST === 'smtp.resend.com' ? process.env.EMAIL_SERVER_PASSWORD : null);
    
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const signInUrl = `${baseUrl}/auth/signin`;
        
        // Use verified sender
        const fromEmail = 'Team <onboarding@resend.dev>';
        
        console.log(`Attempting to send invitation email to: ${email} from: ${fromEmail}`);
        
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'You have been invited to join the team',
          text: `You have been invited to join the team as ${role.replace(/_/g, ' ')}.

To accept this invitation and sign in:

1. Go to: ${signInUrl}
2. Enter your email address: ${email}
3. Click "Sign in with Email"
4. Check your email for the magic link
5. Click the link to complete sign in

Your account has been created and you can sign in immediately.

Best regards,
The Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to the Team!</h2>
              <p>Hi there,</p>
              <p>${decoded.email} has invited you to join as a <strong>${role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</strong>.</p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
                <h3 style="margin-top: 0;">How to Sign In:</h3>
                
                <p><strong>Option 1: If you have a Google account with ${email}</strong></p>
                <ol style="margin-bottom: 20px;">
                  <li>Go to the sign-in page</li>
                  <li>Click "Continue with Google"</li>
                  <li>You're in!</li>
                </ol>
                
                <p><strong>Option 2: Use Magic Link (works with any email)</strong></p>
                <ol>
                  <li>Go to the sign-in page</li>
                  <li>Enter your email: <strong>${email}</strong></li>
                  <li>Click "Send Magic Link"</li>
                  <li>Check your email for the sign-in link</li>
                  <li>Click the link to sign in</li>
                </ol>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${signInUrl}" style="display: inline-block; padding: 14px 28px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Go to Sign In →
                  </a>
                </div>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                This invitation was sent from The Hearth & Home Store admin panel.
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          `,
        });
        
        if (error) {
          console.error('Resend error details:', {
            error,
            from: fromEmail,
            to: email,
            apiKeyPresent: !!resendApiKey,
            apiKeyStart: resendApiKey?.substring(0, 10) + '...'
          });
          
          // Provide specific error messages based on common issues
          if (error.message?.includes('can only send testing emails')) {
            emailError = 'Email service in testing mode. User created successfully. They can sign in at /auth/signin with their email.';
          } else if (error.message?.includes('verify a domain')) {
            emailError = 'Domain not verified in Resend. User created successfully. They can sign in at /auth/signin with their email.';
          } else {
            emailError = error.message || 'Failed to send email via Resend';
          }
        } else {
          emailSent = true;
          console.log('✅ Email sent successfully via Resend');
          console.log('Email ID:', data?.id);
          console.log('To:', email);
          console.log('Check delivery at: https://resend.com/emails/' + data?.id);
        }
      } catch (error) {
        console.error('Email sending failed:', error);
        emailError = error instanceof Error ? error.message : 'Email sending failed';
      }
    } else {
      emailError = 'Resend API key not configured. Please add RESEND_API_KEY to your .env.local file. Get your API key from https://resend.com/api-keys';
    }
    
    return NextResponse.json({ 
      success: true,
      message: emailSent ? 'Team member invited and email sent successfully' : 'Team member invited successfully (email not sent)',
      user: {
        id: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        role: newUser[0].role,
        status: 'pending',
        joinedAt: newUser[0].createdAt.toISOString(),
      },
      emailSent,
      emailError,
      instructions: !emailSent ? `Please ask the user to sign in with Google using this email: ${email}` : null,
    });
    
  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: 'Failed to invite team member' }, 
      { status: 500 }
    );
  }
}