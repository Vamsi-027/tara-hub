import { 
  AbstractNotificationProviderService,
  MedusaContainer
} from "@medusajs/framework/utils"
import { Resend } from "resend"

type NotificationData = {
  to: string
  subject?: string
  template_id?: string
  data?: Record<string, any>
  channel?: string
  trigger_type?: string
  resource_id?: string
  resource_type?: string
}

class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend_notification"
  protected resend: Resend
  protected container_: MedusaContainer

  constructor(container: MedusaContainer) {
    super(container)
    this.container_ = container
    
    // Initialize Resend with API key from environment
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required for Resend notification service")
    }
    
    this.resend = new Resend(apiKey)
  }

  async send(notification: NotificationData): Promise<any> {
    const { to, subject, data, trigger_type, resource_type } = notification
    
    try {
      // Determine email template based on trigger type
      let emailSubject = subject || "Notification from Tara Hub"
      let htmlContent = ""
      
      // Handle different notification types
      if (trigger_type === "user.invite" || resource_type === "invite") {
        emailSubject = "You're invited to Tara Hub Admin"
        htmlContent = this.getUserInvitationTemplate(to, data)
      } else if (trigger_type === "auth.password_reset") {
        emailSubject = "Reset your password"
        htmlContent = this.getPasswordResetTemplate(data)
      } else if (trigger_type === "order.placed") {
        emailSubject = "Order Confirmation"
        htmlContent = this.getOrderConfirmationTemplate(data)
      } else {
        htmlContent = this.getDefaultTemplate(data)
      }
      
      // Send email via Resend
      const result = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Tara Hub Admin <admin@deepcrm.ai>",
        to: [to],
        subject: emailSubject,
        html: htmlContent,
      })

      console.log(`✅ Email sent successfully to ${to} via Resend:`, result.data?.id)

      return {
        id: result.data?.id,
        success: true,
        to,
        subject: emailSubject
      }
    } catch (error) {
      console.error("❌ Error sending email via Resend:", error)
      throw error
    }
  }

  private getUserInvitationTemplate(email: string, data?: Record<string, any>): string {
    const baseUrl = process.env.MEDUSA_ADMIN_URL || "http://localhost:9000"
    const token = data?.token || ""
    const inviteLink = `${baseUrl}/app/invite?token=${token}&email=${encodeURIComponent(email)}`
    const expiresIn = data?.expires_in || "7 days"
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Tara Hub Admin</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.95;
            font-size: 16px;
          }
          .content {
            padding: 40px 30px;
          }
          .welcome-message {
            font-size: 20px;
            color: #1a1a1a;
            margin-bottom: 25px;
            font-weight: 600;
          }
          .content p {
            margin-bottom: 20px;
            color: #4b5563;
            line-height: 1.7;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
          }
          .info-box {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .info-box h3 {
            margin: 0 0 15px;
            color: #1a1a1a;
            font-size: 16px;
            font-weight: 600;
          }
          .info-box p {
            margin: 8px 0;
            font-size: 14px;
            color: #6b7280;
          }
          .info-box code {
            background: #e5e7eb;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            color: #374151;
          }
          .features {
            margin: 30px 0;
          }
          .features h3 {
            font-size: 16px;
            color: #1a1a1a;
            margin-bottom: 15px;
            font-weight: 600;
          }
          .features ul {
            margin: 0;
            padding: 0;
            list-style: none;
          }
          .features li {
            padding: 10px 0 10px 28px;
            position: relative;
            color: #4b5563;
          }
          .features li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
            font-size: 18px;
          }
          .link-text {
            margin-top: 20px;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
            word-break: break-all;
            font-size: 13px;
            color: #6366f1;
            font-family: 'Courier New', monospace;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 13px;
          }
          .footer a {
            color: #6366f1;
            text-decoration: none;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            color: #92400e;
            padding: 12px 16px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
          }
          .warning strong {
            color: #78350f;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .header {
              padding: 30px 20px;
            }
            .content {
              padding: 30px 20px;
            }
            .button {
              padding: 14px 32px;
              font-size: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 Tara Hub Admin</h1>
            <p>Fabric Marketplace Management Platform</p>
          </div>
          
          <div class="content">
            <div class="welcome-message">Welcome to the team! 🎉</div>
            
            <p>You've been invited to join the Tara Hub Admin Dashboard. As an admin, you'll have access to powerful tools to manage the fabric marketplace.</p>
            
            <div class="info-box">
              <h3>Your Account Details</h3>
              <p><strong>Email:</strong> <code>${email}</code></p>
              <p><strong>Role:</strong> Admin User</p>
              <p><strong>Access Level:</strong> Full Dashboard Access</p>
            </div>
            
            <div class="button-container">
              <a href="${inviteLink}" class="button">Accept Invitation & Set Password</a>
            </div>
            
            <div class="warning">
              <strong>⏰ Important:</strong> This invitation link will expire in ${expiresIn} for security reasons. Please accept it as soon as possible.
            </div>
            
            <div class="features">
              <h3>What you'll be able to do:</h3>
              <ul>
                <li>Manage product catalog and inventory</li>
                <li>Process and track customer orders</li>
                <li>Configure store settings and preferences</li>
                <li>Access analytics and reporting</li>
                <li>Manage customer accounts and data</li>
                <li>Handle payments and transactions</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <div class="link-text">${inviteLink}</div>
          </div>
          
          <div class="footer">
            <p><strong>Need help?</strong> Contact our support team at support@tarahub.com</p>
            <p>This is an automated message from Tara Hub. Please do not reply to this email.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p style="margin-top: 15px;">© 2025 Tara Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private getPasswordResetTemplate(data?: Record<string, any>): string {
    const resetLink = data?.reset_link || "#"
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          <div style="padding: 40px 30px;">
            <p>Hi there,</p>
            <p>We received a request to reset your password for your Tara Hub Admin account. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
            </div>
            <p style="color: #ef4444; font-weight: 600;">This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email. Your password won't be changed.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private getOrderConfirmationTemplate(data?: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <p>Order ID: <strong>${data?.order_id || "N/A"}</strong></p>
          <p>Total: <strong>${data?.total || "N/A"}</strong></p>
          <p>We'll send you another email when your order ships.</p>
        </div>
      </body>
      </html>
    `
  }

  private getDefaultTemplate(data?: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notification from Tara Hub</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Notification from Tara Hub</h2>
          <p>${data?.message || "You have a new notification."}</p>
        </div>
      </body>
      </html>
    `
  }
}

export default ResendNotificationService