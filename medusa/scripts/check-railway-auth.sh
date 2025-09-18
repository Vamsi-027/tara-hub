#!/bin/bash

# Check authentication on Railway deployment
MEDUSA_URL="https://medusa-backend-production-3655.up.railway.app"

echo "=== Checking Railway Medusa Deployment ==="
echo ""

# 1. Check health endpoint
echo "1. Health Check:"
curl -s "${MEDUSA_URL}/health" | jq . || echo "Health check failed"
echo ""

# 2. Check admin auth providers
echo "2. Auth Providers:"
curl -s "${MEDUSA_URL}/auth/admin" | jq . || echo "Auth providers check failed"
echo ""

# 3. Try to create admin session (will fail but shows auth is working)
echo "3. Testing Admin Auth Endpoint:"
curl -s -X POST "${MEDUSA_URL}/auth/admin/emailpass" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tara-hub.com"}' | jq . || echo "Auth endpoint check failed"
echo ""

# 4. Check store endpoint (should work without auth)
echo "4. Store API Check:"
curl -s "${MEDUSA_URL}/store/products?limit=1" | jq . || echo "Store API check failed"
echo ""

echo "=== Key Environment Variables to Check on Railway ==="
echo "Make sure these are set in Railway dashboard:"
echo "- DATABASE_URL (PostgreSQL connection string)"
echo "- JWT_SECRET (secure random string)"
echo "- COOKIE_SECRET (secure random string)"
echo "- RESEND_API_KEY (for email authentication)"
echo "- RESEND_FROM_EMAIL (sender email)"
echo "- MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app"
echo ""
echo "To set variables in Railway:"
echo "1. Go to Railway dashboard"
echo "2. Select your medusa-backend service"
echo "3. Go to Variables tab"
echo "4. Add/update the required variables"
echo "5. Redeploy the service"