# 🚀 Tara Hub Production Deployment Guide

Complete guide for deploying and testing Tara Hub to production infrastructure.

## 📋 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐        ┌──────────────┐                   │
│  │   FRONTEND   │        │   BACKEND    │                   │
│  │   (Vercel)   │───────▶│  (Railway)   │                   │
│  │  Fabric Store│        │   Medusa JS  │                   │
│  └──────────────┘        └──────┬───────┘                   │
│                                  │                            │
│                         ┌────────┴────────┐                  │
│                         │                 │                  │
│                  ┌──────▼──────┐   ┌─────▼──────┐          │
│                  │  DATABASE   │   │  STORAGE   │          │
│                  │  (Neon DB)  │   │(Cloudflare)│          │
│                  │  PostgreSQL │   │     R2     │          │
│                  └─────────────┘   └────────────┘          │
│                                                               │
│  GitHub Actions ────▶ Auto-deploy on push to main          │
└─────────────────────────────────────────────────────────────┘
```

### Component Details

| Component | Platform | URL | Purpose |
|-----------|----------|-----|---------|
| **Frontend** | Vercel | https://fabric-store-ten.vercel.app | Customer-facing fabric store |
| **Backend/API** | Railway | https://medusa-backend-production-3655.up.railway.app | Medusa commerce engine |
| **Admin UI** | Railway | https://medusa-backend-production-3655.up.railway.app/app | Admin dashboard |
| **Database** | Neon | PostgreSQL (pooled) | Product data, orders, users |
| **Storage** | Cloudflare R2 | S3-compatible | Images, files |
| **Source Control** | GitHub | Private repo | Version control |

---

## 🔐 Prerequisites

### 1. Required CLI Tools

```bash
# Install Railway CLI
npm install -g @railway/cli

# Install Vercel CLI
npm install -g vercel

# Verify installations
railway --version
vercel --version
```

### 2. Authentication

```bash
# Login to Railway
railway login

# Login to Vercel
vercel login
```

### 3. Environment Variables

Create `.env.deployment.local` in project root:

```env
# Vercel
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here
VERCEL_PROJECT_ID_FABRIC_STORE=prj_xxxxxxxxxxxxx

# Railway
RAILWAY_TOKEN=your_railway_token_here
RAILWAY_PROJECT_ID=7d4ddac3-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**How to get tokens:**
- **Vercel Token**: https://vercel.com/account/tokens
- **Railway Token**: `railway login` then check `~/.railway/config.json`
- **Project IDs**: Check respective dashboards

---

## 📦 Deployment Workflow

### Step 1: Pre-Deployment Checks

Run comprehensive pre-deployment verification:

```bash
./deployment/scripts/pre-deployment-check.sh
```

This checks:
- ✅ Git repository status (uncommitted changes, branch, sync)
- ✅ Dependencies installed (root, medusa, fabric-store)
- ✅ Build succeeds (TypeScript compilation)
- ✅ Environment variables configured
- ✅ CLI tools installed (Railway, Vercel)
- ✅ Code quality (TypeScript, ESLint)
- ✅ Infrastructure status (database, backend health)

**Expected Output:**
```
✅ READY TO DEPLOY!

Total Checks:        32
Passed:              30
Failed:              0
Warnings:            2
```

### Step 2: Deploy to Production

#### Option A: Deploy Everything

```bash
./deployment/scripts/deploy-production.sh all
```

This will:
1. Build and deploy Medusa backend to Railway
2. Build and deploy Fabric Store to Vercel
3. Run basic verification checks

#### Option B: Deploy Individual Components

```bash
# Deploy only Medusa backend
./deployment/scripts/deploy-production.sh medusa

# Deploy only Fabric Store
./deployment/scripts/deploy-production.sh fabric-store
```

### Step 3: Post-Deployment Verification

Run comprehensive production tests:

```bash
./deployment/scripts/verify-production-deployment.sh
```

For detailed output:

