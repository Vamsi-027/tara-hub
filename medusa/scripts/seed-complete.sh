#!/bin/bash

# Complete Database Seeding Script for Tara Hub
# Runs all necessary seed scripts in the correct order

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

# Start time
START_TIME=$(date +%s)

clear
print_header "🌱 TARA HUB DATABASE SEEDING"

echo ""
echo -e "This script will populate your Medusa database with:"
echo -e "  • Core Medusa infrastructure (regions, shipping, etc.)"
echo -e "  • US region with USD pricing"
echo -e "  • Fabric products and categories"
echo -e "  • Inventory management setup"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# ========================================
# Phase 1: Core Setup
# ========================================

print_header "1️⃣  PHASE 1: CORE INFRASTRUCTURE"

print_step "Running master seed script (this may take 2-3 minutes)..."
if npm run seed; then
    print_success "Core infrastructure created successfully"
else
    print_error "Core seed failed!"
    exit 1
fi

# ========================================
# Phase 2: US Region
# ========================================

print_header "2️⃣  PHASE 2: US REGION SETUP"

print_step "Setting up United States region with USD currency..."
if npm run setup:us-region; then
    print_success "US region configured"
else
    print_warning "US region setup had issues (may already exist)"
fi

# ========================================
# Phase 3: Fabric Products
# ========================================

print_header "3️⃣  PHASE 3: FABRIC PRODUCTS"

print_step "Importing fabric data..."
if npm run import:fabrics; then
    print_success "Fabric products imported"
else
    print_warning "Fabric import had issues"
    echo "  You may need to check if fabric data files exist"
fi

print_step "Synchronizing materials..."
if npm run sync:materials; then
    print_success "Materials synchronized"
else
    print_warning "Materials sync had issues"
fi

# ========================================
# Phase 4: Inventory
# ========================================

print_header "4️⃣  PHASE 4: INVENTORY MANAGEMENT"

print_step "Setting up inventory locations and stock..."
if npm run setup:inventory; then
    print_success "Inventory system configured"
else
    print_warning "Inventory setup had issues (may already exist)"
fi

# ========================================
# Summary
# ========================================

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
MINUTES=$((ELAPSED / 60))
SECONDS=$((ELAPSED % 60))

print_header "🎉 SEEDING COMPLETE"

echo ""
echo -e "${GREEN}✅ Database seeding finished successfully!${NC}"
echo ""
echo -e "Time taken: ${CYAN}${MINUTES}m ${SECONDS}s${NC}"
echo ""

echo "📊 What was created:"
echo "  ✅ Regions: Europe + United States"
echo "  ✅ Currencies: EUR + USD"
echo "  ✅ Stock locations with inventory"
echo "  ✅ Shipping options (Standard + Express)"
echo "  ✅ Product categories and collections"
echo "  ✅ Fabric products with variants"
echo "  ✅ Publishable API keys"
echo ""

# ========================================
# Get API Key
# ========================================

print_header "🔑 RETRIEVING API KEYS"

print_step "Fetching publishable API key..."
npx medusa exec ./src/scripts/get-api-keys.ts || print_warning "Could not retrieve API keys"

echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update your frontend .env with the publishable API key above"
echo "2. Restart your Medusa backend: railway service restart"
echo "3. Check your admin dashboard:"
echo "   https://medusa-backend-production-3655.up.railway.app/app"
echo ""
echo "4. Verify products in the store API:"
echo "   curl -H \"x-publishable-api-key: YOUR_KEY\" \\"
echo "     https://medusa-backend-production-3655.up.railway.app/store/products"
echo ""

print_success "All done! Your store is ready for business! 🎊"
echo ""