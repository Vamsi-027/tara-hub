#!/bin/bash

# Railway Post-Deployment Setup Script
# Run this after your Medusa backend is deployed to Railway

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎉 Railway Post-Deployment Setup${NC}"
echo "====================================="
echo ""

# Set Railway environment variables
export RAILWAY_TOKEN="9d1ca706-d735-4a7c-bc65-f571111b8141"
export RAILWAY_PROJECT_ID="7d4ddac3-5123-4445-98cf-714ad52a324a"

BACKEND_URL="https://medusa-backend-production-3655.up.railway.app"

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first.${NC}"
    exit 1
fi

# Function to run commands on Railway
run_on_railway() {
    echo -e "${YELLOW}🚀 Running: $1${NC}"
    railway run $1
}

# 1. Check deployment health
echo -e "${BLUE}🎯 Step 1: Checking deployment health...${NC}"
curl -s "${BACKEND_URL}/health" > /dev/null 2>&1 && echo -e "${GREEN}✅ Backend is healthy${NC}" || echo -e "${RED}❌ Backend not responding${NC}"

# 2. Run database migrations
echo -e "\n${BLUE}🎯 Step 2: Running database migrations...${NC}"
run_on_railway "npx medusa db:migrate"
echo -e "${GREEN}✅ Migrations completed${NC}"

# 3. Create admin user
echo -e "\n${BLUE}🎯 Step 3: Creating admin user...${NC}"
read -p "Enter admin email: " ADMIN_EMAIL
read -s -p "Enter admin password: " ADMIN_PASSWORD
echo ""

export MEDUSA_ADMIN_EMAIL="$ADMIN_EMAIL"
export MEDUSA_ADMIN_PASSWORD="$ADMIN_PASSWORD"

run_on_railway "npx medusa exec ./src/scripts/seed-admin-user.ts"
echo -e "${GREEN}✅ Admin user created${NC}"

# 4. Setup US region
echo -e "\n${BLUE}🎯 Step 4: Setting up US region...${NC}"
run_on_railway "npx medusa exec ./src/scripts/setup-us-region.ts"
echo -e "${GREEN}✅ US region configured${NC}"

# 5. Generate API keys
echo -e "\n${BLUE}🎯 Step 5: Generating API keys...${NC}"
run_on_railway "npx medusa utils:api-key" || {
    echo -e "${YELLOW}⚠️  API key generation command not available. You may need to create them manually.${NC}"
}

# 6. Setup Stripe webhook
echo -e "\n${BLUE}🎯 Step 6: Stripe webhook configuration...${NC}"
echo -e "${YELLOW}📄 Configure Stripe webhook in your Stripe Dashboard:${NC}"
echo "   URL: ${BACKEND_URL}/webhooks/stripe"
echo "   Events to listen:"
echo "   - payment_intent.succeeded"
echo "   - payment_intent.payment_failed"
echo "   - checkout.session.completed"
echo ""
echo "   After creating the webhook, add the webhook secret to Railway:"
echo "   Variable name: STRIPE_WEBHOOK_SECRET"
echo "   Variable value: whsec_..."

# 7. Test the setup
echo -e "\n${BLUE}🎯 Step 7: Testing the setup...${NC}"

# Test store API
echo -e "\n${YELLOW}🧪 Testing Store API...${NC}"
curl -s "${BACKEND_URL}/store/regions" | head -n 50 && echo -e "\n${GREEN}✅ Store API working${NC}" || echo -e "${RED}❌ Store API not responding${NC}"

# 8. Summary
echo -e "\n${GREEN}✨ Setup Complete!${NC}"
echo "================================="
echo -e "🌐 Backend URL: ${BACKEND_URL}"
echo -e "👤 Admin Panel: ${BACKEND_URL}/app"
echo -e "📦 Store API: ${BACKEND_URL}/store"
echo -e "📋 Dashboard: https://railway.app/project/${RAILWAY_PROJECT_ID}"
echo ""
echo -e "${GREEN}📋 Next Steps:${NC}"
echo "1. Login to admin panel with the credentials you created"
echo "2. Add products to your catalog"
echo "3. Configure payment settings in admin"
echo "4. Update frontend apps with the backend URL:"
echo "   NEXT_PUBLIC_MEDUSA_BACKEND_URL=${BACKEND_URL}"
echo ""
echo -e "${YELLOW}🔐 Important Security Notes:${NC}"
echo "1. Change default passwords immediately"
echo "2. Restrict CORS origins in production"
echo "3. Enable rate limiting for API endpoints"
echo "4. Set up monitoring and alerts"
echo ""
echo -e "${GREEN}✅ Post-deployment setup completed successfully!${NC}"