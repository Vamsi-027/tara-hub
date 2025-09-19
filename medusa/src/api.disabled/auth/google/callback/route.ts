import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

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
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:9000/auth/google/callback",
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
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
      return res.status(403).json({
        error: "Access denied. Your Google account is not authorized to access this admin panel.",
        email: userInfo.email
      })
    }

    // Create session for the user
    req.session = req.session || {}
    req.session.auth_context = {
      actor_id: userInfo.id,
      actor_type: "user",
      auth_identity_id: userInfo.id,
      app_metadata: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        provider: "google"
      }
    }

    // Save session
    if (req.session.save) {
      await new Promise((resolve, reject) => {
        req.session.save((err: any) => {
          if (err) reject(err)
          else resolve(true)
        })
      })
    }

    // Redirect to admin dashboard
    return res.redirect("/app")
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    return res.status(500).json({
      error: "Authentication failed",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}