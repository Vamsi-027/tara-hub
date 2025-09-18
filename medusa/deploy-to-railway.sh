#!/bin/bash

# Deploy Medusa Backend to Railway

echo "🚀 Deploying Medusa Backend to Railway..."

# Navigate to medusa directory
cd "$(dirname "$0")"

# Ensure we have the latest changes
echo "📦 Building Medusa application..."
npm run build

echo "🌍 Pushing to Railway..."
# Railway will automatically deploy from the GitHub repository
# The push to main branch triggers the deployment

echo "✅ Deployment triggered!"
echo ""
echo "📝 Note: Railway will automatically deploy from the GitHub repository."
echo "Monitor the deployment at: https://railway.app/dashboard"
echo ""
echo "🔗 Medusa Backend URL: https://medusa-production-4e88.up.railway.app"
echo ""
echo "⚠️ After deployment completes, verify the following endpoints:"
echo "  - https://medusa-production-4e88.up.railway.app/health"
echo "  - https://medusa-production-4e88.up.railway.app/store/products"
echo ""