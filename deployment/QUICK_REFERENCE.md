# 🚀 Deployment Quick Reference Card

## 📦 One-Command Deployment

```bash
# Complete deployment workflow
./deployment/scripts/pre-deployment-check.sh && \
./deployment/scripts/deploy-production.sh all && \
./deployment/scripts/verify-production-deployment.sh
```

---

## 🔧 Essential Commands

### Pre-Deployment

```bash
# Check if ready to deploy
./deployment/scripts/pre-deployment-check.sh

# Build locally first
cd medusa && npm run build
cd ../frontend/experiences/fabric-store && npm run build
```

### Deploy

```bash
# Deploy everything
./deployment/scripts/deploy-production.sh all

# Deploy Medusa only
./deployment/scripts/deploy-production.sh medusa

# Deploy Fabric Store only
./deployment/scripts/deploy-production.sh fabric-store

# Alternative: Original deploy script
./deployment/scripts/deploy.sh all
```

### Verify

```bash
# Full verification suite
./deployment/scripts/verify-production-deployment.sh

# With verbose output
./deployment/scripts/verify-production-deployment.sh --verbose

# Quick health check
curl https://medusa-backend-production-3655.up.railway.app/health
```

---

## 🔍 Monitoring

### Railway (Backend)

```bash
# View logs
railway logs

# Live tail logs
railway logs -f

# Last 200 lines
railway logs --lines 200

# Filter errors
railway logs | grep -i error

# Check status
railway status

# Open dashboard
railway open

# Connect to database
railway connect

# List env vars
railway vars

# Set env var
railway vars set KEY=value

# Restart service
railway service restart
```

### Vercel (Frontend)

```bash
# View logs
vercel logs https://fabric-store-ten.vercel.app

# List deployments
vercel ls

# Get deployment URL
vercel --prod

# View domains
vercel domains

# Open dashboard
vercel

# Pull env vars
vercel env pull
```

---

## 🧪 Testing URLs

### Production Endpoints

```bash
# Backend Health
https://medusa-backend-production-3655.up.railway.app/health

# Store API
https://medusa-backend-production-3655.up.railway.app/store/products
https://medusa-backend-production-3655.up.railway.app/store/regions

# Admin UI
https://medusa-backend-production-3655.up.railway.app/app

# Frontend
https://fabric-store-ten.vercel.app
```

### Quick cURL Tests

```bash
# Health check
curl -i https://medusa-backend-production-3655.up.railway.app/health

# Products
curl https://medusa-backend-production-3655.up.railway.app/store/products | jq .

# Test response time
time curl -s https://medusa-backend-production-3655.up.railway.app/store/products > /dev/null

# Check CORS
curl -I -H "Origin: https://fabric-store-ten.vercel.app" \
  https://medusa-backend-production-3655.up.railway.app/store/products
```

---

## 🚨 Emergency Commands

### Rollback

```bash
# Railway: Redeploy previous version
railway service restart

# Or via dashboard:
# https://railway.app → Deployments → Previous deployment → Redeploy

# Vercel: Promote previous deployment
vercel ls  # Get previous URL
vercel promote <previous-deployment-url>

# Git revert
git revert HEAD
git push origin main
```

### Database Emergency

```bash
# Connect to production DB
railway connect

# Quick backup (via Railway CLI)
railway run -- pg_dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Check database size
railway run -- psql -c "SELECT pg_size_pretty(pg_database_size('railway'));"

# Count records
railway run -- psql -c "SELECT COUNT(*) FROM product;"
```

### Clear Cache

```bash
# Railway: Restart service
railway service restart

# Vercel: Redeploy
vercel --prod --force
```

---

## 📊 Diagnostic Commands

### Check Everything

```bash
# System status
railway status
vercel ls

# Health endpoints
curl https://medusa-backend-production-3655.up.railway.app/health
curl -I https://fabric-store-ten.vercel.app

# Recent logs
railway logs --lines 50
vercel logs https://fabric-store-ten.vercel.app --lines 50

# Database connection
railway run -- psql -c "SELECT version();"
```

### Performance Check

```bash
# API response time
hyperfine 'curl -s https://medusa-backend-production-3655.up.railway.app/store/products'

# Or simple timing
time curl -s https://medusa-backend-production-3655.up.railway.app/store/products > /dev/null

# Frontend performance (using Lighthouse)
npx lighthouse https://fabric-store-ten.vercel.app --view
```

---

## 🔐 Environment Variables

### View Current Variables

```bash
# Railway
railway vars

# Vercel
vercel env ls
vercel env pull
```

### Update Variables

