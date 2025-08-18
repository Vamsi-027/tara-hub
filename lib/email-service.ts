import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export class EmailService {
  private static instance: EmailService;
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendMagicLink(email: string, token: string, origin: string) {
    if (!resend) {
      throw new Error('RESEND API key not configured. Please set RESEND_API_KEY environment variable.');
    }

    const magicLink = `${origin}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
    
    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Tara Hub <noreply@tara-hub.com>',
        to: email,
        subject: 'Sign in to Tara Hub Admin',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin-bottom: 10px;">Welcome to Tara Hub</h1>
              <p style="color: #6b7280; font-size: 16px;">Your secure admin access awaits</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Click the button below to securely sign in to your Tara Hub admin account:
              </p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${magicLink}" 
                   style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                  Sign In to Admin Dashboard
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This link is valid for 15 minutes and can only be used once.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
                If you didn't request this sign-in link, you can safely ignore this email. 
                Only authorized administrators can access the Tara Hub admin panel.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Tara Hub. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
      
      return result;
    } catch (error) {
      console.error('Failed to send magic link email:', error);
      throw new Error('Failed to send magic link email');
    }
  }

  async sendPasswordReset(email: string, token: string, origin: string) {
    if (!resend) {
      throw new Error('RESEND API key not configured. Please set RESEND_API_KEY environment variable.');
    }
    const resetLink = `${origin}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Tara Hub <noreply@tara-hub.com>',
        to: email,
        subject: 'Reset Your Password - Tara Hub',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin-bottom: 10px;">Password Reset Request</h1>
              <p style="color: #6b7280; font-size: 16px;">Secure your Tara Hub admin account</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password. Click the button below to set a new password:
              </p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${resetLink}" 
                   style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This link expires in 1 hour for security reasons.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
                If you didn't request a password reset, please ignore this email. 
                Your password will remain unchanged.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Tara Hub. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
      
      return result;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email: string, name: string) {
    if (!resend) {
      throw new Error('RESEND API key not configured. Please set RESEND_API_KEY environment variable.');
    }
    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Tara Hub <noreply@tara-hub.com>',
        to: email,
        subject: 'Welcome to Tara Hub Admin',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1f2937; margin-bottom: 10px;">Welcome to Tara Hub, ${name}!</h1>
              <p style="color: #6b7280; font-size: 16px;">Your admin account has been activated</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                Congratulations! Your administrator account for Tara Hub has been successfully created.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                You now have access to the admin dashboard where you can manage fabrics, blog posts, team members, and more.
              </p>
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
                Access your admin dashboard anytime:
              </p>
              <a href="${process.env.NEXTAUTH_URL || 'https://tara-hub.vercel.app'}/admin" 
                 style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                Go to Admin Dashboard
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">
                If you have any questions or need assistance, please don't hesitate to reach out to our support team.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Tara Hub. All rights reserved.
              </p>
            </div>
          </div>
        `
      });
      
      return result;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }
}