# Security Operations Runbook - Session 4A Implementation

**For On-Call Engineers and DevOps Teams**

## Overview

This runbook covers the operational aspects of the Session 4A Security & Legal Compliance implementation for Medusa.js v2. It provides troubleshooting guidance, monitoring procedures, and incident response for the security controls deployed.

## Security Architecture Summary

### Security Headers (All Routes: `/*`)
- **CSP**: Prevents XSS attacks
- **HSTS**: Forces HTTPS (production only)
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME confusion
- **Referrer-Policy**: Controls referrer leakage

### CORS Configuration
- **Admin Routes** (`/admin/*`): Controlled by `ADMIN_CORS` environment variable
- **Store Routes** (`/store/*`): Controlled by `STORE_CORS` environment variable
- **Webhook Routes** (`/webhooks/stripe`): Stripe-specific origin validation

### Authentication Hardening
- Enhanced session validation with expiration checks
- Failed login attempt tracking with IP correlation
- Real-time security event logging

### Security Logging
- Structured audit trails for all admin actions
- Authentication event monitoring
- Data access logging for compliance

## Environment Variables

### Required Configuration
```bash
# Production
ADMIN_CORS=https://admin.yourdomain.com
STORE_CORS=https://store.yourdomain.com,https://fabric-store.yourdomain.com
NODE_ENV=production
STRIPE_WEBHOOK_SECRET=whsec_...

# Staging
ADMIN_CORS=https://admin-staging.yourdomain.com,http://localhost:9000
STORE_CORS=https://store-staging.yourdomain.com,http://localhost:3000,http://localhost:3006
NODE_ENV=staging
```

### Optional Configuration
```bash
STRIPE_WEBHOOK_ORIGINS=https://stripe.com
LOG_LEVEL=info
```

## Quick Verification Commands

### Security Headers Check
```bash
# Production
curl -I https://api.yourdomain.com/admin/health

# Staging
curl -I https://api-staging.yourdomain.com/admin/health

# Local
curl -I http://localhost:9000/admin/health
```

**Expected Headers:**
- `Content-Security-Policy: default-src 'self'; ...`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains` (HTTPS only)

### CORS Verification
```bash
# Test allowed origin
curl -H "Origin: https://admin.yourdomain.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.yourdomain.com/admin/health

# Test disallowed origin (should fail)
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.yourdomain.com/admin/health
```

### Security Event Monitoring
```bash
# Real-time security events
docker logs -f medusa-backend | grep "🔒 SECURITY EVENT"

# Extract recent events
./deployment/scripts/extract-security-events.sh /var/log/medusa/app.log 1h

# Generate metrics summary
./deployment/scripts/security-metrics.sh /var/log/medusa/app.log 24h
```

## Troubleshooting Guide

### Security Headers Issues

#### Problem: Headers Missing
**Symptoms:** curl -I shows no security headers
**Diagnosis:**
1. Check if service restarted after config changes
2. Verify edge/proxy isn't stripping headers
3. Check middleware loading order

**Resolution:**
```bash
# Restart Medusa service
docker-compose restart medusa-backend
# OR
kubectl rollout restart deployment/medusa-backend

# Check middleware loading
docker logs medusa-backend | grep "middleware"
```

#### Problem: Duplicate Headers
**Symptoms:** Multiple instances of same header
**Root Cause:** Edge layer adding headers on top of app headers
**Resolution:**
- Configure edge to not add duplicate headers
- OR disable app-level headers and rely on edge

#### Problem: CSP Blocking Resources
**Symptoms:** Console errors about blocked resources
**Diagnosis:** Check browser console for CSP violations
**Resolution:**
```bash
# Update CSP directives in src/utils/security-headers.ts
# Common additions needed:
# - 'unsafe-inline' for styleSrc (admin UI)
# - Additional domains for connectSrc (APIs)
# - blob: for workerSrc (file uploads)
```

### CORS Issues

#### Problem: CORS Blocking Legitimate Requests
**Symptoms:** Browser CORS errors for admin/store access
**Diagnosis:**
1. Check origin in request vs ADMIN_CORS/STORE_CORS
2. Verify no trailing slashes in environment variables
3. Check subdomain/protocol mismatches

**Resolution:**
```bash
# Update environment variables (no trailing slashes)
export ADMIN_CORS="https://admin.yourdomain.com,https://admin-staging.yourdomain.com"

# Restart service
./deployment/scripts/deploy-security-config.sh production
```

#### Problem: Webhook CORS Failures
**Symptoms:** Stripe webhooks failing with CORS errors
**Root Cause:** Browser making preflight requests to webhook endpoint
**Resolution:**
- Webhooks don't need CORS (no origin header)
- Check if proxy is adding CORS restrictions
- Verify webhook URL is exact match

### Authentication Issues

#### Problem: Valid Sessions Being Rejected
**Symptoms:** Users getting logged out unexpectedly
**Diagnosis:**
1. Check session expiration logic
2. Verify JWT token validation
3. Review auth hardening logs

**Resolution:**
```bash
# Check auth events in logs
grep "admin_session_expired" /var/log/medusa/app.log

# Temporary workaround: disable strict session validation
# In src/api/utils/admin-auth.ts, comment out session expiration checks
```

#### Problem: High Failed Login Alerts
**Symptoms:** Alert spam for failed logins
**Diagnosis:**
1. Check if legitimate traffic (password resets, etc.)
2. Look for brute force patterns
3. Verify IP extraction working correctly

**Resolution:**
```bash
# Analyze failed login patterns
grep "admin_login_failure" /var/log/medusa/app.log | \
jq -r '.ipAddress' | sort | uniq -c | sort -nr

