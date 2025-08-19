#!/bin/bash

# Setup Environment Variables for All Vercel Projects
# This script configures environment variables across all three Vercel deployments

set -e

echo "🔧 Vercel Multi-Project Environment Setup"
echo "========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local file not found!${NC}"
    echo "Please create .env.local from .env.example first"
    exit 1
fi

# Function to setup environment for a project
setup_project_env() {
    local PROJECT_DIR=$1
    local PROJECT_NAME=$2
    local APP_NAME=$3
    
    echo -e "\n${BLUE}📦 Setting up: ${PROJECT_NAME}${NC}"
    echo "----------------------------------------"
    
    # Navigate to project directory
    cd "$PROJECT_DIR"
    
    # Check if project is linked to Vercel
    if ! vercel whoami > /dev/null 2>&1; then
        echo -e "${RED}❌ Not logged in to Vercel${NC}"
        echo "Run: vercel login"
        exit 1
    fi
    
    # Link project if not linked
    if [ ! -f ".vercel/project.json" ]; then
        echo -e "${YELLOW}⚠️  Project not linked to Vercel${NC}"
        echo "Linking project..."
        vercel link --yes || {
            echo -e "${RED}Failed to link project${NC}"
            return 1
        }
    fi
    
    echo "Setting environment variables..."
    
    # Read .env.local and set each variable
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove quotes if present
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        # Set for all environments (development, preview, production)
        echo -n "  Setting $key... "
        
        # Use echo to pipe the value to avoid interactive prompt
        echo "$value" | vercel env add "$key" production --force > /dev/null 2>&1 || true
        echo "$value" | vercel env add "$key" preview --force > /dev/null 2>&1 || true
        echo "$value" | vercel env add "$key" development --force > /dev/null 2>&1 || true
        
        echo -e "${GREEN}✓${NC}"
    done < "../../../.env.local"
    
    # Add app-specific public variables
    echo -n "  Setting NEXT_PUBLIC_APP_NAME... "
    echo "$APP_NAME" | vercel env add NEXT_PUBLIC_APP_NAME production --force > /dev/null 2>&1 || true
    echo "$APP_NAME" | vercel env add NEXT_PUBLIC_APP_NAME preview --force > /dev/null 2>&1 || true
    echo "$APP_NAME" | vercel env add NEXT_PUBLIC_APP_NAME development --force > /dev/null 2>&1 || true
    echo -e "${GREEN}✓${NC}"
    
    # Return to root
    cd - > /dev/null
    
    echo -e "${GREEN}✅ ${PROJECT_NAME} environment configured${NC}"
}

# Main execution
echo -e "${YELLOW}This script will configure environment variables for:${NC}"
echo "  1. tara-hub (Admin Dashboard)"
echo "  2. tara-hub-fabric-store (Fabric Store)" 
echo "  3. tara-hub-store-guide (Store Guide)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Setup each project
setup_project_env "." "tara-hub (Admin)" "Admin Dashboard"
setup_project_env "experiences/fabric-store" "tara-hub-fabric-store" "Fabric Store"
setup_project_env "experiences/store-guide" "tara-hub-store-guide" "Store Guide"

echo -e "\n${GREEN}✨ All projects configured successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify with: vercel env ls"
echo "  2. Deploy with: npm run deploy:all"
echo ""
echo -e "${BLUE}Production URLs:${NC}"
echo "  • Admin: https://tara-hub.vercel.app"
echo "  • Fabric Store: https://tara-hub-fabric-store.vercel.app"
echo "  • Store Guide: https://tara-hub-store-guide.vercel.app"