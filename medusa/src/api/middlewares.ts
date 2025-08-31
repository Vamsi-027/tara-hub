import { defineMiddlewares } from "@medusajs/framework/http"
import cors from "cors"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/uploads*",
      middlewares: [
        cors({
          origin: ["http://localhost:9000", "http://localhost:3000", "http://localhost:7001"],
          credentials: true,
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization", "x-medusa-access-token"],
        })
      ]
    }
  ]
})