#!/bin/bash

# Quick deployment scripts for common scenarios
# Usage: ./deploy-quick.sh [scenario]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="../.."

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Scenario: Frontend hotfix
frontend_hotfix() {
    print_header "Frontend Hotfix Deployment"
    
    print_info "This will deploy frontend changes immediately to production"
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    # Quick lint check
    print_info "Running quick lint check..."
    npm run lint || print_warning "Lint issues detected (continuing anyway)"
    
    # Build
    print_info "Building frontend..."
    npm run build:admin
    
    # Deploy to Vercel production
    print_info "Deploying to Vercel production..."
    vercel --prod
    
    print_success "Frontend hotfix deployed!"
}

# Scenario: Database migration only
database_only() {
    print_header "Database Migration Only"
    
    # Check for schema changes
    print_info "Checking for schema changes..."
    if git diff --name-only HEAD^ HEAD | grep -q "schema\|drizzle"; then
        print_success "Schema changes detected"
    else
        print_warning "No schema changes detected in last commit"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
    fi
    
    # Generate migrations
    print_info "Generating migrations..."
    npm run db:generate
    
    # Show migration files
    print_info "Migration files:"
    ls -la drizzle/*.sql 2>/dev/null | tail -5 || print_warning "No migration files found"
    
    # Apply migrations
    read -p "Apply migrations to production? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run db:push
        print_success "Migrations applied!"
    else
        print_warning "Migrations skipped"
    fi
}

# Scenario: Environment update
env_update() {
    print_header "Environment Variables Update"
    
    # Validate local env
    print_info "Validating local environment..."
    node deployment/admin/env-validator.js --production
    
    # Update Vercel
    read -p "Update Vercel environment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Pulling current Vercel env..."
        vercel env pull .env.vercel
        
        print_info "Pushing local env to Vercel..."
        # This is a simplified version - you might need to handle this differently
        vercel env add < .env.local
        
        print_success "Vercel environment updated"
    fi
    
    # Update Railway
    read -p "Update Railway environment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Opening Railway dashboard for manual update..."
        open https://railway.app/dashboard || xdg-open https://railway.app/dashboard
        print_info "Please update environment variables manually in Railway dashboard"
    fi
}

# Scenario: Full stack deployment
full_stack() {
    print_header "Full Stack Deployment"
    
    print_warning "This will deploy: Database → Middleware → Frontend"
    read -p "Continue with full deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    # Database
    print_info "Step 1/3: Database migrations..."
    npm run db:generate
    npm run db:push
    print_success "Database updated"
    
    # Middleware (Railway)
    if command -v railway &> /dev/null; then
        print_info "Step 2/3: Deploying middleware to Railway..."
        railway up --environment production
        print_success "Middleware deployed"
    else
        print_warning "Railway CLI not found, skipping middleware deployment"
    fi
    
    # Frontend (Vercel)
    print_info "Step 3/3: Deploying frontend to Vercel..."
    npm run build:admin
    vercel --prod
    print_success "Frontend deployed"
    
    print_success "Full stack deployment complete!"
}

# Scenario: Rollback
rollback() {
    print_header "Deployment Rollback"
    
    echo "What would you like to rollback?"
    echo "1) Vercel (Frontend)"
    echo "2) Railway (Middleware)"
    echo "3) Database"
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            print_info "Getting recent Vercel deployments..."
            vercel ls
            read -p "Enter deployment URL to rollback to: " url
            vercel rollback $url
            print_success "Vercel rolled back"
            ;;
        2)
            print_info "Opening Railway dashboard for rollback..."
            open https://railway.app/dashboard || xdg-open https://railway.app/dashboard
            print_info "Please perform rollback manually in Railway dashboard"
            ;;
        3)
            print_warning "Database rollback requires manual intervention"
            print_info "1. Restore from backup"
            print_info "2. Or revert migration files and re-run"
            ;;
        *)
            print_error "Invalid choice"
            ;;
    esac
}

# Scenario: Preview deployment
preview() {
    print_header "Preview Deployment"
    
    print_info "Deploying to preview environment..."
    
    # Build and deploy
    npm run build:admin
    vercel  # Without --prod flag
    
    print_success "Preview deployment complete!"
    print_info "Check your preview URL in Vercel dashboard"
}

# Scenario: Emergency fix
emergency() {
    print_header "EMERGENCY DEPLOYMENT"
    
    print_warning "This will skip ALL tests and deploy immediately!"
    print_warning "Only use for critical production fixes!"
    
    read -p "Type 'EMERGENCY' to confirm: " confirm
    if [[ $confirm != "EMERGENCY" ]]; then
        print_error "Confirmation failed"
        exit 1
    fi
    
    # Skip everything, just build and deploy
    print_info "Building..."
    npm run build:admin || print_error "Build failed but continuing..."
    
    print_info "Deploying to production..."
    vercel --prod --force
    
    print_success "Emergency deployment complete!"
    print_warning "Remember to run full tests after the emergency is resolved"
}

# Main menu
show_menu() {
    print_header "Tara Hub - Quick Deployment Menu"
    
    echo "Select deployment scenario:"
    echo ""
    echo "  1) 🔥 Frontend Hotfix      - Quick frontend fix to production"
    echo "  2) 🗄️  Database Only        - Migrate database only"
    echo "  3) 🔐 Environment Update   - Update env variables"
    echo "  4) 🚀 Full Stack           - Deploy everything"
    echo "  5) ↩️  Rollback             - Rollback a deployment"
    echo "  6) 👁️  Preview              - Deploy to preview"
    echo "  7) 🚨 Emergency            - EMERGENCY deployment (skip tests)"
    echo "  8) ❌ Exit"
    echo ""
    read -p "Enter choice (1-8): " choice
    
    case $choice in
        1) frontend_hotfix ;;
        2) database_only ;;
        3) env_update ;;
        4) full_stack ;;
        5) rollback ;;
        6) preview ;;
        7) emergency ;;
        8) exit 0 ;;
        *) 
            print_error "Invalid choice"
            show_menu
            ;;
    esac
}

# Check if scenario was passed as argument
if [ $# -eq 0 ]; then
    show_menu
else
    case $1 in
        hotfix) frontend_hotfix ;;
        database) database_only ;;
        env) env_update ;;
        full) full_stack ;;
        rollback) rollback ;;
        preview) preview ;;
        emergency) emergency ;;
        *)
            print_error "Unknown scenario: $1"
            echo "Available: hotfix, database, env, full, rollback, preview, emergency"
            exit 1
            ;;
    esac
fi