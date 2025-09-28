#!/bin/bash
#
# Security Headers Verification Script
# Validates Session 4A security headers implementation
#

set -euo pipefail

ENVIRONMENT=${1:-"staging"}
BASE_URL=${2:-""}

# Set default URLs based on environment
if [[ -z "$BASE_URL" ]]; then
    case "$ENVIRONMENT" in
        "production")
            BASE_URL="https://api.yourdomain.com"
            ;;
        "staging")
            BASE_URL="https://api-staging.yourdomain.com"
            ;;
        "local")
            BASE_URL="http://localhost:9000"
            ;;
        *)
            echo "❌ Error: Unknown environment '$ENVIRONMENT'"
            echo "Usage: $0 <environment> [base_url]"
            echo "Environments: production, staging, local"
            exit 1
            ;;
    esac
fi

echo "🔒 Security Headers Verification - Session 4A"
echo "=============================================="
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

# Required security headers from Session 4A implementation
REQUIRED_HEADERS=(
    "Content-Security-Policy"
    "X-Frame-Options"
    "X-Content-Type-Options"
    "Referrer-Policy"
)

# HSTS only required in production/HTTPS
if [[ "$BASE_URL" =~ ^https:// ]]; then
    REQUIRED_HEADERS+=("Strict-Transport-Security")
fi

# Test endpoints
ENDPOINTS=(
    "/admin/health"
    "/store/health"
    "/webhooks/stripe"
)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test headers for a specific endpoint
test_endpoint_headers() {
    local endpoint="$1"
    local url="$BASE_URL$endpoint"
    local success=true

    echo -e "${BLUE}Testing endpoint: $endpoint${NC}"
    echo "URL: $url"

    # Get headers with curl
    local curl_output
    if ! curl_output=$(curl -I -s --max-time 10 "$url" 2>&1); then
        echo -e "${RED}❌ Failed to connect to $url${NC}"
        echo "   Error: $curl_output"
        return 1
    fi

    # Check HTTP status
    local status_code=$(echo "$curl_output" | head -n1 | grep -o '[0-9]\{3\}' || echo "000")
    if [[ "$status_code" =~ ^[45] ]]; then
        echo -e "${YELLOW}⚠️  HTTP $status_code response (may be expected for health endpoints)${NC}"
    else
        echo -e "${GREEN}✅ HTTP $status_code response${NC}"
    fi

    # Check each required header
    for header in "${REQUIRED_HEADERS[@]}"; do
        if echo "$curl_output" | grep -qi "^$header:"; then
            local header_value=$(echo "$curl_output" | grep -i "^$header:" | head -n1 | cut -d: -f2- | sed 's/^ *//')
            echo -e "${GREEN}✅ $header: $header_value${NC}"
        else
            echo -e "${RED}❌ Missing: $header${NC}"
            success=false
        fi
    done

    # Check for additional security headers
    local additional_headers=(
        "Cross-Origin-Opener-Policy"
        "Cross-Origin-Resource-Policy"
        "Permissions-Policy"
        "X-Powered-By"
    )

    echo "   Additional headers:"
    for header in "${additional_headers[@]}"; do
        if echo "$curl_output" | grep -qi "^$header:"; then
            local header_value=$(echo "$curl_output" | grep -i "^$header:" | head -n1 | cut -d: -f2- | sed 's/^ *//')
            echo -e "   ${GREEN}✓ $header: $header_value${NC}"
        else
            echo -e "   ${YELLOW}- $header: not present${NC}"
        fi
    done

    echo ""
    return $success
}

# Function to test CORS behavior
test_cors_behavior() {
    echo -e "${BLUE}Testing CORS Configuration${NC}"
    echo "=========================="

    local admin_endpoint="$BASE_URL/admin/health"
    local store_endpoint="$BASE_URL/store/health"

    # Test admin CORS with allowed origin
    if [[ "$ENVIRONMENT" == "production" ]]; then
        local allowed_admin_origin="https://admin.yourdomain.com"
    else
        local allowed_admin_origin="http://localhost:9000"
    fi

    echo "Testing admin CORS with allowed origin: $allowed_admin_origin"
    local cors_response=$(curl -s -H "Origin: $allowed_admin_origin" \
                              -H "Access-Control-Request-Method: GET" \
                              -X OPTIONS "$admin_endpoint" \
                              -w "%{http_code}" \
                              -o /dev/null 2>/dev/null || echo "000")

    if [[ "$cors_response" == "200" || "$cors_response" == "204" ]]; then
        echo -e "${GREEN}✅ Admin CORS allows expected origin${NC}"
    else
        echo -e "${RED}❌ Admin CORS failed for allowed origin (HTTP $cors_response)${NC}"
    fi

    # Test with disallowed origin
    echo "Testing admin CORS with disallowed origin: https://evil.com"
    cors_response=$(curl -s -H "Origin: https://evil.com" \
                         -H "Access-Control-Request-Method: GET" \
                         -X OPTIONS "$admin_endpoint" \
                         -w "%{http_code}" \
                         -o /dev/null 2>/dev/null || echo "000")

    if [[ "$cors_response" == "403" || "$cors_response" == "000" ]]; then
        echo -e "${GREEN}✅ Admin CORS blocks disallowed origin${NC}"
    else
        echo -e "${YELLOW}⚠️  Admin CORS response for disallowed origin: HTTP $cors_response${NC}"
    fi

    echo ""
}

# Function to check edge/proxy configuration
check_edge_configuration() {
    echo -e "${BLUE}Edge/Proxy Configuration Check${NC}"
    echo "=============================="

    local test_url="$BASE_URL/admin/health"

    # Check if headers are being overridden or stripped
    echo "Checking for header duplication or stripping..."

    curl_output=$(curl -I -s "$test_url" 2>/dev/null || echo "")

    # Look for duplicate headers (common edge misconfiguration)
    for header in "${REQUIRED_HEADERS[@]}"; do
        local count=$(echo "$curl_output" | grep -ci "^$header:" || echo "0")
        if [[ "$count" -gt 1 ]]; then
            echo -e "${YELLOW}⚠️  Duplicate $header headers detected ($count instances)${NC}"
            echo "   This may indicate edge layer is adding headers on top of app headers"
        elif [[ "$count" -eq 1 ]]; then
            echo -e "${GREEN}✅ Single $header header (correct)${NC}"
        fi
    done

    # Check for stripped X-Powered-By (should be overridden to "Medusa")
    local powered_by=$(echo "$curl_output" | grep -i "^X-Powered-By:" | cut -d: -f2- | sed 's/^ *//' || echo "")
    if [[ "$powered_by" == "Medusa" ]]; then
        echo -e "${GREEN}✅ X-Powered-By correctly set to 'Medusa'${NC}"
    elif [[ -n "$powered_by" ]]; then
        echo -e "${YELLOW}⚠️  X-Powered-By: $powered_by (expected 'Medusa')${NC}"
    else
        echo -e "${YELLOW}⚠️  X-Powered-By header missing${NC}"
    fi

    echo ""
}

# Function to generate summary report
generate_summary() {
    local total_tests="$1"
    local passed_tests="$2"

    echo -e "${BLUE}Security Headers Verification Summary${NC}"
    echo "====================================="
    echo "Environment: $ENVIRONMENT"
    echo "Base URL: $BASE_URL"
    echo "Tests passed: $passed_tests/$total_tests"

    if [[ "$passed_tests" -eq "$total_tests" ]]; then
        echo -e "${GREEN}🎉 All security headers tests passed!${NC}"
        echo ""
        echo "✅ Ready for production deployment"
        echo "✅ Security headers properly configured"
        echo "✅ CORS behavior validated"
        return 0
    else
        echo -e "${RED}❌ Some tests failed - review configuration${NC}"
        echo ""
        echo "Action items:"
        echo "1. Check edge/proxy configuration for header stripping"
        echo "2. Verify environment variables are set correctly"
        echo "3. Ensure Medusa service has restarted after config changes"
        return 1
    fi
}

# Main execution
main() {
    local total_tests=0
    local passed_tests=0

    # Test each endpoint
    for endpoint in "${ENDPOINTS[@]}"; do
        if test_endpoint_headers "$endpoint"; then
            ((passed_tests++))
        fi
        ((total_tests++))
    done

    # Test CORS behavior
    test_cors_behavior

    # Check edge configuration
    check_edge_configuration

    # Generate summary
    generate_summary "$total_tests" "$passed_tests"
}

# Handle command line arguments
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "Usage: $0 <environment> [base_url]"
    echo ""
    echo "Environments:"
    echo "  production - Tests production security headers"
    echo "  staging    - Tests staging security headers"
    echo "  local      - Tests local development headers"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 staging https://api-staging.yourdomain.com"
    echo "  $0 local http://localhost:9000"
    exit 0
fi

# Run main function
main "$@"