#!/bin/bash

# Pre-Deployment Checklist for Tara Hub
# Ensures everything is ready before deploying to production
# Usage: ./pre-deployment-check.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

print_header() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${CYAN}[ℹ]${NC} $1"
}

# Check function
run_check() {
    ((TOTAL_CHECKS++))
    print_check "$1"
}

clear
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         🚀 PRE-DEPLOYMENT CHECKLIST                   ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ========================================
# 1. GIT REPOSITORY CHECKS
# ========================================

print_header "1️⃣  GIT REPOSITORY STATUS"

# Check if in git repo
run_check "Git repository status"
if git rev-parse --git-dir > /dev/null 2>&1; then
    print_success "Inside git repository"

    # Check for uncommitted changes
    run_check "Uncommitted changes"
    if git diff-index --quiet HEAD --; then
        print_success "No uncommitted changes"
    else
        print_warning "Uncommitted changes detected"
        echo -e "    Run: ${CYAN}git status${NC} to see changes"
        echo -e "    Then: ${CYAN}git add . && git commit -m 'your message'${NC}"
    fi

    # Check current branch
    run_check "Current branch"
    CURRENT_BRANCH=$(git branch --show-current)
    if [[ "$CURRENT_BRANCH" == "main" ]] || [[ "$CURRENT_BRANCH" == "master" ]]; then
        print_success "On main/master branch ($CURRENT_BRANCH)"
    else
        print_warning "On branch: $CURRENT_BRANCH (not main/master)"
        echo -e "    Consider: ${CYAN}git checkout main${NC}"
    fi

    # Check if pushed to remote
    run_check "Remote sync status"
    git fetch origin > /dev/null 2>&1 || true
    LOCAL=$(git rev-parse @ 2>/dev/null || echo "")
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

    if [[ "$LOCAL" == "$REMOTE" ]]; then
        print_success "Synced with remote"
    elif [[ -z "$REMOTE" ]]; then
        print_warning "No remote tracking branch"
    else
        print_error "Local differs from remote - push your changes!"
        echo -e "    Run: ${CYAN}git push origin $CURRENT_BRANCH${NC}"
    fi
else
    print_error "Not in a git repository"
fi

# ========================================
# 2. DEPENDENCIES & BUILD
# ========================================

print_header "2️⃣  DEPENDENCIES & BUILD"

# Check if node_modules exists
run_check "Root dependencies installed"
if [ -d "node_modules" ]; then
    print_success "Root node_modules exists"
else
    print_error "Root node_modules missing"
    echo -e "    Run: ${CYAN}npm install${NC}"
fi

# Check Medusa dependencies
run_check "Medusa dependencies installed"
if [ -d "medusa/node_modules" ]; then
    print_success "Medusa node_modules exists"
else
    print_error "Medusa node_modules missing"
    echo -e "    Run: ${CYAN}cd medusa && npm install${NC}"
fi

# Check fabric-store dependencies
run_check "Fabric Store dependencies installed"
if [ -d "frontend/experiences/fabric-store/node_modules" ]; then
    print_success "Fabric Store node_modules exists"
else
    print_warning "Fabric Store node_modules missing"
    echo -e "    Run: ${CYAN}cd frontend/experiences/fabric-store && npm install${NC}"
fi

# Try building Medusa
run_check "Medusa build test"
print_info "Testing Medusa build (this may take a moment)..."
cd medusa
if npm run build > /tmp/medusa-build.log 2>&1; then
    print_success "Medusa builds successfully"
else
    print_error "Medusa build failed"
    echo -e "    Check: ${CYAN}/tmp/medusa-build.log${NC}"
    tail -n 20 /tmp/medusa-build.log
fi
cd ..

# ========================================
# 3. ENVIRONMENT VARIABLES
# ========================================

print_header "3️⃣  ENVIRONMENT VARIABLES"

# Check for .env.deployment.local
run_check "Deployment credentials"
if [ -f ".env.deployment.local" ]; then
    print_success ".env.deployment.local exists"

    # Check required variables
    REQUIRED_VARS=("VERCEL_TOKEN" "RAILWAY_TOKEN" "VERCEL_PROJECT_ID_FABRIC_STORE" "RAILWAY_PROJECT_ID")
    for var in "${REQUIRED_VARS[@]}"; do
        run_check "$var in .env.deployment.local"
        if grep -q "^${var}=" .env.deployment.local && ! grep -q "^${var}=$\|^${var}=your_" .env.deployment.local; then
            print_success "$var is set"
        else
            print_error "$var missing or not configured"
        fi
    done
else
    print_error ".env.deployment.local not found"
    echo -e "    Create this file with deployment tokens"
fi