```bash
# Railway
railway vars set DATABASE_URL="postgresql://..."
railway vars set STRIPE_API_KEY="sk_live_..."

# Vercel (creates/updates .env)
vercel env add
vercel env rm <name>
```

### Critical Variables Checklist

**Railway (Medusa):**
- `DATABASE_URL` - Neon PostgreSQL
- `JWT_SECRET` - Auth secret
- `COOKIE_SECRET` - Session secret
- `STRIPE_API_KEY` - Payment gateway
- `STRIPE_WEBHOOK_SECRET` - Stripe webhooks
- `S3_ACCESS_KEY_ID` - R2 storage
- `S3_SECRET_ACCESS_KEY` - R2 storage
- `S3_BUCKET_NAME` - R2 bucket
- `S3_ENDPOINT` - R2 endpoint
- `S3_PUBLIC_URL` - R2 public URL
- `RESEND_API_KEY` - Email service

**Vercel (Fabric Store):**
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` - API URL
- `STRIPE_PUBLISHABLE_KEY` - Frontend Stripe
- `TWILIO_ACCOUNT_SID` - SMS auth
- `TWILIO_AUTH_TOKEN` - SMS auth
- `SANITY_PROJECT_ID` - CMS
- `SANITY_DATASET` - CMS dataset

---

## 🛠️ Troubleshooting Quick Fixes

### "Cannot connect to backend"

```bash
# Check backend is up
curl https://medusa-backend-production-3655.up.railway.app/health

# Check CORS
railway vars | grep CORS

# Fix CORS
railway vars set STORE_CORS="https://fabric-store-ten.vercel.app,http://localhost:3006"
railway service restart
```

### "Images not loading"

```bash
# Check R2 config
railway vars | grep S3

# Test R2 endpoint
curl -I <your-r2-public-url>/test.jpg

# Verify product has images
curl https://medusa-backend-production-3655.up.railway.app/store/products | jq '.[0].images'
```

### "Admin UI not loading"

```bash
# Check admin UI build
railway logs | grep -i "admin"

# Rebuild admin
cd medusa && npm run build:admin

# Check environment
railway vars | grep MEDUSA_ADMIN_BACKEND_URL
```

### "Database connection timeout"

```bash
# Test DB connection
railway connect

# Check connection string
railway vars | grep DATABASE_URL

# Check Neon dashboard
# https://console.neon.tech
```

---

## 📱 Mobile Testing

```bash
# Use ngrok for local-to-mobile testing
ngrok http 3006  # For fabric-store

# Test production on mobile
# Visit: https://fabric-store-ten.vercel.app
# Use Chrome DevTools Device Mode
```

---

## 🔗 Important URLs

| Resource | URL |
|----------|-----|
| **Railway Dashboard** | https://railway.app |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Neon Dashboard** | https://console.neon.tech |
| **Cloudflare Dashboard** | https://dash.cloudflare.com |
| **GitHub Repository** | https://github.com/varaku1012/tara-hub-1 |
| **Medusa Backend** | https://medusa-backend-production-3655.up.railway.app |
| **Admin UI** | https://medusa-backend-production-3655.up.railway.app/app |
| **Fabric Store** | https://fabric-store-ten.vercel.app |
| **API Health** | https://medusa-backend-production-3655.up.railway.app/health |

---

## 📞 Get Help

```bash
# Railway help
railway help
railway <command> --help

# Vercel help
vercel help
vercel <command> --help

# Project documentation
cat deployment/DEPLOYMENT_GUIDE.md

# Check logs
./deployment/scripts/verify-production-deployment.sh --verbose
```

---

## ⚡ Pro Tips

1. **Always run pre-deployment check first**
   ```bash
   ./deployment/scripts/pre-deployment-check.sh
   ```

2. **Monitor logs during deployment**
   ```bash
   railway logs -f &
   ./deployment/scripts/deploy-production.sh all
   ```

3. **Keep a terminal with logs open**
   ```bash
   # Terminal 1: Railway logs
   railway logs -f

   # Terminal 2: Vercel logs
   vercel logs https://fabric-store-ten.vercel.app -f
   ```

4. **Verify after every deployment**
   ```bash
   ./deployment/scripts/verify-production-deployment.sh
   ```

5. **Bookmark critical URLs**
   - Railway project dashboard
   - Vercel project dashboard
   - Neon database dashboard

---

**Quick Start for New Developers:**

```bash
# 1. Clone and setup
git clone <repo-url>
cd tara-hub-1
npm install

# 2. Install CLI tools
npm i -g @railway/cli vercel

# 3. Login
railway login
vercel login

# 4. Test deployment scripts
./deployment/scripts/pre-deployment-check.sh

# 5. Done! You're ready to deploy
```

---

**Last Updated:** 2025-09-29