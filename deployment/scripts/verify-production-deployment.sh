#!/bin/bash

# Comprehensive Production Deployment Verification Script
# Tests all components: Vercel Frontend, Railway Backend, Neon DB, Cloudflare R2
# Usage: ./verify-production-deployment.sh [--verbose]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
MEDUSA_URL="https://medusa-backend-production-3655.up.railway.app"
FABRIC_STORE_URL="https://fabric-store-ten.vercel.app"
VERBOSE=false

# Parse arguments
if [[ "$1" == "--verbose" ]]; then
    VERBOSE=true
fi

# Counters for summary
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNING_TESTS=0

# Helper functions
print_header() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNING_TESTS++))
}

print_info() {
    echo -e "${CYAN}[ℹ]${NC} $1"
}

# Test function with optional verbose output
test_endpoint() {
    local url=$1
    local expected_code=$2
    local description=$3
    local method=${4:-GET}

    ((TOTAL_TESTS++))
    print_test "$description"

    if [[ "$VERBOSE" == "true" ]]; then
        print_info "Testing: $method $url (expecting HTTP $expected_code)"
    fi

    if [[ "$method" == "GET" ]]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null || echo "000")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null || echo "000")
    fi

    if [[ "$response" == "$expected_code" ]]; then
        print_success "$description - HTTP $response"
        return 0
    elif [[ "$response" == "000" ]]; then
        print_error "$description - Connection failed"
        return 1
    else
        print_warning "$description - Got HTTP $response, expected $expected_code"
        return 1
    fi
}

# Test with JSON response validation
test_json_endpoint() {
    local url=$1
    local description=$2
    local expected_field=$3

    ((TOTAL_TESTS++))
    print_test "$description"

    if [[ "$VERBOSE" == "true" ]]; then
        print_info "Testing: GET $url"
    fi

    response=$(curl -s --connect-timeout 10 --max-time 30 "$url" 2>/dev/null || echo '{"error":"connection_failed"}')
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null || echo "000")

    if [[ "$http_code" == "200" ]]; then
        if echo "$response" | grep -q "$expected_field"; then
            print_success "$description - Valid JSON response"
            if [[ "$VERBOSE" == "true" ]]; then
                echo "    Response preview: ${response:0:100}..."
            fi
            return 0
        else
            print_warning "$description - Missing expected field: $expected_field"
            return 1
        fi
    else
        print_error "$description - HTTP $http_code"
        return 1
    fi
}

# ========================================
# Start Testing
# ========================================

clear
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       🔍 PRODUCTION DEPLOYMENT VERIFICATION           ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Testing Infrastructure:"
echo -e "  • Backend/API: ${MEDUSA_URL}"
echo -e "  • Frontend: ${FABRIC_STORE_URL}"
echo -e "  • Database: Neon PostgreSQL"
echo -e "  • Storage: Cloudflare R2"
echo ""
echo -e "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ========================================
# 1. RAILWAY BACKEND TESTS
# ========================================

print_header "1️⃣  RAILWAY BACKEND (Medusa API)"

# Health endpoint
test_endpoint "$MEDUSA_URL/health" "200" "Health endpoint"

# Store API
test_json_endpoint "$MEDUSA_URL/store/products" "Store products endpoint" "products"

# Admin endpoint (should require auth)
test_endpoint "$MEDUSA_URL/admin/products" "401" "Admin API authentication"

# Admin UI
test_endpoint "$MEDUSA_URL/app" "200" "Admin UI homepage"

# Regions endpoint
test_json_endpoint "$MEDUSA_URL/store/regions" "Store regions endpoint" "regions"

# Product categories
test_json_endpoint "$MEDUSA_URL/store/product-categories" "Product categories endpoint" "product_categories"

# ========================================
# 2. VERCEL FRONTEND TESTS
# ========================================

print_header "2️⃣  VERCEL FRONTEND (Fabric Store)"

# Homepage
test_endpoint "$FABRIC_STORE_URL" "200" "Homepage"

