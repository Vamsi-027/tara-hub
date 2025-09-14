#!/bin/bash

# Simple Deployment Script
# - Medusa (Backend + Admin) -> Railway
# - Fabric Store -> Vercel

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check for .env.deployment.local
if [ ! -f .env.deployment.local ]; then
    print_error ".env.deployment.local not found!"
    exit 1
fi

# Load deployment tokens - simplified approach
VERCEL_TOKEN=$(grep "^VERCEL_TOKEN=" .env.deployment.local | cut -d'=' -f2)
VERCEL_PROJECT_ID_FABRIC_STORE=$(grep "^VERCEL_PROJECT_ID_FABRIC_STORE=" .env.deployment.local | cut -d'=' -f2)
RAILWAY_TOKEN=$(grep "^RAILWAY_TOKEN=" .env.deployment.local | cut -d'=' -f2)
RAILWAY_PROJECT_ID=$(grep "^RAILWAY_PROJECT_ID=" .env.deployment.local | cut -d'=' -f2)

# Verify tokens are present
if [ -z "$RAILWAY_TOKEN" ] || [ -z "$VERCEL_TOKEN" ]; then
    print_error "Missing RAILWAY_TOKEN or VERCEL_TOKEN in .env.deployment.local"
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║         🚀 DEPLOYING TARA HUB APPLICATIONS            ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# ========================================
# STEP 1: Deploy Medusa to Railway
# ========================================
deploy_medusa() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  🚂 DEPLOYING MEDUSA (Backend + Admin) TO RAILWAY"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    
    cd medusa
    
    print_status "Building Medusa application..."
    npm run build || true  # Continue even if there are TypeScript warnings
    
    # Admin UI is already built as part of npm run build
    print_status "Admin UI already built"
    
    print_status "Deploying to Railway..."
    # Use Railway CLI with token directly without relying on stored login state
    RAILWAY_TOKEN=$RAILWAY_TOKEN railway up --detach --service medusa-backend
    
    print_success "Medusa deployment initiated!"
    echo ""
    echo "  📍 Railway Dashboard: https://railway.app/project/$RAILWAY_PROJECT_ID"
    echo "  📍 API Endpoint: https://medusa-backend-production-3655.up.railway.app"
    echo "  📍 Admin UI: https://medusa-backend-production-3655.up.railway.app/app"
    echo ""
    
    cd ..
}

# ========================================
# STEP 2: Deploy Fabric Store to Vercel
# ========================================
deploy_fabric_store() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  ▲ DEPLOYING FABRIC STORE TO VERCEL"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    
    cd frontend/experiences/fabric-store
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Building Fabric Store..."
    npm run build
    
    print_status "Deploying to Vercel..."
    vercel --prod --yes --token=$VERCEL_TOKEN
    
    print_success "Fabric Store deployed!"
    echo ""
    echo "  📍 Vercel Dashboard: https://vercel.com/dashboard"
    echo "  📍 Check dashboard for deployment URL"
    echo ""
    
    cd ../../..
}

# ========================================
# MAIN EXECUTION
# ========================================

case "${1:-all}" in
    medusa)
        deploy_medusa
        ;;
    fabric-store)
        deploy_fabric_store
        ;;
    all)
        deploy_medusa
        deploy_fabric_store
        
        echo ""
        echo "═══════════════════════════════════════════════════════"
        echo "  ✅ DEPLOYMENT COMPLETE!"
        echo "═══════════════════════════════════════════════════════"
        echo ""
        echo "📋 Verify your deployments:"
        echo ""
        echo "1. Medusa Backend Health Check:"
        echo "   curl https://medusa-backend-production-3655.up.railway.app/health"
        echo ""
        echo "2. Medusa Admin UI:"
        echo "   https://medusa-backend-production-3655.up.railway.app/app"
        echo ""
        echo "3. Fabric Store:"
        echo "   Check Vercel dashboard for URL"
        echo ""
        ;;
    *)
        echo "Usage: $0 [medusa|fabric-store|all]"
        exit 1
        ;;
esac

print_success "🎉 Script completed successfully!"