# Check Medusa .env
run_check "Medusa environment file"
if [ -f "medusa/.env" ]; then
    print_success "medusa/.env exists"

    # Check critical Medusa env vars
    MEDUSA_VARS=("DATABASE_URL" "JWT_SECRET" "STRIPE_API_KEY" "S3_ACCESS_KEY_ID")
    for var in "${MEDUSA_VARS[@]}"; do
        run_check "$var in medusa/.env"
        if grep -q "^${var}=" medusa/.env && ! grep -q "^${var}=$\|^${var}=your_\|^${var}=postgresql://username" medusa/.env; then
            print_success "$var is configured"
        else
            print_warning "$var missing or using placeholder"
        fi
    done
else
    print_warning "medusa/.env not found (may use Railway env vars)"
fi

# ========================================
# 4. CLI TOOLS
# ========================================

print_header "4️⃣  CLI TOOLS"

# Check Railway CLI
run_check "Railway CLI"
if command -v railway &> /dev/null; then
    RAILWAY_VERSION=$(railway --version 2>/dev/null || echo "unknown")
    print_success "Railway CLI installed ($RAILWAY_VERSION)"
else
    print_warning "Railway CLI not installed"
    echo -e "    Install: ${CYAN}npm i -g @railway/cli${NC}"
fi

# Check Vercel CLI
run_check "Vercel CLI"
if command -v vercel &> /dev/null; then
    VERCEL_VERSION=$(vercel --version 2>/dev/null || echo "unknown")
    print_success "Vercel CLI installed ($VERCEL_VERSION)"
else
    print_warning "Vercel CLI not installed"
    echo -e "    Install: ${CYAN}npm i -g vercel${NC}"
fi

# Check Node version
run_check "Node.js version"
NODE_VERSION=$(node --version)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [[ "$NODE_MAJOR" -ge 20 ]]; then
    print_success "Node.js $NODE_VERSION (meets requirement: >=20)"
elif [[ "$NODE_MAJOR" -ge 18 ]]; then
    print_warning "Node.js $NODE_VERSION (recommended: >=20 for Medusa)"
else
    print_error "Node.js $NODE_VERSION (too old, need >=18)"
fi

# Check npm version
run_check "npm version"
NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION"

# ========================================
# 5. CODE QUALITY
# ========================================

print_header "5️⃣  CODE QUALITY"

# Run TypeScript check
run_check "TypeScript check"
if npm run type-check > /tmp/typecheck.log 2>&1; then
    print_success "TypeScript check passed"
else
    print_warning "TypeScript errors detected"
    echo -e "    Check: ${CYAN}/tmp/typecheck.log${NC}"
fi

# Run linter
run_check "ESLint check"
if npm run lint > /tmp/lint.log 2>&1; then
    print_success "ESLint passed"
else
    print_warning "Linting issues detected"
    echo -e "    Run: ${CYAN}npm run lint${NC}"
fi

# ========================================
# 6. TEST SUITE
# ========================================

print_header "6️⃣  TEST SUITE (Optional)"

run_check "Unit tests"
if npm run test:unit > /tmp/test.log 2>&1; then
    print_success "Unit tests passed"
else
    print_warning "Unit tests failed or not configured"
    echo -e "    Review: ${CYAN}/tmp/test.log${NC}"
fi

# ========================================
# 7. INFRASTRUCTURE CHECKS
# ========================================

print_header "7️⃣  INFRASTRUCTURE STATUS"

# Test database connection (via Medusa)
run_check "Database connectivity"
print_info "Testing database via Medusa health endpoint..."
if curl -f -s "https://medusa-backend-production-3655.up.railway.app/health" > /dev/null 2>&1; then
    print_success "Production backend is accessible"
else
    print_warning "Production backend not responding (may be deploying)"
fi

# ========================================
# SUMMARY
# ========================================

print_header "📊 CHECKLIST SUMMARY"

echo ""
echo -e "Total Checks:        ${CYAN}$TOTAL_CHECKS${NC}"
echo -e "Passed:              ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed:              ${RED}$FAILED_CHECKS${NC}"
echo -e "Warnings:            ${YELLOW}$WARNINGS${NC}"
echo ""

if [[ "$FAILED_CHECKS" -eq 0 ]]; then
    if [[ "$WARNINGS" -eq 0 ]]; then
        echo -e "${GREEN}✅ READY TO DEPLOY!${NC}"
        echo ""
        echo -e "Deploy with:"
        echo -e "  ${CYAN}./deployment/scripts/deploy-production.sh all${NC}"
    else
        echo -e "${YELLOW}⚠️  READY WITH WARNINGS${NC}"
        echo ""
        echo -e "You can deploy, but review warnings above."
        echo -e "  ${CYAN}./deployment/scripts/deploy-production.sh all${NC}"
    fi
else
    echo -e "${RED}❌ NOT READY TO DEPLOY${NC}"
    echo ""
    echo -e "Fix the failed checks above before deploying."
fi

echo ""
echo -e "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Exit code
if [[ "$FAILED_CHECKS" -eq 0 ]]; then
    exit 0
else
    exit 1
fi