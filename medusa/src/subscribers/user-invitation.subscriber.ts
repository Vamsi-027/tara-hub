import { 
  SubscriberArgs,
  SubscriberConfig,
  type INotificationModuleService,
  type IUserModuleService
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { Resend } from "resend"

export default async function userInvitationSubscriber({
  event,
  container,
}: SubscriberArgs<{ 
  id: string
  email?: string
  token?: string
  accepted?: boolean
  metadata?: Record<string, any>
  data?: any
}>) {
  console.log("🔔 User invitation event triggered:", event.name, event.data)

  try {
    // Get the notification service
    const notificationService = container.resolve<INotificationModuleService>(
      Modules.NOTIFICATION
    )
    
    // Get the user service to fetch invitation details
    const userService = container.resolve<IUserModuleService>(Modules.USER)
    
    // For direct Resend integration (fallback if module doesn't work)
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Tara Hub Admin <admin@deepcrm.ai>"
    
    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not configured")
      return
    }

    // Extract email from various possible locations in the event data
    let email = event.data?.email || 
                event.data?.metadata?.email || 
                event.data?.data?.email ||
                event.data?.user?.email
    
    let token = event.data?.token
    
    // If no email found directly, try to fetch the invitation details
    if (!email && event.data?.id) {
      try {
        console.log("📋 Fetching invitation details for ID:", event.data.id)
        
        // Fetch the invitation details using the user service
        const invitations = await userService.listInvites({
          id: [event.data.id]
        })
        
        if (invitations?.length > 0) {
          const invitation = invitations[0]
          email = invitation.email
          token = invitation.token || token
          console.log("✅ Found invitation details - Email:", email)
        }
      } catch (fetchError) {
        console.error("❌ Error fetching invitation details:", fetchError)
      }
    }
    
    // If still no email, log the full event data to understand the structure
    if (!email) {
      console.error("❌ No email found in invitation event data:", JSON.stringify(event.data, null, 2))
      return
    }
    
    const { metadata } = event.data
    
    // Generate invitation link
    const baseUrl = process.env.MEDUSA_ADMIN_URL || "http://localhost:9000"
    const inviteLink = `${baseUrl}/app/invite?token=${token || 'generated-token'}&email=${encodeURIComponent(email)}`
    
    console.log("📧 Sending invitation email to:", email)
    console.log("🔗 Invitation link:", inviteLink)

    // Try using the notification service first
    try {
      // Only try notification service if we have a valid email
      if (email && email !== 'undefined') {
        await notificationService.createNotifications({
          to: email,
          channel: "email",
          template: "user.invite",
          trigger_type: "user.invite",
          resource_type: "invite",
          resource_id: event.data.id,
          data: {
            email,
            token: token || 'generated-token',
            invite_link: inviteLink,
            expires_in: "7 days",
            ...metadata
          }
        })
        
        console.log("✅ Invitation email queued via notification service")
      } else {
        throw new Error("Invalid email address")
      }
    } catch (notificationError) {
      console.log("⚠️ Notification service failed, using direct Resend:", notificationError)
      
      // Fallback to direct Resend API
      if (email && email !== 'undefined') {
        const resend = new Resend(resendApiKey)
        
        const emailHtml = generateInvitationEmailHtml(email, inviteLink)
        
        const result = await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject: "You're invited to Tara Hub Admin",
          html: emailHtml,
        })
        
        console.log("✅ Invitation email sent directly via Resend:", result.data?.id)
      } else {
        console.error("❌ Cannot send invitation - no valid email address")
      }
    }
  } catch (error) {
    console.error("❌ Error in user invitation subscriber:", error)
  }
}

function generateInvitationEmailHtml(email: string, inviteLink: string): string {
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
        }
        .content {
          padding: 40px 30px;
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
        }
        .info-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 20px;
          margin: 25px 0;
          border-radius: 8px;
        }
        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 13px;
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
          <h2 style="color: #1a1a1a;">Welcome to the team! 🎉</h2>
          
          <p>You've been invited to join the Tara Hub Admin Dashboard. As an admin, you'll have access to powerful tools to manage the fabric marketplace.</p>
          
          <div class="info-box">
            <h3 style="margin: 0 0 10px; font-size: 16px;">Your Account Details</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> Admin User</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${inviteLink}" class="button">Accept Invitation & Set Password</a>
          </div>
          
          <p style="color: #ef4444; font-weight: 600;">⏰ This invitation link will expire in 7 days.</p>
          
          <h3 style="margin-top: 30px;">What you'll be able to do:</h3>
          <ul style="color: #4b5563;">
            <li>Manage product catalog and inventory</li>
            <li>Process and track customer orders</li>
            <li>Configure store settings</li>
            <li>Access analytics and reporting</li>
            <li>Manage customer accounts</li>
          </ul>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link:<br>
            <span style="color: #6366f1; word-break: break-all;">${inviteLink}</span>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Need help?</strong> Contact support at support@tarahub.com</p>
          <p>© 2025 Tara Hub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export const config: SubscriberConfig = {
  event: [
    "user.invite.created",
    "invite.created",
    "auth.user.invited",
    "admin.invite.created"
  ],
}