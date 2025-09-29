#!/bin/bash

# Complete Deployment Pipeline with Testing
# Runs: Pre-check → Deploy → Verify → Report
# Usage: ./deploy-and-test.sh [medusa|fabric-store|all] [--skip-checks] [--skip-verify]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
DEPLOYMENT_TARGET="${1:-all}"
SKIP_CHECKS=false
SKIP_VERIFY=false
START_TIME=$(date +%s)
LOG_FILE="/tmp/tara-hub-deployment-$(date +%Y%m%d-%H%M%S).log"

# Parse arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        --skip-verify)
            SKIP_VERIFY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Helper functions
print_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║  $1${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo ""
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

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

# Log to file and console
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Calculate elapsed time
elapsed_time() {
    local end_time=$(date +%s)
    local elapsed=$((end_time - START_TIME))
    printf "%02d:%02d" $((elapsed / 60)) $((elapsed % 60))
}

# Error handler
handle_error() {
    local exit_code=$?
    print_banner "❌ DEPLOYMENT FAILED"
    echo ""
    print_error "An error occurred during deployment"
    print_info "Exit code: $exit_code"
    print_info "Check log file: $LOG_FILE"
    echo ""
    print_info "Elapsed time: $(elapsed_time)"
    echo ""
    exit $exit_code
}

trap handle_error ERR

# ========================================
# Main Execution
# ========================================

clear
print_banner "🚀 TARA HUB DEPLOYMENT PIPELINE"

echo ""
echo -e "Configuration:"
echo -e "  • Target:        ${CYAN}$DEPLOYMENT_TARGET${NC}"
echo -e "  • Skip checks:   ${CYAN}$SKIP_CHECKS${NC}"
echo -e "  • Skip verify:   ${CYAN}$SKIP_VERIFY${NC}"
echo -e "  • Log file:      ${CYAN}$LOG_FILE${NC}"
echo ""
echo -e "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ========================================
# Phase 1: Pre-Deployment Checks
# ========================================

if [[ "$SKIP_CHECKS" == false ]]; then
    print_banner "📋 PHASE 1: PRE-DEPLOYMENT CHECKS"
    print_step "Running pre-deployment verification..."

    if ./deployment/scripts/pre-deployment-check.sh >> "$LOG_FILE" 2>&1; then
        print_success "Pre-deployment checks passed"
    else
        print_warning "Pre-deployment checks had warnings/failures"
        print_info "Review output in: $LOG_FILE"

        echo ""
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled by user"
            exit 1
        fi
    fi
else
    print_warning "Skipping pre-deployment checks (--skip-checks)"
fi

# ========================================
# Phase 2: Git Status Check
# ========================================

print_banner "📦 PHASE 2: GIT STATUS"

if git rev-parse --git-dir > /dev/null 2>&1; then
    print_step "Checking git repository status..."

    CURRENT_BRANCH=$(git branch --show-current)
    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MSG=$(git log -1 --pretty=%B)

    echo -e "  Branch:  ${CYAN}$CURRENT_BRANCH${NC}"
    echo -e "  Commit:  ${CYAN}$COMMIT_HASH${NC}"
    echo -e "  Message: ${CYAN}$COMMIT_MSG${NC}"
    echo ""

    if git diff-index --quiet HEAD --; then
        print_success "Working directory is clean"
    else
        print_warning "Uncommitted changes detected"
        git status --short
        echo ""
        read -p "Continue with uncommitted changes? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Deployment cancelled. Commit your changes first."
            exit 1
        fi
    fi

    # Check if synced with remote
    git fetch origin > /dev/null 2>&1 || true
    LOCAL=$(git rev-parse @ 2>/dev/null || echo "")
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

    if [[ "$LOCAL" == "$REMOTE" ]]; then
        print_success "Synced with remote"
    elif [[ -z "$REMOTE" ]]; then
        print_warning "No remote tracking branch"
    else
        print_warning "Local differs from remote"
        echo ""
        read -p "Push changes to remote first? (Y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git push origin "$CURRENT_BRANCH"
            print_success "Pushed to remote"
        fi
    fi
else
    print_warning "Not in a git repository"
fi

# ========================================
# Phase 3: Build Verification
# ========================================

print_banner "🔨 PHASE 3: BUILD VERIFICATION"

if [[ "$DEPLOYMENT_TARGET" == "medusa" ]] || [[ "$DEPLOYMENT_TARGET" == "all" ]]; then
    print_step "Building Medusa..."
    cd medusa
    if npm run build >> "$LOG_FILE" 2>&1; then
        print_success "Medusa build successful"
    else
        print_error "Medusa build failed - check $LOG_FILE"
        exit 1
    fi
    cd ..
fi

if [[ "$DEPLOYMENT_TARGET" == "fabric-store" ]] || [[ "$DEPLOYMENT_TARGET" == "all" ]]; then
    print_step "Building Fabric Store..."
    cd frontend/experiences/fabric-store
    if npm run build >> "$LOG_FILE" 2>&1; then
        print_success "Fabric Store build successful"
    else
        print_error "Fabric Store build failed - check $LOG_FILE"
        exit 1
    fi
    cd ../../..
fi

# ========================================
# Phase 4: Deployment
# ========================================

print_banner "🚀 PHASE 4: DEPLOYMENT"

print_step "Deploying to production..."
echo ""

if ./deployment/scripts/deploy-production.sh "$DEPLOYMENT_TARGET" >> "$LOG_FILE" 2>&1; then
    print_success "Deployment completed successfully"
else
    print_error "Deployment failed - check $LOG_FILE"
    exit 1
fi

# Wait for deployment to stabilize
print_info "Waiting 30 seconds for deployment to stabilize..."
sleep 30

# ========================================
# Phase 5: Post-Deployment Verification
# ========================================

if [[ "$SKIP_VERIFY" == false ]]; then
    print_banner "✅ PHASE 5: POST-DEPLOYMENT VERIFICATION"

    print_step "Running comprehensive verification tests..."
    echo ""

    if ./deployment/scripts/verify-production-deployment.sh >> "$LOG_FILE" 2>&1; then
        VERIFICATION_STATUS="PASSED"
        print_success "All verification tests passed"
    else
        VERIFICATION_STATUS="FAILED"
        print_error "Some verification tests failed - check $LOG_FILE"
        echo ""
        print_info "Deployment may still be initializing. Manual verification recommended."
    fi
else
    VERIFICATION_STATUS="SKIPPED"
    print_warning "Skipping post-deployment verification (--skip-verify)"
fi

# ========================================
# Phase 6: Deployment Report
# ========================================

print_banner "📊 DEPLOYMENT REPORT"

ELAPSED=$(elapsed_time)
END_TIME=$(date '+%Y-%m-%d %H:%M:%S')

echo ""
echo -e "═══════════════════════════════════════════════════════"
echo -e "  DEPLOYMENT SUMMARY"
echo -e "═══════════════════════════════════════════════════════"
echo ""
echo -e "Target:              ${CYAN}$DEPLOYMENT_TARGET${NC}"
echo -e "Started:             ${CYAN}$(date -d @$START_TIME '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "Completed:           ${CYAN}$END_TIME${NC}"
echo -e "Duration:            ${CYAN}$ELAPSED${NC}"
echo -e "Verification:        ${CYAN}$VERIFICATION_STATUS${NC}"
echo ""

if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "Git Commit:          ${CYAN}$COMMIT_HASH${NC}"
    echo -e "Branch:              ${CYAN}$CURRENT_BRANCH${NC}"
    echo ""
fi

echo -e "Log File:            ${CYAN}$LOG_FILE${NC}"
echo ""
echo -e "═══════════════════════════════════════════════════════"
echo ""

# ========================================
# Phase 7: Quick Verification Links
# ========================================

print_banner "🔗 VERIFICATION LINKS"

echo ""
echo -e "Test these URLs to verify deployment:"
echo ""

if [[ "$DEPLOYMENT_TARGET" == "medusa" ]] || [[ "$DEPLOYMENT_TARGET" == "all" ]]; then
    echo -e "  ${CYAN}Medusa Health:${NC}"
    echo -e "    https://medusa-backend-production-3655.up.railway.app/health"
    echo ""
    echo -e "  ${CYAN}Admin UI:${NC}"
    echo -e "    https://medusa-backend-production-3655.up.railway.app/app"
    echo ""
    echo -e "  ${CYAN}Store API:${NC}"
    echo -e "    https://medusa-backend-production-3655.up.railway.app/store/products"
    echo ""
fi

if [[ "$DEPLOYMENT_TARGET" == "fabric-store" ]] || [[ "$DEPLOYMENT_TARGET" == "all" ]]; then
    echo -e "  ${CYAN}Fabric Store:${NC}"
    echo -e "    https://fabric-store-ten.vercel.app"
    echo ""
fi

echo -e "  ${CYAN}Platform Dashboards:${NC}"
echo -e "    Railway:  https://railway.app"
echo -e "    Vercel:   https://vercel.com/dashboard"
echo ""

# ========================================
# Phase 8: Next Steps
# ========================================

print_banner "📝 NEXT STEPS"

echo ""
echo -e "1. ${CYAN}Verify deployment manually:${NC}"
echo -e "   - Test critical user flows"
echo -e "   - Check admin UI functionality"
echo -e "   - Verify product catalog loads"
echo ""
echo -e "2. ${CYAN}Monitor logs for 10 minutes:${NC}"
echo -e "   railway logs -f"
echo -e "   vercel logs https://fabric-store-ten.vercel.app"
echo ""
echo -e "3. ${CYAN}Run additional tests if needed:${NC}"
echo -e "   npm run test:e2e"
echo ""
echo -e "4. ${CYAN}Update team on deployment status${NC}"
echo ""

# ========================================
# Summary Status
# ========================================

if [[ "$VERIFICATION_STATUS" == "PASSED" ]]; then
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    exit 0
elif [[ "$VERIFICATION_STATUS" == "SKIPPED" ]]; then
    echo ""
    print_warning "⚠️  Deployment completed but verification was skipped"
    print_info "Run ./deployment/scripts/verify-production-deployment.sh manually"
    echo ""
    exit 0
else
    echo ""
    print_warning "⚠️  Deployment completed with verification warnings"
    print_info "Review $LOG_FILE for details"
    echo ""
    exit 0
fi