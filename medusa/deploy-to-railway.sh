#!/bin/bash

# Railway Deployment Script for Medusa v2 Backend
# Usage: ./deploy-to-railway.sh

set -e

echo "🚂 Starting Railway deployment for Medusa backend..."

# Check if RAILWAY_TOKEN exists
if [ -z "$RAILWAY_TOKEN" ]; then
    echo "❌ Error: RAILWAY_TOKEN environment variable is not set"
    echo "Please add RAILWAY_TOKEN to your .env.local file or export it"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Installing..."
    npm install -g @railway/cli
fi

echo "✅ Railway CLI found"

# Login to Railway using token (non-interactive)
echo "🔐 Setting up Railway authentication..."
export RAILWAY_TOKEN

# Check if already authenticated
if railway whoami > /dev/null 2>&1; then
    echo "✅ Already authenticated with Railway"
else
    echo "❌ Not authenticated with Railway"
    echo "Please run 'railway login' manually and then re-run this script"
    exit 1
fi

# Check if we're already linked to a project
if [ ! -f .railway/config.json ]; then
    echo "🔗 No Railway project linked. Creating new project..."
    railway init
else
    echo "✅ Railway project already linked"
fi

# Add databases if they don't exist
echo "🗄️ Setting up databases..."
railway add --database postgres || echo "PostgreSQL might already exist"
railway add --database redis || echo "Redis might already exist"

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up --detach

echo "✅ Deployment initiated!"
echo "📋 Next steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Monitor deployment logs: railway logs"
echo "3. Check service status: railway status"
echo ""
echo "🌐 Your Railway project dashboard:"
echo "https://railway.app/dashboard"