```bash
./deployment/scripts/verify-production-deployment.sh --verbose
```

**This tests:**
- ✅ Backend health endpoint
- ✅ Store API (products, regions, categories)
- ✅ Admin API authentication
- ✅ Admin UI accessibility
- ✅ Frontend homepage
- ✅ Database connectivity
- ✅ File storage (R2 URLs in products)
- ✅ CORS configuration
- ✅ API response times
- ✅ Security headers
- ✅ Authentication flow
- ✅ GitHub sync status
- ✅ Deployment platform status

**Expected Output:**
```
📊 TEST SUMMARY

Total Tests Run:     24
Passed:              22
Failed:              0
Warnings:            2

Overall Status:      ✓ EXCELLENT (91%)
```

---

## 🧪 Testing Your Deployment

### Automated Testing

```bash
# Run all verification tests
./deployment/scripts/verify-production-deployment.sh

# Check specific Railway deployment
cd medusa && ./verify-deployment.sh

# Run E2E tests against production
npm run test:e2e
```

### Manual Testing Checklist

#### Backend API Tests

```bash
# Health check
curl https://medusa-backend-production-3655.up.railway.app/health

# Store products
curl https://medusa-backend-production-3655.up.railway.app/store/products

# Store regions
curl https://medusa-backend-production-3655.up.railway.app/store/regions

# Admin requires auth (should return 401)
curl https://medusa-backend-production-3655.up.railway.app/admin/products
```

#### Frontend Tests

1. **Homepage Load**
   - Visit: https://fabric-store-ten.vercel.app
   - Verify: Page loads without errors
   - Check: Browser console has no errors

2. **Product Browsing**
   - Navigate to products page
   - Verify: Products display with images
   - Check: Images load from R2 storage

3. **Performance**
   - Use Chrome DevTools Lighthouse
   - Target: Performance score >80
   - Check: Time to Interactive <3s

#### Database Tests

```bash
# Via Railway CLI
railway connect

# In PostgreSQL:
\l                          # List databases
\dt                         # List tables
SELECT COUNT(*) FROM product;
SELECT COUNT(*) FROM region;
```

#### Storage Tests

1. **Image Upload** (via Admin UI)
   - Login to: https://medusa-backend-production-3655.up.railway.app/app
   - Upload product image
   - Verify: Image appears in product details
   - Check: URL contains R2 domain

2. **CDN Performance**
   - Open image URL directly
   - Check: Fast load time (<1s)
   - Verify: Correct Content-Type header

---

## 🔍 Monitoring & Debugging

### Railway Logs

```bash
# View real-time logs
railway logs

# View last 100 lines
railway logs --lines 100

# Filter logs
railway logs | grep ERROR
```

### Vercel Logs

```bash
# View deployment logs
vercel logs https://fabric-store-ten.vercel.app

# View build logs
vercel logs --build
```

### Health Endpoints

```bash
# Backend health
curl https://medusa-backend-production-3655.up.railway.app/health

# Expected response:
# {"status":"ok"}
```

### Common Issues & Solutions

#### Issue: Admin UI shows "Connection Error"

**Solution:**
```bash
# Check CORS configuration
railway vars | grep CORS

# Update CORS if needed
railway vars set STORE_CORS="https://fabric-store-ten.vercel.app,https://medusa-backend-production-3655.up.railway.app"
```

#### Issue: Images not loading

**Solution:**
```bash
# Check R2 credentials in Railway
railway vars | grep S3

# Test R2 connection
curl -I https://your-account.r2.dev/store/organized/test-image.jpg
```

#### Issue: Database connection errors

**Solution:**
```bash
# Check database URL
railway vars | grep DATABASE_URL

# Test connection
railway connect
```

#### Issue: Build fails on Railway

**Solution:**
```bash
# Check build logs
railway logs --lines 200

# Common fixes:
# 1. Clear build cache
railway service restart

# 2. Re-deploy
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

---

## 🚨 Rollback Procedures

### Quick Rollback (Railway)

```bash
# List recent deployments
railway status

