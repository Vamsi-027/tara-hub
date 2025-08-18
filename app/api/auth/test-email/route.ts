import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, type = 'magic_link' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailService = EmailService.getInstance();
    const testToken = 'test-token-123';
    const origin = request.nextUrl.origin;

    let result;
    switch (type) {
      case 'magic_link':
        result = await emailService.sendMagicLink(email, testToken, origin);
        break;
      case 'password_reset':
        result = await emailService.sendPasswordReset(email, testToken, origin);
        break;
      case 'welcome':
        result = await emailService.sendWelcomeEmail(email, 'Test User');
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent successfully`,
      messageId: result.data?.id,
      email,
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint',
    usage: 'POST with { "email": "test@example.com", "type": "magic_link|password_reset|welcome" }',
    environment: {
      hasResendKey: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || 'Not configured',
      nodeEnv: process.env.NODE_ENV,
    }
  });
}