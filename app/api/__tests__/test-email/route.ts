import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use require for CommonJS module
    const nodemailer = require('nodemailer');
    
    // Create transporter with Resend settings
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT),
      secure: true, // true for port 465
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    console.log('Testing connection to:', process.env.EMAIL_SERVER_HOST);
    console.log('Using email:', process.env.EMAIL_SERVER_USER);
    
    // Verify connection
    await transporter.verify();
    console.log('SMTP connection verified successfully!');

    // Send test email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'admin@deepcrm.ai', // Send to yourself for testing
      subject: 'Test Email from Tara Hub',
      text: 'This is a test email to verify Resend email configuration.',
      html: '<p>This is a <b>test email</b> to verify Resend email configuration.</p>',
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully!',
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    });
  } catch (error: any) {
    console.error('Email test error:', error);
    
    // More detailed error information for debugging
    let errorDetails = {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    };
    
    // Check for common Microsoft 365 authentication issues
    if (error.responseCode === 535 || error.message.includes('Authentication')) {
      errorDetails.message += ' - Please check: 1) Email and password are correct, 2) SMTP authentication is enabled in Microsoft 365 admin center, 3) Consider using an app password if 2FA is enabled';
    }
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: errorDetails,
      config: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        user: process.env.EMAIL_SERVER_USER,
        from: process.env.EMAIL_FROM,
      }
    }, { status: 500 });
  }
}