import { 
  MedusaRequest, 
  MedusaResponse,
  AuthenticatedMedusaRequest
} from "@medusajs/framework"
import { Resend } from "resend"
import crypto from "crypto"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { email, role = "admin", metadata = {} } = req.body
    
    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format"
      })
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    // Initialize Resend
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Tara Hub Admin <admin@deepcrm.ai>"
    
    if (!resendApiKey) {
      console.error("❌ RESEND_API_KEY not configured")
      return res.status(500).json({
        error: "Email service not configured. Please set RESEND_API_KEY."
      })
    }

    const resend = new Resend(resendApiKey)
    
    // Generate invitation link
    const baseUrl = process.env.MEDUSA_ADMIN_URL || process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    const inviteLink = `${baseUrl}/app/invite?token=${token}&email=${encodeURIComponent(email)}`
    
    console.log("📧 Sending invitation to:", email)
    console.log("🔗 Invitation link:", inviteLink)
    console.log("🎯 Role:", role)
    
    // Generate email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Tara Hub Admin</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
          }
          .info-box {
            background: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .features li {
            margin: 10px 0;
            color: #4b5563;
          }
          .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            font-size: 13px;
            color: #6b7280;
          }
          .link-copy {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            word-break: break-all;
            font-family: monospace;
            font-size: 13px;
            color: #667eea;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 Tara Hub Admin</h1>
            <p style="margin: 10px 0 0; opacity: 0.95;">Fabric Marketplace Management Platform</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1a1a1a; font-size: 24px;">Welcome to the team! 🎉</h2>
            
            <p style="color: #4b5563; line-height: 1.7;">
              You've been invited to join the Tara Hub Admin Dashboard. 
              As an admin, you'll have access to powerful tools to manage the fabric marketplace.
            </p>
            
            <div class="info-box">
              <h3 style="margin: 0 0 15px; font-size: 16px; color: #1a1a1a;">Your Account Details</h3>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 8px 0;"><strong>Role:</strong> ${role === 'admin' ? 'Administrator' : role}</p>
              <p style="margin: 8px 0;"><strong>Access Level:</strong> Full Dashboard Access</p>
            </div>
            
            <div class="button-container">
              <a href="${inviteLink}" class="button">Accept Invitation & Set Password</a>
            </div>
            
            <p style="background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; padding: 12px 16px; border-radius: 6px; font-size: 14px;">
              <strong>⏰ Important:</strong> This invitation link will expire on ${expiresAt.toLocaleDateString()} for security reasons.
            </p>
            
            <h3 style="margin-top: 30px; color: #1a1a1a;">What you'll be able to do:</h3>
            <ul class="features">
              <li>Manage product catalog and inventory</li>
              <li>Process and track customer orders</li>
              <li>Configure store settings and preferences</li>
              <li>Access analytics and reporting dashboards</li>
              <li>Manage customer accounts and data</li>
              <li>Handle payments and transactions</li>
            </ul>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If the button above doesn't work, copy and paste this link into your browser:
            </p>
            <div class="link-copy">${inviteLink}</div>
          </div>
          
          <div class="footer">
            <p><strong>Need help?</strong> Contact our support team</p>
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p style="margin-top: 15px;">© 2025 Tara Hub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Send invitation email
    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "You're invited to Tara Hub Admin Dashboard",
      html: emailHtml,
    })
    
    console.log("✅ Invitation email sent:", emailResult.data?.id)
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: "Invitation sent successfully",
      data: {
        email,
        role,
        invitation_sent: true,
        email_id: emailResult.data?.id,
        expires_at: expiresAt.toISOString(),
        // Don't send the actual token in production - this is just for testing
        test_link: process.env.NODE_ENV === 'development' ? inviteLink : undefined
      }
    })
    
  } catch (error) {
    console.error("❌ Error sending invitation:", error)
    return res.status(500).json({
      error: "Failed to send invitation",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

// GET endpoint to check if email service is configured
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const isConfigured = !!process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Not configured"
  
  return res.status(200).json({
    configured: isConfigured,
    from_email: fromEmail,
    service: "Resend",
    status: isConfigured ? "ready" : "not_configured",
    message: isConfigured 
      ? "Email service is configured and ready to send invitations" 
      : "Please set RESEND_API_KEY in your environment variables"
  })
}