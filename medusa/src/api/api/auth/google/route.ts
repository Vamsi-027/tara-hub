import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Build Google OAuth URL with the redirect URI that matches what's in Google Console
  const backendUrl = process.env.MEDUSA_BACKEND_URL || 'https://medusa-backend-production-3655.up.railway.app'
  const redirectUri = `${backendUrl}/api/auth/callback/google`
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('email profile')}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=admin`

  return res.redirect(googleAuthUrl)
}