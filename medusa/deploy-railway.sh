#!/bin/bash

echo "🚀 Deploying Medusa to Railway..."

# Set Railway environment variables
export RAILWAY_TOKEN="9d1ca706-d735-4a7c-bc65-f571111b8141"

# Build the project first
echo "📦 Building Medusa..."
npm run build

# Since Railway CLI has auth issues, we'll use git push to trigger deployment
echo "🔄 Pushing to GitHub to trigger Railway deployment..."

# Add all changes
git add -A

# Commit changes
git commit -m "deploy: update Medusa backend with order persistence fixes" || true

# Push to main branch (Railway will auto-deploy from GitHub)
git push origin main

echo "✅ Deployment triggered!"
echo ""
echo "📝 Railway will automatically deploy from the GitHub repository"
echo "🔗 Monitor deployment at: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a"
echo ""
echo "🌐 Once deployed, the Medusa backend will be available at:"
echo "   https://medusa-production-4e88.up.railway.app"
echo ""
echo "⏳ Please wait a few minutes for deployment to complete"
echo "   Then verify at: https://medusa-production-4e88.up.railway.app/health"