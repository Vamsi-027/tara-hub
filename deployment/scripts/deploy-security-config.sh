#!/bin/bash
#
# Security Configuration Deployment Script
# Deploys Session 4A security controls for Medusa.js v2
#

set -euo pipefail

ENVIRONMENT=${1:-"staging"}
MEDUSA_SERVICE_NAME=${MEDUSA_SERVICE_NAME:-"medusa-backend"}

echo "🔒 Deploying security configuration for environment: $ENVIRONMENT"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Error: Environment must be 'staging' or 'production'"
    exit 1
fi

# Check if required environment variables are set
check_env_vars() {
    local required_vars=("ADMIN_CORS" "STORE_CORS" "NODE_ENV")

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            echo "❌ Error: Required environment variable $var is not set"
            echo "   Please set the following before deployment:"
            echo "   export ADMIN_CORS='https://admin.yourdomain.com'"
            echo "   export STORE_CORS='https://store.yourdomain.com'"
            echo "   export NODE_ENV='$ENVIRONMENT'"
            exit 1
        fi
    done
}

# Validate CORS origins format
validate_cors_origins() {
    local cors_vars=("ADMIN_CORS" "STORE_CORS")

    for var in "${cors_vars[@]}"; do
        local origins="${!var}"

        # Check for trailing slashes
        if [[ "$origins" =~ /$ ]]; then
            echo "⚠️  Warning: $var contains trailing slashes - removing them"
            origins="${origins%/}"
        fi

        # Check for valid HTTPS in production
        if [[ "$ENVIRONMENT" == "production" ]] && [[ "$origins" =~ http://[^localhost] ]]; then
            echo "❌ Error: Production CORS origins must use HTTPS (found HTTP in $var)"
            exit 1
        fi

        echo "✅ $var validated: $origins"
    done
}

# Deploy configuration based on platform
deploy_config() {
    echo "🚀 Deploying security configuration..."

    case "${DEPLOYMENT_PLATFORM:-docker}" in
        "railway")
            echo "📦 Deploying to Railway..."
            railway variables set ADMIN_CORS="$ADMIN_CORS"
            railway variables set STORE_CORS="$STORE_CORS"
            railway variables set NODE_ENV="$NODE_ENV"
            railway variables set STRIPE_WEBHOOK_ORIGINS="${STRIPE_WEBHOOK_ORIGINS:-https://stripe.com}"

            echo "🔄 Triggering Railway deployment..."
            railway up --detach
            ;;

        "vercel")
            echo "▲ Deploying to Vercel..."
            vercel env add ADMIN_CORS production <<< "$ADMIN_CORS"
            vercel env add STORE_CORS production <<< "$STORE_CORS"
            vercel env add NODE_ENV production <<< "$NODE_ENV"

            echo "🔄 Triggering Vercel deployment..."
            vercel --prod
            ;;

        "docker")
            echo "🐳 Updating Docker environment..."

            # Update docker-compose environment file
            cat > ".env.$ENVIRONMENT" << EOF
ADMIN_CORS=$ADMIN_CORS
STORE_CORS=$STORE_CORS
NODE_ENV=$NODE_ENV
STRIPE_WEBHOOK_ORIGINS=${STRIPE_WEBHOOK_ORIGINS:-https://stripe.com}
EOF

            echo "🔄 Restarting Docker services..."
            docker-compose --env-file ".env.$ENVIRONMENT" up -d --force-recreate "$MEDUSA_SERVICE_NAME"
            ;;

        "kubernetes")
            echo "☸️  Deploying to Kubernetes..."

            # Create/update ConfigMap
            kubectl create configmap medusa-security-config \
                --from-literal=ADMIN_CORS="$ADMIN_CORS" \
                --from-literal=STORE_CORS="$STORE_CORS" \
                --from-literal=NODE_ENV="$NODE_ENV" \
                --from-literal=STRIPE_WEBHOOK_ORIGINS="${STRIPE_WEBHOOK_ORIGINS:-https://stripe.com}" \
                --dry-run=client -o yaml | kubectl apply -f -

            echo "🔄 Rolling out deployment..."
            kubectl rollout restart deployment/medusa-backend
            kubectl rollout status deployment/medusa-backend --timeout=300s
            ;;

        *)
            echo "⚠️  Unknown deployment platform: ${DEPLOYMENT_PLATFORM:-docker}"
            echo "   Please manually set the following environment variables:"
            echo "   ADMIN_CORS=$ADMIN_CORS"
            echo "   STORE_CORS=$STORE_CORS"
            echo "   NODE_ENV=$NODE_ENV"
            echo "   STRIPE_WEBHOOK_ORIGINS=${STRIPE_WEBHOOK_ORIGINS:-https://stripe.com}"
            ;;
    esac
}

# Wait for service to be ready
wait_for_service() {
    local max_attempts=30
    local attempt=1
    local health_url="${MEDUSA_BASE_URL:-http://localhost:9000}/admin/health"

    echo "⏳ Waiting for Medusa service to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            echo "✅ Medusa service is ready!"
            return 0
        fi

        echo "   Attempt $attempt/$max_attempts failed, retrying in 10s..."
        sleep 10
        ((attempt++))
    done

    echo "❌ Service failed to become ready after $max_attempts attempts"
    return 1
}

# Main execution
main() {
    echo "🔒 Session 4A Security Deployment - Medusa.js v2"
    echo "================================================"

    check_env_vars
    validate_cors_origins
    deploy_config

    # Wait for deployment to complete
    sleep 30
    wait_for_service

    echo ""
    echo "✅ Security configuration deployed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Run security headers verification: ./verify-security-headers.sh $ENVIRONMENT"
    echo "2. Test CORS behavior from allowed/disallowed origins"
    echo "3. Monitor logs for security events"
    echo ""
}

# Run main function
main "$@"