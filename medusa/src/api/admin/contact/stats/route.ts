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

  try {
    // Get all contacts for stats
    const [contacts] = await contactModuleService.listAndCountContacts()

    // Calculate stats
    const stats = {
      total: contacts.length,
      byStatus: {
        new: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      avgResponseTime: 0,
      totalResponseTime: 0,
      respondedCount: 0
    }

    contacts.forEach((contact: any) => {
      // Count by status
      if (contact.status && stats.byStatus[contact.status] !== undefined) {
        stats.byStatus[contact.status]++
      }
      
      // Count by priority
      if (contact.priority && stats.byPriority[contact.priority] !== undefined) {
        stats.byPriority[contact.priority]++
      }
      
      // Calculate response times
      if (contact.respondedAt && contact.created_at) {
        const responseTime = new Date(contact.respondedAt).getTime() - new Date(contact.created_at).getTime()
        stats.totalResponseTime += responseTime
        stats.respondedCount++
      }
    })

    // Calculate average response time in hours
    if (stats.respondedCount > 0) {
      stats.avgResponseTime = Math.round(stats.totalResponseTime / stats.respondedCount / (1000 * 60 * 60))
    }

    res.json(stats)
  } catch (error) {
    console.error("Error fetching contact stats:", error)
    res.status(500).json({
      error: "Failed to fetch contact statistics"
    })
  }
}