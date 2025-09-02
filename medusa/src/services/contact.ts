import { 
  MedusaService,
  MedusaContainer,
  Logger
} from "@medusajs/framework/utils"

interface CreateContactInput {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  order_number?: string
  category?: string
  priority?: "low" | "medium" | "high" | "urgent"
  source?: string
}

interface UpdateContactInput {
  status?: "new" | "in_progress" | "resolved" | "closed"
  priority?: "low" | "medium" | "high" | "urgent"
  admin_notes?: string
  responded_at?: Date
}

interface ContactFilters {
  status?: string | string[]
  priority?: string | string[]
  category?: string
  source?: string
  email?: string
  order_number?: string
  created_at?: {
    gte?: Date
    lte?: Date
  }
}

class ContactService extends MedusaService({
  Contact: "contact"
}) {
  private logger: Logger

  constructor(container: MedusaContainer) {
    super(...arguments)
    this.logger = container.logger
  }

  /**
   * Create a new contact form submission
   */
  async createContact(data: CreateContactInput) {
    this.logger.info(`Creating new contact submission from ${data.email}`)
    
    try {
      const contact = await this.contactService_.create({
        ...data,
        status: "new",
        priority: data.priority || "medium",
        source: data.source || "fabric_store",
        category: data.category || this.categorizeBySubject(data.subject)
      })

      this.logger.info(`Contact submission created with ID: ${contact.id}`)
      return contact
    } catch (error) {
      this.logger.error("Failed to create contact submission:", error)
      throw error
    }
  }

  /**
   * Get contact submissions with filtering and pagination
   */
  async listContacts(
    filters: ContactFilters = {},
    config: {
      skip?: number
      take?: number
      order?: { [key: string]: "ASC" | "DESC" }
    } = {}
  ) {
    const { skip = 0, take = 20, order = { created_at: "DESC" } } = config

    try {
      const [contacts, count] = await this.contactService_.listAndCount(
        filters,
        {
          skip,
          take,
          order,
          select: [
            "id", "name", "email", "phone", "subject", "status", 
            "priority", "category", "source", "created_at", "updated_at"
          ]
        }
      )

      return {
        contacts,
        count,
        limit: take,
        offset: skip
      }
    } catch (error) {
      this.logger.error("Failed to list contacts:", error)
      throw error
    }
  }

  /**
   * Get a single contact by ID
   */
  async getContact(id: string) {
    try {
      const contact = await this.contactService_.retrieve(id)
      return contact
    } catch (error) {
      this.logger.error(`Failed to get contact ${id}:`, error)
      throw error
    }
  }

  /**
   * Update contact status and admin notes
   */
  async updateContact(id: string, data: UpdateContactInput) {
    this.logger.info(`Updating contact ${id}`)
    
    try {
      // Set responded_at timestamp if status is changing from "new"
      const currentContact = await this.contactService_.retrieve(id)
      const updateData = { ...data }
      
      if (currentContact.status === "new" && data.status && data.status !== "new") {
        updateData.responded_at = new Date()
      }

      const contact = await this.contactService_.update(id, updateData)
      
      this.logger.info(`Contact ${id} updated successfully`)
      return contact
    } catch (error) {
      this.logger.error(`Failed to update contact ${id}:`, error)
      throw error
    }
  }

  /**
   * Soft delete a contact
   */
  async deleteContact(id: string) {
    this.logger.info(`Deleting contact ${id}`)
    
    try {
      await this.contactService_.softDelete([id])
      this.logger.info(`Contact ${id} deleted successfully`)
      return { id, deleted: true }
    } catch (error) {
      this.logger.error(`Failed to delete contact ${id}:`, error)
      throw error
    }
  }

  /**
   * Get contact statistics for admin dashboard
   */
  async getContactStats() {
    try {
      const [
        totalCount,
        newCount,
        inProgressCount,
        resolvedCount,
        urgentCount
      ] = await Promise.all([
        this.contactService_.count(),
        this.contactService_.count({ status: "new" }),
        this.contactService_.count({ status: "in_progress" }),
        this.contactService_.count({ status: "resolved" }),
        this.contactService_.count({ priority: "urgent", status: ["new", "in_progress"] })
      ])

      return {
        total: totalCount,
        new: newCount,
        in_progress: inProgressCount,
        resolved: resolvedCount,
        urgent: urgentCount,
        response_rate: totalCount > 0 ? ((totalCount - newCount) / totalCount) * 100 : 0
      }
    } catch (error) {
      this.logger.error("Failed to get contact statistics:", error)
      throw error
    }
  }

  /**
   * Search contacts by text across name, email, subject, and message
   */
  async searchContacts(query: string, limit: number = 10) {
    try {
      const contacts = await this.contactService_.list(
        {
          $or: [
            { name: { $ilike: `%${query}%` } },
            { email: { $ilike: `%${query}%` } },
            { subject: { $ilike: `%${query}%` } },
            { message: { $ilike: `%${query}%` } }
          ]
        },
        {
          take: limit,
          order: { created_at: "DESC" }
        }
      )

      return contacts
    } catch (error) {
      this.logger.error("Failed to search contacts:", error)
      throw error
    }
  }

  /**
   * Auto-categorize submission based on subject content
   */
  private categorizeBySubject(subject: string): string {
    const subjectLower = subject.toLowerCase()
    
    if (subjectLower.includes("order") || subjectLower.includes("shipping") || subjectLower.includes("delivery")) {
      return "order_support"
    } else if (subjectLower.includes("fabric") || subjectLower.includes("material") || subjectLower.includes("swatch")) {
      return "fabric_inquiry"
    } else if (subjectLower.includes("return") || subjectLower.includes("refund") || subjectLower.includes("exchange")) {
      return "returns"
    } else if (subjectLower.includes("technical") || subjectLower.includes("website") || subjectLower.includes("bug")) {
      return "technical"
    } else {
      return "general"
    }
  }
}

export default ContactService