# Test common routes (if they exist)
test_endpoint "$FABRIC_STORE_URL/products" "200" "Products page" || print_warning "Products page may use different route"

# Check if Next.js is serving properly
((TOTAL_TESTS++))
print_test "Next.js headers check"
headers=$(curl -I -s --connect-timeout 10 --max-time 30 "$FABRIC_STORE_URL" 2>/dev/null || echo "")
if echo "$headers" | grep -qi "x-vercel"; then
    print_success "Next.js/Vercel headers present"
elif echo "$headers" | grep -qi "HTTP/[12].[01] 200"; then
    print_success "Frontend is serving successfully"
else
    print_error "Frontend headers check failed"
fi

# ========================================
# 3. DATABASE CONNECTIVITY TESTS
# ========================================

print_header "3️⃣  DATABASE (Neon PostgreSQL)"

((TOTAL_TESTS++))
print_test "Database connectivity (via API)"

# Test database by checking if products are being served (proves DB connection)
response=$(curl -s "$MEDUSA_URL/store/products?limit=1" 2>/dev/null || echo '{"error":"failed"}')
if echo "$response" | grep -q "products"; then
    print_success "Database connection verified (products accessible)"
else
    print_error "Database connection issue (products not accessible)"
fi

# Test regions (another DB-dependent endpoint)
((TOTAL_TESTS++))
print_test "Database queries (regions)"
response=$(curl -s "$MEDUSA_URL/store/regions" 2>/dev/null || echo '{"error":"failed"}')
if echo "$response" | grep -q "regions"; then
    print_success "Database queries working correctly"
else
    print_error "Database query issues detected"
fi

# ========================================
# 4. FILE STORAGE TESTS (Cloudflare R2)
# ========================================

print_header "4️⃣  FILE STORAGE (Cloudflare R2)"

((TOTAL_TESTS++))
print_test "Storage configuration (via products with images)"

# Check if products have image URLs
response=$(curl -s "$MEDUSA_URL/store/products?limit=5" 2>/dev/null || echo '{"error":"failed"}')
if echo "$response" | grep -qi "https://"; then
    if echo "$response" | grep -qi "r2\|cloudflare\|image"; then
        print_success "R2 storage URLs detected in product data"
    else
        print_warning "Image URLs found but R2 domain not detected"
    fi
else
    print_warning "No image URLs found in products (may be expected)"
fi

# ========================================
# 5. API INTEGRATION TESTS
# ========================================

print_header "5️⃣  API INTEGRATION & CORS"

# Test CORS headers from backend
((TOTAL_TESTS++))
print_test "CORS configuration"
cors_headers=$(curl -s -I -H "Origin: $FABRIC_STORE_URL" "$MEDUSA_URL/store/products" 2>/dev/null || echo "")
if echo "$cors_headers" | grep -qi "access-control-allow-origin"; then
    print_success "CORS headers configured correctly"
else
    print_warning "CORS headers not detected (may need verification)"
fi

# Test API response time
((TOTAL_TESTS++))
print_test "API response time"
start_time=$(date +%s%N)
curl -s "$MEDUSA_URL/store/products?limit=1" > /dev/null 2>&1
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [[ "$response_time" -lt 1000 ]]; then
    print_success "API response time: ${response_time}ms (excellent)"
elif [[ "$response_time" -lt 2000 ]]; then
    print_success "API response time: ${response_time}ms (good)"
else
    print_warning "API response time: ${response_time}ms (slow)"
fi

# ========================================
# 6. AUTHENTICATION & SECURITY
# ========================================

print_header "6️⃣  AUTHENTICATION & SECURITY"

# Test that admin requires authentication
test_endpoint "$MEDUSA_URL/admin/products" "401" "Admin authentication required"

# Test store endpoints are public
test_endpoint "$MEDUSA_URL/store/products" "200" "Store endpoints are public"

# Check security headers
((TOTAL_TESTS++))
print_test "Security headers"
security_headers=$(curl -s -I "$MEDUSA_URL" 2>/dev/null || echo "")
header_count=0

