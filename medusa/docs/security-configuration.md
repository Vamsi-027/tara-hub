# Security Configuration

Framework-native security controls for Medusa v2 fabric store implementation.

## Security Headers

**Implementation**: `src/utils/security-headers.ts` + `src/api/middlewares.ts`

Comprehensive security headers applied to all routes:

- **CSP**: Prevents XSS attacks with strict content policy
- **HSTS**: Forces HTTPS connections (production only)
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type confusion
- **Referrer-Policy**: Controls referrer information leakage

**Environment Configuration**:
```bash
NODE_ENV=production  # Enables stricter CSP and HSTS
```

## CORS Configuration

**Implementation**: `src/api/middlewares.ts`

Explicit origin allowlists replace permissive `origin: true`:

- **Admin endpoints**: `/admin/*` - Controlled via `ADMIN_CORS`
- **Store endpoints**: `/store/*` - Controlled via `STORE_CORS`
- **Webhook endpoints**: `/webhooks/stripe` - Stripe-specific origins

**Environment Variables**:
```bash
ADMIN_CORS=http://localhost:9000,https://admin.yourdomain.com
STORE_CORS=http://localhost:3000,http://localhost:3006,https://store.yourdomain.com
STRIPE_WEBHOOK_ORIGINS=https://stripe.com
```

## Authentication Hardening

**Implementation**: `src/api/utils/admin-auth.ts`

Enhanced admin authentication with security logging:

- **Session validation**: Checks session expiration
- **Token validation**: Verifies JWT token expiry
- **IP tracking**: Logs client IP addresses
- **Failed attempt logging**: Tracks authentication failures

**Security Context**:
- Extracts IP from `X-Forwarded-For`, `X-Real-IP`, or socket
- Logs user agent strings for analysis
- Tracks session IDs for correlation

## Security Logging

**Implementation**: `src/utils/security-logger.ts` + `src/middleware/audit-logger.ts`

Structured security event logging for compliance:

**Event Categories**:
- Authentication (login/logout/failures)
- Authorization (permission denials)
- Admin actions (all admin API calls)
- Data access (CRUD operations)
- Sync operations (materials sync)

**Event Storage**:
- Development: Console output with structured format
- Production: Ready for integration with logging service

**Audit Trail Fields**:
- Actor ID, email, IP address, user agent
- Session ID for correlation
- Action, resource, success/failure
- Metadata (request details, timing)
- Request ID for tracking

## Monitoring & Alerting

**Security Metrics** (via `securityLogger.getMetrics()`):
- Failed login attempts
- Permission denials
- Critical security events
- Admin action volume
- Suspicious activity

**Alert Triggers**:
- Critical severity events (immediate console alert)
- Multiple failed logins from same IP
- Permission denials above threshold

## Integration Points

### Existing Systems
- **RBAC**: Extends `src/utils/rbac.ts` functionality
- **Admin Auth**: Enhances existing admin identity assertion
- **Middleware Chain**: Integrates with Medusa v2 middleware system

### Framework Compliance
- Uses Medusa v2 native error handling (`MedusaError`)
- Follows framework middleware patterns
- Compatible with container resolution system

## Development vs Production

**Development**:
- Relaxed CSP for local development
- HSTS disabled for localhost
- Detailed console logging
- localhost origins allowed

**Production**:
- Strict CSP with minimal allowed sources
- HSTS enabled with 2-year max-age
- Structured logging for analysis
- Explicit origin allowlists only

## Quick Verification

Check security headers are active:
```bash
curl -I http://localhost:9000/admin/auth
# Should include: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
```

Monitor security events:
```bash
# Check console for security event logs
# Look for: 🔒 SECURITY EVENT, ⚠️ SECURITY WARNING, 🚨 SECURITY CRITICAL
```

## Environment Setup

Required for production:
```bash
NODE_ENV=production
ADMIN_CORS=https://your-admin-domain.com
STORE_CORS=https://your-store-domain.com
STRIPE_WEBHOOK_ORIGINS=https://stripe.com
```

## Compliance Ready

This implementation provides audit trails and security controls suitable for:
- **PCI DSS**: Payment processing security
- **GDPR**: Data access logging (Phase 1)
- **SOC 2**: Security monitoring and access controls

**Next Steps**: Rate limiting, GDPR workflows, advanced threat protection (future sessions)