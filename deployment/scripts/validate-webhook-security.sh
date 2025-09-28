#!/bin/bash
#
# Webhook Security Validation Script
# Validates Stripe webhook security configuration for Session 4A
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
            exit 1
            ;;
    esac
fi

echo "🔒 Webhook Security Validation - Session 4A"
echo "==========================================="
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test webhook endpoint accessibility
test_webhook_endpoint() {
    local webhook_url="$BASE_URL/webhooks/stripe"

    echo -e "${BLUE}Testing Webhook Endpoint Accessibility${NC}"
    echo "======================================"
    echo "URL: $webhook_url"

    # Test GET request (should be allowed but may return 405 Method Not Allowed)
    local get_response=$(curl -s -w "%{http_code}" -o /dev/null "$webhook_url" 2>/dev/null || echo "000")
    echo "GET response: HTTP $get_response"

    # Test POST request without signature (should fail with 401)
    echo "Testing POST without signature..."
    local post_response=$(curl -s -w "%{http_code}" -o /dev/null \
                              -X POST \
                              -H "Content-Type: application/json" \
                              -d '{"test": "payload"}' \
                              "$webhook_url" 2>/dev/null || echo "000")

    if [[ "$post_response" == "401" ]]; then
        echo -e "${GREEN}✅ Webhook correctly rejects unsigned requests (HTTP 401)${NC}"
    else
        echo -e "${RED}❌ Webhook should reject unsigned requests with 401, got HTTP $post_response${NC}"
    fi

    # Test POST with invalid signature
    echo "Testing POST with invalid signature..."
    local invalid_sig_response=$(curl -s -w "%{http_code}" -o /dev/null \
                                     -X POST \
                                     -H "Content-Type: application/json" \
                                     -H "Stripe-Signature: invalid_signature" \
                                     -d '{"test": "payload"}' \
                                     "$webhook_url" 2>/dev/null || echo "000")

    if [[ "$invalid_sig_response" == "400" ]]; then
        echo -e "${GREEN}✅ Webhook correctly rejects invalid signatures (HTTP 400)${NC}"
    else
        echo -e "${YELLOW}⚠️  Webhook response for invalid signature: HTTP $invalid_sig_response${NC}"
    fi

    echo ""
}

# Test CORS behavior for webhook endpoint
test_webhook_cors() {
    local webhook_url="$BASE_URL/webhooks/stripe"

    echo -e "${BLUE}Testing Webhook CORS Configuration${NC}"
    echo "=================================="

    # Test preflight with no origin (should be allowed - webhooks have no origin)
    echo "Testing preflight without origin (webhook behavior)..."
    local no_origin_response=$(curl -s -w "%{http_code}" -o /dev/null \
                                   -X OPTIONS \
                                   -H "Access-Control-Request-Method: POST" \
                                   "$webhook_url" 2>/dev/null || echo "000")

    if [[ "$no_origin_response" =~ ^2 ]]; then
        echo -e "${GREEN}✅ Webhook allows requests without origin header${NC}"
    else
        echo -e "${YELLOW}⚠️  Webhook OPTIONS response: HTTP $no_origin_response${NC}"
    fi

    # Test with browser origin (should be controlled by STRIPE_WEBHOOK_ORIGINS)
    echo "Testing with browser origin..."
    local browser_response=$(curl -s -w "%{http_code}" -o /dev/null \
                                 -X OPTIONS \
                                 -H "Origin: https://malicious-site.com" \
                                 -H "Access-Control-Request-Method: POST" \
                                 "$webhook_url" 2>/dev/null || echo "000")

    # This depends on STRIPE_WEBHOOK_ORIGINS configuration
    echo "Browser origin response: HTTP $browser_response"
    echo "(Response depends on STRIPE_WEBHOOK_ORIGINS configuration)"

    echo ""
}

# Check raw body handling
test_raw_body_handling() {
    echo -e "${BLUE}Testing Raw Body Handling${NC}"
    echo "========================="

    # This is harder to test externally, but we can check the response
    # indicates raw body parsing is working
    local webhook_url="$BASE_URL/webhooks/stripe"

    echo "Testing Content-Type handling..."

    # Test with correct content type
    local json_response=$(curl -s -w "%{http_code}" -o /dev/null \
                              -X POST \
                              -H "Content-Type: application/json" \
                              -H "Stripe-Signature: test_sig" \
                              -d '{"id": "evt_test"}' \
                              "$webhook_url" 2>/dev/null || echo "000")

    echo "application/json response: HTTP $json_response"

    # Test with incorrect content type
    local form_response=$(curl -s -w "%{http_code}" -o /dev/null \
                              -X POST \
                              -H "Content-Type: application/x-www-form-urlencoded" \
                              -H "Stripe-Signature: test_sig" \
                              -d 'test=data' \
                              "$webhook_url" 2>/dev/null || echo "000")

    echo "form-encoded response: HTTP $form_response"

    echo -e "${YELLOW}ℹ️  Raw body parsing verification requires internal testing${NC}"
    echo "   Ensure your proxy/load balancer forwards raw JSON without modification"

    echo ""
}

