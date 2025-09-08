import { Modules } from "@medusajs/framework/utils"

export default async function linkGoogleAuth({ container }: any) {
  const logger = container.resolve("logger")
  const userModule = container.resolve(Modules.USER)
  const authModule = container.resolve(Modules.AUTH)

  const email = "vamsicheruku027@gmail.com"
  const googleUserId = "115410036936885692124" // Your Google user ID from the error

  try {
    // Find the existing user
    const existingUsers = await userModule.listUsers({
      email: email,
    })

    if (existingUsers.length === 0) {
      logger.error(`No user found with email ${email}`)
      return
    }

    const user = existingUsers[0]
    logger.info(`Found existing user:`, user.id, user.email)

    // Check if Google auth identity already exists
    try {
      const existingAuth = await authModule.retrieveAuthIdentity(googleUserId, {
        select: ["id", "provider", "entity_id"]
      })
      
      if (existingAuth) {
        logger.info(`Google auth identity already exists for ${googleUserId}`)
        if (existingAuth.entity_id === user.id) {
          logger.info(`Already linked to correct user ${user.id}`)
          return
        } else {
          logger.info(`Linked to different user ${existingAuth.entity_id}, updating...`)
          // Update the existing auth identity to link to correct user
          await authModule.updateAuthIdentities(googleUserId, {
            entity_id: user.id
          })
          logger.info(`Updated Google auth identity to link to user ${user.id}`)
          return
        }
      }
    } catch (error) {
      // Auth identity doesn't exist, we'll create it below
      logger.info(`No existing Google auth identity found, creating new one`)
    }

    // Create Google auth identity for the existing user
    await authModule.createAuthIdentities({
      provider_identities: [{
        entity_id: user.id,
        provider: "google",
        auth_identity: {
          id: googleUserId,
          provider_metadata: {
            email: email,
            name: "Vamsi Cheruku"
          }
        }
      }]
    })

    logger.info(`Created Google auth identity for user ${user.id}`)
    logger.info(`Google OAuth should now work for ${email}`)

  } catch (error) {
    logger.error("Failed to link Google auth:", error)
    throw error
  }
}