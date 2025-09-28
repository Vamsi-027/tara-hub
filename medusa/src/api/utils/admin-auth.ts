import { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { logAuthEvent } from "../utils/security-logger"

export type AdminIdentity = {
  actorId: string | null
  actorType: string | null
  email?: string | null
  sessionId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}


/**
 * Enhanced admin request assertion with security logging
 */
export function assertAdminRequest(req: MedusaRequest): AdminIdentity {
  const auth: any = (req as any).auth
  const user: any = (req as any).user
  const session: any = (req as any).session

  // Extract security context
  const ipAddress = getClientIpAddress(req)
  const userAgent = req.headers["user-agent"] || null
  const sessionId = session?.id || auth?.session_id || null

  const actorType = auth?.actor_type ?? user?.type ?? null
  const actorId = auth?.actor_id ?? user?.id ?? session?.user_id ?? null
  const email = user?.email ?? auth?.actor_email ?? session?.email ?? null

  // Enhanced admin validation
  const isAdmin = Boolean(
    (auth?.actor_type && ["admin", "user"].includes(auth.actor_type)) ||
      user?.type === "admin" ||
      user?.role === "admin" ||
      (session?.user_id && session?.scope === "admin")
  )

  // Additional security checks
  const hasValidSession = Boolean(
    sessionId && (
      session?.expires_at ? new Date(session.expires_at) > new Date() : true
    )
  )

  const hasValidAuth = Boolean(
    auth?.exp ? auth.exp * 1000 > Date.now() : true
  )

  if (!isAdmin || !actorId) {
    // Log failed authentication attempt
    logAuthEvent("admin_login_failure", {
      actorId,
      email,
      ipAddress,
      userAgent,
      sessionId,
      errorMessage: !isAdmin ? "insufficient_privileges" : "missing_actor_id"
    })

    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Admin authentication required"
    )
  }

  if (!hasValidSession && !hasValidAuth) {
    // Log expired session/token
    logAuthEvent("admin_session_expired", {
      actorId,
      email,
      ipAddress,
      userAgent,
      sessionId,
      errorMessage: "Session expired or invalid"
    })

    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Session expired or invalid"
    )
  }

  // Log successful authentication
  logAuthEvent("admin_login_success", {
    actorId,
    email,
    ipAddress,
    userAgent,
    sessionId
  })

  return {
    actorId,
    actorType,
    email,
    sessionId,
    ipAddress,
    userAgent,
  }
}

/**
 * Extract client IP address from request
 */
function getClientIpAddress(req: MedusaRequest): string | null {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.headers["x-real-ip"]?.toString() ||
    req.headers["x-client-ip"]?.toString() ||
    req.socket?.remoteAddress ||
    null
  )
}