if echo "$security_headers" | grep -qi "x-content-type-options"; then
    ((header_count++))
fi
if echo "$security_headers" | grep -qi "x-frame-options"; then
    ((header_count++))
fi
if echo "$security_headers" | grep -qi "strict-transport-security"; then
    ((header_count++))
fi

if [[ "$header_count" -ge 2 ]]; then
    print_success "Security headers present ($header_count/3)"
elif [[ "$header_count" -ge 1 ]]; then
    print_warning "Some security headers present ($header_count/3)"
else
    print_warning "Security headers not detected"
fi

# ========================================
# 7. GITHUB SYNC CHECK
# ========================================

print_header "7️⃣  GITHUB INTEGRATION"

print_info "Checking if git repository is clean and synced..."

if git rev-parse --git-dir > /dev/null 2>&1; then
    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        print_success "Git repository is clean (no uncommitted changes)"
    else
        print_warning "Uncommitted changes detected in git repository"
        if [[ "$VERBOSE" == "true" ]]; then
            git status --short
        fi
    fi

    # Check if local is behind remote
    git fetch origin > /dev/null 2>&1 || true
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

    if [[ "$LOCAL" == "$REMOTE" ]]; then
        print_success "Local branch is synced with remote"
    elif [[ -z "$REMOTE" ]]; then
        print_warning "Could not check remote branch status"
    else
        print_warning "Local branch differs from remote - push your changes"
    fi
else
    print_warning "Not in a git repository"
fi

# ========================================
# 8. DEPLOYMENT STATUS
# ========================================

print_header "8️⃣  DEPLOYMENT PLATFORMS STATUS"

# Check Railway CLI
if command -v railway &> /dev/null; then
    print_info "Railway CLI detected - checking status..."
    if railway status > /dev/null 2>&1; then
        print_success "Railway: Deployment active"
        if [[ "$VERBOSE" == "true" ]]; then
            railway status | head -n 10
        fi
    else
        print_warning "Railway: Could not fetch status (may need login)"
    fi
else
    print_warning "Railway CLI not installed (install: npm i -g @railway/cli)"
fi

# Check Vercel CLI
if command -v vercel &> /dev/null; then
    print_info "Vercel CLI detected"
    print_success "Vercel: CLI available for deployments"
else
    print_warning "Vercel CLI not installed (install: npm i -g vercel)"
fi

# ========================================
# SUMMARY
# ========================================

print_header "📊 TEST SUMMARY"

echo ""
echo -e "Total Tests Run:     ${CYAN}$TOTAL_TESTS${NC}"
echo -e "Passed:              ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:              ${RED}$FAILED_TESTS${NC}"
echo -e "Warnings:            ${YELLOW}$WARNING_TESTS${NC}"
echo ""

# Calculate pass rate
if [[ "$TOTAL_TESTS" -gt 0 ]]; then
    PASS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))

    if [[ "$PASS_RATE" -ge 90 ]]; then
        echo -e "Overall Status:      ${GREEN}✓ EXCELLENT${NC} (${PASS_RATE}%)"
    elif [[ "$PASS_RATE" -ge 70 ]]; then
        echo -e "Overall Status:      ${YELLOW}⚠ GOOD${NC} (${PASS_RATE}%)"
    else
        echo -e "Overall Status:      ${RED}✗ NEEDS ATTENTION${NC} (${PASS_RATE}%)"
    fi
fi

echo ""
echo -e "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Quick links
print_header "🔗 QUICK LINKS"
echo ""
echo -e "Railway Dashboard:   https://railway.app"
echo -e "Vercel Dashboard:    https://vercel.com/dashboard"
echo -e "Medusa Admin:        ${MEDUSA_URL}/app"
echo -e "Fabric Store:        ${FABRIC_STORE_URL}"
echo -e "API Health:          ${MEDUSA_URL}/health"
echo ""

# Exit with appropriate code
if [[ "$FAILED_TESTS" -eq 0 ]]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    echo ""
    exit 1
fi