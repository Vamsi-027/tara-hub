import { Modules } from "@medusajs/framework/utils"
import bcrypt from "bcrypt"

export default async function setupEmailAuth({ container }: any) {
  const logger = container.resolve("logger")
  const userModule = container.resolve(Modules.USER)
  const authModule = container.resolve(Modules.AUTH)

  const email = "vamsicheruku027@gmail.com"
  const password = "supersecretpassword" // Same as admin user

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

    // Check if emailpass auth identity exists
    const userAuthIdentities = await authModule.listAuthIdentities({
      entity_id: user.id,
      provider: "emailpass"
    })

    if (userAuthIdentities.length > 0) {
      logger.info(`Email/password auth already exists for user`)
      return
    }

    // Create email/password auth identity
    const hashedPassword = await bcrypt.hash(password, 10)
    
    await authModule.createAuthIdentities({
      provider_identities: [{
        entity_id: user.id,
        provider: "emailpass",
        auth_identity: {
          provider_metadata: {
            email: email,
            password: hashedPassword
          }
        }
      }]
    })

    logger.info(`Created email/password auth for ${email}`)
    logger.info(`You can now login with:`)
    logger.info(`Email: ${email}`)
    logger.info(`Password: ${password}`)

  } catch (error) {
    logger.error("Error setting up email auth:", error)
    throw error
  }
}