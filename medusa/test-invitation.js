/**
 * Test script for sending user invitations via Resend
 * 
 * Usage: node test-invitation.js <email>
 */

const { Resend } = require('resend');

// Load environment variables
require('dotenv').config();

const resendApiKey = process.env.RESEND_API_KEY || 're_C7yWWG1y_Fsxewcn1iUuraQx2bvb2a2Wf';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tara Hub Admin <admin@deepcrm.ai>';

async function sendTestInvitation(email) {
  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node test-invitation.js <email>');
    process.exit(1);
  }

  console.log('📧 Sending test invitation to:', email);
  console.log('📤 From:', fromEmail);
  
  const resend = new Resend(resendApiKey);
  
  // Generate a test invitation link
  const inviteLink = `http://localhost:9000/app/invite?token=test-token-${Date.now()}&email=${encodeURIComponent(email)}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Tara Hub Admin</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
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
        .button {
          display: inline-block;
          padding: 16px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎨 Tara Hub Admin</h1>
          <p style="margin: 10px 0 0; opacity: 0.95;">Fabric Marketplace Management Platform</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1a1a1a;">Welcome to the team! 🎉</h2>
          
          <p>You've been invited to join the Tara Hub Admin Dashboard. As an admin, you'll have access to powerful tools to manage the fabric marketplace.</p>
          
          <div class="info-box">
            <h3 style="margin: 0 0 10px; font-size: 16px;">Your Account Details</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> Administrator</p>
            <p style="margin: 5px 0;"><strong>Access Level:</strong> Full Dashboard Access</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${inviteLink}" class="button" style="color: white;">Accept Invitation & Set Password</a>
          </div>
          
          <p style="background: #fef3c7; border: 1px solid #fbbf24; color: #92400e; padding: 12px 16px; border-radius: 6px;">
            <strong>⏰ Important:</strong> This invitation link will expire in 7 days for security reasons.
          </p>
          
          <h3>What you'll be able to do:</h3>
          <ul style="color: #4b5563;">
            <li>Manage product catalog and inventory</li>
            <li>Process and track customer orders</li>
            <li>Configure store settings and preferences</li>
            <li>Access analytics and reporting</li>
            <li>Manage customer accounts and data</li>
          </ul>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color: #667eea; word-break: break-all;">${inviteLink}</span>
          </p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
          <p><strong>Need help?</strong> Contact our support team</p>
          <p>© 2025 Tara Hub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "You're invited to Tara Hub Admin Dashboard",
      html: emailHtml,
    });
    
    console.log('✅ Invitation email sent successfully!');
    console.log('📬 Email ID:', result.data?.id);
    console.log('🔗 Test invitation link:', inviteLink);
    
    return result;
  } catch (error) {
    console.error('❌ Error sending invitation:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const email = process.argv[2];
  sendTestInvitation(email)
    .then(() => {
      console.log('\n✨ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { sendTestInvitation };