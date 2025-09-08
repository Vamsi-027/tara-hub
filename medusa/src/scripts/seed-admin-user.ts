import { Modules } from "@medusajs/framework/utils"
import bcrypt from "bcrypt"

export default async function seedAdminUser({ container }: any) {
  const logger = container.resolve("logger")
  const userModule = container.resolve(Modules.USER)
  const authModule = container.resolve(Modules.AUTH)

  const email = process.env.MEDUSA_ADMIN_EMAIL || "admin@tara-hub.com"
  const password = process.env.MEDUSA_ADMIN_PASSWORD || "supersecretpassword"

  try {
    // Check if user already exists
    const existingUsers = await userModule.listUsers({
      email: email,
    })

    if (existingUsers.length > 0) {
      logger.info(`Admin user with email ${email} already exists`)
      return
    }

    // Create the admin user
    const user = await userModule.createUsers({
      email: email,
      first_name: "Admin",
      last_name: "User",
    })

    logger.info(`Created admin user with email: ${email}`)

    // Create auth identity for the user with emailpass provider
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

    logger.info(`Created auth identity for admin user`)
    logger.info(`You can now login with:`)
    logger.info(`Email: ${email}`)
    logger.info(`Password: ${password}`)

  } catch (error) {
    logger.error("Failed to create admin user:", error)
    throw error
  }
}