import { 
  AuthenticatedMedusaRequest,
  MedusaResponse
} from "@medusajs/framework/http"
import { CONTACT_MODULE } from "../../../modules/contact"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const contactModuleService = req.scope.resolve(CONTACT_MODULE)
  
  const { 
    status, 
    priority, 
    category, 
    limit = 20,
    offset = 0,
    q
  } = req.query

  try {
    const filters: any = {}
    
    if (status && status !== 'all') filters.status = status
    if (priority && priority !== 'all') filters.priority = priority
    if (category && category !== 'all') filters.category = category

    const [contacts, count] = await contactModuleService.listAndCountContacts(
      filters,
      {
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        order: { created_at: "DESC" }
      }
    )

    res.json({
      contacts,
      count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    res.status(500).json({
      error: "Failed to fetch contacts"
    })
  }
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const contactModuleService = req.scope.resolve(CONTACT_MODULE)
  
  try {
    const contact = await contactModuleService.createContacts(req.body)
    res.json({ contact })
  } catch (error) {
    console.error("Error creating contact:", error)
    res.status(500).json({
      error: "Failed to create contact"
    })
  }
}