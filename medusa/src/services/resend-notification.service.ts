import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import { Resend } from "resend"

type SendNotificationData = {
  to: string
  subject?: string
  template?: string
  data?: Record<string, any>
}

class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "resend"
  private resend: Resend

  constructor() {
    super()
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  async send(notification: SendNotificationData): Promise<any> {
    const { to, subject, template, data } = notification
    
    try {
      // Generate HTML content based on the template
      const htmlContent = this.generateEmailTemplate(template || "default", data)
      
      const result = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "Tara Hub Admin <admin@deepcrm.ai>",
        to: [to],
        subject: subject || "Notification from Tara Hub",
        html: htmlContent,
      })

      return {
        id: result.data?.id,
        success: true,
      }
    } catch (error) {
      console.error("Error sending email via Resend:", error)
      throw error
    }
  }

  private generateEmailTemplate(template: string, data?: Record<string, any>): string {
    switch (template) {
      case "user_invitation":
        return this.getUserInvitationTemplate(data)
      case "password_reset":
        return this.getPasswordResetTemplate(data)
      case "order_confirmation":
        return this.getOrderConfirmationTemplate(data)
      default:
        return this.getDefaultTemplate(data)
    }
  }

  private getUserInvitationTemplate(data?: Record<string, any>): string {
    const inviteLink = data?.invite_link || "#"
    const adminName = data?.admin_name || "Admin"
    const userEmail = data?.email || ""
    
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
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .content p {
            margin-bottom: 15px;
            color: #666;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .info-box {
            background: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 5px 0;
            font-size: 14px;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .content {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Tara Hub Admin</h1>
          </div>
          
          <div class="content">
            <h2>You've been invited!</h2>
            
            <p>Hello,</p>
            
            <p>You've been invited to join the Tara Hub Admin Dashboard. This invitation was sent by ${adminName}.</p>
            
            <div class="info-box">
              <p><strong>Your login email:</strong> ${userEmail}</p>
              <p><strong>Access level:</strong> Admin User</p>
            </div>
            
            <p>To accept this invitation and set up your account, please click the button below:</p>
            
            <div class="button-container">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${inviteLink}</p>
            
            <p><strong>This invitation link will expire in 7 days for security reasons.</strong></p>
            
            <p>Once you accept the invitation, you'll be able to:</p>
            <ul style="color: #666;">
              <li>Access the admin dashboard</li>
              <li>Manage products and inventory</li>
              <li>Process orders and customer data</li>
              <li>Configure store settings</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated email from Tara Hub. Please do not reply to this email.</p>
            <p>If you did not expect this invitation, please ignore this email or contact support.</p>
            <p>© 2025 Tara Hub. All rights reserved.</p>
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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
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
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Order Confirmation</h2>
          <p>Thank you for your order!</p>
          <p>Order ID: ${data?.order_id || "N/A"}</p>
          <p>Total: ${data?.total || "N/A"}</p>
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
        <title>Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
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