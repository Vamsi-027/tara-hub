import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { 
  createVerificationToken, 
  isValidEmail,
  sanitizeEmail
} from '@/lib/auth-utils';
import { legacyUsers } from '@/lib/legacy-auth-schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    headers: {},
    env: {},
    steps: []
  };

  try {
    // Log headers
    debugInfo.headers = {
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
    };

    // Log environment
    debugInfo.env = {
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'not set',
      nodeEnv: process.env.NODE_ENV,
    };

    debugInfo.steps.push('Starting signin process');

    const body = await request.json();
    const { email: rawEmail } = body;
    
    debugInfo.steps.push(`Received email: ${rawEmail}`);
    
    // Validate email format
    if (!rawEmail || !isValidEmail(rawEmail)) {
      debugInfo.steps.push('Invalid email format');
      return NextResponse.json({
        error: 'Invalid email address format',
        debug: debugInfo
      }, { status: 400 });
    }
    
    const email = sanitizeEmail(rawEmail);
    debugInfo.steps.push(`Sanitized email: ${email}`);
    
    // Check if user exists in database
    debugInfo.steps.push('Checking user in database...');
    const existingUser = await db.select().from(legacyUsers).where(eq(legacyUsers.email, email)).limit(1);
    
    if (existingUser.length === 0) {
      debugInfo.steps.push('User not found in database');
      return NextResponse.json({
        error: 'Unauthorized: User not found',
        debug: debugInfo
      }, { status: 403 });
    }
    
    const user = existingUser[0];
    if (!['admin', 'platform_admin', 'tenant_admin'].includes(user.role || '')) {
      debugInfo.steps.push(`User role not admin: ${user.role}`);
      return NextResponse.json({
        error: 'Unauthorized: Admin access required',
        debug: debugInfo
      }, { status: 403 });
    }
    
    debugInfo.steps.push('User authorized, creating token...');
    
    // Generate magic link token
    const token = await createVerificationToken(email, 'magic_link', 15);
    debugInfo.steps.push(`Token created: ${token.substring(0, 10)}...`);
    
    // Send magic link email
    debugInfo.steps.push('Initializing email service...');
    const emailService = EmailService.getInstance();
    
    debugInfo.steps.push('Sending email...');
    const emailResult = await emailService.sendMagicLink(email, token, request.nextUrl.origin);
    debugInfo.steps.push(`Email sent: ${JSON.stringify(emailResult)}`);
    
    return NextResponse.json({ 
      message: 'Magic link sent successfully!',
      success: true,
      email: email,
      debug: debugInfo
    });
    
  } catch (error: any) {
    debugInfo.error = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
    
    console.error('Magic link signin error:', error);
    
    return NextResponse.json({
      error: 'Failed to send magic link',
      details: error.message,
      debug: debugInfo
    }, { status: 500 });
  }
}