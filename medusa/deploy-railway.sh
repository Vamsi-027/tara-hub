#!/bin/bash

# =============================================================================
# Railway Deployment Script for Medusa v2 with Google OAuth
# =============================================================================

set -e

echo "🚀 Starting Railway deployment for Medusa..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Set Railway authentication token and project ID from environment
export RAILWAY_TOKEN="${RAILWAY_TOKEN:-b6194b15-4e51-4c96-914d-6f5574fb387e}"
export RAILWAY_PROJECT_ID="${RAILWAY_PROJECT_ID:-7d4ddac3-5123-4445-98cf-714ad52a324a}"

# Verify we're in the medusa directory
if [ ! -f "medusa-config.ts" ]; then
    echo "❌ This script must be run from the medusa directory"
    exit 1
fi

echo "🔗 Linking to Railway project..."

# Deploy to Railway with environment variables
echo "📦 Deploying to Railway with correct environment variables..."

# Set critical environment variables for Railway deployment
echo "🔐 Setting core configuration..."
railway variables \
  --set "MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app" \
  --set "MEDUSA_ADMIN_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app" \
  --set "NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app" \
  --set "GOOGLE_CALLBACK_URL=https://medusa-backend-production-3655.up.railway.app/auth/google/callback" \
  --set "GOOGLE_REDIRECT_URI=https://medusa-backend-production-3655.up.railway.app/admin/auth/google/callback" \
  --set "STORE_CORS=https://medusa-backend-production-3655.up.railway.app,http://localhost:3000,http://localhost:3006,http://localhost:3007,http://localhost:8000" \
  --set "ADMIN_CORS=https://medusa-backend-production-3655.up.railway.app,http://localhost:3000,http://localhost:7001,http://localhost:9000" \
  --set "AUTH_CORS=https://medusa-backend-production-3655.up.railway.app,http://localhost:3000,http://localhost:9000,http://localhost:8000" \
  --set "NODE_ENV=production" \
  --set "DISABLE_MEDUSA_ADMIN=false"

# Set Google OAuth credentials
echo "🔐 Setting up Google OAuth credentials..."
railway variables \
  --set "GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com" \
  --set "GOOGLE_CLIENT_SECRET=your-google-client-secret" \
  --set "GOOGLE_AUTO_CREATE_USERS=true" \
  --set "GOOGLE_DEFAULT_ROLE=admin"

# Set database and Redis URLs
echo "🗄️ Setting up database and Redis..."
railway variables \
  --set "DATABASE_URL=postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require" \
  --set "REDIS_URL=rediss://default:AZS6AAIncDFiY2Q2YzgwNTA0NmQ0OWJhYWJkNmU2MjBmMGZmNmVkMHAxMzgwNzQ@excited-emu-38074.upstash.io:6379"

# Set storage configuration (Cloudflare R2)
echo "☁️ Setting up Cloudflare R2 storage..."
railway variables \
  --set "S3_REGION=auto" \
  --set "S3_BUCKET_NAME=store" \
  --set "S3_ENDPOINT=https://53d24b2d4e898f68c085de59b5f1ca71.r2.cloudflarestorage.com" \
  --set "S3_ACCESS_KEY_ID=7706574044a6bd0b09bb1eff5eba68da" \
  --set "S3_SECRET_ACCESS_KEY=ce54d583a573e0b21015c423f625e5ef1258574ee55ff609b8f3b0b7747ef677" \
  --set "S3_FORCE_PATH_STYLE=true" \
  --set "S3_PUBLIC_URL=https://pub-24feed215a5e46e7b89260e44459ce21.r2.dev"

# Set JWT and security keys
echo "🔐 Setting up security keys..."
railway variables \
  --set "JWT_SECRET=PWsuM6Ax3UNl9IE9TNpvUGsm2Z+gHNhKD8oAuEU7BIo=" \
  --set "COOKIE_SECRET=PWsuM6Ax3UNl9IE9TNpvUGsm2Z+gHNhKD8oAuEU7BIo="

# Set email configuration (Resend)
echo "📧 Setting up email service..."
railway variables \
  --set "RESEND_API_KEY=re_C7yWWG1y_Fsxewcn1iUuraQx2bvb2a2Wf" \
  --set "RESEND_FROM_EMAIL=Tara Hub Admin <admin@deepcrm.ai>"

# Set admin credentials
echo "👤 Setting up admin credentials..."
railway variables \
  --set "MEDUSA_ADMIN_EMAIL=admin@tara-hub.com" \
  --set "MEDUSA_ADMIN_PASSWORD=supersecretpassword"

echo "🚀 Triggering Railway deployment..."

# Deploy to Railway
railway up --detach

echo "⏳ Waiting for deployment to complete..."
sleep 10

# Get deployment status
echo "📊 Checking deployment status..."
railway status

echo "✅ Deployment initiated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Wait for deployment to complete (check Railway dashboard)"
echo "2. Verify admin UI is accessible at: https://medusa-backend-production-3655.up.railway.app/app"
echo "3. Test Google OAuth login"
echo "4. Check logs with: railway logs"
echo ""
echo "🔗 Railway Project: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a"
echo "🌐 Admin URL: https://medusa-backend-production-3655.up.railway.app/app"