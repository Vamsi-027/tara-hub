#!/bin/bash

echo "🚀 Deploying Medusa to Railway..."

# Set Railway environment variables
export RAILWAY_TOKEN="9d1ca706-d735-4a7c-bc65-f571111b8141"
export RAILWAY_PROJECT_ID="7d4ddac3-5123-4445-98cf-714ad52a324a"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚂 Railway Deployment for Medusa Backend${NC}"
echo "========================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Railway CLI...${NC}"

    # Install Railway CLI based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        curl -fsSL https://railway.app/install.sh | sh
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://railway.app/install.sh | sh
    else
        echo -e "${RED}Please install Railway CLI from https://docs.railway.app/cli/installation${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Railway CLI available${NC}"

# Build the project first
echo -e "${YELLOW}📦 Building Medusa locally...${NC}"
npm run build || {
    echo -e "${RED}❌ Build failed! Fix errors before deploying.${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build successful${NC}"

# Deploy using Railway CLI or Git
echo -e "${YELLOW}🚀 Deploying to Railway...${NC}"

# Try Railway CLI first
if railway up --detach 2>/dev/null; then
    echo -e "${GREEN}✅ Deployed via Railway CLI${NC}"
else
    # Fallback to Git deployment
    echo -e "${YELLOW}📡 Using Git deployment...${NC}"

    # Add all changes
    git add -A

    # Commit changes
    git commit -m "deploy: Medusa backend with checkout implementation" || true

    # Push to main branch (Railway will auto-deploy from GitHub)
    git push origin main

    echo -e "${GREEN}✅ Deployment triggered via Git${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment initiated successfully!${NC}"
echo ""
echo "📝 Deployment Details:"
echo "   Project ID: $RAILWAY_PROJECT_ID"
echo "   Dashboard: https://railway.app/project/$RAILWAY_PROJECT_ID"
echo "   Logs: https://railway.app/project/$RAILWAY_PROJECT_ID/logs"
echo ""
echo "🌐 Once deployed, your Medusa backend will be available at:"
echo "   https://medusa-backend-production-3655.up.railway.app"
echo ""
echo "📊 Endpoints to verify:"
echo "   Health: https://medusa-backend-production-3655.up.railway.app/health"
echo "   Admin: https://medusa-backend-production-3655.up.railway.app/app"
echo "   Store API: https://medusa-backend-production-3655.up.railway.app/store"
echo ""
echo -e "${YELLOW}⏳ Deployment typically takes 5-10 minutes${NC}"
echo "   Monitor progress in the Railway dashboard"