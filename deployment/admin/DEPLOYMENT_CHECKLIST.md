# 🚀 Tara Hub Admin - Production Deployment Checklist

## Pre-Deployment Requirements

### 1. Environment Setup ✅
- [ ] `.env.local` file created with all required variables
- [ ] Run environment validation: `node deployment/admin/env-validator.js --production`
- [ ] Verify all required environment variables are set:
  - [ ] `DATABASE_URL` - PostgreSQL connection (Neon)
  - [ ] `NEXTAUTH_URL` - Production URL (not localhost)
  - [ ] `NEXTAUTH_SECRET` - Strong secret (32+ characters)
  - [ ] `RESEND_API_KEY` - Valid Resend API key
  - [ ] `RESEND_FROM_EMAIL` - Verified sender email
  - [ ] `R2_ACCOUNT_ID` - Cloudflare account ID
  - [ ] `R2_ACCESS_KEY_ID` - R2 access key
  - [ ] `R2_SECRET_ACCESS_KEY` - R2 secret key
  - [ ] `R2_BUCKET_NAME` - R2 bucket name

### 2. Code Quality ✅
- [ ] All code committed to Git
- [ ] On `main` branch (or approved release branch)
- [ ] Run linting: `npm run lint`
- [ ] Run type checking: `npx tsc --noEmit`
- [ ] Run tests (if available): `npm run test`

### 3. Database Setup 🗄️
- [ ] Database migrations generated: `npm run db:generate`
- [ ] Migrations reviewed for breaking changes
- [ ] Database backup created (if updating existing)
- [ ] Migrations applied: `npm run db:push`
- [ ] Initial data seeded (if needed): `node scripts/seed-data.js`

### 4. Security Audit 🔒
- [ ] No exposed secrets in code
- [ ] Admin emails configured in `lib/auth.ts`
- [ ] Authentication flow tested
- [ ] CORS properly configured
- [ ] Rate limiting implemented (if applicable)
- [ ] No high/critical npm vulnerabilities: `npm audit`

## Deployment Process

### 5. Pre-Deployment Testing 🧪
```bash
# Run comprehensive pre-deployment tests
node deployment/admin/pre-deploy-test.js

# All tests should pass before proceeding
```

### 6. Build Verification 🏗️
```bash
# Build the application locally
npm run build:admin

# Verify build completes without errors
# Check build size is reasonable (< 5MB)
```

### 7. Vercel Deployment 🚀

#### First-Time Setup:
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

#### Deploy to Preview:
```bash
# Deploy to preview environment first
vercel

# Test the preview URL thoroughly
```

#### Deploy to Production:
```bash
# After preview testing, deploy to production
vercel --prod
```

### 8. Environment Variables in Vercel 🔐
- [ ] Go to Vercel Dashboard → Project Settings → Environment Variables
- [ ] Add all production environment variables
- [ ] Set proper scopes (Production, Preview, Development)
- [ ] Ensure NEXTAUTH_URL matches production domain

## Post-Deployment Verification

### 9. Production Testing ✔️
- [ ] Visit production URL: https://tara-hub.vercel.app
- [ ] Test authentication flow:
  - [ ] Sign in with admin email
  - [ ] Receive magic link email
  - [ ] Successfully authenticate
  - [ ] Access admin dashboard
- [ ] Test critical features:
  - [ ] View fabric catalog
  - [ ] Add/edit fabrics (admin only)
  - [ ] Upload images to R2
  - [ ] Team management
  - [ ] Blog functionality

### 10. Monitoring Setup 📊
- [ ] Check Vercel Analytics dashboard
- [ ] Set up error monitoring (Sentry/LogRocket if configured)
- [ ] Configure uptime monitoring
- [ ] Set up alerts for critical errors

### 11. Performance Validation 🏃
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals in Vercel Analytics
- [ ] Verify caching is working (KV/Redis)
- [ ] Test page load times

## Rollback Plan

### If Issues Occur:
1. **Immediate Rollback:**
   ```bash
   # List recent deployments
   vercel ls
   
   # Rollback to previous deployment
   vercel rollback [deployment-url]
   ```

2. **Database Rollback:**
   - Restore from backup if migrations caused issues
   - Use previous schema version

3. **Environment Variables:**
   - Revert any changed environment variables in Vercel dashboard

## Automated Deployment Script

### One-Command Deployment:
```bash
# Run the automated deployment script
node deployment/admin/deploy.js

# This script will:
# 1. Validate environment
# 2. Run tests
# 3. Build application
# 4. Deploy to Vercel
# 5. Run post-deployment checks
```

## Important URLs

- **Production:** https://tara-hub.vercel.app
- **Admin Panel:** https://tara-hub.vercel.app/admin
- **API Health:** https://tara-hub.vercel.app/api/health
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Dashboard:** https://console.neon.tech
- **Cloudflare R2:** https://dash.cloudflare.com

## Support Contacts

- **Technical Issues:** varaku@gmail.com
- **Vercel Support:** https://vercel.com/support
- **Database (Neon):** https://neon.tech/support

## Notes

### Known Issues:
- ESLint and TypeScript errors temporarily ignored in build (see next.config.mjs)
- Address these in future refactoring

### Performance Tips:
- Enable ISR for dynamic pages
- Use Vercel KV for caching when available
- Optimize images through Next.js Image component
- Implement lazy loading for heavy components

### Security Reminders:
- Rotate NEXTAUTH_SECRET regularly
- Keep admin email list updated
- Monitor failed authentication attempts
- Regular security audits with `npm audit`

---

## Quick Commands Reference

```bash
# Environment validation
node deployment/admin/env-validator.js --production

# Pre-deployment testing
node deployment/admin/pre-deploy-test.js

# Database operations
npm run db:generate    # Generate migrations
npm run db:push        # Apply migrations
npm run db:studio      # Open Drizzle Studio

# Deployment
vercel                 # Deploy to preview
vercel --prod          # Deploy to production
vercel ls              # List deployments
vercel rollback [url]  # Rollback deployment

# Seed data
node scripts/seed-data.js --all

# Full automated deployment
node deployment/admin/deploy.js
```

---

✅ **Deployment Complete!**

Remember to:
1. Test all critical paths in production
2. Monitor for the first 24 hours
3. Be ready to rollback if issues arise
4. Document any issues or learnings for next deployment