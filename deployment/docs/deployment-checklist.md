# Security Deployment Checklist - Session 4A

**Complete this checklist before merging the security feature branch**

## Pre-Deployment Verification

### Environment Configuration
- [ ] **CORS Variables Set**
  ```bash
  # Production
  ADMIN_CORS=https://admin.yourdomain.com
  STORE_CORS=https://store.yourdomain.com

  # Staging
  ADMIN_CORS=https://admin-staging.yourdomain.com,http://localhost:9000
  STORE_CORS=https://store-staging.yourdomain.com,http://localhost:3000
  ```

- [ ] **Environment Type Configured**
  ```bash
  NODE_ENV=production  # or staging
  ```

- [ ] **Webhook Secrets Set**
  ```bash
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

- [ ] **Service Restarted** after environment variable changes

## Security Headers Testing

Run verification script:
```bash
./deployment/scripts/verify-security-headers.sh <environment>
```

### Required Headers Present
- [ ] **Content-Security-Policy** - XSS protection
- [ ] **X-Frame-Options: DENY** - Clickjacking protection
- [ ] **X-Content-Type-Options: nosniff** - MIME confusion protection
- [ ] **Referrer-Policy: strict-origin-when-cross-origin** - Referrer leakage protection
- [ ] **Strict-Transport-Security** (HTTPS only) - Force secure connections

### Header Validation
- [ ] **No Duplicate Headers** - Edge not conflicting with app headers
- [ ] **CSP Not Blocking Resources** - Admin UI loads correctly
- [ ] **HSTS Only on HTTPS** - Not present for localhost/HTTP

## CORS Behavior Testing

### Admin Endpoints (`/admin/*`)
- [ ] **Allowed Origins Work**
  ```bash
  curl -H "Origin: https://admin.yourdomain.com" \
       -X OPTIONS https://api.yourdomain.com/admin/health
  # Should return 200/204
  ```

- [ ] **Disallowed Origins Blocked**
  ```bash
  curl -H "Origin: https://evil.com" \
       -X OPTIONS https://api.yourdomain.com/admin/health
  # Should be blocked or return error
  ```

- [ ] **No Trailing Slashes** in CORS environment variables

### Store Endpoints (`/store/*`)
- [ ] **Frontend Origins Allowed** - All legitimate frontends work
- [ ] **Development Origins** (staging only) - localhost ports included
- [ ] **Cross-Origin Requests** work from all configured origins

## Webhook Security Validation

Run webhook validation:
```bash
./deployment/scripts/validate-webhook-security.sh <environment>
```

### Webhook Endpoint Security
- [ ] **Unsigned Requests Rejected** - Returns 401 for missing signature
- [ ] **Invalid Signatures Rejected** - Returns 400 for bad signature
- [ ] **Content-Type Handled** - Accepts application/json
- [ ] **Raw Body Preserved** - Proxy doesn't modify JSON payload

### Stripe Configuration
- [ ] **Webhook URL Configured** in Stripe Dashboard
  ```
  Production: https://api.yourdomain.com/webhooks/stripe
  Staging: https://api-staging.yourdomain.com/webhooks/stripe
  ```

- [ ] **Events Configured** in Stripe:
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - payment_intent.canceled
  - charge.refunded
  - charge.dispute.created

- [ ] **Webhook Secret** environment variable set

## Authentication & Security Logging

### Authentication Hardening
- [ ] **Admin Login Success** logged correctly
- [ ] **Failed Login Attempts** tracked with IP addresses
- [ ] **Session Expiration** validated and logged
- [ ] **IP Address Extraction** working (check X-Forwarded-For)

### Security Event Logging
- [ ] **Console Output** shows security events with 🔒 emoji
- [ ] **Structured Format** - JSON format with required fields
- [ ] **Event Categories** working:
  - Authentication events
  - Admin actions
  - Data access operations
  - Sync operations

### Log Verification
```bash
# Check for security events in logs
docker logs medusa-backend | grep "🔒 SECURITY EVENT"

# OR for file-based logs
grep "securityEvent.*true" /var/log/medusa/app.log
```

## Monitoring & Alerting Setup

### Log Aggregation
- [ ] **Central Logging** configured for your platform
- [ ] **Security Events** being indexed/searchable
- [ ] **Log Retention** policy configured

### Alert Configuration
- [ ] **Failed Login Threshold** - Alert on >5 failures/10min from same IP
- [ ] **Critical Events** - Alert on any severity="critical"
- [ ] **Permission Denials** - Alert on >10 denials/5min from same user
- [ ] **Sync Failures** - Alert on any materials sync failure

### Monitoring Tools Setup
```bash
# Create monitoring utilities
./deployment/scripts/setup-security-monitoring.sh <environment>
```

## Edge/Proxy Configuration

### Load Balancer/CDN Settings
- [ ] **Headers Not Stripped** - App headers reach client
- [ ] **No Header Conflicts** - Edge not adding duplicate headers
- [ ] **Raw Body Forwarding** - Webhooks receive unmodified JSON
- [ ] **IP Forwarding** - X-Forwarded-For header present

### SSL/TLS Configuration
- [ ] **HTTPS Enforced** in production
- [ ] **Certificate Valid** and not expiring soon
- [ ] **HSTS Supported** - Headers work with TLS termination

## Application Testing

### Admin Interface
- [ ] **Admin Login Works** from allowed origins
- [ ] **Admin Functions** work normally (no CSP blocking)
- [ ] **Security Events Generated** for admin actions

### Store Interface
- [ ] **Store Access** works from configured origins
- [ ] **API Calls** succeed from frontend applications
- [ ] **Payment Flow** completes successfully

### Webhook Processing
- [ ] **Test Webhook** processes successfully
  ```bash
  # If using Stripe CLI
  stripe webhooks trigger payment_intent.succeeded
  ```
- [ ] **Webhook Events** logged correctly
- [ ] **Payment Processing** updates orders properly

## Performance Validation

### Response Time Impact
- [ ] **Headers Overhead** - <1ms additional latency
- [ ] **CORS Processing** - No significant delay on preflight
- [ ] **Logging Overhead** - <5ms for security events

### Resource Usage
- [ ] **Memory Usage** stable (logging buffer not growing)
- [ ] **CPU Usage** minimal increase
- [ ] **Log Volume** manageable

## Documentation & Runbooks

### Documentation Updates
- [ ] **Security Configuration Guide** available at `docs/security-configuration.md`
- [ ] **Operations Runbook** available at `deployment/docs/security-operations-runbook.md`
- [ ] **Environment Variables** documented
- [ ] **Verification Commands** provided

### Team Communication
- [ ] **On-Call Team** briefed on new security features
- [ ] **Monitoring Procedures** documented and shared
- [ ] **Escalation Contacts** updated

## Final Validation

### End-to-End Testing
- [ ] **Complete User Flow** - Login → Admin Actions → Logout
- [ ] **Cross-Origin Requests** from all legitimate frontends
- [ ] **Webhook End-to-End** - Stripe → Webhook → Order Processing
- [ ] **Security Event Chain** - Action → Log → Alert (if applicable)

### Security Review
- [ ] **No Security Bypasses** - All controls working as designed
- [ ] **Minimal Attack Surface** - Only necessary origins allowed
- [ ] **Audit Trail Complete** - All admin actions logged
- [ ] **Compliance Ready** - Logs suitable for audit requirements

## Post-Deployment Monitoring

### First 24 Hours
- [ ] **Monitor Error Rates** - No increase in 4xx/5xx errors
- [ ] **Check Security Logs** - Events being generated correctly
- [ ] **Verify Alerts** - Monitoring system receiving events
- [ ] **User Feedback** - No reports of access issues

### First Week
- [ ] **Review Security Metrics** - Baseline normal behavior
- [ ] **Performance Impact** - Confirm minimal overhead
- [ ] **Log Volume Analysis** - Ensure sustainable log generation
- [ ] **Alert Tuning** - Adjust thresholds if needed

## Sign-Off

### Technical Verification
- [ ] **DevOps Engineer:** _________________________________ Date: _______
- [ ] **Security Engineer:** ______________________________ Date: _______
- [ ] **Engineering Lead:** _______________________________ Date: _______

### Go-Live Approval
- [ ] **All checklist items completed**
- [ ] **No blocking issues identified**
- [ ] **Monitoring confirmed operational**
- [ ] **Team ready for production deployment**

**Deployment Approved By:** _________________________________ Date: _______

---

## Emergency Rollback Plan

If critical issues arise post-deployment:

1. **Immediate Actions:**
   ```bash
   # Revert security headers (emergency only)
   export NODE_ENV=development
   docker-compose restart medusa-backend
   ```

2. **CORS Emergency Reset:**
   ```bash
   # Temporarily allow all origins (NOT for production)
   export ADMIN_CORS="*"
   export STORE_CORS="*"
   ```

3. **Full Rollback:**
   ```bash
   git revert <security-feature-commit>
   ./deployment/scripts/deploy-security-config.sh production
   ```

**Rollback Authority:** DevOps On-Call Engineer + Engineering Lead approval required