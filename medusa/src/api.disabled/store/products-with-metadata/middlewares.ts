import { defineMiddlewares } from "@medusajs/medusa"
import { validateAndTransformQuery } from "@medusajs/framework/api"
import { StoreGetProductsParams } from "@medusajs/framework/types"

/**
 * Middleware configuration for the products-with-metadata route
 * This ensures proper authentication and query validation
 */

export default defineMiddlewares((routeConfig) => {
  return [
    {
      routes: [
        {
          matcher: "/store/products-with-metadata",
          method: ["GET"],
        },
      ],
      middlewares: [
        // Standard store authentication - allows publishable key access
        validateAndTransformQuery(
          StoreGetProductsParams,
          {
            defaults: {
              fields: "+metadata",
              limit: 100,
              offset: 0,
            },
          }
        ),
      ],
    },
  ]
})