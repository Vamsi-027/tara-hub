import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Whitelist of allowed Google email addresses for admin access
const ALLOWED_ADMIN_EMAILS = [
  "varaku@gmail.com",
  "vamsicheruku027@gmail.com", 
  "admin@deepcrm.ai",
  "batchu.kedareswaraabhinav@gmail.com",
  "admin@tara-hub.com"
]

export async function adminGoogleAuthMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Skip auth check for auth endpoints themselves
  if (req.path.startsWith("/auth/")) {
    return next()
  }

  // Check if user is authenticated
  if (!req.session?.auth_context?.actor_id) {
    // Redirect to Google login
    return res.redirect("/auth/google")
  }

  // Get user details from session
  const userEmail = req.session?.auth_context?.app_metadata?.email

  // Check if email is in whitelist
  if (!userEmail || !ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
    return res.status(403).json({
      error: "Access denied. Your Google account is not authorized to access this admin panel."
    })
  }

  // User is authenticated and authorized
  next()
}