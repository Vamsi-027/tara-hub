/**
 * Security Headers Utility
 *
 * Provides Helmet-compatible security header middleware for Medusa v2.
 * Implements CSP, HSTS, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.
 */

import { NextFunction, Request, Response } from "express"

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives?: {
      defaultSrc?: string[]
      styleSrc?: string[]
      scriptSrc?: string[]
      imgSrc?: string[]
      connectSrc?: string[]
      fontSrc?: string[]
      frameSrc?: string[]
      objectSrc?: string[]
      mediaSrc?: string[]
      workerSrc?: string[]
    }
    reportOnly?: boolean
  }
  hsts?: {
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  frameguard?: {
    action?: "deny" | "sameorigin" | "allow-from"
    domain?: string
  }
  noSniff?: boolean
  referrerPolicy?: {
    policy?: string | string[]
  }
  crossOriginEmbedderPolicy?: boolean
  crossOriginOpenerPolicy?: boolean
  crossOriginResourcePolicy?: {
    policy?: "same-site" | "same-origin" | "cross-origin"
  }
}

const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'"]
    },
    reportOnly: false
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false
  },
  frameguard: {
    action: "deny"
  },
  noSniff: true,
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: {
    policy: "same-site"
  }
}

/**
 * Build CSP directive string from configuration
 */
function buildCSPDirective(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase()
      return `${kebabDirective} ${sources.join(' ')}`
    })
    .join('; ')
}

/**
 * Security headers middleware factory
 */
export function securityHeaders(config: SecurityHeadersConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return (req: Request, res: Response, next: NextFunction) => {
    // Content Security Policy
    if (finalConfig.contentSecurityPolicy?.directives) {
      const cspValue = buildCSPDirective(finalConfig.contentSecurityPolicy.directives)
      const headerName = finalConfig.contentSecurityPolicy.reportOnly
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy"
      res.setHeader(headerName, cspValue)
    }

    // HTTP Strict Transport Security
    if (finalConfig.hsts && req.secure) {
      let hstsValue = `max-age=${finalConfig.hsts.maxAge}`
      if (finalConfig.hsts.includeSubDomains) {
        hstsValue += "; includeSubDomains"
      }
      if (finalConfig.hsts.preload) {
        hstsValue += "; preload"
      }
      res.setHeader("Strict-Transport-Security", hstsValue)
    }

    // X-Frame-Options
    if (finalConfig.frameguard) {
      let frameValue: string
      switch (finalConfig.frameguard.action) {
        case "deny":
          frameValue = "DENY"
          break
        case "sameorigin":
          frameValue = "SAMEORIGIN"
          break
        case "allow-from":
          frameValue = `ALLOW-FROM ${finalConfig.frameguard.domain}`
          break
        default:
          frameValue = "DENY"
      }
      res.setHeader("X-Frame-Options", frameValue)
    }

    // X-Content-Type-Options
    if (finalConfig.noSniff) {
      res.setHeader("X-Content-Type-Options", "nosniff")
    }

    // Referrer-Policy
    if (finalConfig.referrerPolicy?.policy) {
      const policy = Array.isArray(finalConfig.referrerPolicy.policy)
        ? finalConfig.referrerPolicy.policy.join(", ")
        : finalConfig.referrerPolicy.policy
      res.setHeader("Referrer-Policy", policy)
    }

    // Cross-Origin-Embedder-Policy
    if (finalConfig.crossOriginEmbedderPolicy) {
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
    }

    // Cross-Origin-Opener-Policy
    if (finalConfig.crossOriginOpenerPolicy) {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
    }

    // Cross-Origin-Resource-Policy
    if (finalConfig.crossOriginResourcePolicy?.policy) {
      res.setHeader("Cross-Origin-Resource-Policy", finalConfig.crossOriginResourcePolicy.policy)
    }

    // Additional security headers
    res.setHeader("X-Powered-By", "Medusa") // Override Express default
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

    next()
  }
}

/**
 * Predefined security configurations for different environments
 */
export const securityConfigs: Record<string, SecurityHeadersConfig> = {
  development: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "localhost:*"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", "localhost:*"],
        imgSrc: ["'self'", "data:", "https:", "localhost:*"],
        connectSrc: ["'self'", "localhost:*", "ws:", "wss:"],
        fontSrc: ["'self'", "localhost:*"],
        frameSrc: ["'self'", "localhost:*"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "localhost:*"],
        workerSrc: ["'self'", "blob:", "localhost:*"]
      }
    },
    hsts: {
      maxAge: 0 // Disable HSTS in development
    }
  },

  production: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Required for some admin UI components
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        workerSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true
    },
    crossOriginEmbedderPolicy: true
  }
}

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): SecurityHeadersConfig {
  const env = process.env.NODE_ENV || "development"
  return env === "production" ? securityConfigs.production : securityConfigs.development
}