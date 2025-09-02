import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Whitelist of allowed Google email addresses for admin access
const ALLOWED_ADMIN_EMAILS = [
  "varaku@gmail.com",
  "vamsicheruku027@gmail.com", 
  "admin@deepcrm.ai",
  "batchu.kedareswaraabhinav@gmail.com",
  "admin@tara-hub.com"
]

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const code = req.query.code as string
  const state = req.query.state as string

  if (!code) {
    return res.status(400).json({ error: "No authorization code provided" })
  }

  try {
    // Exchange code for tokens using the SAME redirect URI that Google expects
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: "http://localhost:9000/api/auth/callback/google", // MUST match exactly what's in Google Console
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error("Token exchange failed:", error)
      throw new Error("Failed to exchange code for tokens")
    }

    const tokens = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("Failed to get user info")
    }

    const userInfo = await userResponse.json()

    // Check if user email is whitelisted
    if (!ALLOWED_ADMIN_EMAILS.includes(userInfo.email)) {
      // Redirect back to login with error message
      const errorMessage = encodeURIComponent(`Access denied: ${userInfo.email} is not authorized for admin access`)
      return res.redirect(`/app/login?error=unauthorized&message=${errorMessage}`)
    }

    // Get the user module to create/find the user
    const userModule = req.scope.resolve(Modules.USER)
    
    // Check if user exists
    let user
    try {
      const existingUsers = await userModule.listUsers({
        email: userInfo.email,
      })
      
      if (existingUsers.length > 0) {
        user = existingUsers[0]
      } else {
        // Create new user
        user = await userModule.createUsers({
          email: userInfo.email,
          first_name: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
          last_name: userInfo.family_name || userInfo.name?.split(' ')[1] || '',
        })
      }
    } catch (error) {
      console.error("Error creating/finding user:", error)
      // If user operations fail, continue with session creation anyway
      user = { id: userInfo.email, email: userInfo.email }
    }

    // Create session for the user
    req.session = req.session || {}
    req.session.auth_context = {
      actor_id: user.id, // Use the Medusa user ID
      actor_type: "user",
      auth_identity_id: userInfo.id,
      app_metadata: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        provider: "google",
        user_id: user.id
      }
    }

    // Redirect to admin dashboard
    return res.redirect("/app")
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    return res.redirect("/app/login?error=auth_failed")
  }
}