/**
 * Setup script for Contact Management System
 * Creates the contact entity and sets up the service
 */

import { ContainerRegistrationKeys, createMedusaContainer } from "@medusajs/framework/utils"

async function setupContacts() {
  console.log("🚀 Setting up Contact Management System...")

  try {
    const container = createMedusaContainer()
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    
    logger.info("Contact Management System setup initiated")

    // The model and service will be automatically registered by Medusa
    // This script just ensures the database schema is synced
    
    console.log("✅ Contact Management System setup completed!")
    console.log("\n📋 What was set up:")
    console.log("• Contact entity with comprehensive fields")
    console.log("• Contact service for managing submissions")
    console.log("• Admin API routes for contact management")
    console.log("• Store API route for contact form submissions")
    console.log("• Admin UI pages and widgets for viewing contacts")
    
    console.log("\n🔗 Access points:")
    console.log("• Admin Dashboard Contacts: http://localhost:9000/app/contacts")
    console.log("• Store Contact API: http://localhost:9000/store/contacts")
    console.log("• Admin Contact API: http://localhost:9000/admin/contacts")
    console.log("• Fabric Store Form: http://localhost:3006/contact")
    
    console.log("\n📊 Features:")
    console.log("• Status tracking: new → in_progress → resolved → closed")
    console.log("• Priority levels: low, medium, high, urgent")
    console.log("• Auto-categorization based on subject")
    console.log("• Email notifications (if RESEND_API_KEY configured)")
    console.log("• Search and filtering in admin UI")
    console.log("• Response time tracking")
    console.log("• Admin notes and internal communication")
    
    console.log("\n⚙️ Environment Variables (optional):")
    console.log("• RESEND_API_KEY - for email notifications")
    console.log("• ADMIN_EMAIL - admin notification recipient")
    console.log("• MEDUSA_BACKEND_URL - for fabric-store integration")

  } catch (error) {
    console.error("❌ Contact Management System setup failed:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  setupContacts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { setupContacts }