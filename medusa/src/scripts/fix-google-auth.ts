import { Modules } from "@medusajs/framework/utils"

export default async function fixGoogleAuth({ container }: any) {
  const logger = container.resolve("logger")
  const userModule = container.resolve(Modules.USER)
  const authModule = container.resolve(Modules.AUTH)

  const email = "vamsicheruku027@gmail.com"
  const googleUserId = "115410036936885692124"

  try {
    // Find the user
    const existingUsers = await userModule.listUsers({
      email: email,
    })

    if (existingUsers.length === 0) {
      logger.error(`No user found with email ${email}`)
      return
    }

    const user = existingUsers[0]
    logger.info(`User found: ID=${user.id}, Email=${user.email}`)

    // Delete the existing broken auth identity
    try {
      await authModule.deleteAuthIdentities([googleUserId])
      logger.info(`Deleted broken auth identity ${googleUserId}`)
    } catch (error) {
      logger.info(`No existing auth identity to delete: ${error.message}`)
    }

    // Create a new auth identity with proper structure
    try {
      await authModule.createAuthIdentities([{
        id: googleUserId,
        provider: "google",
        entity_id: user.id,
        provider_metadata: {
          email: email,
          name: "Vamsi Cheruku"
        }
      }])

      logger.info(`Created new Google auth identity: ${googleUserId} -> ${user.id}`)
    } catch (error) {
      logger.error(`Failed to create auth identity: ${error.message}`)
      
      // Try alternative method - using the provider_identities format
      try {
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
        logger.info(`Created auth identity using provider_identities format`)
      } catch (error2) {
        logger.error(`Both methods failed: ${error2.message}`)
        throw error2
      }
    }

    // Verify the auth identity was created correctly
    try {
      const authIdentity = await authModule.retrieveAuthIdentity(googleUserId, {
        select: ["id", "provider", "entity_id", "provider_metadata"]
      })
      
      logger.info(`Verification - Auth identity: ID=${authIdentity.id}, Provider=${authIdentity.provider}, EntityID=${authIdentity.entity_id}`)
    } catch (error) {
      logger.error(`Verification failed: ${error.message}`)
    }

  } catch (error) {
    logger.error("Error fixing Google auth:", error)
    throw error
  }
}