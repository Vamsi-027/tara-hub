#!/bin/bash

echo "🚀 Deploying Medusa to Railway (Simple)"
echo "========================================"

# Navigate to medusa directory
cd medusa

# Build the project
echo "Building Medusa..."
npm run build

# Fix the public directory symlink issue
rm -f public/public 2>/dev/null

# Deploy using Railway CLI (already linked)
echo "Deploying to Railway..."
railway up

echo "✅ Deployment initiated!"
echo "Check build logs at: https://railway.app/dashboard"