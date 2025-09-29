---
description: Comprehensive security review of code changes with focus on API, auth, and compliance
argument-hint: [file-or-directory]
allowed-tools: Read, Grep, Glob, Bash
---

# Security Review

Perform comprehensive security analysis on: ${1:-.}

## Security Checklist:

### 1. Authentication & Authorization
- [ ] JWT token validation and expiration
- [ ] Admin authentication using `assertAdminRequest`
- [ ] Permission checks before sensitive operations
- [ ] Session management and token rotation

### 2. Input Validation
- [ ] Zod schema validation for all inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] File upload restrictions and validation

### 3. API Security
- [ ] Rate limiting on public endpoints
- [ ] CORS configuration review
- [ ] API authentication requirements
- [ ] Sensitive data in responses (no PII exposure)

### 4. Data Protection
- [ ] Encryption for sensitive data at rest
- [ ] HTTPS enforcement (TLS 1.3+)
- [ ] Secrets not hardcoded (environment variables)
- [ ] Proper error messages (no info leakage)

### 5. Compliance
- [ ] PCI DSS for payment handling
- [ ] GDPR compliance for EU customers
- [ ] Audit logging for sensitive operations
- [ ] Data retention policies

## Analysis Process:
1. Scan for security anti-patterns
2. Review authentication/authorization logic
3. Check for common vulnerabilities (OWASP Top 10)
4. Validate compliance requirements
5. Generate security findings report

Use api-security-specialist agent for deep security expertise.