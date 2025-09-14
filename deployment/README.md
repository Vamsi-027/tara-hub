# 📦 Deployment Configuration

Complete deployment setup for Tara Hub platform with Medusa backend on Railway and Fabric Store on Vercel.

## 🎯 Deployment Architecture

| Application | Platform | URL | Directory |
|------------|----------|-----|-----------|
| **Medusa Backend + Admin** | Railway | `https://medusa-backend-production-3655.up.railway.app` | `/medusa` |
| **Fabric Store** | Vercel | `https://fabric-store.vercel.app` | `/frontend/experiences/fabric-store` |

## 📁 Deployment Directory Structure

```
deployment/
├── railway/                     # Railway deployment for Medusa Backend
│   ├── Dockerfile               # Production Docker image for Medusa
│   ├── railway.json             # Railway build configuration
│   └── railway.toml             # Railway deployment settings
│   
├── vercel/                      # Vercel deployment for Fabric Store
│   ├── project.json            # Vercel project configuration
│   ├── fabric-store.vercel.json # Fabric Store specific settings
│   ├── env-production.json     # Production environment variables template
│   ├── .vercelignore           # Files to ignore during deployment
│   └── README.md               # Vercel-specific documentation
│
├── github/                      # GitHub Actions CI/CD
│   └── deploy.yml              # Automated deployment workflow
│
├── scripts/                     # Deployment automation scripts
│   ├── deploy.sh               # Main deployment script (simple)
│   └── deploy-production.sh    # Production deployment with validations
│
└── README.md                    # This file
```

## 🚀 Quick Start Guide

### Step 1: Setup Deployment Credentials

Create `.env.deployment.local` in the **root directory** (not in deployment/):

```bash
# Vercel Credentials
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID_FABRIC_STORE=prj_1Z6WNwHAxrLIylgChrHnLVJGQvNw

# Railway Credentials
RAILWAY_TOKEN=your_railway_token_here
RAILWAY_PROJECT_ID=your_project_id_here
```

**Note**: The `.env.deployment.local` file is already added to `.gitignore` for security.

### Step 2: Install CLIs

```bash
# Install both CLIs globally
npm install -g vercel @railway/cli
```

### Step 3: Deploy

```bash
# Deploy everything (both Medusa and Fabric Store)
bash deployment/scripts/deploy.sh all

# Deploy only Fabric Store to Vercel
bash deployment/scripts/deploy.sh fabric-store

# Deploy only Medusa to Railway
bash deployment/scripts/deploy.sh medusa

# Alternative: Using npm scripts (if configured)
npm run deploy:fabric-store  # Deploy Fabric Store
npm run deploy:medusa        # Deploy Medusa
npm run deploy:all          # Deploy both
```

---

## 🚂 Railway Deployment (Medusa Backend)

### What Gets Deployed
- Medusa Backend API (REST endpoints)
- Medusa Admin Dashboard (at `/app`)
- All custom modules and APIs

### Configuration Files
- **Location**: `deployment/railway/`
- **Symlinks**: Files are symlinked to `/medusa` directory for Railway to detect
- **Auto-deploy**: Pushes to `main` branch trigger automatic deployment

### Manual Deployment Steps

```bash
# 1. Navigate to Medusa directory
cd medusa

# 2. Build the application
npm run build
npm run build:admin  # Build admin UI

# 3. Deploy to Railway
railway up

# Or use the deployment script
npm run deploy:medusa
```

### Required Environment Variables in Railway Dashboard

```env
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Security
JWT_SECRET=your_jwt_secret
COOKIE_SECRET=your_cookie_secret

# Storage (Cloudflare R2)
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=store
S3_ENDPOINT=https://....r2.cloudflarestorage.com
S3_PUBLIC_URL=https://pub-....r2.dev

# CDN
FABRIC_CDN_PREFIX=https://cdn.deepcrm.ai

# CORS (Important!)
STORE_CORS=https://fabric-store.vercel.app,http://localhost:3006
ADMIN_CORS=https://medusa-backend-production-3655.up.railway.app

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=admin@yourdomain.com

# Payments
STRIPE_API_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Access URLs
- **API**: `https://medusa-backend-production-3655.up.railway.app`
- **Admin**: `https://medusa-backend-production-3655.up.railway.app/app`
- **Health**: `https://medusa-backend-production-3655.up.railway.app/health`

