/**
 * Medusa Admin Configuration Override
 * Forces production backend URL for Railway deployment
 */

import { defineConfig } from "@medusajs/admin-sdk"

// Force Railway production URL for admin API calls
const PRODUCTION_BACKEND_URL = "https://medusa-production-e02c.up.railway.app"

export default defineConfig({
  // Force the backend URL to Railway production
  backendUrl: PRODUCTION_BACKEND_URL,
  
  // Ensure development mode uses the correct URL too
  development: {
    backendUrl: PRODUCTION_BACKEND_URL,
  },
  
  // Production configuration
  production: {
    backendUrl: PRODUCTION_BACKEND_URL,
  },
})