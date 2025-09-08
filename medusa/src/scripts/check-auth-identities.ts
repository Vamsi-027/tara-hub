import { Modules } from "@medusajs/framework/utils"

export default async function checkAuthIdentities({ container }: any) {
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
    logger.info(`User found: ID=${user.id}, Email=${user.email}, Name=${user.first_name} ${user.last_name}`)

    // Try to find auth identity by Google user ID
    try {
      const authIdentity = await authModule.retrieveAuthIdentity(googleUserId, {
        select: ["id", "provider", "entity_id", "provider_metadata"]
      })
      
      logger.info(`Auth identity found: ID=${authIdentity.id}, Provider=${authIdentity.provider}, EntityID=${authIdentity.entity_id}, Metadata=${JSON.stringify(authIdentity.provider_metadata)}`)
    } catch (error) {
      logger.error(`No auth identity found for Google user ID ${googleUserId}:`, error.message)
    }

    // List all auth identities for this user
    try {
      const userAuthIdentities = await authModule.listAuthIdentities({
        entity_id: user.id
      })
      
      logger.info(`All auth identities for user ${user.id}:`, userAuthIdentities.map(auth => ({
        id: auth.id,
        provider: auth.provider,
        entity_id: auth.entity_id
      })))
    } catch (error) {
      logger.error(`Error listing auth identities for user:`, error.message)
    }

    // List all Google auth identities
    try {
      const googleAuthIdentities = await authModule.listAuthIdentities({
        provider: "google"
      })
      
      logger.info(`All Google auth identities:`, googleAuthIdentities.map(auth => ({
        id: auth.id,
        provider: auth.provider,
        entity_id: auth.entity_id,
        provider_metadata: auth.provider_metadata
      })))
    } catch (error) {
      logger.error(`Error listing Google auth identities:`, error.message)
    }

  } catch (error) {
    logger.error("Error checking auth identities:", error)
    throw error
  }
}