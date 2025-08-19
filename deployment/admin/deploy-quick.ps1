# PowerShell version of quick deployment scripts for Windows
# Usage: .\deploy-quick.ps1 [scenario]

$ErrorActionPreference = "Stop"

# Colors
function Write-Header {
    param($text)
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "▶ $text" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Blue
}

function Write-Success {
    param($text)
    Write-Host "✓ $text" -ForegroundColor Green
}

function Write-Warning {
    param($text)
    Write-Host "⚠ $text" -ForegroundColor Yellow
}

function Write-Error {
    param($text)
    Write-Host "✗ $text" -ForegroundColor Red
}

function Write-Info {
    param($text)
    Write-Host "ℹ $text"
}

# Change to project root
Set-Location ..\..\

# Scenario: Frontend hotfix
function Frontend-Hotfix {
    Write-Header "Frontend Hotfix Deployment"
    
    Write-Info "This will deploy frontend changes immediately to production"
    $confirm = Read-Host "Continue? (y/n)"
    if ($confirm -ne 'y') {
        Write-Warning "Deployment cancelled"
        exit
    }
    
    # Quick lint check
    Write-Info "Running quick lint check..."
    try {
        npm run lint
    } catch {
        Write-Warning "Lint issues detected (continuing anyway)"
    }
    
    # Build
    Write-Info "Building frontend..."
    npm run build:admin
    
    # Deploy to Vercel production
    Write-Info "Deploying to Vercel production..."
    vercel --prod
    
    Write-Success "Frontend hotfix deployed!"
}

# Scenario: Database migration only
function Database-Only {
    Write-Header "Database Migration Only"
    
    # Check for schema changes
    Write-Info "Checking for schema changes..."
    $changes = git diff --name-only HEAD^ HEAD
    if ($changes -match "schema|drizzle") {
        Write-Success "Schema changes detected"
    } else {
        Write-Warning "No schema changes detected in last commit"
        $confirm = Read-Host "Continue anyway? (y/n)"
        if ($confirm -ne 'y') {
            exit
        }
    }
    
    # Generate migrations
    Write-Info "Generating migrations..."
    npm run db:generate
    
    # Show migration files
    Write-Info "Migration files:"
    Get-ChildItem drizzle\*.sql | Select-Object -Last 5 | ForEach-Object { Write-Host $_.Name }
    
    # Apply migrations
    $confirm = Read-Host "Apply migrations to production? (y/n)"
    if ($confirm -eq 'y') {
        npm run db:push
        Write-Success "Migrations applied!"
    } else {
        Write-Warning "Migrations skipped"
    }
}

# Scenario: Environment update
function Env-Update {
    Write-Header "Environment Variables Update"
    
    # Validate local env
    Write-Info "Validating local environment..."
    node deployment\admin\env-validator.js --production
    
    # Update Vercel
    $confirm = Read-Host "Update Vercel environment? (y/n)"
    if ($confirm -eq 'y') {
        Write-Info "Pulling current Vercel env..."
        vercel env pull .env.vercel
        
        Write-Info "Please update environment variables in Vercel dashboard"
        Start-Process "https://vercel.com/dashboard"
        Write-Success "Opening Vercel dashboard..."
    }
    
    # Update Railway
    $confirm = Read-Host "Update Railway environment? (y/n)"
    if ($confirm -eq 'y') {
        Write-Info "Opening Railway dashboard for manual update..."
        Start-Process "https://railway.app/dashboard"
        Write-Info "Please update environment variables manually in Railway dashboard"
    }
}

# Scenario: Full stack deployment
function Full-Stack {
    Write-Header "Full Stack Deployment"
    
    Write-Warning "This will deploy: Database → Middleware → Frontend"
    $confirm = Read-Host "Continue with full deployment? (y/n)"
    if ($confirm -ne 'y') {
        exit
    }
    
    # Database
    Write-Info "Step 1/3: Database migrations..."
    npm run db:generate
    npm run db:push
    Write-Success "Database updated"
    
    # Middleware (Railway)
    if (Get-Command railway -ErrorAction SilentlyContinue) {
        Write-Info "Step 2/3: Deploying middleware to Railway..."
        railway up --environment production
        Write-Success "Middleware deployed"
    } else {
        Write-Warning "Railway CLI not found, skipping middleware deployment"
    }
    
    # Frontend (Vercel)
    Write-Info "Step 3/3: Deploying frontend to Vercel..."
    npm run build:admin
    vercel --prod
    Write-Success "Frontend deployed"
    
    Write-Success "Full stack deployment complete!"
}

