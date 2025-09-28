/**
 * Audit Logger Middleware
 *
 * Tracks admin actions for compliance and security monitoring.
 * Logs all admin API requests with context and results.
 */

import { NextFunction, Request, Response } from "express"
import { MedusaRequest } from "@medusajs/framework/http"
import { logAdminAction, logDataAccess } from "../utils/security-logger"
import { assertAdminRequest } from "../api/utils/admin-auth"

/**
 * Audit logging middleware for admin actions
 */
export function auditLogger() {
  return async (req: MedusaRequest, res: Response, next: NextFunction) => {
    // Only audit admin routes
    if (!req.url?.startsWith("/admin/")) {
      return next()
    }

    // Skip health checks and static assets
    if (req.url.includes("/health") || req.url.includes("/static/")) {
      return next()
    }

    let adminIdentity: any = null

    try {
      // Try to get admin identity if authenticated
      if (req.auth || req.user || req.session) {
        adminIdentity = assertAdminRequest(req)
      }
    } catch (error) {
      // Authentication will be handled by auth middleware
    }

    const startTime = Date.now()
    const originalJson = res.json
    let responseBody: any = null
    let statusCode: number = 200

    // Capture response data
    res.json = function(data: any) {
      responseBody = data
      statusCode = res.statusCode
      return originalJson.call(this, data)
    }

    // Continue with request processing
    res.on("finish", () => {
      const duration = Date.now() - startTime
      const success = statusCode >= 200 && statusCode < 400

      // Extract action and resource from URL and method
      const { action, resource } = parseRequestContext(req)

      // Determine if this is a data access operation
      const isDataOperation = isDataAccessOperation(req.method, req.url)

      if (adminIdentity) {
        if (isDataOperation) {
          // Log as data access
          logDataAccess(resource, getDataAction(req.method), {
            actorId: adminIdentity.actorId,
            email: adminIdentity.email,
            ipAddress: adminIdentity.ipAddress,
            sessionId: adminIdentity.sessionId,
            metadata: {
              url: req.url,
              method: req.method,
              duration,
              statusCode,
              userAgent: adminIdentity.userAgent,
              requestSize: req.headers["content-length"],
              query: req.query,
            },
            success,
            errorMessage: success ? undefined : getErrorMessage(responseBody)
          })
        } else {
          // Log as admin action
          logAdminAction(action, resource, {
            actorId: adminIdentity.actorId,
            email: adminIdentity.email,
            ipAddress: adminIdentity.ipAddress,
            userAgent: adminIdentity.userAgent,
            sessionId: adminIdentity.sessionId,
            metadata: {
              url: req.url,
              method: req.method,
              duration,
              statusCode,
              requestSize: req.headers["content-length"],
              query: req.query,
            },
            success,
            errorMessage: success ? undefined : getErrorMessage(responseBody)
          })
        }
      }
    })

    next()
  }
}

/**
 * Parse request context to extract action and resource
 */
function parseRequestContext(req: MedusaRequest): { action: string; resource: string } {
  const method = req.method?.toLowerCase() || "unknown"
  const url = req.url || ""

  // Extract resource from URL path
  const pathParts = url.split("/").filter(Boolean)
  const resource = pathParts.slice(1).join("/") || "unknown" // Skip 'admin' part

  // Map HTTP methods to actions
  const actionMap: Record<string, string> = {
    get: "read",
    post: "create",
    put: "update",
    patch: "update",
    delete: "delete",
    options: "options"
  }

  const action = actionMap[method] || method

  return {
    action: `${action}_${resource}`.replace(/\/+/g, "_").replace(/_+/g, "_"),
    resource: resource.split("?")[0] // Remove query params
  }
}

/**
 * Determine if this is a data access operation
 */
function isDataAccessOperation(method: string, url: string): boolean {
  const dataEndpoints = [
    "/admin/products",
    "/admin/orders",
    "/admin/customers",
    "/admin/users",
    "/admin/materials",
    "/admin/inventory",
    "/admin/analytics",
    "/admin/reports"
  ]

  return dataEndpoints.some(endpoint => url.startsWith(endpoint))
}

/**
 * Map HTTP method to data action
 */
function getDataAction(method: string): "read" | "write" | "delete" | "export" {
  switch (method.toLowerCase()) {
    case "get":
      return "read"
    case "post":
    case "put":
    case "patch":
      return "write"
    case "delete":
      return "delete"
    default:
      return "read"
  }
}

/**
 * Extract error message from response body
 */
function getErrorMessage(responseBody: any): string | undefined {
  if (!responseBody) return undefined

  if (typeof responseBody === "string") return responseBody

  if (responseBody.error) {
    return typeof responseBody.error === "string"
      ? responseBody.error
      : responseBody.error.message || "Unknown error"
  }

  if (responseBody.message) {
    return responseBody.message
  }

  return undefined
}