import { 
  MedusaRequest, 
  MedusaResponse,
  AuthenticatedMedusaRequest
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const container = req.scope
  const contactService = container.resolve("contactService")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    // Parse query parameters for filtering and pagination
    const { 
      status, 
      priority, 
      category, 
      source, 
      email,
      order_number,
      offset = 0, 
      limit = 20,
      order_by = "created_at",
      sort = "desc",
      q
    } = req.query

    // Handle search query
    if (q && typeof q === 'string') {
      const contacts = await contactService.searchContacts(q, parseInt(limit as string))
      return res.json({
        contacts,
        count: contacts.length,
        limit: parseInt(limit as string),
        offset: 0
      })
    }

    // Build filters object
    const filters: any = {}
    if (status) filters.status = Array.isArray(status) ? status : [status]
    if (priority) filters.priority = Array.isArray(priority) ? priority : [priority]
    if (category) filters.category = category
    if (source) filters.source = source
    if (email) filters.email = email
    if (order_number) filters.order_number = order_number

    // Parse date filters if provided
    const created_after = req.query.created_after as string
    const created_before = req.query.created_before as string
    if (created_after || created_before) {
      filters.created_at = {}
      if (created_after) filters.created_at.gte = new Date(created_after)
      if (created_before) filters.created_at.lte = new Date(created_before)
    }

    // Get contacts with pagination
    const result = await contactService.listContacts(filters, {
      skip: parseInt(offset as string),
      take: parseInt(limit as string),
      order: { [order_by as string]: (typeof sort === 'string' ? sort.toUpperCase() : 'DESC') as "ASC" | "DESC" }
    })

    res.json(result)
  } catch (error) {
    logger.error("Failed to fetch contacts:", error)
    res.status(500).json({ 
      error: "Failed to fetch contacts",
      details: error.message 
    })
  }
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const container = req.scope
  const contactService = container.resolve("contactService")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const body = req.body as any
    const { 
      name, 
      email, 
      phone, 
      subject, 
      message, 
      order_number,
      category,
      priority,
      source 
    } = body

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

    // Create contact submission
    const contact = await contactService.createContact({
      name,
      email,
      phone,
      subject,
      message,
      order_number,
      category,
      priority,
      source
    })

    logger.info(`Contact submission created: ${contact.id}`)

    res.status(201).json({
      contact,
      message: "Contact submission created successfully"
    })
  } catch (error) {
    logger.error("Failed to create contact submission:", error)
    res.status(500).json({ 
      error: "Failed to create contact submission",
      details: error.message 
    })
  }
}