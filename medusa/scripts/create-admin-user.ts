import { Modules, MedusaModule } from "@medusajs/framework/utils"

async function createAdminUser() {
  try {
    // Initialize Medusa modules
    const { initialize } = await import("@medusajs/framework")
    const { container } = await initialize()

    // Get the user module
    const userModule = container.resolve(Modules.USER)

    // Check if admin user already exists
    const email = "admin@tara-hub.com"
    const existingUsers = await userModule.listUsers({
      email,
    })

    if (existingUsers.length > 0) {
      console.log("Admin user already exists:", email)

      // Create an invite token for the existing user
      const inviteModule = container.resolve("invite")
      if (inviteModule) {
        const invite = await inviteModule.createInvites({
          email,
          accepted: false,
          metadata: {},
        })
        console.log("Created invite for existing admin user")
      }
    } else {
      // Create new admin user
      const user = await userModule.createUsers({
        email,
        first_name: "Admin",
        last_name: "User",
        metadata: {
          role: "admin",
        },
      })

      console.log("Created admin user:", user)

      // Create an authentication identity
      const authModule = container.resolve(Modules.AUTH)
      if (authModule) {
        await authModule.createAuthIdentities({
          provider_identities: [{
            entity_id: user.id,
            provider: "emailpass",
            auth_identity_id: user.id,
          }],
        })
        console.log("Created auth identity for admin user")
      }
    }

    // Generate a login link (for development)
    console.log("\n=== Admin Access Instructions ===")
    console.log("1. Go to: https://medusa-backend-production-3655.up.railway.app/app")
    console.log("2. Use email: admin@tara-hub.com")
    console.log("3. Click 'Continue with email'")
    console.log("4. You'll receive a magic link to login")
    console.log("\nNote: Make sure RESEND_API_KEY is configured in Railway environment variables")

    process.exit(0)
  } catch (error) {
    console.error("Error creating admin user:", error)
    process.exit(1)
  }
}

createAdminUser()