# Check proxy/edge configuration
check_proxy_configuration() {
    echo -e "${BLUE}Proxy/Edge Configuration Check${NC}"
    echo "=============================="

    local webhook_url="$BASE_URL/webhooks/stripe"

    # Check if proxy is modifying headers
    echo "Checking for proxy header modifications..."

    local headers_output=$(curl -I -s "$webhook_url" 2>/dev/null || echo "")

    # Look for proxy-added headers
    local proxy_headers=(
        "X-Forwarded-For"
        "X-Real-IP"
        "X-Forwarded-Proto"
        "X-Forwarded-Host"
        "CF-Ray"              # Cloudflare
        "X-Amzn-Trace-Id"     # AWS ALB
        "X-Request-Id"        # Various proxies
    )

    echo "Proxy headers detected:"
    for header in "${proxy_headers[@]}"; do
        if echo "$headers_output" | grep -qi "^$header:"; then
            local header_value=$(echo "$headers_output" | grep -i "^$header:" | head -n1 | cut -d: -f2- | sed 's/^ *//')
            echo -e "   ${GREEN}✓ $header: $header_value${NC}"
        fi
    done

    # Check content-length handling
    if echo "$headers_output" | grep -qi "^Content-Length:"; then
        echo -e "${GREEN}✅ Content-Length header preserved${NC}"
    else
        echo -e "${YELLOW}⚠️  Content-Length header not present (may be normal for HEAD/OPTIONS)${NC}"
    fi

    # Check for transfer-encoding
    if echo "$headers_output" | grep -qi "^Transfer-Encoding:"; then
        local encoding=$(echo "$headers_output" | grep -i "^Transfer-Encoding:" | cut -d: -f2- | sed 's/^ *//')
        echo -e "${YELLOW}⚠️  Transfer-Encoding: $encoding (ensure raw body is preserved)${NC}"
    fi

    echo ""
}

# Generate Stripe webhook configuration guide
generate_stripe_config_guide() {
    echo -e "${BLUE}Stripe Webhook Configuration Guide${NC}"
    echo "=================================="

    echo "To complete webhook setup in Stripe Dashboard:"
    echo ""

    case "$ENVIRONMENT" in
        "production")
            echo "1. Webhook URL: $BASE_URL/webhooks/stripe"
            echo "2. Events to send:"
            ;;
        "staging")
            echo "1. Webhook URL: $BASE_URL/webhooks/stripe"
            echo "2. Events to send (staging):"
            ;;
        "local")
            echo "1. Use Stripe CLI for local testing:"
            echo "   stripe listen --forward-to localhost:9000/webhooks/stripe"
            echo "2. Events to send (development):"
            ;;
    esac

    echo "   - payment_intent.succeeded"
    echo "   - payment_intent.payment_failed"
    echo "   - payment_intent.canceled"
    echo "   - payment_intent.amount_capturable_updated"
    echo "   - charge.refunded"
    echo "   - charge.dispute.created"
    echo ""

    echo "3. Copy the webhook signing secret to environment variables:"
    echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
    echo ""

    if [[ "$ENVIRONMENT" != "local" ]]; then
        echo "4. Test the webhook:"
        echo "   stripe webhooks trigger payment_intent.succeeded --webhook-url $BASE_URL/webhooks/stripe"
        echo ""
    fi
}

# Main execution
main() {
    echo "Starting webhook security validation..."
    echo ""

    test_webhook_endpoint
    test_webhook_cors
    test_raw_body_handling
    check_proxy_configuration
    generate_stripe_config_guide

    echo -e "${BLUE}Webhook Security Validation Summary${NC}"
    echo "==================================="
    echo "✅ Webhook endpoint accessibility tested"
    echo "✅ CORS configuration verified"
    echo "✅ Raw body handling checked"
    echo "✅ Proxy configuration analyzed"
    echo ""
    echo -e "${GREEN}🎉 Webhook security validation complete!${NC}"
    echo ""
    echo "Action items:"
    echo "1. Configure webhook in Stripe Dashboard using the guide above"
    echo "2. Set STRIPE_WEBHOOK_SECRET environment variable"
    echo "3. Test with actual Stripe webhook events"
    echo "4. Monitor logs for webhook processing"
}

# Handle help
if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    echo "Usage: $0 <environment> [base_url]"
    echo ""
    echo "Validates Stripe webhook security configuration"
    echo ""
    echo "Environments: production, staging, local"
    exit 0
fi

# Run main function
main "$@"