# Scenario: Rollback
function Rollback-Deployment {
    Write-Header "Deployment Rollback"
    
    Write-Host "What would you like to rollback?"
    Write-Host "1) Vercel (Frontend)"
    Write-Host "2) Railway (Middleware)"
    Write-Host "3) Database"
    $choice = Read-Host "Enter choice (1-3)"
    
    switch ($choice) {
        1 {
            Write-Info "Getting recent Vercel deployments..."
            vercel ls
            $url = Read-Host "Enter deployment URL to rollback to"
            vercel rollback $url
            Write-Success "Vercel rolled back"
        }
        2 {
            Write-Info "Opening Railway dashboard for rollback..."
            Start-Process "https://railway.app/dashboard"
            Write-Info "Please perform rollback manually in Railway dashboard"
        }
        3 {
            Write-Warning "Database rollback requires manual intervention"
            Write-Info "1. Restore from backup"
            Write-Info "2. Or revert migration files and re-run"
        }
        default {
            Write-Error "Invalid choice"
        }
    }
}

# Scenario: Preview deployment
function Preview-Deploy {
    Write-Header "Preview Deployment"
    
    Write-Info "Deploying to preview environment..."
    
    # Build and deploy
    npm run build:admin
    vercel  # Without --prod flag
    
    Write-Success "Preview deployment complete!"
    Write-Info "Check your preview URL in Vercel dashboard"
}

# Scenario: Emergency fix
function Emergency-Deploy {
    Write-Header "EMERGENCY DEPLOYMENT"
    
    Write-Warning "This will skip ALL tests and deploy immediately!"
    Write-Warning "Only use for critical production fixes!"
    
    $confirm = Read-Host "Type 'EMERGENCY' to confirm"
    if ($confirm -ne "EMERGENCY") {
        Write-Error "Confirmation failed"
        exit 1
    }
    
    # Skip everything, just build and deploy
    Write-Info "Building..."
    try {
        npm run build:admin
    } catch {
        Write-Error "Build failed but continuing..."
    }
    
    Write-Info "Deploying to production..."
    vercel --prod --force
    
    Write-Success "Emergency deployment complete!"
    Write-Warning "Remember to run full tests after the emergency is resolved"
}

# Main menu
function Show-Menu {
    Write-Header "Tara Hub - Quick Deployment Menu"
    
    Write-Host "Select deployment scenario:"
    Write-Host ""
    Write-Host "  1) 🔥 Frontend Hotfix      - Quick frontend fix to production"
    Write-Host "  2) 🗄️  Database Only        - Migrate database only"
    Write-Host "  3) 🔐 Environment Update   - Update env variables"
    Write-Host "  4) 🚀 Full Stack           - Deploy everything"
    Write-Host "  5) ↩️  Rollback             - Rollback a deployment"
    Write-Host "  6) 👁️  Preview              - Deploy to preview"
    Write-Host "  7) 🚨 Emergency            - EMERGENCY deployment (skip tests)"
    Write-Host "  8) ❌ Exit"
    Write-Host ""
    $choice = Read-Host "Enter choice (1-8)"
    
    switch ($choice) {
        1 { Frontend-Hotfix }
        2 { Database-Only }
        3 { Env-Update }
        4 { Full-Stack }
        5 { Rollback-Deployment }
        6 { Preview-Deploy }
        7 { Emergency-Deploy }
        8 { exit }
        default { 
            Write-Error "Invalid choice"
            Show-Menu
        }
    }
}

# Check if scenario was passed as argument
if ($args.Count -eq 0) {
    Show-Menu
} else {
    switch ($args[0]) {
        "hotfix" { Frontend-Hotfix }
        "database" { Database-Only }
        "env" { Env-Update }
        "full" { Full-Stack }
        "rollback" { Rollback-Deployment }
        "preview" { Preview-Deploy }
        "emergency" { Emergency-Deploy }
        default {
            Write-Error "Unknown scenario: $($args[0])"
            Write-Host "Available: hotfix, database, env, full, rollback, preview, emergency"
            exit 1
        }
    }
}