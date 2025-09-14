# Vercel Deployment Configuration

This directory contains all Vercel deployment configurations for the Fabric Store application.

## Files

### `project.json`
Main Vercel project configuration with:
- Project ID: `prj_1Z6WNwHAxrLIylgChrHnLVJGQvNw`
- Framework: Next.js
- Root Directory: `frontend/experiences/fabric-store`
- Build settings

### `fabric-store.vercel.json`
Vercel build configuration that should be in the fabric-store directory.
Contains:
- Framework settings
- Region configuration (iad1)
- Basic environment variables

### `env-production.json`
Template for production environment variables. 
Replace `@secret_name` placeholders with actual values in Vercel dashboard.

### `.vercelignore`
Files to exclude from Vercel deployment.

## Deployment Process

The deployment scripts in `../scripts/` use these configurations to:
1. Navigate to `frontend/experiences/fabric-store/`
2. Build the Next.js application
3. Deploy to Vercel using the token from `.env.deployment.local`
4. Apply environment variables from `env-production.json`

## Environment Variables

Set these in Vercel Dashboard (Settings → Environment Variables):

**Public Variables (Client-side):**
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_BASE_URL`

**Secret Variables (Server-side):**
- `STRIPE_SECRET_KEY`
- `RESEND_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `SANITY_API_TOKEN`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Quick Deploy

From root directory:
```bash
npm run deploy:fabric-store
```

Or manually:
```bash
cd frontend/experiences/fabric-store
vercel --prod --token=$VERCEL_TOKEN
```