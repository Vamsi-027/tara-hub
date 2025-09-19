import { defineMiddlewares } from "@medusajs/medusa"
import { regionDataFix } from "./region-fix"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/regions*",
      method: ["GET"],
      middlewares: [regionDataFix],
    },
  ],
})