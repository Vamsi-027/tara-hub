# Vercel Deployment Guide for Tara Hub Monorepo

## Architecture Overview

This monorepo contains 3 separate Next.js applications that need to be deployed independently:

1. **Main Admin App** (Root directory)
2. **Fabric Store** (experiences/fabric-store)
3. **Store Guide** (experiences/store-guide)

## Deployment Strategy

### Option 1: Using Vercel Dashboard (Recommended)

#### Step 1: Deploy Main Admin App
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import from GitHub: `varaku1012/tara-hub`
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave empty or use `.`)
   - **Build Command**: `npm run build:admin`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
5. Add environment variables from `.env.local`
6. Deploy

#### Step 2: Deploy Fabric Store
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import from GitHub: `varaku1012/tara-hub`
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `experiences/fabric-store`
   - **Build Command**: Override with `cd ../.. && npm install && cd experiences/fabric-store && npm run build`
   - **Output Directory**: `experiences/fabric-store/.next`
   - **Install Command**: Override with `echo 'Handled by build command'`
5. Add environment variables
6. Deploy

#### Step 3: Deploy Store Guide
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import from GitHub: `varaku1012/tara-hub`
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `experiences/store-guide`
   - **Build Command**: Override with `cd ../.. && npm install && cd experiences/store-guide && npm run build`
   - **Output Directory**: `experiences/store-guide/.next`
   - **Install Command**: Override with `echo 'Handled by build command'`
5. Add environment variables
6. Deploy

### Option 2: Using Vercel CLI

```bash
# Deploy Main Admin App
vercel --prod

# Deploy Fabric Store
cd experiences/fabric-store
vercel --prod --name tara-hub-fabric-store

# Deploy Store Guide
cd ../store-guide
vercel --prod --name tara-hub-store-guide
```

## Environment Variables Required

All apps need these environment variables:

```env
# Database
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...

# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-here

# Email (for magic links)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=admin@yourdomain.com

# Google OAuth (optional fallback)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Vercel KV (optional)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Cloudflare R2 (for image uploads)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

## Domain Configuration

After deployment, you'll have:

1. **Main Admin**: `tara-hub.vercel.app` or custom domain
2. **Fabric Store**: `tara-hub-fabric-store.vercel.app` or subdomain `store.yourdomain.com`
3. **Store Guide**: `tara-hub-store-guide.vercel.app` or subdomain `guide.yourdomain.com`

## Troubleshooting

### 404 Error Fix
If you get a 404 error, check:
1. Root directory is set correctly in Vercel project settings
2. Build command is appropriate for the app location
3. Output directory matches the actual build output

### Build Failures
1. Check that all environment variables are set
2. Verify npm install completes successfully
3. Check build logs for specific errors

### Monorepo Issues
- The fabric-store and store-guide apps depend on the root node_modules
- That's why their build commands include `cd ../.. && npm install`

## Automatic Deployments

Once set up, each push to the main branch will trigger deployments for all three apps automatically through Vercel's GitHub integration.