# 🚂 Deploy Medusa to Railway Using Tokens

This guide shows how to deploy a Medusa backend to Railway using authentication tokens instead of the web interface.

## 📋 Prerequisites

- Medusa backend project ready for deployment
- Railway account with project created
- Railway CLI installed
- Railway project tokens

## 🔑 Required Tokens

You'll need these tokens from your Railway project:

```bash
RAILWAY_TOKEN=9d1ca706-d735-4a7c-bc65-f571111b8141
RAILWAY_PROJECT_ID=7d4ddac3-5123-4445-98cf-714ad52a324a
```

**Where to find these:**
1. **RAILWAY_TOKEN**: Railway Dashboard → Settings → Tokens
2. **RAILWAY_PROJECT_ID**: Found in your project URL or settings

## 🛠️ Installation

### 1. Install Railway CLI

```bash
# macOS
brew install railway
# or
curl -fsSL https://railway.app/install.sh | sh

# Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows
scoop install railway
# or download from https://github.com/railwayapp/cli/releases
```

### 2. Verify Installation

```bash
railway --version
```

## 🚀 Deployment Process

### Step 1: Set Environment Variables

```bash
export RAILWAY_TOKEN="9d1ca706-d735-4a7c-bc65-f571111b8141"
export RAILWAY_PROJECT_ID="7d4ddac3-5123-4445-98cf-714ad52a324a"
```

### Step 2: Navigate to Medusa Directory

```bash
cd /path/to/your/medusa
```

### Step 3: Deploy to Railway

```bash
# Deploy to specific service (if multiple services exist)
railway up --service medusa-backend --detach

# Or deploy to default service
railway up --detach
```

### Step 4: Monitor Deployment

```bash
# Check deployment status
railway status

# View build logs (requires login)
railway logs --build

# View runtime logs (requires login)
railway logs
```

## ✅ Verification

### Check Health Endpoint

```bash
curl https://medusa-backend-production-3655.up.railway.app/health
```

Expected response: `OK`

### Test Admin Panel

Open: https://medusa-backend-production-3655.up.railway.app/app

### Test Store API

```bash
curl https://medusa-backend-production-3655.up.railway.app/store/regions
```

## ⚙️ Post-Deployment Configuration

### 1. Set Environment Variables in Railway

Go to Railway Dashboard → Your Project → Variables and add:

```bash
# Required
NODE_ENV=production
JWT_SECRET=your_jwt_secret_min_32_chars
COOKIE_SECRET=your_cookie_secret_min_32_chars

# Database (auto-provided if using Railway PostgreSQL)
DATABASE_URL=${{DATABASE_URL}}

# CORS
STORE_CORS=https://your-frontend.vercel.app
ADMIN_CORS=https://medusa-backend-production-3655.up.railway.app

# Stripe (if using payments)
STRIPE_API_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_secret_from_stripe

# Email (optional)
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 2. Run Database Migrations

```bash
railway run npx medusa db:migrate
```

### 3. Create Admin User

```bash
railway run npx medusa exec ./src/scripts/seed-admin-user.ts
```

### 4. Setup Regions

```bash
railway run npx medusa exec ./src/scripts/setup-us-region.ts
```

## 🔧 Troubleshooting

### Common Issues

#### "Multiple services found"
```bash
# List available services
railway service

# Deploy to specific service
railway up --service medusa-backend --detach
```

#### "Unauthorized" Error
```bash
# Verify tokens are set
echo $RAILWAY_TOKEN
echo $RAILWAY_PROJECT_ID

# Re-export if needed
export RAILWAY_TOKEN="9d1ca706-d735-4a7c-bc65-f571111b8141"
export RAILWAY_PROJECT_ID="7d4ddac3-5123-4445-98cf-714ad52a324a"
```

#### Build Failures
```bash
# Check build logs
railway logs --build

# Common fixes:
# 1. Ensure Dockerfile exists
# 2. Check package.json scripts
# 3. Verify environment variables
```

#### Database Connection Issues
```bash
# Add PostgreSQL service in Railway dashboard
# DATABASE_URL will be auto-injected

# Or manually set:
DATABASE_URL=postgresql://user:pass@host:port/db
```

### TypeScript Build Errors

If you encounter TypeScript errors during build:

```bash
# Option 1: Fix TypeScript errors in code
# Option 2: Bypass local build and let Railway build
railway up --service medusa-backend --detach
```

## 📊 Monitoring

### Railway Dashboard

- **Project**: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a
- **Deployments**: Monitor build status and logs
- **Metrics**: View CPU, memory, and network usage
- **Variables**: Manage environment variables

### Health Checks

```bash
# Automated health check script
#!/bin/bash
URL="https://medusa-backend-production-3655.up.railway.app/health"
if curl -f $URL > /dev/null 2>&1; then
    echo "✅ Medusa backend is healthy"
else
    echo "❌ Medusa backend is down"
fi
```

## 🔄 Updates and Rollbacks

### Deploy Updates

```bash
# Make code changes
git add .
git commit -m "feat: your changes"

# Redeploy
railway up --service medusa-backend --detach
```

### Rollback

1. Go to Railway Dashboard
2. Navigate to Deployments
3. Find previous successful deployment
4. Click "Redeploy"

## 🛡️ Security Best Practices

### Token Security

```bash
# Store tokens in environment file (don't commit to git)
echo "RAILWAY_TOKEN=9d1ca706-d735-4a7c-bc65-f571111b8141" >> ~/.railway
echo "RAILWAY_PROJECT_ID=7d4ddac3-5123-4445-98cf-714ad52a324a" >> ~/.railway

# Source when needed
source ~/.railway
```

### Environment Variables

- ✅ Use strong, random secrets for JWT_SECRET and COOKIE_SECRET
- ✅ Restrict CORS origins to your frontend domains
- ✅ Use environment variables for all sensitive data
- ❌ Never commit secrets to git
- ❌ Don't use default passwords

## 🎯 Complete Example

Here's a complete deployment script:

```bash
#!/bin/bash

# Set Railway tokens
export RAILWAY_TOKEN="9d1ca706-d735-4a7c-bc65-f571111b8141"
export RAILWAY_PROJECT_ID="7d4ddac3-5123-4445-98cf-714ad52a324a"

echo "🚂 Deploying Medusa to Railway..."

# Navigate to medusa directory
cd medusa

# Deploy
echo "📦 Starting deployment..."
railway up --service medusa-backend --detach

# Wait a moment
sleep 10

# Check health
echo "🔍 Checking deployment health..."
if curl -f https://medusa-backend-production-3655.up.railway.app/health > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 Backend URL: https://medusa-backend-production-3655.up.railway.app"
    echo "👤 Admin Panel: https://medusa-backend-production-3655.up.railway.app/app"
else
    echo "❌ Deployment may still be in progress. Check Railway dashboard."
fi

echo "📊 Monitor at: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a"
```

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/reference/cli-api)
- [Medusa Deployment Guide](https://docs.medusajs.com/deployment)
- [Railway Discord](https://discord.gg/railway)

## 💡 Tips

1. **Use Git Integration**: Connect Railway to your GitHub repo for automatic deployments
2. **Environment Branches**: Use Railway's environment feature for staging/production
3. **Resource Monitoring**: Set up alerts for high CPU/memory usage
4. **Database Backups**: Enable automatic backups for PostgreSQL
5. **Custom Domains**: Add your own domain in Railway dashboard

---

**Deployment URL**: https://medusa-backend-production-3655.up.railway.app  
**Project Dashboard**: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a  
**Last Updated**: $(date)