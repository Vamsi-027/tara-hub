/**
 * Security Logger Utility
 *
 * Provides structured security event logging for audit trails,
 * incident investigation, and compliance monitoring.
 */

export interface SecurityEvent {
  type: SecurityEventType
  severity: "low" | "medium" | "high" | "critical"
  category: "authentication" | "authorization" | "admin_action" | "sync" | "payment" | "data_access"
  actorId?: string | null
  actorType?: string | null
  email?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  sessionId?: string | null
  resource?: string
  action?: string
  metadata?: Record<string, any>
  timestamp: Date
  success: boolean
  errorMessage?: string
  requestId?: string
}

export type SecurityEventType =
  | "admin_login_success"
  | "admin_login_failure"
  | "admin_logout"
  | "admin_session_expired"
  | "admin_action_performed"
  | "permission_denied"
  | "resource_access"
  | "data_export"
  | "data_modification"
  | "sync_operation"
  | "payment_processed"
  | "webhook_received"
  | "rate_limit_exceeded"
  | "suspicious_activity"

/**
 * Main security logger class
 */
class SecurityLogger {
  private static instance: SecurityLogger
  private logBuffer: SecurityEvent[] = []
  private readonly MAX_BUFFER_SIZE = 100

  private constructor() {}

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger()
    }
    return SecurityLogger.instance
  }

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, "timestamp">): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
      requestId: this.generateRequestId()
    }

    // Add to buffer for batch processing
    this.logBuffer.push(fullEvent)

    // Immediate console output for development
    this.outputToConsole(fullEvent)

    // Flush buffer if needed
    if (this.logBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flush()
    }

    // For critical events, also emit alerts
    if (fullEvent.severity === "critical") {
      this.emitAlert(fullEvent)
    }
  }

  /**
   * Log authentication events
   */
  logAuth(
    type: "admin_login_success" | "admin_login_failure" | "admin_logout" | "admin_session_expired",
    context: {
      actorId?: string | null
      email?: string | null
      ipAddress?: string | null
      userAgent?: string | null
      sessionId?: string | null
      errorMessage?: string
    }
  ): void {
    this.log({
      type,
      severity: type.includes("failure") ? "medium" : "low",
      category: "authentication",
      success: !type.includes("failure"),
      ...context
    })
  }

  /**
   * Log admin actions
   */
  logAdminAction(
    action: string,
    resource: string,
    context: {
      actorId: string
      email?: string | null
      ipAddress?: string | null
      userAgent?: string | null
      sessionId?: string | null
      metadata?: Record<string, any>
      success?: boolean
      errorMessage?: string
    }
  ): void {
    this.log({
      type: "admin_action_performed",
      severity: "low",
      category: "admin_action",
      action,
      resource,
      success: context.success ?? true,
      ...context
    })
  }

  /**
   * Log data access events
   */
  logDataAccess(
    resource: string,
    action: "read" | "write" | "delete" | "export",
    context: {
      actorId?: string | null
      email?: string | null
      ipAddress?: string | null
      sessionId?: string | null
      metadata?: Record<string, any>
      success?: boolean
      errorMessage?: string
    }
  ): void {
    const severity = action === "delete" ? "medium" : action === "export" ? "medium" : "low"

    this.log({
      type: action === "export" ? "data_export" : "resource_access",
      severity,
      category: "data_access",
      action,
      resource,
      success: context.success ?? true,
      ...context
    })
  }

  /**
   * Log sync operations
   */
  logSyncOperation(
    operation: string,
    context: {
      actorId?: string | null
      email?: string | null
      metadata?: Record<string, any>
      success?: boolean
      errorMessage?: string
    }
  ): void {
    this.log({
      type: "sync_operation",
      severity: context.success === false ? "medium" : "low",
      category: "sync",
      action: operation,
      resource: "materials_sync",
      success: context.success ?? true,
      ...context
    })
  }

  /**
   * Log permission denials
   */
  logPermissionDenied(
    resource: string,
    action: string,
    context: {
      actorId?: string | null
      email?: string | null
      ipAddress?: string | null
      userAgent?: string | null
      sessionId?: string | null
      reason?: string
    }
  ): void {
    this.log({
      type: "permission_denied",
      severity: "medium",
      category: "authorization",
      action,
      resource,
      success: false,
      errorMessage: context.reason || "Access denied",
      ...context
    })
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(
    description: string,
    context: {
      actorId?: string | null
      email?: string | null
      ipAddress?: string | null
      userAgent?: string | null
      sessionId?: string | null
      metadata?: Record<string, any>
    }
  ): void {
    this.log({
      type: "suspicious_activity",
      severity: "high",
      category: "authentication",
      action: "suspicious_behavior",
      resource: "system",
      success: false,
      errorMessage: description,
      ...context
    })
  }

  /**
   * Output to console for development
   */
  private outputToConsole(event: SecurityEvent): void {
    const logLevel = event.severity === "critical" ? "error" :
                    event.severity === "high" ? "warn" :
                    event.success ? "info" : "warn"

    const logData = {
      securityEvent: true,
      ...event,
      timestamp: event.timestamp.toISOString()
    }

    switch (logLevel) {
      case "error":
        console.error("🚨 SECURITY CRITICAL:", logData)
        break
      case "warn":
        console.warn("⚠️  SECURITY WARNING:", logData)
        break
      default:
        console.log("🔒 SECURITY EVENT:", logData)
    }
  }

  /**
   * Emit alerts for critical events
   */
  private emitAlert(event: SecurityEvent): void {
    // In production, this would integrate with alerting systems
    console.error("🚨 CRITICAL SECURITY ALERT:", {
      type: event.type,
      actorId: event.actorId,
      ipAddress: event.ipAddress,
      timestamp: event.timestamp.toISOString(),
      message: event.errorMessage
    })
  }

  /**
   * Flush buffered events
   */
  private flush(): void {
    if (this.logBuffer.length === 0) return

    // In production, this would send to logging service
    console.log(`📤 Flushing ${this.logBuffer.length} security events to persistent storage`)

    this.logBuffer = []
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get security metrics summary
   */
  getMetrics(timeWindow: number = 3600000): SecurityMetrics {
    // This would query persistent storage in production
    const now = new Date()
    const windowStart = new Date(now.getTime() - timeWindow)

    const recentEvents = this.logBuffer.filter(
      event => event.timestamp >= windowStart
    )

    return {
      timeWindow: timeWindow,
      totalEvents: recentEvents.length,
      failedLogins: recentEvents.filter(e => e.type === "admin_login_failure").length,
      successfulLogins: recentEvents.filter(e => e.type === "admin_login_success").length,
      permissionDenials: recentEvents.filter(e => e.type === "permission_denied").length,
      criticalEvents: recentEvents.filter(e => e.severity === "critical").length,
      suspiciousActivity: recentEvents.filter(e => e.type === "suspicious_activity").length,
      adminActions: recentEvents.filter(e => e.type === "admin_action_performed").length,
    }
  }
}

export interface SecurityMetrics {
  timeWindow: number
  totalEvents: number
  failedLogins: number
  successfulLogins: number
  permissionDenials: number
  criticalEvents: number
  suspiciousActivity: number
  adminActions: number
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance()

// Convenience functions
export const logAuthEvent = securityLogger.logAuth.bind(securityLogger)
export const logAdminAction = securityLogger.logAdminAction.bind(securityLogger)
export const logDataAccess = securityLogger.logDataAccess.bind(securityLogger)
export const logSyncOperation = securityLogger.logSyncOperation.bind(securityLogger)
export const logPermissionDenied = securityLogger.logPermissionDenied.bind(securityLogger)
export const logSuspiciousActivity = securityLogger.logSuspiciousActivity.bind(securityLogger)