/**
 * Script to manage API keys in production Medusa
 * Creates or retrieves publishable keys for store access
 */

import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function manageApiKeys(container: MedusaContainer) {
  const apiKeyService = container.resolve("apiKey")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    logger.info("🔑 Managing API Keys for Production...")

    // List existing API keys
    const existingKeys = await apiKeyService.listApiKeys({})

    logger.info(`📋 Found ${existingKeys.length} existing API keys`)

    // Check for store publishable key
    let storeKey = existingKeys.find(key =>
      key.title?.toLowerCase().includes("store") ||
      key.title?.toLowerCase().includes("fabric") ||
      key.type === "publishable"
    )

    if (storeKey) {
      logger.info("✅ Found existing store publishable key:")
      logger.info(`   Title: ${storeKey.title}`)
      logger.info(`   Token: ${storeKey.token}`)
      logger.info(`   Type: ${storeKey.type}`)
      logger.info(`   Created: ${storeKey.created_at}`)
      logger.info("")
      logger.info("🎯 Use this key in your fabric-store app:")
      logger.info(`   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${storeKey.token}`)
    } else {
      logger.info("⚠️ No store publishable key found, creating one...")

      // Create a new publishable key
      const newKey = await apiKeyService.createApiKeys({
        title: "Fabric Store Production Key",
        type: "publishable",
        created_by: "system"
      })

      logger.info("✅ Created new publishable key:")
      logger.info(`   Title: ${newKey.title}`)
      logger.info(`   Token: ${newKey.token}`)
      logger.info(`   Type: ${newKey.type}`)
      logger.info("")
      logger.info("🎯 Add this to your fabric-store environment:")
      logger.info(`   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${newKey.token}`)
    }

    // Also list all keys for debugging
    logger.info("")
    logger.info("📋 All API Keys in system:")
    for (const key of existingKeys) {
      logger.info(`   - ${key.title || "Untitled"} (${key.type}): ${key.token}`)
    }

  } catch (error) {
    logger.error("❌ Failed to manage API keys:", error)

    // If the API key service isn't available, provide alternative solution
    if (error.message?.includes("apiKey") || error.message?.includes("resolve")) {
      logger.info("")
      logger.info("⚠️ API Key service not available. Trying alternative approach...")

      // Try direct database query
      const query = container.resolve(ContainerRegistrationKeys.QUERY)

      try {
        // Try using the query service to get API keys
        const result = await query.graph({
          entity: "api_key",
          fields: ["id", "token", "title", "type", "created_at"],
          filters: { type: "publishable" }
        })

        if (result?.data?.length > 0) {
          logger.info("✅ Found API keys via query:")
          result.data.forEach(key => {
            logger.info(`   ${key.title}: ${key.token}`)
          })
        }
      } catch (queryError) {
        logger.info("")
        logger.info("📌 Alternative Solution:")
        logger.info("1. Access Medusa Admin UI at: https://medusa-backend-production-3655.up.railway.app/app")
        logger.info("2. Navigate to Settings -> API Key Management")
        logger.info("3. Create a new Publishable Key for 'Fabric Store'")
        logger.info("4. Copy the key and update your fabric-store environment")
        logger.info("")
        logger.info("Or temporarily disable API key requirement by:")
        logger.info("1. Remove 'x-publishable-api-key' header from API calls")
        logger.info("2. Ensure Medusa is configured to allow public access")
      }
    }
  }
}

// Execute if run directly
if (require.main === module) {
  require("dotenv").config()

  const { initialize } = require("@medusajs/framework")

  initialize().then(async ({ container }) => {
    await manageApiKeys(container)
    process.exit(0)
  }).catch((error) => {
    console.error("Failed to initialize:", error)
    process.exit(1)
  })
}