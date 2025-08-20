import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { 
  createVerificationToken, 
  logFailedLoginAttempt, 
  checkRateLimit,
  isValidEmail,
  sanitizeEmail
} from '@/lib/auth-utils';
import { legacyUsers } from '@/lib/legacy-auth-schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawEmail } = body;
    
    // Validate email format
    if (!rawEmail || !isValidEmail(rawEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format' }, 
        { status: 400 }
      );
    }
    
    const email = sanitizeEmail(rawEmail);
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'Unknown';
    
    // Skip rate limiting for now (until database migration is complete)
    console.log('Skipping rate limiting check - database migration pending');
    
    // Check if user exists in database and has admin role
    console.log('👤 Checking user authorization in database...');
    const existingUser = await db.select().from(legacyUsers).where(eq(legacyUsers.email, email)).limit(1);
    
    if (existingUser.length === 0) {
      console.log('❌ User not found in database:', email);
      return NextResponse.json(
        { error: 'Unauthorized: User not found. Please contact an administrator to be added to the system.' }, 
        { status: 403 }
      );
    }
    
    const user = existingUser[0];
    if (!['admin', 'platform_admin', 'tenant_admin'].includes(user.role || '')) {
      console.log('❌ User does not have admin role:', email, 'Role:', user.role);
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' }, 
        { status: 403 }
      );
    }
    
    console.log('✅ User authorized:', email, 'Role:', user.role);
    
    // Generate magic link token (15 minutes expiry)
    const token = await createVerificationToken(email, 'magic_link', 15);
    
    // Send magic link email
    try {
      console.log('📧 Attempting to send email to:', email);
      console.log('🔑 Token created:', token.substring(0, 10) + '...');
      console.log('🌐 Origin:', request.nextUrl.origin);
      
      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendMagicLink(email, token, request.nextUrl.origin);
      
      console.log('✅ Email send result:', emailResult);
      
      // Check if there was an explicit error
      if (emailResult?.error) {
        console.error('❌ Email service returned error:', emailResult.error);
        const errorMessage = typeof emailResult.error === 'object' 
          ? JSON.stringify(emailResult.error) 
          : emailResult.error;
        throw new Error(`Email service error: ${errorMessage}`);
      }
      
      // Get email ID from either format
      const emailId = emailResult?.data?.id || emailResult?.id || 'sent';
      console.log('✅ Email sent with ID:', emailId);
      
      return NextResponse.json({ 
        message: 'Magic link sent successfully! Check your email to sign in.',
        success: true,
        email: email, // Return sanitized email for UI feedback
        emailId: emailId
      });
    } catch (emailError: any) {
      console.error('❌ Failed to send email:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        stack: emailError.stack,
        response: emailError.response
      });
      
      // Return a more specific error
      return NextResponse.json({
        error: 'Failed to send magic link email. Please try again.',
        details: emailError.message,
        email: email
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Magic link signin error:', error);
    
    // Skip error logging for now (until database migration is complete)
    console.log('Signin error occurred - skipping failed attempt logging');
    
    return NextResponse.json(
      { error: 'Failed to send magic link. Please try again.' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Magic link signin endpoint',
      method: 'POST',
      body: {
        email: 'string (required)'
      }
    }, 
    { status: 200 }
  );
}