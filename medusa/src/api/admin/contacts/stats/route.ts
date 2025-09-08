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
    const stats = await contactService.getContactStats()

    // Get additional time-based statistics
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todayCount, weekCount, monthCount] = await Promise.all([
      contactService.listContacts({ created_at: { gte: startOfToday } }).then(r => r.count),
      contactService.listContacts({ created_at: { gte: startOfWeek } }).then(r => r.count),
      contactService.listContacts({ created_at: { gte: startOfMonth } }).then(r => r.count)
    ])

    const enhancedStats = {
      ...stats,
      today: todayCount,
      this_week: weekCount,
      this_month: monthCount,
      timestamp: now.toISOString()
    }

    res.json(enhancedStats)
  } catch (error) {
    logger.error("Failed to fetch contact statistics:", error)
    res.status(500).json({ 
      error: "Failed to fetch contact statistics",
      details: error.message 
    })
  }
}