import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'

// Initialize Resend - You need to get an API key from https://resend.com
const resend = new Resend(process.env.RESEND_API_KEY || 're_test_key')

// Enhanced email template with order details
function getEmailTemplate(orderId: string, paymentIntentId: string, orderData?: any) {
  const items = orderData?.items || []
  const shipping = orderData?.shipping || {}
  const email = orderData?.email || ''
  const total = orderData?.total || 0
  
  // Generate items HTML
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.title || 'Item'}</strong><br>
        <span style="color: #666; font-size: 14px;">${item.variant || ''}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        $${((item.price || 0) / 100).toFixed(2)}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
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
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #28a745; margin: 0;">✓ Order Confirmed!</h1>
      <p style="color: #666; margin-top: 10px;">Thank you for your purchase</p>
    </div>
    
    <div style="background-color: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
      <!-- Order Info -->
      <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 5px 0;"><strong>Order ID:</strong></td>
            <td style="text-align: right;">${orderId}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Order Date:</strong></td>
            <td style="text-align: right;">${new Date().toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Email:</strong></td>
            <td style="text-align: right;">${email}</td>
          </tr>
        </table>
      </div>
      
      <!-- Order Items -->
      <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || '<tr><td colspan="4" style="padding: 20px; text-align: center;">No items found</td></tr>'}
        </tbody>
      </table>
      
      <!-- Order Summary -->
      <table style="width: 100%; margin-bottom: 25px;">
        <tr>
          <td style="padding: 8px 0; text-align: right;">Subtotal:</td>
          <td style="padding: 8px 0; text-align: right; width: 100px;">
            <strong>$${(subtotal / 100).toFixed(2)}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; text-align: right;">Shipping:</td>
          <td style="padding: 8px 0; text-align: right;">
            <strong>$${(shippingCost / 100).toFixed(2)}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; text-align: right;">Tax:</td>
          <td style="padding: 8px 0; text-align: right;">
            <strong>$${(tax / 100).toFixed(2)}</strong>
          </td>
        </tr>
        <tr style="border-top: 2px solid #28a745;">
          <td style="padding: 12px 0; text-align: right; font-size: 18px;"><strong>Total:</strong></td>
          <td style="padding: 12px 0; text-align: right; font-size: 18px; color: #28a745;">
            <strong>$${(finalTotal / 100).toFixed(2)}</strong>
          </td>
        </tr>
      </table>
      
      <!-- Shipping Address -->
      ${shipping.firstName ? `
      <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #28a745; padding-bottom: 10px;">Shipping Address</h3>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
        <p style="margin: 5px 0;">${shipping.firstName} ${shipping.lastName || ''}</p>
        <p style="margin: 5px 0;">${shipping.address || ''}</p>
        <p style="margin: 5px 0;">${shipping.city || ''}, ${shipping.state || ''} ${shipping.zipCode || ''}</p>
        <p style="margin: 5px 0;">${shipping.country || 'US'}</p>
      </div>
      ` : ''}
      
      <!-- What's Next -->
      <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">What's Next?</h3>
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
        <ul style="padding-left: 20px; margin: 0;">
          <li style="margin-bottom: 8px;">Your fabric samples are being carefully packaged</li>
          <li style="margin-bottom: 8px;">You'll receive a shipping notification within 24 hours</li>
          <li style="margin-bottom: 8px;">Expected delivery in 3-5 business days</li>
          <li style="margin-bottom: 8px;">Track your order with the tracking number we'll send</li>
        </ul>
      </div>
      
      <!-- Contact -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
        <h3 style="color: #333; margin-bottom: 15px;">Need Help?</h3>
        <p style="margin: 10px 0;">If you have any questions about your order, please contact us:</p>
        <p style="margin: 10px 0;">
          <a href="mailto:support@fabricstore.com" style="color: #28a745; text-decoration: none;">support@fabricstore.com</a>
        </p>
        <p style="margin: 10px 0; color: #666;">Order ID: ${orderId}</p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #666; font-size: 14px;">
        Thank you for choosing our premium fabric collection!
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 20px;">
        © 2024 Fabric Store. All rights reserved.
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
    const { orderId, paymentIntentId, email, orderData } = body

    // Get email from localStorage cart data or use a test email
    const customerEmail = email || 'test@example.com'
    
    console.log('=================================================')
    console.log('📧 ORDER CONFIRMATION EMAIL')
    console.log('=================================================')
    console.log('To:', customerEmail)
    console.log('Order ID:', orderId)
    console.log('Payment Intent:', paymentIntentId)
    console.log('Timestamp:', new Date().toISOString())
    console.log('=================================================')
    
    let emailSent = false
    
    // Option 1: Try Resend first (if configured with real API key)
    if (process.env.RESEND_API_KEY && 
        process.env.RESEND_API_KEY !== 're_test_key' && 
        process.env.RESEND_API_KEY !== 're_123456789_yourActualApiKeyHere' &&
        process.env.RESEND_API_KEY.startsWith('re_')) {
      try {
        const data = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Fabric Store <onboarding@resend.dev>',
          to: [customerEmail],
          subject: `Order Confirmation - ${orderId}`,
          html: getEmailTemplate(orderId, paymentIntentId, orderData),
        })
        
        console.log('✅ REAL EMAIL SENT SUCCESSFULLY via Resend!')
        console.log('📧 Sent to:', customerEmail)
        console.log('Email ID:', (data as any).id || 'unknown')
        console.log('Check your inbox (or spam folder) for the order confirmation!')
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
        
        const info = await transporter.sendMail({
          from: '"Fabric Store" <orders@fabricstore.com>',
          to: customerEmail,
          subject: `Order Confirmation - ${orderId}`,
          html: getEmailTemplate(orderId, paymentIntentId, orderData),
        })
        
        const previewUrl = nodemailer.getTestMessageUrl(info)
        
        console.log('📧 TEST EMAIL SENT (Preview Only)')
        console.log('🔗 VIEW YOUR EMAIL HERE:', previewUrl)
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
          html: getEmailTemplate(orderId, paymentIntentId, orderData),
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
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📄 Full Email HTML Template:')
      console.log(getEmailTemplate(orderId, paymentIntentId).substring(0, 500) + '...')
    }
    
    console.log('=================================================\n')
    
    return NextResponse.json({
      success: true,
      message: emailSent ? 'Order confirmation email sent!' : 'Order confirmation logged (check console for email link)',
      emailSent: emailSent,
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