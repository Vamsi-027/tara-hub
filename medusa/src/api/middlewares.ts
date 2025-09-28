/**
 * API Middlewares
 *
 * Custom middleware configuration for API routes.
 * Includes raw body parsing for webhook signature validation.
 */

import {
  defineMiddlewares,
  raw,
  json,
  cors,
  authenticate
} from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/webhooks/stripe",
      middlewares: [
        cors({
          origin: true,
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
          origin: process.env.ADMIN_CORS?.split(",") || ["http://localhost:9000"],
          credentials: true,
        }),
        json(),
        authenticate("user", ["bearer", "session"]),
      ],
    },
    {
      matcher: "/store/*",
      middlewares: [
        cors({
          origin: process.env.STORE_CORS?.split(",") || ["http://localhost:3000"],
          credentials: true,
        }),
        json(),
        authenticate("customer", ["bearer"], {
          allowUnregistered: true,
        }),
      ],
    },
  ],
})