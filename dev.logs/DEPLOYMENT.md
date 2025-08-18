# Vercel Deployment Guide for Multi-Experience Architecture

## Overview

This repository contains multiple independent Next.js applications that should be deployed as separate Vercel projects. Each experience runs independently with its own domain/subdomain.

## Project Structure

- **Main Admin App** (`/app`) → `admin.tara-hub.com`
- **Fabric Store** (`/experiences/fabric-store`) → `fabric.tara-hub.com`
- **Store Guide** (`/experiences/store-guide`) → `guide.tara-hub.com`

## Architecture Update: Turborepo + NPM Workspaces

The project now uses **Turborepo** with **NPM Workspaces** for optimal build performance and shared resource management:

- **Shared packages** in `/packages` folder (ui, lib, config)
- **Turborepo** for parallel builds and caching
- **NPM Workspaces** for dependency management
- **Zero duplication** of common components

## Deployment Methods

### Method 1: Vercel CLI (Recommended)

#### Prerequisites
```bash
npm i -g vercel
```

#### Deploy Main Admin App
```bash
# From repository root
cd C:\Users\varak\repos\tara-hub
vercel --prod

# When prompted:
# - Set up and deploy: Y
# - Which scope: [Your Vercel account]
# - Link to existing project: N
# - Project name: tara-hub-admin
# - Directory: ./
# - Override settings: N
```

#### Deploy Fabric Store
```bash
cd experiences/fabric-store
vercel --prod

# When prompted:
# - Project name: tara-hub-fabric-store
# - Directory: ./
```

#### Deploy Store Guide
```bash
cd experiences/store-guide
vercel --prod

# When prompted:
# - Project name: tara-hub-store-guide
# - Directory: ./
```

### Method 2: GitHub Integration with Monorepo

1. **Push to GitHub** (if not already)
```bash
git remote add origin https://github.com/yourusername/tara-hub.git
git push -u origin main
```

2. **Import in Vercel Dashboard**

#### For Admin App:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure:
   - **Project Name**: `tara-hub-admin`
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### For Fabric Store:
1. Import the SAME GitHub repository again
2. Configure:
   - **Project Name**: `tara-hub-fabric-store`
   - **Framework Preset**: Next.js
   - **Root Directory**: `experiences/fabric-store` ⚠️ IMPORTANT
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### For Store Guide:
1. Import the SAME GitHub repository again
2. Configure:
   - **Project Name**: `tara-hub-store-guide`
   - **Framework Preset**: Next.js
   - **Root Directory**: `experiences/store-guide` ⚠️ IMPORTANT
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Method 3: GitHub Actions Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_ADMIN_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./

  deploy-fabric-store:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_FABRIC_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./experiences/fabric-store

  deploy-store-guide:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_GUIDE_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./experiences/store-guide
```

## Environment Variables

Each Vercel project needs its own environment variables:

### Admin App (`tara-hub-admin`)
```env
NEXTAUTH_URL=https://admin.tara-hub.com
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
KV_REST_API_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-token
```

### Fabric Store (`tara-hub-fabric-store`)
```env
NEXT_PUBLIC_API_URL=https://admin.tara-hub.com/api
NEXT_PUBLIC_STORE_NAME=Fabric Store
KV_REST_API_URL=shared-kv-url
KV_REST_API_TOKEN=shared-kv-token
```

### Store Guide (`tara-hub-store-guide`)
```env
NEXT_PUBLIC_API_URL=https://admin.tara-hub.com/api
NEXT_PUBLIC_STORE_NAME=Store Guide
```

## Domain Configuration

After deployment, configure custom domains in Vercel:

1. **Admin App**: 
   - Go to Project Settings → Domains
   - Add `admin.tara-hub.com` or `app.tara-hub.com`

2. **Fabric Store**:
   - Go to Project Settings → Domains
   - Add `fabric.tara-hub.com` or `store.tara-hub.com`

3. **Store Guide**:
   - Go to Project Settings → Domains
   - Add `guide.tara-hub.com` or `help.tara-hub.com`

## Shared Resources Strategy

### Option 1: NPM Workspace (Current)
Keep shared components in the monorepo, each app builds with its own copy.

### Option 2: Private NPM Package
```json
// Create packages/shared-ui/package.json
{
  "name": "@tara-hub/shared-ui",
  "version": "1.0.0",
  "main": "index.js",
  "exports": {
    "./components": "./components/index.js",
    "./lib": "./lib/index.js"
  }
}
```

### Option 3: Git Submodules
```bash
# Create separate repo for shared components
git submodule add https://github.com/yourusername/tara-hub-shared.git shared
```

## Build Optimization

### Add turborepo for faster builds:

```json
// package.json (root)
{
  "scripts": {
    "build:all": "turbo run build",
    "dev:all": "turbo run dev --parallel",
    "deploy:admin": "vercel --prod",
    "deploy:fabric": "cd experiences/fabric-store && vercel --prod",
    "deploy:guide": "cd experiences/store-guide && vercel --prod"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Deployment Triggers

### Path-based Deployment (Recommended)

Configure in Vercel Dashboard → Project Settings → Git:

**Admin App** - Ignored Build Step:
```bash
git diff HEAD^ HEAD --quiet -- experiences/
```

**Fabric Store** - Ignored Build Step:
```bash
git diff HEAD^ HEAD --quiet -- app/ experiences/store-guide/
```

**Store Guide** - Ignored Build Step:
```bash
git diff HEAD^ HEAD --quiet -- app/ experiences/fabric-store/
```

This ensures:
- Admin app only rebuilds when root or `/app` changes
- Fabric store only rebuilds when its directory changes
- Store guide only rebuilds when its directory changes

## Monitoring & Analytics

Each Vercel project gets its own:
- Analytics dashboard
- Performance monitoring
- Error tracking
- Usage metrics

Enable in each project:
1. Go to Project Settings → Analytics
2. Enable Web Analytics
3. Enable Speed Insights

## Cost Optimization

### Pro Tips:
1. **Use Edge Functions** for shared API routes
2. **Enable ISR** for static content with revalidation
3. **Share Vercel KV** instance across projects (same tokens)
4. **Use Vercel Blob** for shared media storage
5. **Configure spending limits** per project

## Troubleshooting

### Common Issues:

1. **Build fails due to missing dependencies**
   - Ensure each experience has its own package.json
   - Run `npm install` in each directory locally first

2. **Shared components not found**
   - Check relative import paths
   - Consider using TypeScript path aliases

3. **Environment variables not working**
   - Add them in Vercel Dashboard
   - Redeploy after adding variables

4. **Domain routing issues**
   - Check DNS propagation
   - Verify domain ownership in Vercel

## Rollback Strategy

Each project can be rolled back independently:
```bash
# List deployments
vercel ls tara-hub-admin

# Rollback to previous
vercel rollback [deployment-url]
```

## CI/CD Best Practices

1. **Use Preview Deployments** for PRs
2. **Set up staging environments** per project
3. **Configure deployment protection** for production
4. **Use Vercel CLI in CI** for controlled deployments
5. **Monitor build times** and optimize as needed

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Monorepo Guide](https://vercel.com/docs/monorepos)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)