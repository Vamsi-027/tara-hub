import { Resend } from 'resend';
import crypto from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export class EmailService {
  private static instance: EmailService;
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private generateMessageId(domain: string = 'deepcrm.ai'): string {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `<${timestamp}.${uniqueId}@${domain}>`;
  }

  private createOptimizedHtml(magicLink: string, email: string): string {
    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Access Your Account</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:8px;">
          <tr>
            <td style="padding:40px 30px;text-align:center;background:#1e293b;border-radius:8px 8px 0 0;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;">Tara Hub</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 30px;">
              <p style="margin:0 0 20px;color:#374151;font-size:16px;">Hello,</p>
              <p style="margin:0 0 30px;color:#374151;font-size:16px;">You requested to sign in to your account. Click the button below:</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="background:#3b82f6;border-radius:6px;">
                    <a href="${magicLink}" style="display:block;padding:12px 30px;color:#ffffff;text-decoration:none;font-size:16px;">Sign In</a>
                  </td>
                </tr>
              </table>
              <p style="margin:30px 0 20px;color:#6b7280;font-size:14px;">Or copy this link:</p>
              <p style="margin:0 0 30px;padding:12px;background:#f8fafc;border-radius:4px;word-break:break-all;font-size:12px;color:#475569;">${magicLink}</p>
              <p style="margin:0;padding:15px;background:#fef3c7;border-left:4px solid #f59e0b;color:#92400e;font-size:14px;">This link expires in 15 minutes.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;background:#f8fafc;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
              <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Tara Hub. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private createPlainText(magicLink: string): string {
    return `Tara Hub - Sign In Request
============================

Hello,

You requested to sign in to your account. Use this link:

${magicLink}

This link expires in 15 minutes.

If you didn't request this, please ignore this email.

© ${new Date().getFullYear()} Tara Hub. All rights reserved.`;
  }

  async sendMagicLink(email: string, token: string, origin: string) {
    console.log('[EmailService] Sending optimized email to:', email);
    
    if (!resend) {
      throw new Error('Email service not configured. Please set RESEND_API_KEY.');
    }

    const magicLink = `${origin}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
    const messageId = this.generateMessageId();
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tara Hub <admin@deepcrm.ai>';
    
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: email,
        replyTo: 'no-reply@deepcrm.ai',
        subject: 'Access Your Tara Hub Account',
        html: this.createOptimizedHtml(magicLink, email),
        text: this.createPlainText(magicLink),
        headers: {
          // Core headers
          'Message-ID': messageId,
          'X-Message-ID': messageId,
          'MIME-Version': '1.0',
          
          // Priority headers (Normal priority to avoid spam triggers)
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          
          // Anti-spam headers
          'X-Mailer': 'Tara Hub/1.0',
          'X-Entity-Ref-ID': crypto.randomBytes(8).toString('hex'),
          'X-Auto-Response-Suppress': 'DR, NDR, RN, NRN, OOF',
          'Precedence': 'bulk',
          'Auto-Submitted': 'auto-generated',
          
          // Microsoft specific
          'X-MS-Exchange-Organization-SCL': '-1',
          'X-MS-Exchange-CrossTenant-Id': crypto.randomUUID(),
          'X-MS-Has-Attach': 'no',
          
          // Authentication
          'X-Originating-IP': '[10.0.0.1]',
          'X-SES-CONFIGURATION-SET': 'default',
          
          // Unsubscribe (required)
          'List-Unsubscribe': '<mailto:unsubscribe@deepcrm.ai>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          
          // Tracking prevention
          'X-No-Track': '1',
          'X-Report-Abuse': 'Please report abuse to abuse@deepcrm.ai'
        },
        tags: [
          { name: 'type', value: 'transactional' },
          { name: 'category', value: 'authentication' }
        ],
      });

      console.log('[EmailService] Email sent:', result);
      return result;
      
    } catch (error: any) {
      console.error('[EmailService] Failed:', error);
      throw error;
    }
  }

  async sendPasswordReset(email: string, token: string, origin: string) {
    // Reuse optimized sendMagicLink for now
    return this.sendMagicLink(email, token, origin);
  }

  async sendInvitation(email: string, inviterName: string, teamName: string, inviteLink: string) {
    if (!resend) {
      throw new Error('Email service not configured');
    }

    const messageId = this.generateMessageId();
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tara Hub <admin@deepcrm.ai>';

    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: email,
        replyTo: 'no-reply@deepcrm.ai',
        subject: `You're invited to join ${teamName}`,
        html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" style="background:#ffffff;border-radius:8px;">
          <tr>
            <td style="padding:40px 30px;">
              <h2 style="margin:0 0 20px;color:#1e293b;">Join ${teamName}</h2>
              <p style="margin:0 0 20px;color:#374151;font-size:16px;">${inviterName} invited you to collaborate.</p>
              <table cellspacing="0" cellpadding="0" style="margin:30px auto;">
                <tr>
                  <td style="background:#3b82f6;border-radius:6px;">
                    <a href="${inviteLink}" style="display:block;padding:12px 30px;color:#ffffff;text-decoration:none;">Accept Invitation</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        text: `You're invited to join ${teamName}\n\n${inviterName} invited you to collaborate.\n\nAccept invitation: ${inviteLink}`,
        headers: {
          'Message-ID': messageId,
          'X-Priority': '3',
          'X-Entity-Ref-ID': crypto.randomBytes(8).toString('hex'),
          'List-Unsubscribe': '<mailto:unsubscribe@deepcrm.ai>',
        }
      });

      return result;
    } catch (error) {
      console.error('[EmailService] Invitation failed:', error);
      throw error;
    }
  }
}

export const EmailService2 = EmailService;