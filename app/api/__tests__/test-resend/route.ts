import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(request: NextRequest) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    
    // Check if environment variables are set
    const envCheck = {
      hasApiKey: !!resendApiKey,
      apiKeyLength: resendApiKey?.length || 0,
      apiKeyPrefix: resendApiKey?.substring(0, 5) || 'none',
      hasFromEmail: !!resendFromEmail,
      fromEmail: resendFromEmail || 'not set',
      nodeEnv: process.env.NODE_ENV,
    };

    // Try to initialize Resend
    let resendStatus = 'not initialized';
    let testEmailResult = null;
    
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        resendStatus = 'initialized';
        
        // Try to send a test email
        const result = await resend.emails.send({
          from: resendFromEmail || 'onboarding@resend.dev',
          to: 'varaku@gmail.com',
          subject: 'Test Email from Vercel Debug Endpoint',
          html: `
            <p>This is a test email from the debug endpoint.</p>
            <p>Environment: ${process.env.NODE_ENV}</p>
            <p>Time: ${new Date().toISOString()}</p>
            <p>From: ${resendFromEmail || 'onboarding@resend.dev'}</p>
          `
        });
        
        testEmailResult = {
          success: true,
          id: result.data?.id || result.id,
          error: result.error,
          rawResult: result
        };
      } catch (error: any) {
        testEmailResult = {
          success: false,
          error: error.message,
          details: error.response?.data || error
        };
      }
    }

    return NextResponse.json({
      message: 'Resend API Test',
      environment: envCheck,
      resendStatus,
      testEmailResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}