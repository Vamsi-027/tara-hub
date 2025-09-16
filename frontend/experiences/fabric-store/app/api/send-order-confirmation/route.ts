import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// Initialize Resend - You need to get an API key from https://resend.com
const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key')

// Modern themed order confirmation email template
function getOrderConfirmationTemplate(orderId: string, paymentIntentId: string, orderData?: any) {
  const items = orderData?.items || []
  const shipping = orderData?.shipping || {}
  const email = orderData?.email || ''
  const total = orderData?.total || 0

  // Generate items HTML with modern styling
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">
        <div style="display: flex; align-items: start;">
          <div>
            <strong style="color: #111827; font-size: 15px;">${item.title || 'Fabric Sample'}</strong>
            ${item.variant ? `<br><span style="color: #6b7280; font-size: 13px; margin-top: 4px; display: inline-block;">${item.variant}</span>` : ''}
            ${item.sku ? `<br><span style="color: #9ca3af; font-size: 12px;">SKU: ${item.sku}</span>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151; font-weight: 500;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">
        $${((item.price || 0) / 100).toFixed(2)}
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #111827; font-weight: 600;">
        $${(((item.price || 0) * (item.quantity || 1)) / 100).toFixed(2)}
      </td>
    </tr>
  `).join('')

  const subtotal = items.reduce((sum: number, item: any) =>
    sum + ((item.price || 0) * (item.quantity || 1)), 0)
  const shippingCost = 1000 // $10 flat rate
  const tax = Math.round(subtotal * 0.08) // 8% tax
  const finalTotal = total || (subtotal + shippingCost + tax)
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation - Custom Fabric Designs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; padding: 16px; background: linear-gradient(135deg, #111827 0%, #374151 100%); border-radius: 12px; margin-bottom: 16px;">
        <div style="color: white; font-size: 24px; font-weight: bold;">⬢</div>
      </div>
      <h2 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">Custom Fabric Designs</h2>
      <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Premium Fabrics</p>
    </div>

    <div style="background-color: white; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); overflow: hidden;">
      <!-- Success Banner -->
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 24px; text-align: center;">
        <div style="display: inline-block; padding: 8px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; margin-bottom: 12px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed!</h1>
        <p style="color: rgba(255, 255, 255, 0.9); margin-top: 8px; font-size: 16px;">Thank you for your purchase</p>
      </div>
    
      <!-- Content Container -->
      <div style="padding: 32px;">
        <!-- Order Info Card -->
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Order Number</td>
              <td style="text-align: right; font-weight: 600; color: #111827; font-family: monospace;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Order Date</td>
              <td style="text-align: right; color: #374151;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Payment Method</td>
              <td style="text-align: right; color: #374151;">Credit Card ****</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Email</td>
              <td style="text-align: right; color: #374151;">${email}</td>
            </tr>
          </table>
        </div>
      
        <!-- Order Items -->
        <div style="margin-bottom: 32px;">
          <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center;">
            <span style="display: inline-block; width: 4px; height: 20px; background-color: #3b82f6; margin-right: 12px; border-radius: 2px;"></span>
            Order Items
          </h3>
          <table style="width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px 16px; text-align: left; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                <th style="padding: 12px 16px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                <th style="padding: 12px 16px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                <th style="padding: 12px 16px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
              </tr>
            </thead>
            <tbody style="background-color: white;">
              ${itemsHtml || '<tr><td colspan="4" style="padding: 32px; text-align: center; color: #6b7280;">No items found</td></tr>'}
            </tbody>
          </table>
        </div>
      
        <!-- Order Summary -->
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
              <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">
                $${(subtotal / 100).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Shipping</td>
              <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">
                $${(shippingCost / 100).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tax</td>
              <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">
                $${(tax / 100).toFixed(2)}
              </td>
            </tr>
            <tr style="border-top: 2px solid #e5e7eb; margin-top: 8px;">
              <td style="padding-top: 16px; color: #111827; font-size: 18px; font-weight: 700;">Total</td>
              <td style="padding-top: 16px; text-align: right; color: #3b82f6; font-size: 20px; font-weight: 700;">
                $${(finalTotal / 100).toFixed(2)}
              </td>
            </tr>
          </table>
        </div>
      
        <!-- Shipping Address -->
        ${shipping.firstName ? `
        <div style="margin-bottom: 32px;">
          <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center;">
            <span style="display: inline-block; width: 4px; height: 20px; background-color: #3b82f6; margin-right: 12px; border-radius: 2px;"></span>
            Shipping Address
          </h3>
          <div style="background-color: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
            <p style="margin: 0 0 4px 0; color: #111827; font-weight: 600;">${shipping.firstName} ${shipping.lastName || ''}</p>
            <p style="margin: 0 0 4px 0; color: #6b7280;">${shipping.address || ''}</p>
            <p style="margin: 0 0 4px 0; color: #6b7280;">${shipping.city || ''}, ${shipping.state || ''} ${shipping.zipCode || ''}</p>
            <p style="margin: 0; color: #6b7280;">${shipping.country || 'United States'}</p>
            ${shipping.phone ? `<p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">📞 ${shipping.phone}</p>` : ''}
          </div>
        </div>
        ` : ''}
      
        <!-- What's Next -->
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
          <h3 style="color: #1e40af; font-size: 16px; font-weight: 600; margin: 0 0 16px 0; display: flex; align-items: center;">
            <span style="margin-right: 8px;">📦</span>
            What Happens Next
          </h3>
          <div style="color: #1e40af; font-size: 14px; line-height: 1.8;">
            <div style="margin-bottom: 12px; display: flex; align-items: start;">
              <span style="color: #3b82f6; margin-right: 8px; font-weight: bold;">✓</span>
              <span>Your premium fabric samples are being carefully packaged by our team</span>
            </div>
            <div style="margin-bottom: 12px; display: flex; align-items: start;">
              <span style="color: #3b82f6; margin-right: 8px; font-weight: bold;">✓</span>
              <span>You'll receive a shipping notification with tracking within 24 hours</span>
            </div>
            <div style="margin-bottom: 12px; display: flex; align-items: start;">
              <span style="color: #3b82f6; margin-right: 8px; font-weight: bold;">✓</span>
              <span>Expected delivery in 3-5 business days via our premium shipping partners</span>
            </div>
            <div style="display: flex; align-items: start;">
              <span style="color: #3b82f6; margin-right: 8px; font-weight: bold;">✓</span>
              <span>Track your order anytime using the tracking number in your shipping email</span>
            </div>
          </div>
        </div>
      
        <!-- Need Help Section -->
        <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center;">
          <h3 style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Need Assistance?</h3>
          <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">Our customer service team is here to help with any questions about your order.</p>
          <div style="margin-top: 20px;">
            <a href="mailto:support@customfabricdesigns.com" style="display: inline-block; background-color: #111827; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Contact Support</a>
          </div>
          <p style="margin: 16px 0 0 0; color: #9ca3af; font-size: 12px;">Reference Order: ${orderId}</p>
        </div>
      </div>
    
      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 16px 0;">
          Thank you for choosing Custom Fabric Designs for your premium fabric needs.
        </p>
        <div style="margin-bottom: 16px;">
          <a href="https://customfabricdesigns.com" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Visit Website</a>
          <span style="color: #d1d5db;">•</span>
          <a href="https://customfabricdesigns.com/browse" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Browse Fabrics</a>
          <span style="color: #d1d5db;">•</span>
          <a href="https://customfabricdesigns.com/contact" style="color: #6b7280; text-decoration: none; font-size: 12px; margin: 0 8px;">Contact Us</a>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">
          © 2024 Custom Fabric Designs. All rights reserved.
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
          This is an automated email. Please do not reply directly to this message.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `
}

// Payment receipt email template
function getPaymentReceiptTemplate(orderId: string, paymentIntentId: string, orderData?: any) {
  const items = orderData?.items || []
  const shipping = orderData?.shipping || {}
  const email = orderData?.email || ''
  const total = orderData?.total || 0

  const subtotal = items.reduce((sum: number, item: any) =>
    sum + ((item.price || 0) * (item.quantity || 1)), 0)
  const shippingCost = 1000 // $10 flat rate
  const tax = Math.round(subtotal * 0.08) // 8% tax
  const finalTotal = total || (subtotal + shippingCost + tax)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - Custom Fabric Designs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Receipt Header -->
    <div style="background-color: white; border-radius: 12px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); overflow: hidden;">
      <div style="background-color: #111827; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Payment Receipt</h1>
      </div>

      <div style="padding: 32px;">
        <!-- Transaction Details -->
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Transaction Details</h2>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Transaction ID</td>
              <td style="text-align: right; font-family: monospace; color: #374151; font-size: 12px;">${paymentIntentId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Order Number</td>
              <td style="text-align: right; font-family: monospace; color: #374151;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Payment Date</td>
              <td style="text-align: right; color: #374151;">${new Date().toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Payment Method</td>
              <td style="text-align: right; color: #374151;">Credit Card</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6b7280;">Payment Status</td>
              <td style="text-align: right;"><span style="color: #10b981; font-weight: 600;">✓ Successful</span></td>
            </tr>
          </table>
        </div>

        <!-- Amount Breakdown -->
        <div style="border: 2px solid #111827; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Payment Summary</h2>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Subtotal</td>
              <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">$${(subtotal / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Shipping</td>
              <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">$${(shippingCost / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tax</td>
              <td style="padding: 8px 0; text-align: right; color: #374151; font-size: 14px;">$${(tax / 100).toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #111827;">
              <td style="padding-top: 12px; color: #111827; font-size: 18px; font-weight: 700;">Total Paid</td>
              <td style="padding-top: 12px; text-align: right; color: #111827; font-size: 20px; font-weight: 700;">$${(finalTotal / 100).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <!-- Billing Information -->
        ${shipping.firstName ? `
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #111827; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">Billing Information</h2>
          <p style="margin: 0 0 4px 0; color: #374151;">${shipping.firstName} ${shipping.lastName || ''}</p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${shipping.address || ''}</p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${shipping.city || ''}, ${shipping.state || ''} ${shipping.zipCode || ''}</p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">${email}</p>
        </div>
        ` : ''}

        <!-- Footer Note -->
        <div style="text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0;">
            This receipt confirms your payment has been successfully processed.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Please retain this receipt for your records.
          </p>
        </div>
      </div>
    </div>

    <!-- Legal Footer -->
    <div style="text-align: center; margin-top: 24px;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
        Custom Fabric Designs • Premium Fabrics • customfabricdesigns.com
      </p>
      <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0;">
        This is an official payment receipt. No signature required.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentIntentId, email, orderData, sendReceipt = true } = body

    // Get email from localStorage cart data or use a test email
    const customerEmail = email || 'test@example.com'

    console.log('=================================================')
    console.log('📧 ORDER CONFIRMATION & PAYMENT RECEIPT EMAIL')
    console.log('=================================================')
    console.log('To:', customerEmail)
    console.log('Order ID:', orderId)
    console.log('Payment Intent:', paymentIntentId)
    console.log('Timestamp:', new Date().toISOString())
    console.log('=================================================')

    let emailSent = false
    let receiptSent = false

    // Option 1: Try Resend first (if configured with real API key)
    if (process.env.RESEND_API_KEY &&
        process.env.RESEND_API_KEY !== 're_test_key' &&
        process.env.RESEND_API_KEY !== 're_123456789_yourActualApiKeyHere' &&
        process.env.RESEND_API_KEY.startsWith('re_')) {
      try {
        // Send order confirmation with reply-to for better deliverability
        const confirmationData = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Tara Hub Admin <admin@deepcrm.ai>',
          to: [customerEmail],
          subject: `Your Tara Hub Order #${orderId} is Confirmed`,
          html: getOrderConfirmationTemplate(orderId, paymentIntentId, orderData),
          replyTo: 'support@tara-hub.co',
          headers: {
            'X-Priority': '1',
            'Importance': 'high',
          }
        })

        // Send payment receipt if requested
        if (sendReceipt) {
          const receiptData = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Tara Hub Admin <admin@deepcrm.ai>',
            to: [customerEmail],
            subject: `Payment Receipt - Tara Hub Order #${orderId}`,
            html: getPaymentReceiptTemplate(orderId, paymentIntentId, orderData),
            replyTo: 'support@tara-hub.co',
            headers: {
              'X-Priority': '1',
              'Importance': 'high',
            }
          })
          receiptSent = true
          console.log('✅ PAYMENT RECEIPT SENT via Resend!')
        }
        
        console.log('✅ ORDER CONFIRMATION EMAIL SENT via Resend!')
        console.log('📧 Sent to:', customerEmail)
        console.log('Confirmation Response:', JSON.stringify(confirmationData, null, 2))
        console.log('Email ID:', (confirmationData as any).id || 'unknown')
        console.log('⚠️ IMPORTANT: Check your SPAM/JUNK folder if you don\'t see the email in inbox!')
        console.log('📌 The email may be in spam because it\'s from deepcrm.ai domain')
        emailSent = true
      } catch (emailError: any) {
        console.log('⚠️ Resend Error:', emailError.message || emailError)
        console.log('Make sure you have a valid Resend API key in .env.local')
      }
    }
    
    // Option 2: Try Ethereal Email (test service) as fallback
    if (!emailSent) {
      try {
        const testAccount = await nodemailer.createTestAccount()
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        })

        // Send order confirmation
        const confirmInfo = await transporter.sendMail({
          from: '"Custom Fabric Designs" <orders@customfabricdesigns.com>',
          to: customerEmail,
          subject: `Order Confirmation - ${orderId}`,
          html: getOrderConfirmationTemplate(orderId, paymentIntentId, orderData),
        })

        const confirmPreviewUrl = nodemailer.getTestMessageUrl(confirmInfo)

        console.log('📧 TEST ORDER CONFIRMATION EMAIL (Preview Only)')
        console.log('🔗 VIEW ORDER CONFIRMATION:', confirmPreviewUrl)

        // Send payment receipt if requested
        if (sendReceipt) {
          const receiptInfo = await transporter.sendMail({
            from: '"Custom Fabric Designs" <payments@customfabricdesigns.com>',
            to: customerEmail,
            subject: `Payment Receipt - ${orderId}`,
            html: getPaymentReceiptTemplate(orderId, paymentIntentId, orderData),
          })

          const receiptPreviewUrl = nodemailer.getTestMessageUrl(receiptInfo)
          console.log('🧾 TEST PAYMENT RECEIPT EMAIL (Preview Only)')
          console.log('🔗 VIEW PAYMENT RECEIPT:', receiptPreviewUrl)
          receiptSent = true
        }

        console.log('')
        emailSent = true
      } catch (error) {
        console.log('Could not send test email:', error)
      }
    }
    
    // Option 3: Gmail with app password (if configured)
    if (!emailSent && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        })
        
        await transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: customerEmail,
          subject: `Order Confirmation - ${orderId}`,
          html: getOrderConfirmationTemplate(orderId, paymentIntentId, orderData),
        })
        
        console.log('✅ Email sent successfully via Gmail!')
        emailSent = true
      } catch (gmailError) {
        console.log('⚠️ Could not send via Gmail:', gmailError)
      }
    }
    
    if (!emailSent) {
      console.log('')
      console.log('❌ Email could not be sent')
      console.log('To enable email sending, you need to configure Resend:')
      console.log('')
      console.log('📧 RESEND SETUP (Recommended):')
      console.log('1. Sign up at https://resend.com (free tier: 100 emails/day)')
      console.log('2. Get your API key from the dashboard')
      console.log('3. Replace the placeholder in .env.local:')
      console.log('   RESEND_API_KEY=re_YOUR_ACTUAL_API_KEY_HERE')
      console.log('4. Restart the server')
      console.log('')
      console.log('Your current RESEND_API_KEY:', process.env.RESEND_API_KEY ? 
        (process.env.RESEND_API_KEY.substring(0, 10) + '...') : 'Not configured')
    }
    
    // Log the email template for debugging
    if (process.env.NODE_ENV === 'development' && !emailSent) {
      console.log('\n📄 Order Confirmation Template Preview:')
      console.log(getOrderConfirmationTemplate(orderId, paymentIntentId, orderData).substring(0, 500) + '...')
    }

    console.log('=================================================\n')

    return NextResponse.json({
      success: true,
      message: emailSent ?
        (receiptSent ? 'Order confirmation and payment receipt emails sent!' : 'Order confirmation email sent!') :
        'Order confirmation logged (check console for email links)',
      emailSent: emailSent,
      receiptSent: receiptSent,
      details: {
        orderId,
        paymentIntentId,
        email: customerEmail,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('❌ Error in email confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to process confirmation email' },
      { status: 500 }
    )
  }
}