### Deployment Status
- Monitor deployment at Railway Dashboard
- Logs available via `railway logs --tail`

---

## ▲ Vercel Deployment (Fabric Store)

### What Gets Deployed
- Next.js 15 e-commerce frontend
- Customer-facing fabric store
- Connects to Medusa backend API

### Configuration Files
- **Location**: `deployment/vercel/`
- **App Location**: `frontend/experiences/fabric-store/`
- **Project ID**: `prj_1Z6WNwHAxrLIylgChrHnLVJGQvNw`

### Deployment Methods

#### Method 1: Using Deployment Script (Recommended)

```bash
# From root directory
bash deployment/scripts/deploy.sh fabric-store
```

This script will:
1. Navigate to fabric-store directory
2. Install dependencies
3. Build the application
4. Deploy to Vercel production

#### Method 2: Manual Deployment

```bash
# 1. Navigate to Fabric Store directory
cd frontend/experiences/fabric-store

# 2. Install dependencies
npm install

# 3. Build the application
npm run build

# 4. Deploy to Vercel
vercel --prod --yes --token=$VERCEL_TOKEN
```

#### Method 3: Using npm Script

```bash
# From root directory (if configured in package.json)
npm run deploy:fabric-store
```

### Deployment URLs
- **Production**: `https://fabric-store-7baeexmij-vamsi-cheruku.vercel.app`
- **Dashboard**: `https://vercel.com/vamsi-cheruku/fabric-store`

### Required Environment Variables in Vercel Dashboard

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Select Project → Settings → Environment Variables

```env
# Medusa Connection (Public)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...

# Stripe (Public & Secret)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Twilio SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=d1t5dcup
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=admin@yourdomain.com

# Auth
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# App Config
NEXT_PUBLIC_APP_NAME=Fabric Store
NEXT_PUBLIC_BASE_URL=https://fabric-store-7baeexmij-vamsi-cheruku.vercel.app
NODE_ENV=production
```

---

## 📝 Deployment Scripts Explained

### `deploy.sh` (Simple Deployment)
- Loads tokens from `.env.deployment.local`
- Builds and deploys applications
- Simple error handling
- Good for development/staging

### `deploy-production.sh` (Production Deployment)
- Enhanced error checking
- Build verification before deployment
- Colored output for better readability
- Post-deployment health checks
- Deployment status notifications

### Usage Examples

```bash
# Deploy both platforms
bash deployment/scripts/deploy.sh all

# Deploy only Medusa
bash deployment/scripts/deploy.sh medusa

# Deploy only Fabric Store
bash deployment/scripts/deploy.sh fabric-store

# Production deployment with checks
bash deployment/scripts/deploy-production.sh all
```

---

## 🔧 Platform-Specific Commands

### Railway Commands
```bash
# View logs
railway logs --tail

# Check status
railway status

# Restart service
railway restart

# Rollback deployment
railway rollback

# View environment variables
railway variables
```

### Vercel Commands
```bash
# View deployments
vercel ls

# View logs
vercel logs

# Check environment variables
vercel env ls

# Promote deployment to production
vercel promote [deployment-url]

# Rollback (promote previous deployment)
vercel ls  # Find previous deployment
vercel promote [previous-deployment-url]
```

---

## 🧪 Post-Deployment Verification

### 1. Test Medusa Backend
```bash
# Health check
curl https://medusa-backend-production-3655.up.railway.app/health

# Test API
curl https://medusa-backend-production-3655.up.railway.app/store/products

# Access Admin Dashboard
open https://medusa-backend-production-3655.up.railway.app/app
```

### 2. Test Fabric Store
```bash
# Check deployment
open https://fabric-store-7baeexmij-vamsi-cheruku.vercel.app

# Verify Medusa connection
# Should see products loading from backend

# Check Vercel deployment status
open https://vercel.com/vamsi-cheruku/fabric-store
```

### 3. Complete Flow Test
1. Open Fabric Store
2. Browse products (should load from Medusa)
3. Add to cart
4. Test checkout (Stripe integration)
5. Check Medusa Admin for orders

---

## 🚨 Troubleshooting Guide

### Railway Issues

