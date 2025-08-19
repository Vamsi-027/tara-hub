import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { checkJWTAuth, PERMISSIONS } from '@/lib/auth-utils-jwt'

export async function POST(request: Request) {
  try {
    const { allowed, error } = await checkJWTAuth(PERMISSIONS.ADMIN_ONLY);
    if (!allowed) {
      return error!;
    }

    const { testEmail } = await request.json()
    
    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      )
    }

    // Check Resend configuration
    const resendApiKey = process.env.RESEND_API_KEY || 
      (process.env.EMAIL_SERVER_HOST === 'smtp.resend.com' ? process.env.EMAIL_SERVER_PASSWORD : null)
    
    if (!resendApiKey) {
      return NextResponse.json({
        error: 'Resend not configured',
        details: {
          hasResendApiKey: !!process.env.RESEND_API_KEY,
          emailServerHost: process.env.EMAIL_SERVER_HOST,
          isResendSmtp: process.env.EMAIL_SERVER_HOST === 'smtp.resend.com',
          hasEmailPassword: !!process.env.EMAIL_SERVER_PASSWORD,
        }
      }, { status: 500 })
    }

    // Send test email
    const resend = new Resend(resendApiKey)
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Admin DeepCRM <admin@deepcrm.ai>',
      to: testEmail,
      subject: 'Test Email from Team Management',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email Successful!</h2>
          <p>This is a test email from your Team Management system.</p>
          <p>If you received this email, your Resend integration is working correctly.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Configuration details:<br>
            - Email Provider: Resend<br>
            - From: ${process.env.EMAIL_FROM || 'Admin DeepCRM <admin@deepcrm.ai>'}<br>
            - Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `,
    })
    
    if (error) {
      return NextResponse.json({
        error: 'Failed to send test email',
        details: error,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      data,
      configuration: {
        from: process.env.EMAIL_FROM || 'Admin DeepCRM <admin@deepcrm.ai>',
        provider: 'Resend',
        apiKeyPresent: true,
      }
    })
    
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}