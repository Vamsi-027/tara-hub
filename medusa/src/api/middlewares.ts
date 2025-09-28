/**
 * API Middlewares
 *
 * Custom middleware configuration for API routes.
 * Includes raw body parsing for webhook signature validation
 * and comprehensive security headers.
 */

import {
  defineMiddlewares,
  raw,
  json,
  cors,
  authenticate
} from "@medusajs/framework/http"
import { securityHeaders, getSecurityConfig } from "../utils/security-headers"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/*",
      middlewares: [
        // Apply security headers to all routes
        securityHeaders(getSecurityConfig()),
      ],
    },
    {
      matcher: "/webhooks/stripe",
      middlewares: [
        cors({
          origin: (origin, callback) => {
            // Allow Stripe webhooks (no origin) and configured origins
            if (!origin || process.env.STRIPE_WEBHOOK_ORIGINS?.split(",").includes(origin)) {
              callback(null, true)
            } else {
              callback(null, false)
            }
          },
          credentials: true,
        }),
        // Raw body parsing for Stripe signature validation
        raw({
          type: "application/json",
          limit: "10mb",
        }),
      ],
    },
    {
      matcher: "/admin/*",
      middlewares: [
        cors({
          origin: (origin, callback) => {
            const adminOrigins = process.env.ADMIN_CORS?.split(",") || [
              "http://localhost:9000",
              "https://localhost:9000"
            ]
            // Allow same-origin requests (no origin header) and configured origins
            if (!origin || adminOrigins.includes(origin)) {
              callback(null, true)
            } else {
              console.warn(`Blocked admin CORS origin: ${origin}`)
              callback(null, false)
            }
          },
          credentials: true,
          maxAge: 86400, // Cache preflight for 24 hours
          optionsSuccessStatus: 200,
        }),
        json(),
        authenticate("user", ["bearer", "session"]),
      ],
    },
    {
      matcher: "/store/*",
      middlewares: [
        cors({
          origin: (origin, callback) => {
            const storeOrigins = process.env.STORE_CORS?.split(",") || [
              "http://localhost:3000",
              "https://localhost:3000",
              "http://localhost:3006", // fabric-store experience
              "https://localhost:3006"
            ]
            // Allow same-origin requests (no origin header) and configured origins
            if (!origin || storeOrigins.includes(origin)) {
              callback(null, true)
            } else {
              console.warn(`Blocked store CORS origin: ${origin}`)
              callback(null, false)
            }
          },
          credentials: true,
          maxAge: 86400, // Cache preflight for 24 hours
          optionsSuccessStatus: 200,
        }),
        json(),
        authenticate("customer", ["bearer"], {
          allowUnregistered: true,
        }),
      ],
    },
  ],
})