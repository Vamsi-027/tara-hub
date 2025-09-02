import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTACT_MODULE } from "../../../modules/contact"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const contactModuleService = req.scope.resolve(CONTACT_MODULE)
  
  const { name, email, phone, subject, message, orderNumber } = req.body

  try {
    // Create the contact submission
    const contact = await contactModuleService.createContacts({
      name,
      email,
      phone,
      subject,
      message,
      orderNumber,
      source: "fabric_store",
      category: determineCategory(subject),
      priority: determinePriority(message, subject)
    })

    res.json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
      contact: contact
    })
  } catch (error) {
    console.error("Error creating contact:", error)
    res.status(500).json({
      error: "Failed to submit contact form"
    })
  }
}

function determineCategory(subject: string): string {
  const subjectLower = subject.toLowerCase()
  if (subjectLower.includes("order")) return "order_support"
  if (subjectLower.includes("product") || subjectLower.includes("fabric")) return "fabric_inquiry"
  if (subjectLower.includes("wholesale")) return "wholesale"
  if (subjectLower.includes("return") || subjectLower.includes("exchange")) return "returns"
  if (subjectLower.includes("custom")) return "custom_order"
  return "general"
}

function determinePriority(message: string, subject: string): "low" | "medium" | "high" | "urgent" {
  const content = `${subject} ${message}`.toLowerCase()
  if (content.includes("urgent") || content.includes("asap") || content.includes("immediately")) return "urgent"
  if (content.includes("order") && content.includes("problem")) return "high"
  if (content.includes("wholesale") || content.includes("bulk")) return "high"
  return "medium"
}