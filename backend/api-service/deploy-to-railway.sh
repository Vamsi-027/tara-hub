#!/bin/bash

# Railway Deployment Script for Tara Hub API Service
# This script deploys the standalone API service to Railway

echo "🚂 Tara Hub API Service - Railway Deployment"
echo "==========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found!"
    echo "Please install it first:"
    echo "  npm install -g @railway/cli"
    echo "  or"
    echo "  curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    echo "  Setting $key..."
    railway variables set "$key=$value" 2>/dev/null
}

# Parse command line arguments
ENVIRONMENT="production"
SKIP_ENV=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --staging)
            ENVIRONMENT="staging"
            shift
            ;;
        --skip-env)
            SKIP_ENV=true
            shift
            ;;
        --help)
            echo "Usage: ./deploy-to-railway.sh [options]"
            echo ""
            echo "Options:"
            echo "  --staging     Deploy to staging environment"
            echo "  --skip-env    Skip environment variable setup"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run './deploy-to-railway.sh --help' for usage"
            exit 1
            ;;
    esac
done

echo "Environment: $ENVIRONMENT"
echo ""

# Step 1: Login to Railway (if needed)
echo "📝 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Step 2: Link to Railway project
echo ""
echo "🔗 Linking to Railway project..."
if [ ! -f ".railway/config.json" ]; then
    echo "No Railway project linked. Please select or create one:"
    railway link
else
    echo "Already linked to a Railway project"
fi

# Step 3: Set environment variables (if not skipped)
if [ "$SKIP_ENV" = false ]; then
    echo ""
    echo "🔐 Setting environment variables..."
    
    # Check if .env file exists
    if [ -f ".env" ]; then
        echo "Loading variables from .env file..."
        
        # Read .env file and set variables
        while IFS='=' read -r key value; do
            # Skip comments and empty lines
            if [[ ! "$key" =~ ^# ]] && [ -n "$key" ]; then
                # Remove quotes from value
                value="${value%\"}"
                value="${value#\"}"
                value="${value%\'}"
                value="${value#\'}"
                
                # Don't set Railway-provided variables
                if [[ ! "$key" =~ ^RAILWAY_ ]] && [[ ! "$key" = "PORT" ]]; then
                    set_env_var "$key" "$value"
                fi
            fi
        done < .env
        
        echo "✅ Environment variables configured"
    else
        echo "⚠️  No .env file found"
        echo "Please set environment variables manually in Railway dashboard"
        echo "Copy from .env.example for reference"
    fi
    
    # Set NODE_ENV
    echo "  Setting NODE_ENV=$ENVIRONMENT..."
    railway variables set "NODE_ENV=$ENVIRONMENT"
fi

# Step 4: Add Railway services (if needed)
echo ""
echo "🔌 Checking Railway services..."
echo "Make sure you have added these services in Railway dashboard:"
echo "  - PostgreSQL (for database)"
echo "  - Redis (optional, for caching)"
echo ""
echo "Press Enter to continue..."
read

# Step 5: Deploy to Railway
echo ""
echo "🚀 Deploying to Railway..."
railway up

# Step 6: Show deployment info
echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📊 Useful commands:"
echo "  railway logs          - View application logs"
echo "  railway open          - Open in browser"
echo "  railway status        - Check deployment status"
echo "  railway variables     - View environment variables"
echo "  railway domain        - Get deployment URL"
echo ""

# Get deployment URL
echo "🌐 Getting deployment URL..."
DEPLOYMENT_URL=$(railway domain 2>/dev/null || echo "Run 'railway domain' to get URL")
echo "URL: $DEPLOYMENT_URL"
echo ""

echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check deployment status: railway status"
echo "2. View logs: railway logs"
echo "3. Test health endpoint: curl $DEPLOYMENT_URL/health"
echo "4. Update Next.js app with API URL in .env.local:"
echo "   RAILWAY_API_URL=$DEPLOYMENT_URL"