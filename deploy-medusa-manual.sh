#!/bin/bash

# Manual Medusa deployment to Railway
echo "🚀 Deploying Medusa to Railway (Manual)"
echo "========================================"

# Set Railway tokens
export RAILWAY_TOKEN="05a1a4ba-8f3c-461a-ad07-6c8e8e80c7e8"
export RAILWAY_PROJECT_TOKEN="3bf6e5e8-beff-4a72-a55f-16b3c825f937"

# Link to project
echo "Linking to Railway project..."
railway link -p 3bf6e5e8-beff-4a72-a55f-16b3c825f937

# Deploy to medusa-backend service
echo "Deploying to medusa-backend service..."
railway up --service medusa-backend

echo "✅ Deployment initiated!"
echo "Check status at: https://railway.app/dashboard"