# Rollback via dashboard:
# 1. Open https://railway.app/project/YOUR_PROJECT_ID
# 2. Go to Deployments tab
# 3. Click on previous working deployment
# 4. Click "Redeploy"
```

### Quick Rollback (Vercel)

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <previous-deployment-url>
```

### Emergency Rollback

```bash
# Revert Git commit
git revert HEAD
git push origin main

# This triggers automatic re-deployment
```

---

## 📊 Performance Benchmarks

### API Response Times

| Endpoint | Target | Acceptable |
|----------|--------|------------|
| `/health` | <100ms | <200ms |
| `/store/products` | <500ms | <1000ms |
| `/store/regions` | <200ms | <500ms |
| `/admin/*` | <500ms | <1000ms |

### Frontend Metrics

| Metric | Target | Acceptable |
|--------|--------|------------|
| First Contentful Paint | <1.5s | <2.5s |
| Largest Contentful Paint | <2.5s | <4.0s |
| Time to Interactive | <3.0s | <5.0s |
| Cumulative Layout Shift | <0.1 | <0.25 |

---

## 🔄 CI/CD Setup (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run pre-deployment checks
        run: ./deployment/scripts/pre-deployment-check.sh

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          cd medusa
          railway up --detach

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm install -g vercel
          cd frontend/experiences/fabric-store
          vercel --prod --yes --token=$VERCEL_TOKEN

      - name: Verify deployment
        run: ./deployment/scripts/verify-production-deployment.sh
```

**Add secrets to GitHub:**
1. Go to repo Settings → Secrets → Actions
2. Add: `RAILWAY_TOKEN`, `VERCEL_TOKEN`

---

## 📞 Support & Resources

### Documentation Links

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [MedusaJS Docs](https://docs.medusajs.com)
- [Neon Docs](https://neon.tech/docs)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2)

### Quick Commands Reference

```bash
# Pre-deployment check
./deployment/scripts/pre-deployment-check.sh

# Deploy everything
./deployment/scripts/deploy-production.sh all

# Verify deployment
./deployment/scripts/verify-production-deployment.sh

# Railway commands
railway logs                # View logs
railway status              # Check status
railway open                # Open dashboard
railway vars                # List env vars
railway connect             # Connect to DB

# Vercel commands
vercel logs <url>           # View logs
vercel ls                   # List deployments
vercel --prod               # Deploy to production
vercel domains              # Manage domains
```

### Troubleshooting Flowchart

```
Deployment Failed?
│
├─▶ Pre-deployment check failed?
│   └─▶ Fix issues reported in check
│
├─▶ Build failed?
│   ├─▶ Check TypeScript errors
│   ├─▶ Check dependencies
│   └─▶ Review build logs
│
├─▶ Deployment succeeded but site down?
│   ├─▶ Check health endpoint
│   ├─▶ Review platform logs
│   └─▶ Verify env vars
│
└─▶ Site up but errors?
    ├─▶ Check browser console
    ├─▶ Test API endpoints
    └─▶ Review application logs
```

---

## ✅ Deployment Checklist

Print this before each deployment:

- [ ] Run pre-deployment check script
- [ ] All tests passing locally
- [ ] Git repository clean and pushed
- [ ] Environment variables verified
- [ ] Database migrations ready (if any)
- [ ] Backup current production data (if needed)
- [ ] Deploy to production
- [ ] Run verification script
- [ ] Test critical user flows manually
- [ ] Monitor logs for 10 minutes
- [ ] Update team on deployment status

---

## 📝 Post-Deployment Notes

After successful deployment, document:

1. **Deployment timestamp**: _________________
2. **Git commit SHA**: _________________
3. **New features deployed**: _________________
4. **Breaking changes**: _________________
5. **Migration notes**: _________________
6. **Rollback plan confirmed**: [ ]

---

**Last Updated:** 2025-09-29
**Maintained by:** DevOps Team
**Version:** 1.0.0
