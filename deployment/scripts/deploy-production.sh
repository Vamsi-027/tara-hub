#!/bin/bash

# Production Deployment Script for Tara Hub
# Deploys Medusa to Railway and Fabric Store to Vercel

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if .env.deployment.local exists
if [ ! -f .env.deployment.local ]; then
    print_error ".env.deployment.local not found!"
    echo ""
    echo "Please create .env.deployment.local with the following content:"
    echo ""
    cat << 'EOF'
# Vercel
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here
VERCEL_PROJECT_ID_FABRIC_STORE=your_fabric_store_project_id

# Railway
RAILWAY_TOKEN=your_railway_token_here
RAILWAY_PROJECT_ID=your_railway_project_id_here
EOF
    exit 1
fi

# Load deployment tokens
export $(cat .env.deployment.local | grep -v '^#' | xargs)

# Verify required tokens
MISSING_VARS=()
[ -z "$VERCEL_TOKEN" ] && MISSING_VARS+=("VERCEL_TOKEN")
[ -z "$RAILWAY_TOKEN" ] && MISSING_VARS+=("RAILWAY_TOKEN")

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables in .env.deployment.local:"
    printf '%s\n' "${MISSING_VARS[@]}"
    exit 1
fi

# Function to check if CLI tool is installed
check_cli() {
    if ! command -v $1 &> /dev/null; then
        print_warning "$1 CLI not found. Installing..."
        npm install -g $2
    else
        print_status "$1 CLI is installed"
    fi
}

# Function to deploy Medusa to Railway
deploy_medusa() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "   🚂 DEPLOYING MEDUSA BACKEND TO RAILWAY"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    
    # Check Railway CLI
    check_cli "railway" "@railway/cli"
    
    cd medusa
    
    print_status "Building Medusa application..."
    npm run build || {
        print_error "Build failed! Check the error messages above."
        cd ..
        return 1
    }
    
    print_status "Deploying to Railway..."
    
    # Deploy using Railway CLI with token
    RAILWAY_TOKEN=$RAILWAY_TOKEN railway up --detach || {
        print_error "Railway deployment failed!"
        cd ..
        return 1
    }
    
    print_success "Medusa deployment initiated successfully!"
    print_status "Check deployment status at: https://railway.app/project/$RAILWAY_PROJECT_ID"
    
    cd ..
    return 0
}

# Function to deploy Fabric Store to Vercel
deploy_fabric_store() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "   ▲ DEPLOYING FABRIC STORE TO VERCEL"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    
    # Check Vercel CLI
    check_cli "vercel" "vercel"
    
    cd frontend/experiences/fabric-store
    
    print_status "Installing dependencies..."
    npm install
    
    print_status "Building Fabric Store application..."
    npm run build || {
        print_error "Build failed! Check the error messages above."
        cd ../../..
        return 1
    }
    
    print_status "Deploying to Vercel..."
    
    # Deploy to production using Vercel CLI with token
    vercel --prod --yes --token=$VERCEL_TOKEN || {
        print_error "Vercel deployment failed!"
        cd ../../..
        return 1
    }
    
    print_success "Fabric Store deployed successfully!"
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --token=$VERCEL_TOKEN 2>/dev/null | grep "fabric-store" | head -1 | awk '{print $2}')
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        print_status "Deployment URL: https://$DEPLOYMENT_URL"
    fi
    
    cd ../../..
    return 0
}

# Function to verify deployments
verify_deployments() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "   ✅ VERIFYING DEPLOYMENTS"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    
    # Test Medusa health endpoint
    print_status "Testing Medusa health endpoint..."
    if curl -f -s https://medusa-backend-production-3655.up.railway.app/health > /dev/null; then
        print_success "Medusa backend is healthy!"
    else
        print_warning "Medusa health check failed - deployment may still be in progress"
    fi
    
    print_status "Deployments completed. Please verify manually:"
    echo ""
    echo "  📍 Medusa Backend:"
    echo "     Dashboard: https://railway.app/project/$RAILWAY_PROJECT_ID"
    echo "     API: https://medusa-backend-production-3655.up.railway.app"
    echo "     Admin: https://medusa-backend-production-3655.up.railway.app/app"
    echo ""
    echo "  📍 Fabric Store:"
    echo "     Dashboard: https://vercel.com/dashboard"
    echo "     App: Check Vercel dashboard for URL"
}

# Main execution
main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║       🚀 TARA HUB PRODUCTION DEPLOYMENT SCRIPT        ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    
    # Parse command line arguments
    case "${1:-all}" in
        medusa)
            deploy_medusa
            ;;
        fabric-store)
            deploy_fabric_store
            ;;
        all)
            deploy_medusa
            if [ $? -eq 0 ]; then
                deploy_fabric_store
                if [ $? -eq 0 ]; then
                    verify_deployments
                fi
            fi
            ;;
        *)
            echo "Usage: $0 [medusa|fabric-store|all]"
            echo ""
            echo "Examples:"
            echo "  $0 all          # Deploy both Medusa and Fabric Store"
            echo "  $0 medusa       # Deploy only Medusa backend"
            echo "  $0 fabric-store # Deploy only Fabric Store"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "🎉 Deployment script completed!"
    echo ""
    echo "📋 Post-Deployment Checklist:"
    echo "   [ ] Check Railway logs for Medusa"
    echo "   [ ] Check Vercel logs for Fabric Store"
    echo "   [ ] Test API endpoints"
    echo "   [ ] Verify database connections"
    echo "   [ ] Test user authentication"
    echo "   [ ] Monitor for errors in the first 10 minutes"
}

# Run main function
main "$@"