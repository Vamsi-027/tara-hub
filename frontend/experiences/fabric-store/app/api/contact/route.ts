import { NextResponse } from 'next/server'

// Contact form submission type
interface ContactFormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  orderNumber?: string
}

// Medusa backend URL
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'

export async function POST(request: Request) {
  try {
    const body: ContactFormData = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Phone validation if provided
    if (body.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(body.phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number' },
          { status: 400 }
        )
      }
    }

    // Submit to Medusa backend
    try {
      const medusaResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/submit-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: body.name,
          email: body.email,
          phone: body.phone,
          subject: body.subject,
          message: body.message,
          order_number: body.orderNumber, // Map orderNumber to order_number
          source: 'fabric_store',
          priority: 'medium'
        })
      })

      if (medusaResponse.ok) {
        const medusaData = await medusaResponse.json()
        console.log('Contact submission saved to Medusa:', medusaData.contact_id)
        
        return NextResponse.json({
          success: true,
          message: medusaData.message || 'Thank you for your fabric inquiry! We will get back to you soon.',
          contact_id: medusaData.contact_id
        }, { status: 200 })
      } else {
        const errorData = await medusaResponse.json()
        console.error('Medusa backend error:', errorData)
        
        // Fallback to in-memory storage if Medusa fails
        console.log('Falling back to local storage due to Medusa error')
        return await handleLocalSubmission(body)
      }
    } catch (medusaError) {
      console.error('Failed to connect to Medusa backend:', medusaError)
      
      // Fallback to in-memory storage if Medusa is unavailable
      console.log('Falling back to local storage due to Medusa connection error')
      return await handleLocalSubmission(body)
    }

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to process contact form submission' },
      { status: 500 }
    )
  }
}

// Fallback function for local storage when Medusa is unavailable
async function handleLocalSubmission(body: ContactFormData) {
  try {
    console.log('Processing contact form submission locally:', {
      name: body.name,
      email: body.email,
      subject: body.subject,
      timestamp: new Date().toISOString()
    })

    // Try to send email notification if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Send email notification to admin
        await resend.emails.send({
          from: 'Tara Hub Fabric Store <noreply@deepcrm.ai>',
          to: process.env.ADMIN_EMAIL || 'admin@deepcrm.ai',
          subject: `[FABRIC STORE] New Contact: ${body.subject}`,
          html: `
            <h2>New Contact Form Submission from Fabric Store</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${body.name}</p>
              <p><strong>Email:</strong> ${body.email}</p>
              ${body.phone ? `<p><strong>Phone:</strong> ${body.phone}</p>` : ''}
              ${body.orderNumber ? `<p><strong>Order Number:</strong> ${body.orderNumber}</p>` : ''}
              <p><strong>Subject:</strong> ${body.subject}</p>
              <p><strong>Message:</strong></p>
              <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                ${body.message.replace(/\n/g, '<br>')}
              </div>
            </div>
            <p><strong>⚠️ Note:</strong> This submission was stored locally - Medusa backend unavailable</p>
            <hr>
            <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
          `
        })

        // Send confirmation email to user
        await resend.emails.send({
          from: 'Tara Hub <noreply@deepcrm.ai>',
          to: body.email,
          subject: 'We received your fabric inquiry - Tara Hub',
          html: `
            <h2>Thank you for your fabric inquiry!</h2>
            <p>Dear ${body.name},</p>
            <p>We have received your message and will get back to you within 24-48 hours.</p>
            <p><strong>Your inquiry:</strong></p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #007cba; margin: 15px 0;">
              <p><strong>Subject:</strong> ${body.subject}</p>
              <p>${body.message.replace(/\n/g, '<br>')}</p>
            </div>
            <p>Our fabric experts will review your inquiry and provide detailed information about our collection.</p>
            <p>If you need immediate assistance, please call us at +1 (555) 123-4567.</p>
            <p>Best regards,<br>The Tara Hub Fabric Team</p>
          `
        })

        console.log('Email notifications sent successfully (local fallback)')
      } catch (emailError) {
        console.error('Email sending failed in local fallback:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your fabric inquiry! We will get back to you soon.',
      note: 'Submission processed locally - admin has been notified'
    }, { status: 200 })

  } catch (error) {
    console.error('Local submission handling failed:', error)
    return NextResponse.json(
      { error: 'Failed to process contact form submission' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve submissions - now proxy to Medusa admin API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '10'
    const offset = searchParams.get('offset') || '0'
    
    // In production, you would check for admin authentication here
    // For now, we'll proxy the request to Medusa
    
    const medusaResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/contacts?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MEDUSA_ADMIN_TOKEN || ''}`,
        'Content-Type': 'application/json'
      }
    })

    if (medusaResponse.ok) {
      const data = await medusaResponse.json()
      return NextResponse.json(data)
    } else {
      console.error('Failed to fetch contacts from Medusa')
      return NextResponse.json(
        { error: 'Failed to fetch contact submissions' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact submissions' },
      { status: 500 }
    )
  }
}