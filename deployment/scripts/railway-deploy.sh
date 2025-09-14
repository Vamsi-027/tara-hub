#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Load tokens
if [ ! -f .env.deployment.local ]; then
    print_error ".env.deployment.local not found!"
    exit 1
fi

RAILWAY_TOKEN=$(grep "^RAILWAY_TOKEN=" .env.deployment.local | cut -d'=' -f2)
RAILWAY_PROJECT_ID=$(grep "^RAILWAY_PROJECT_ID=" .env.deployment.local | cut -d'=' -f2)

echo ""
echo "🚂 RAILWAY DEPLOYMENT"
echo ""

cd medusa

print_status "Building Medusa..."
npm run build || true

print_status "Attempting deployment..."

# Deploy to medusa-backend service
if RAILWAY_TOKEN=$RAILWAY_TOKEN railway up --detach --service medusa-backend; then
    print_success "Deployed to medusa-backend service"
else
    print_error "Deployment failed. Check Railway logs for details"
    echo "Dashboard: https://railway.app/project/$RAILWAY_PROJECT_ID"
    exit 1
fi

print_success "Deployment initiated!"
echo "Dashboard: https://railway.app/project/$RAILWAY_PROJECT_ID"
