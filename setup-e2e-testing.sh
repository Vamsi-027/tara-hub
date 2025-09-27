#!/bin/bash

# Tara Hub E2E Testing Setup Script
# Standardizes environment for local testing & deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║          🧪 TARA HUB E2E TESTING SETUP               ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Step 1: Check Docker availability
print_status "Checking Docker availability..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
    print_success "Docker is available and running"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not available - will require database URL"
    DOCKER_AVAILABLE=false
fi

# Step 2: Check if we're in the correct directory
if [ ! -f "medusa/package.json" ]; then
    print_error "Please run this script from the tara-hub-1 root directory"
    exit 1
fi

print_success "Found medusa directory"

# Step 3: Check for Neon database environment variables
cd medusa
print_status "Checking for database environment variables..."

NEON_URL=""
if [ -n "$DATABASE_URL_TEST" ]; then
    NEON_URL="$DATABASE_URL_TEST"
    print_success "Found DATABASE_URL_TEST"
elif [ -n "$NEON_DATABASE_URL" ]; then
    NEON_URL="$NEON_DATABASE_URL"
    print_success "Found NEON_DATABASE_URL"
elif [ -n "$DATABASE_URL" ]; then
    NEON_URL="$DATABASE_URL"
    print_success "Found DATABASE_URL (using as fallback)"
elif [ -f ".env.testing" ] && grep -q "DATABASE_URL" .env.testing; then
    print_success "Found database configuration in .env.testing"
else
    print_warning "No database URL found in environment"
fi

# Step 4: Setup options
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  TESTING SETUP OPTIONS"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ -n "$NEON_URL" ]; then
    echo "Option A: Use Cloud Database (RECOMMENDED)"
    echo "  Database: ${NEON_URL:0:30}..."
    echo "  Command: npm run test:e2e:materials"
    echo ""
fi

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "Option B: Use Docker Testcontainers"
    echo "  Database: Automatic PostgreSQL container"
    echo "  Command: npm run test:e2e:materials"
    echo ""
fi

if [ -z "$NEON_URL" ] && [ "$DOCKER_AVAILABLE" = false ]; then
    echo "❌ SETUP REQUIRED:"
    echo ""
    echo "You need either:"
    echo "1. A Neon database URL:"
    echo "   export DATABASE_URL_TEST='postgresql://user:pass@neon-host/test_db?sslmode=require'"
    echo ""
    echo "2. Or Docker running:"
    echo "   docker run hello-world"
    echo ""
    exit 1
fi

# Step 5: Run tests based on available options
echo "═══════════════════════════════════════════════════════"
echo "  RUNNING E2E TESTS"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ "$1" = "--run" ]; then
    print_status "Installing dependencies..."
    npm install

    print_status "Running E2E materials tests..."
    if npm run test:e2e:materials; then
        print_success "E2E tests completed successfully!"
        echo ""
        echo "✅ Test Results:"
        echo "  - Authentication (401 for unauthenticated)"
        echo "  - Materials list with pagination"
        echo "  - Search functionality (q parameter)"
        echo "  - Individual material retrieval"
        echo "  - 404 handling for missing materials"
    else
        print_error "E2E tests failed"
        echo ""
        echo "🔧 Troubleshooting:"
        echo "  1. Check database connectivity"
        echo "  2. Ensure materials schema exists"
        echo "  3. Verify Docker is running (if using containers)"
        echo "  4. Check Jest timeout settings"
        exit 1
    fi
else
    echo "Ready to run E2E tests!"
    echo ""
    echo "To execute tests:"
    echo "  ./setup-e2e-testing.sh --run"
    echo ""
    echo "Or manually:"
    echo "  cd medusa && npm run test:e2e:materials"
fi

echo ""
print_success "E2E testing setup complete!"
echo ""
echo "📋 Environment Summary:"
echo "  Docker Available: $DOCKER_AVAILABLE"
echo "  Database URL: ${NEON_URL:+Configured}"
echo "  Test Command: npm run test:e2e:materials"
echo ""