**Build Fails:**
```bash
railway logs  # Check error messages
# Common issues:
# - Missing environment variables
# - Database connection issues
# - Node version mismatch
```

**Admin UI Not Loading:**
```bash
cd medusa
npm run build:admin  # Rebuild admin UI
railway up
```

### Vercel Issues

**Build Fails:**
```bash
vercel logs  # Check error messages
# Common issues:
# - Missing NEXT_PUBLIC_ variables
# - Module resolution errors
# - Build timeout (increase in vercel.json)
```

**API Connection Issues:**
- Check `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is correct
- Verify CORS settings in Railway environment
- Check browser console for CORS errors

### Token Issues
- Verify `.env.deployment.local` exists in root
- Check tokens haven't expired
- Ensure correct permissions:
  - Railway: Full access to project
  - Vercel: Deploy permissions

---

## 🔒 Security Best Practices

1. **Never commit** `.env.deployment.local` to git
2. **Use different tokens** for dev/staging/production
3. **Rotate tokens** every 3-6 months
4. **Store production tokens** in CI/CD secrets only
5. **Use environment-specific** API keys (test vs production)
6. **Enable 2FA** on Railway and Vercel accounts

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Medusa Documentation](https://docs.medusajs.com)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### Railway Deployment Issues

1. **"Login state is corrupt" Error**
   - **Cause**: Invalid or expired Railway token
   - **Solution**: 
     ```bash
     # Get a new token from Railway dashboard
     # Update .env.deployment.local with new token
     RAILWAY_TOKEN=your-new-token-here
     
     # Retry deployment
     bash deployment/scripts/deploy.sh medusa
     ```

2. **Build Failures**
   - **TypeScript Errors**: Check `medusa/tsconfig.json` and ensure all imports are correct
   - **Missing Dependencies**: Run `cd medusa && npm install` before deploying
   - **AWS SDK Warning**: This is a known issue and doesn't affect deployment

3. **Service Not Found**
   - **Solution**: Remove `--service medusa-backend` flag from the deploy script if service doesn't exist

4. **Admin UI Not Loading**
   ```bash
   cd medusa
   npm run build:admin  # Rebuild admin UI
   railway up
   ```

#### Vercel Deployment Issues

1. **Project Not Found**
   - **Cause**: Wrong project ID in `.env.deployment.local`
   - **Solution**: Get correct project ID from Vercel dashboard

2. **Build Failures**
   - **Missing Environment Variables**: Ensure all required env vars are set in Vercel project settings
   - **Node Version**: Fabric-store requires Node.js 18+

3. **Deployment Hangs**
   - **Solution**: Use `--yes` flag to skip confirmation prompts

4. **API Connection Issues**
   - Check `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is correct
   - Verify CORS settings in Railway environment
   - Check browser console for CORS errors

#### General Issues

1. **Script Permission Denied**
   ```bash
   chmod +x deployment/scripts/deploy.sh
   ```

2. **Environment Variables Not Loading**
   - Ensure `.env.deployment.local` exists in project root
   - Check file has correct format (no spaces around `=`)

3. **Port Already in Use (Local Testing)**
   ```bash
   # Kill process on port 3006 (fabric-store)
   lsof -ti:3006 | xargs kill -9
   
   # Kill process on port 9000 (medusa)
   lsof -ti:9000 | xargs kill -9
   ```

## 🔑 Getting New Deployment Tokens

### Railway Token
1. Go to [Railway Dashboard](https://railway.app/account/tokens)
2. Click "Create Token"
3. Copy the token and update `.env.deployment.local`

### Vercel Token
1. Go to [Vercel Tokens](https://vercel.com/account/tokens)
2. Create a new token with appropriate scope
3. Copy the token and update `.env.deployment.local`

## 📍 Deployment URLs

After successful deployment:

- **Fabric Store (Vercel)**: `https://fabric-store-7baeexmij-vamsi-cheruku.vercel.app`
- **Medusa Backend (Railway)**: `https://medusa-backend-production-3655.up.railway.app`
- **Medusa Admin**: `https://medusa-backend-production-3655.up.railway.app/app`

## 🆘 Support

For deployment issues:
1. Check deployment script logs
2. Verify environment variables
3. Review platform-specific logs
4. Check GitHub issues for similar problems

---

**Last Updated**: December 2024  
**Maintained By**: DevOps Team