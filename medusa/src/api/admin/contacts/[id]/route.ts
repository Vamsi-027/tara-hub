import { 
  MedusaRequest, 
  MedusaResponse,
  MedusaContainer,
  AuthenticatedMedusaRequest
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const container = req.scope as MedusaContainer
  const contactService = container.resolve("contactService")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { id } = req.params

    const contact = await contactService.getContact(id)

    if (!contact) {
      return res.status(404).json({
        error: "Contact not found"
      })
    }

    res.json({ contact })
  } catch (error) {
    logger.error(`Failed to fetch contact ${req.params.id}:`, error)
    
    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Contact not found"
      })
    }

    res.status(500).json({ 
      error: "Failed to fetch contact",
      details: error.message 
    })
  }
}

export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const container = req.scope as MedusaContainer
  const contactService = container.resolve("contactService")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { id } = req.params
    const { status, priority, admin_notes } = req.body

    // Validate status if provided
    const validStatuses = ["new", "in_progress", "resolved", "closed"]
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        valid_statuses: validStatuses
      })
    }

    // Validate priority if provided
    const validPriorities = ["low", "medium", "high", "urgent"]
    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: "Invalid priority",
        valid_priorities: validPriorities
      })
    }

    const contact = await contactService.updateContact(id, {
      status,
      priority,
      admin_notes
    })

    logger.info(`Contact ${id} updated by admin`)

    res.json({
      contact,
      message: "Contact updated successfully"
    })
  } catch (error) {
    logger.error(`Failed to update contact ${req.params.id}:`, error)
    
    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Contact not found"
      })
    }

    res.status(500).json({ 
      error: "Failed to update contact",
      details: error.message 
    })
  }
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const container = req.scope as MedusaContainer
  const contactService = container.resolve("contactService")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const { id } = req.params

    await contactService.deleteContact(id)

    logger.info(`Contact ${id} deleted by admin`)

    res.json({
      id,
      deleted: true,
      message: "Contact deleted successfully"
    })
  } catch (error) {
    logger.error(`Failed to delete contact ${req.params.id}:`, error)
    
    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: "Contact not found"
      })
    }

    res.status(500).json({ 
      error: "Failed to delete contact",
      details: error.message 
    })
  }
}