# Block suspicious IPs at firewall level if needed
# Adjust alert thresholds if legitimate traffic
```

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Failed Login Rate**
   - Threshold: >5 failures from same IP in 10 minutes
   - Action: Investigate IP, consider blocking

2. **Critical Security Events**
   - Threshold: Any event with severity="critical"
   - Action: Immediate investigation required

3. **Permission Denials**
   - Threshold: >10 denials from same user in 5 minutes
   - Action: Check for privilege escalation attempts

4. **Materials Sync Failures**
   - Threshold: Any sync operation failure
   - Action: Check sync service health, data integrity

### Log Patterns

Search patterns for your logging system:

```bash
# All security events
securityEvent:true

# Failed authentications
type:admin_login_failure

# High severity events
severity:high OR severity:critical

# Sync failures
category:sync AND success:false

# Specific user actions
actorId:"user_123" AND category:admin_action
```

### Alert Configuration Examples

#### Splunk
```sql
index=medusa securityEvent=true type=admin_login_failure
| bucket _time span=10m
| stats count by _time, ipAddress
| where count > 5
```

#### Elasticsearch/Kibana
```json
{
  "query": {
    "bool": {
      "must": [
        {"term": {"securityEvent": true}},
        {"term": {"type": "admin_login_failure"}},
        {"range": {"@timestamp": {"gte": "now-10m"}}}
      ]
    }
  },
  "aggs": {
    "by_ip": {
      "terms": {"field": "ipAddress"},
      "aggs": {"count": {"value_count": {"field": "type"}}}
    }
  }
}
```

## Incident Response

### Security Event Response Procedures

#### High Failed Login Rate
1. **Immediate Actions:**
   - Identify source IP addresses
   - Check for successful logins from same IPs
   - Verify admin accounts aren't compromised

2. **Investigation:**
   - Review admin user activity logs
   - Check for suspicious admin actions
   - Verify session tokens haven't been compromised

3. **Mitigation:**
   - Block malicious IPs at firewall
   - Force password resets for affected accounts
   - Invalidate active sessions if needed

#### Critical Security Event
1. **Immediate Actions:**
   - Page security team
   - Capture current system state
   - Begin timeline reconstruction

2. **Investigation:**
   - Review full event context
   - Check for lateral movement
   - Assess data access patterns

3. **Communication:**
   - Notify stakeholders
   - Document findings
   - Plan remediation

#### Webhook Security Compromise
1. **Immediate Actions:**
   - Rotate webhook secrets
   - Review payment processing integrity
   - Check for unauthorized transactions

2. **Investigation:**
   - Analyze webhook payload logs
   - Verify Stripe signature validation
   - Check for data tampering

## Deployment Procedures

### Pre-Deployment Checklist
- [ ] Environment variables configured
- [ ] Security headers tested
- [ ] CORS behavior verified
- [ ] Webhook validation working
- [ ] Monitoring alerts configured

### Deployment Steps
1. **Deploy configuration:**
   ```bash
   ./deployment/scripts/deploy-security-config.sh production
   ```

2. **Verify headers:**
   ```bash
   ./deployment/scripts/verify-security-headers.sh production
   ```

3. **Test webhooks:**
   ```bash
   ./deployment/scripts/validate-webhook-security.sh production
   ```

4. **Monitor logs:**
   ```bash
   ./deployment/scripts/security-metrics.sh /var/log/medusa/app.log 1h
   ```

### Rollback Procedures
If issues arise:

1. **Immediate rollback:**
   ```bash
   # Revert to previous environment configuration
   kubectl rollout undo deployment/medusa-backend
   ```

2. **Disable security features:**
   ```bash
   # Temporarily disable strict headers
   export NODE_ENV=development
   docker-compose restart medusa-backend
   ```

3. **Reset CORS to permissive:**
   ```bash
   # Emergency CORS reset (NOT for production)
   export ADMIN_CORS="*"
   export STORE_CORS="*"
   ```

## Performance Impact

### Expected Overhead
- **Security headers:** <1ms per request
- **CORS validation:** <1ms per preflight
- **Auth hardening:** 2-5ms per admin request
- **Security logging:** 1-3ms per event

### Performance Monitoring
Monitor these metrics for performance impact:
- Average response time increase
- Memory usage for logging buffers
- CPU usage for header processing

## Compliance Notes

### Audit Trail Requirements
The implementation provides audit trails for:
- **PCI DSS:** Payment processing security events
- **GDPR:** Data access logging (Phase 1 foundation)
- **SOC 2:** Administrative access controls

### Data Retention
Security logs contain:
- IP addresses (personal data under GDPR)
- User actions and access patterns
- Authentication events

**Retention Policy:** Follow your organization's data retention requirements

## Contact Information

### Escalation Contacts
- **Security Team:** security@yourdomain.com
- **DevOps On-Call:** +1-xxx-xxx-xxxx
- **Engineering Team:** eng@yourdomain.com

### External Resources
- **Stripe Support:** For webhook-related issues
- **CDN/Edge Provider:** For header conflicts

---

**Document Version:** 1.0
**Last Updated:** Session 4A Implementation
**Review Date:** Quarterly review recommended