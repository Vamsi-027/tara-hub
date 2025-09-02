import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Build Google OAuth URL with the redirect URI that matches what's in Google Console
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent('http://localhost:9000/api/auth/callback/google')}` + // MUST match Google Console
    `&response_type=code` +
    `&scope=${encodeURIComponent('email profile')}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=admin`

  return res.redirect(googleAuthUrl)
}