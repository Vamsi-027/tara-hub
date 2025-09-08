# 🔐 Environment Variables Management Guide

This guide explains how to manage environment variables for Vercel deployments using the automated scripts.

## 📋 Overview

The environment variables management system helps you:
- Extract variables from `.env.local` files
- Generate templates for each app
- Push variables to Vercel projects
- Pull variables from Vercel
- Validate environment setup
- Prepare CI/CD environment files

## 🚀 Quick Start

### 1. Generate Templates from .env.local
```bash
npm run env:generate
```
This creates environment templates for each app in `deployment/vercel/configs/env-templates/`

### 2. Push Variables to Vercel
```bash
# Push to all apps (development)
npm run env:push

# Push to specific app
npm run env:push admin production
npm run env:push fabric-store development
npm run env:push store-guide development
```

### 3. Deploy with Environment Variables
```bash
# Deploy with automatic env sync
npm run deploy:with-env

# Production deployment with env sync
npm run deploy:prod-with-env
```

## 🛠 Detailed Usage

### Interactive Management
```bash
npm run env:manage
```
This opens an interactive menu with options:
1. Load from .env.local and generate templates
2. Push variables to Vercel (specific project)
3. Pull variables from Vercel
4. Generate CI/CD env file
5. Push all variables to all projects
6. Validate environment setup

### Command Line Usage
```bash
# Generate templates
node deployment/vercel/scripts/manage-env-vars.js generate

# Push to specific project
node deployment/vercel/scripts/manage-env-vars.js push admin production
node deployment/vercel/scripts/manage-env-vars.js push fabric-store development

# Pull from Vercel
node deployment/vercel/scripts/manage-env-vars.js pull admin development

# Validate setup
node deployment/vercel/scripts/manage-env-vars.js validate

# Generate CI/CD file
node deployment/vercel/scripts/manage-env-vars.js ci
```

## 📊 Environment Variable Categories

### Authentication
- `NEXTAUTH_URL` - Base URL for authentication
- `NEXTAUTH_SECRET` - JWT secret (generate with: `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

### Database (PostgreSQL)
- `DATABASE_URL` - Primary database connection string
- `POSTGRES_URL` - Alternative database URL
- `POSTGRES_URL_NON_POOLING` - Non-pooling connection
- `POSTGRES_USER` - Database username
- `POSTGRES_HOST` - Database host
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DATABASE` - Database name

### Redis/KV Cache
- `KV_REST_API_URL` - Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Vercel KV token
- `KV_REST_API_READ_ONLY_TOKEN` - Read-only token
- `KV_URL` - Redis connection URL
- `REDIS_URL` - Alternative Redis URL
- `UPSTASH_REDIS_REST_URL` - Upstash REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash token

### Email Service (Resend)
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - From email address
- `EMAIL_SERVER_USER` - SMTP user
- `EMAIL_SERVER_PASSWORD` - SMTP password
- `EMAIL_SERVER_HOST` - SMTP host
- `EMAIL_SERVER_PORT` - SMTP port
- `EMAIL_FROM` - From email (legacy)

### Cloudflare R2 Storage
- `R2_BUCKET` - Bucket name
- `S3_URL` - S3-compatible endpoint
- `R2_ACCESS_KEY_ID` - Access key ID
- `R2_SECRET_ACCESS_KEY` - Secret access key
- `R2_ACCOUNT_ID` - Account ID

## 🎯 App-Specific Requirements

### Admin Dashboard
**Required:** Authentication, Database, Redis, Email, Storage
**Optional:** Stack Auth

### Fabric Store
**Required:** Database, Redis
**Optional:** Authentication

### Store Guide
**Required:** Database
**Optional:** Redis

## 📁 Generated Files

### Environment Templates
Located in `deployment/vercel/configs/env-templates/`:
- `admin.env.template` - Admin app variables
- `fabric-store.env.template` - Fabric store variables
- `store-guide.env.template` - Store guide variables
- `ci.env` - CI/CD environment template

### Pulled Environment Files
When pulling from Vercel:
- `admin.env.development`
- `admin.env.production`
- `fabric-store.env.development`
- `fabric-store.env.production`
- `store-guide.env.development`
- `store-guide.env.production`

## 🔄 Deployment Integration

### Deploy with Environment Sync
```bash
# Preview deployment with env sync
npm run deploy:with-env

# Production deployment with env sync
npm run deploy:prod-with-env

# Using deploy-all script directly
node deployment/vercel/scripts/deploy-all.js --with-env --prod --parallel
```

### Manual Deployment Steps
1. Validate environment setup: `npm run env:validate`
2. Push variables to Vercel: `npm run env:push`
3. Deploy applications: `npm run deploy:prod`

## 🔒 Security Best Practices

1. **Never commit `.env.local` files** to version control
2. **Use different secrets** for development and production
3. **Rotate secrets regularly**, especially `NEXTAUTH_SECRET`
4. **Use read-only tokens** where possible
5. **Limit environment variable access** to necessary team members
6. **Store secrets in CI/CD** secret managers, not in code

## 🐛 Troubleshooting

### Variables not appearing in Vercel
- Ensure you're linked to the correct project: `vercel link`
- Check if you have permission to manage env vars
- Verify the correct environment (development/production)

### Deployment failing due to missing variables
- Run validation: `npm run env:validate`
- Check app-specific requirements in this guide
- Ensure all required categories are configured

### CI/CD environment issues
- Generate CI template: `node deployment/vercel/scripts/manage-env-vars.js ci`
- Add secrets to GitHub/GitLab secrets
- Use the generated template as reference

## 📝 Example Workflow

### Initial Setup
```bash
# 1. Create .env.local with all variables
cp .env.example .env.local
# Edit .env.local with your values

# 2. Generate templates
npm run env:generate

# 3. Validate setup
npm run env:validate

# 4. Push to Vercel
npm run env:push

# 5. Deploy with env sync
npm run deploy:prod-with-env
```

### Updating Variables
```bash
# 1. Update .env.local

# 2. Push updated variables
npm run env:push admin production

# 3. Redeploy
npm run deploy:admin
```

### Team Collaboration
```bash
# 1. Pull variables from Vercel
npm run env:pull admin development

# 2. Share template files (not actual values)
# Located in deployment/vercel/configs/env-templates/

# 3. Team members can use templates as reference
```

## 🎯 Best Practices

1. **Use templates** for documentation and onboarding
2. **Validate before deployment** to catch missing variables
3. **Use --with-env flag** for automated deployments
4. **Keep local and Vercel in sync** using push/pull commands
5. **Document custom variables** in your project README
6. **Use environment-specific values** (dev vs prod URLs)

## 🔗 Related Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Vercel Documentation](https://vercel.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)