# 🚂 Railway Deployment Guide for Medusa Backend

This guide explains how to deploy the Medusa backend to Railway using the provided deployment configuration.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **PostgreSQL Database**: Will be provisioned on Railway
4. **Environment Variables**: Have your API keys ready

## 🚀 Quick Deploy

### Option 1: Using Deployment Script

```bash
# Navigate to medusa directory
cd medusa

# Make script executable
chmod +x deploy-railway.sh

# Run deployment
./deploy-railway.sh
```

### Option 2: Manual Railway CLI

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Set environment variables
export RAILWAY_TOKEN="9d1ca706-d735-4a7c-bc65-f571111b8141"
export RAILWAY_PROJECT_ID="7d4ddac3-5123-4445-98cf-714ad52a324a"

# Deploy
railway up --detach
```

### Option 3: GitHub Integration

1. Connect your GitHub repository to Railway
2. Railway will auto-deploy on every push to main branch
3. Monitor at: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a

## ⚙️ Configuration

### Railway Project Structure

Your Railway project should have these services:

```
Railway Project
├── Medusa Backend (Main service)
├── PostgreSQL (Database)
└── Redis (Optional - for caching)
```

### Environment Variables

Set these in Railway Dashboard > Variables:

#### 🔑 Required Variables

```bash
# Core
NODE_ENV=production
PORT=${{PORT}}

# Database (auto-provided by Railway PostgreSQL)
DATABASE_URL=${{DATABASE_URL}}

# Security (generate with: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_min_32_chars
COOKIE_SECRET=your_cookie_secret_min_32_chars

# CORS
STORE_CORS=https://your-frontend.vercel.app
ADMIN_CORS=https://medusa-backend-production-3655.up.railway.app
```

#### 💳 Payment Configuration (Stripe)

```bash
# From Stripe Dashboard
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 📧 Email Configuration

```bash
# Option 1: Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Option 2: SendGrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM=noreply@yourdomain.com
```

#### 📦 File Storage (Optional)

```bash
# Cloudflare R2 or AWS S3
S3_ENDPOINT=https://...
S3_BUCKET_NAME=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_REGION=auto
```

## 🛠️ Post-Deployment Setup

### 1. Run Post-Deploy Script

```bash
cd medusa/scripts
chmod +x railway-post-deploy.sh
./railway-post-deploy.sh
```

This script will:
- Run database migrations
- Create admin user
- Setup US region
- Generate API keys
- Configure webhooks

### 2. Manual Setup Steps

#### Database Migrations
```bash
railway run npx medusa db:migrate
```

#### Create Admin User
```bash
railway run npx medusa exec ./src/scripts/seed-admin-user.ts
```

#### Setup Regions
```bash
railway run npx medusa exec ./src/scripts/setup-us-region.ts
```

#### Generate API Keys
```bash
railway run npx medusa utils:api-key
```

### 3. Configure Stripe Webhooks

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint:
   - URL: `https://medusa-backend-production-3655.up.railway.app/webhooks/stripe`
   - Events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
3. Copy webhook secret
4. Add to Railway variables: `STRIPE_WEBHOOK_SECRET=whsec_...`

## 🔍 Verification

### Health Check
```bash
curl https://medusa-backend-production-3655.up.railway.app/health
```

### Admin Panel
Open: https://medusa-backend-production-3655.up.railway.app/app

### Store API Test
```bash
curl https://medusa-backend-production-3655.up.railway.app/store/regions \
  -H "x-publishable-api-key: YOUR_KEY"
```

## 📋 Deployment Files

### `railway.json`
Defines build and deployment configuration:
- Uses Dockerfile for build
- Health check on `/health`
- Auto-restart on failure

### `Dockerfile`
Multi-stage build:
- Build stage: Compiles TypeScript, builds admin UI
- Production stage: Runs optimized server
- Non-root user for security
- Health checks included

### `medusa-config.ts`
Configures:
- Database connection
- Redis caching (optional)
- Stripe payment provider
- File storage (S3/R2)
- CORS settings

## 📊 Monitoring

### Railway Dashboard
- Logs: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a/logs
- Metrics: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a/metrics
- Deployments: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a/deployments

### Application Logs
```bash
# View logs
railway logs

# Follow logs
railway logs -f
```

## 🔄 Updates and Rollbacks

### Deploy Updates
```bash
# Make changes
git add .
git commit -m "feat: your changes"
git push origin main

# Railway auto-deploys from GitHub
```

### Rollback
1. Go to Railway dashboard
2. Navigate to Deployments
3. Click on previous successful deployment
4. Click "Rollback to this deployment"

## 🐛 Troubleshooting

### Build Failures
```bash
# Check build logs
railway logs --build

# Common fixes:
# 1. Clear cache and rebuild
railway up --no-cache

# 2. Check Node version (requires >=20)
# 3. Verify all dependencies installed
```

### Database Connection Issues
```bash
# Verify DATABASE_URL is set
railway variables

# Test connection
railway run npx medusa db:ping
```

### Admin Panel Not Loading
1. Check build logs for admin build success
2. Verify `MEDUSA_ADMIN_BACKEND_URL` is set correctly
3. Clear browser cache and cookies
4. Check CORS settings

### Payment Issues
1. Verify Stripe keys are correct
2. Check webhook configuration
3. Monitor webhook events in Stripe dashboard
4. Check Railway logs for webhook errors

## 📞 Support

### Railway Resources
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### Medusa Resources
- [Medusa Documentation](https://docs.medusajs.com)
- [Medusa Discord](https://discord.gg/medusajs)
- [Medusa GitHub](https://github.com/medusajs/medusa)

## 🔒 Security Checklist

- [ ] Strong JWT_SECRET and COOKIE_SECRET
- [ ] CORS origins restricted
- [ ] Database SSL enabled
- [ ] API rate limiting configured
- [ ] Webhook signature verification enabled
- [ ] Admin passwords changed from defaults
- [ ] Environment variables not exposed in logs
- [ ] Regular security updates applied

## 🌟 Production Checklist

- [ ] All migrations run successfully
- [ ] Admin user created
- [ ] Regions configured
- [ ] Payment provider tested
- [ ] Email notifications working
- [ ] File uploads working (if using S3/R2)
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] SSL certificates valid

---

**Deployment URL**: https://medusa-backend-production-3655.up.railway.app  
**Project ID**: 7d4ddac3-5123-4445-98cf-714ad52a324a  
**Last Updated**: $(date)