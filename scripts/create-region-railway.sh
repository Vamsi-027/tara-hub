#!/bin/bash

# Script to create a region on Railway Medusa deployment

MEDUSA_URL="https://medusa-backend-production-3655.up.railway.app"

echo "🌍 Creating region in production Medusa..."
echo ""

# First, let's create an admin user if needed and get auth token
echo "1. Creating admin user..."

# Create admin user (will fail if already exists, that's okay)
curl -X POST "$MEDUSA_URL/auth/user/emailpass/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tara-hub.com",
    "password": "medusa_admin_2024"
  }' 2>/dev/null

echo ""
echo "2. Authenticating..."

# Login to get token
AUTH_RESPONSE=$(curl -s -X POST "$MEDUSA_URL/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tara-hub.com",
    "password": "medusa_admin_2024"
  }')

TOKEN=$(echo $AUTH_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to authenticate. Response:"
  echo $AUTH_RESPONSE
  exit 1
fi

echo "✅ Authenticated successfully"
echo ""

# Create region
echo "3. Creating US region..."

REGION_RESPONSE=$(curl -s -X POST "$MEDUSA_URL/admin/regions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "United States",
    "currency_code": "USD",
    "tax_rate": 0,
    "payment_providers": ["manual"],
    "fulfillment_providers": ["manual"],
    "countries": ["us"]
  }')

echo "Region creation response:"
echo $REGION_RESPONSE | python3 -m json.tool 2>/dev/null || echo $REGION_RESPONSE

echo ""
echo "4. Checking regions..."

REGIONS=$(curl -s -X GET "$MEDUSA_URL/admin/regions" \
  -H "Authorization: Bearer $TOKEN")

echo "Existing regions:"
echo $REGIONS | python3 -m json.tool 2>/dev/null || echo $REGIONS

echo ""
echo "✅ Script completed!"
echo ""
echo "Admin credentials:"
echo "  Email: admin@tara-hub.com"
echo "  Password: medusa_admin_2024"
echo ""
echo "You can now login at: $MEDUSA_URL/app"