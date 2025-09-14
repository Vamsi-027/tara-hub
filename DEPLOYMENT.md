# 🚀 Tara Hub Deployment Guide

## Overview

This document consolidates all deployment configurations and processes for the Tara Hub platform.

## 📦 Current Deployment Architecture

### **1. Medusa Backend (Railway)**
- **Platform**: Railway
- **URL**: https://medusa-backend-production-3655.up.railway.app
- **Config Files**:
  - `medusa/Dockerfile` - Production Docker image
  - `medusa/railway.json` - Railway build configuration
  - `medusa/railway.toml` - Railway deployment settings
  - `medusa/.railway/config.json` - Project linking

### **2. Main Admin Dashboard (Vercel)**
- **Platform**: Vercel
- **URL**: https://tara-hub.vercel.app
- **Config Files**:
  - `vercel.json` - Root Vercel configuration
  - `deployment/vercel/configs/vercel-root.json`

### **3. Experience Apps (Vercel)**
- **Fabric Store**: Port 3006
  - Config: `frontend/experiences/fabric-store/vercel.json`
- **Store Guide**: Port 3007
  - Config: `frontend/experiences/store-guide/vercel.json`

### **4. Sanity Studio**
- **Command**: `npm run deploy` (in sanity-studio directory)

## 🛠️ Deployment Commands

### Production Deployments
```bash
# Deploy all apps to Vercel
npm run deploy:prod

# Deploy specific apps
npm run deploy:admin          # Admin dashboard
npm run deploy:fabric-store   # Fabric store experience
npm run deploy:store-guide    # Store guide experience

# Medusa deployment (Railway - auto-deploys on git push)
git push origin main
```

### Environment Management
```bash
# Manage environment variables
npm run env:manage

# Validate environment setup
npm run env:validate
```

## 🐳 Local Development with Docker

### Docker Compose Setup
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up postgres redis -d

# Stop all services
docker-compose down
```

### Development Dockerfiles
- `Dockerfile.dev` - Root admin development container
- `medusa/Dockerfile.dev` - Medusa backend development container

## 🔧 Configuration Files

### Active Deployment Files
```
deployment/
├── vercel/
│   ├── configs/           # Vercel project configs
│   ├── scripts/           # Deployment automation
│   │   ├── deploy-all.js
│   │   ├── deploy-admin.js
│   │   ├── deploy-fabric-store.js
│   │   └── deploy-store-guide.js
│   └── docs/
│       └── deploy-to-vercel.md

medusa/
├── Dockerfile             # Production build
├── Dockerfile.dev         # Development build
├── railway.json          # Railway config
├── railway.toml          # Railway settings
└── .railway/
    └── config.json       # Project linking
```

## 📝 Environment Variables

### Required for Deployment
```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=rediss://...

# Medusa Backend
MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app

# Security
JWT_SECRET=...
COOKIE_SECRET=...

# Fabric CDN
FABRIC_CDN_PREFIX=https://cdn.deepcrm.ai

# Deployment Tokens (if manual deployment needed)
RAILWAY_TOKEN=...
RAILWAY_PROJECT_ID=...
VERCEL_TOKEN=...
```

## 🔄 Deployment Process

### Railway (Medusa Backend)
1. **Automatic**: Pushes to `main` branch trigger deployment
2. **Manual**: Use Railway dashboard at https://railway.app/project/[PROJECT_ID]

### Vercel (Frontend Apps)
1. **Automatic**: Connected to GitHub, deploys on push
2. **Manual**: Use `npm run deploy:[app-name]` commands

## 🧹 Cleanup Notes

The following files have been removed as they were redundant or unused:
- Duplicate Railway deployment scripts in medusa/
- Unused Dockerfiles in app/ and frontend/admin/
- Temporary test scripts
- Redundant Vercel configurations

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [MedusaJS Deployment Guide](https://docs.medusajs.com/deployment)