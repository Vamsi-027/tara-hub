import { 
  MedusaRequest, 
  MedusaResponse,
  MedusaContainer
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// CORS headers for fabric-store frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3006", // Fabric store port
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
}

export const OPTIONS = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  res.set(corsHeaders)
  res.status(204).send()
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const container = req.scope as MedusaContainer
  const contactService = container.resolve("contactService")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // Set CORS headers
  res.set(corsHeaders)

  try {
    const { 
      name, 
      email, 
      phone, 
      subject, 
      message, 
      order_number 
    } = req.body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["name", "email", "subject", "message"]
      })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email address"
      })
    }

    // Phone validation if provided
    if (phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          error: "Invalid phone number format"
        })
      }
    }

    // Create contact submission with fabric store source
    const contact = await contactService.createContact({
      name,
      email,
      phone,
      subject,
      message,
      order_number,
      source: "fabric_store",
      priority: "medium" // Default priority for store submissions
    })

    logger.info(`Contact submission from fabric store: ${contact.id} - ${email}`)

    // Send email notification if configured
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)

        // Send admin notification
        await resend.emails.send({
          from: 'Tara Hub Fabric Store <noreply@deepcrm.ai>',
          to: process.env.ADMIN_EMAIL || 'admin@deepcrm.ai',
          subject: `New Fabric Store Inquiry: ${subject}`,
          html: `
            <h2>New Contact Form Submission from Fabric Store</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            ${order_number ? `<p><strong>Order Number:</strong> ${order_number}</p>` : ''}
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <hr>
            <p><small>Submitted: ${new Date().toLocaleString()}</small></p>
            <p><small>Source: Fabric Store Frontend</small></p>
            <p><a href="http://localhost:9000/app/contacts/${contact.id}" style="background: #007cba; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">View in Admin Dashboard</a></p>
          `
        })

        // Send customer confirmation
        await resend.emails.send({
          from: 'Tara Hub <noreply@deepcrm.ai>',
          to: email,
          subject: 'We received your fabric inquiry - Tara Hub',
          html: `
            <h2>Thank you for your fabric inquiry!</h2>
            <p>Dear ${name},</p>
            <p>We have received your message and will get back to you within 24-48 hours.</p>
            <p><strong>Your inquiry:</strong></p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #007cba; margin: 15px 0;">
              <p><strong>Subject:</strong> ${subject}</p>
              <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p>Our fabric experts will review your inquiry and provide detailed information about our collection.</p>
            <p>If you need immediate assistance, please call us at +1 (555) 123-4567.</p>
            <p>Best regards,<br>The Tara Hub Fabric Team</p>
            <hr>
            <p><small>Reference ID: ${contact.id}</small></p>
          `
        })

        logger.info(`Email notifications sent for contact ${contact.id}`)
      }
    } catch (emailError) {
      logger.error("Failed to send email notifications:", emailError)
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Thank you for your fabric inquiry! We will get back to you soon.",
      contact_id: contact.id
    })
  } catch (error) {
    logger.error("Failed to process contact form submission:", error)
    res.status(500).json({ 
      error: "Failed to process contact form submission",
      message: "Please try again later or contact us directly."
    })
  }
}