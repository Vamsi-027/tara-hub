---
description: Pre-deployment checklist and environment validation
argument-hint: [environment]
allowed-tools: Bash, Read, Grep
---

# Deployment Readiness Check

Validate deployment readiness for environment: ${1:-production}

## Pre-Deployment Checklist:

### 1. Code Quality
!`git status`
!`git diff --stat main`

- [ ] All tests passing: `npm run test`
- [ ] Type checking clean: `npm run type-check`
- [ ] Linting passed: `npm run lint`
- [ ] Build successful: `npm run build`

### 2. Environment Configuration
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] API keys and secrets validated
- [ ] Feature flags reviewed

### 3. Database
- [ ] Migrations tested on staging
- [ ] Backup created before migration
- [ ] Rollback procedure documented
- [ ] No breaking schema changes

### 4. Security
- [ ] Security scan passed
- [ ] Dependencies updated
- [ ] No exposed secrets
- [ ] SSL certificates valid

### 5. Monitoring
- [ ] Health check endpoints working
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Alerting rules configured

## Deployment Commands:

**Staging**:
```bash
npm run deploy:staging
```

**Production**:
```bash
npm run deploy:prod
```

## Post-Deployment:
1. Verify health checks: `curl https://[domain]/health`
2. Monitor error rates for 30 minutes
3. Check performance metrics
4. Validate critical user flows

Use deployment-specialist agent for deployment issues.