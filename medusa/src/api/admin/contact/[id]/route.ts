import { 
  AuthenticatedMedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http"
import { CONTACT_MODULE } from "../../../../modules/contact"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const contactModuleService = req.scope.resolve(CONTACT_MODULE)
  const { id } = req.params

  try {
    const contact = await contactModuleService.retrieveContact(id)
    res.json({ contact })
  } catch (error) {
    console.error("Error fetching contact:", error)
    res.status(404).json({
      error: "Contact not found"
    })
  }
}

export const PUT = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const contactModuleService = req.scope.resolve(CONTACT_MODULE)
  const { id } = req.params

  try {
    const updateData: any = {}
    
    if (req.body.status) updateData.status = req.body.status
    if (req.body.priority) updateData.priority = req.body.priority
    if (req.body.adminNotes !== undefined) updateData.adminNotes = req.body.adminNotes
    
    // If status is being changed to resolved or closed, set respondedAt
    if (req.body.status === 'resolved' || req.body.status === 'closed') {
      updateData.respondedAt = new Date()
    }

    const contact = await contactModuleService.updateContacts(id, updateData)
    res.json({ contact })
  } catch (error) {
    console.error("Error updating contact:", error)
    res.status(500).json({
      error: "Failed to update contact"
    })
  }
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const contactModuleService = req.scope.resolve(CONTACT_MODULE)
  const { id } = req.params

  try {
    await contactModuleService.deleteContacts(id)
    res.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    res.status(500).json({
      error: "Failed to delete contact"
    })
  }
}