/**
 * NUCLEAR ADMIN CONFIGURATION OVERRIDE
 * Forces production backend URL at every possible level
 */

import { defineConfig } from "@medusajs/admin-sdk"

// Force Railway production URL for admin API calls
const PRODUCTION_BACKEND_URL = "https://medusa-production-e02c.up.railway.app"

// Set global variables immediately
if (typeof window !== 'undefined') {
  (window as any).__BACKEND_URL__ = PRODUCTION_BACKEND_URL;
  (window as any).MEDUSA_BACKEND_URL = PRODUCTION_BACKEND_URL;
  (window as any).MEDUSA_ADMIN_BACKEND_URL = PRODUCTION_BACKEND_URL;
}

export default defineConfig({
  // Force the backend URL to Railway production
  backendUrl: PRODUCTION_BACKEND_URL,
  
  // Override any development/production environment detection
  development: {
    backendUrl: PRODUCTION_BACKEND_URL,
  },
  
  production: {
    backendUrl: PRODUCTION_BACKEND_URL,
  },
  
  // Override at build time
  build: {
    backendUrl: PRODUCTION_BACKEND_URL,
  },
  
  // Additional configuration overrides
  server: {
    backendUrl: PRODUCTION_BACKEND_URL,
  },
})