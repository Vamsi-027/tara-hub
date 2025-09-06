#!/bin/bash

# Post-Deployment Verification Script for Medusa on Railway
# Usage: ./verify-deployment.sh

set -e

echo "🔍 Starting post-deployment verification..."

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first."
    exit 1
fi

# Get deployment status
echo "📊 Checking Railway service status..."
railway status

echo ""
echo "📋 Checking recent deployment logs..."
railway logs --lines 50

# Get the Railway domain
RAILWAY_DOMAIN=$(railway status | grep -o "https://.*\.up\.railway\.app" | head -n1)

if [ -z "$RAILWAY_DOMAIN" ]; then
    echo "⚠️ Could not detect Railway domain. Please check Railway dashboard."
    RAILWAY_DOMAIN="https://your-app.up.railway.app"
fi

echo ""
echo "🌐 Detected Railway domain: $RAILWAY_DOMAIN"

# Health check function
check_endpoint() {
    local url=$1
    local description=$2
    
    echo "🔍 Testing $description: $url"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url" || echo "000")
    
    case $response in
        200)
            echo "✅ $description is accessible (HTTP $response)"
            ;;
        404)
            echo "⚠️ $description returned 404 - endpoint might not exist"
            ;;
        500|502|503|504)
            echo "❌ $description returned server error (HTTP $response)"
            return 1
            ;;
        000)
            echo "❌ $description is not accessible (connection failed)"
            return 1
            ;;
        *)
            echo "⚠️ $description returned HTTP $response"
            ;;
    esac
}

echo ""
echo "🏥 Running health checks..."

# Test health endpoint
check_endpoint "$RAILWAY_DOMAIN/health" "Health endpoint"

# Test admin UI
check_endpoint "$RAILWAY_DOMAIN/app" "Admin UI"

# Test store API
check_endpoint "$RAILWAY_DOMAIN/store" "Store API"

# Test admin API (should return 401 without auth)
echo "🔐 Testing Admin API authentication..."
admin_response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$RAILWAY_DOMAIN/admin" || echo "000")

case $admin_response in
    401)
        echo "✅ Admin API is protected (HTTP 401) - correct behavior"
        ;;
    200)
        echo "⚠️ Admin API returned 200 - might not be properly protected"
        ;;
    *)
        echo "❌ Admin API returned unexpected response: $admin_response"
        ;;
esac

echo ""
echo "🌐 Testing CORS configuration..."
echo "Make sure your Vercel frontend can connect to: $RAILWAY_DOMAIN"
echo ""

# Database connection test
echo "🗄️ Testing database connectivity..."
echo "Check Railway logs for database connection messages:"
railway logs --lines 20 | grep -i "database\|postgres\|connection" || echo "No database logs found"

echo ""
echo "🚀 Redis connection test..."
echo "Check Railway logs for Redis connection messages:"
railway logs --lines 20 | grep -i "redis\|cache" || echo "No Redis logs found"

echo ""
echo "📦 File storage test..."
echo "Check Railway logs for S3/storage connection messages:"
railway logs --lines 20 | grep -i "s3\|storage\|file" || echo "No storage logs found"

echo ""
echo "🎉 Verification completed!"
echo ""
echo "📋 Summary:"
echo "- Railway Domain: $RAILWAY_DOMAIN"
echo "- Admin UI: $RAILWAY_DOMAIN/app"
echo "- Store API: $RAILWAY_DOMAIN/store"
echo "- Admin API: $RAILWAY_DOMAIN/admin"
echo ""
echo "🔧 Next steps if issues are found:"
echo "1. Check Railway dashboard for detailed logs"
echo "2. Verify all environment variables are set correctly"
echo "3. Ensure database migrations ran successfully"
echo "4. Update your Vercel frontend with the Railway URL"
echo ""
echo "📖 Useful Railway commands:"
echo "- View logs: railway logs"
echo "- Check status: railway status"
echo "- Open dashboard: railway open"
echo "- Connect to database: railway connect"