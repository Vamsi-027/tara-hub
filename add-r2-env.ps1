# PowerShell script to add R2 environment variables to Vercel

Write-Host "Adding R2 environment variables to Vercel..." -ForegroundColor Green
Write-Host "Please make sure you have your R2 credentials in .env.local" -ForegroundColor Yellow
Write-Host ""

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "Error: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create it with your R2 credentials first." -ForegroundColor Red
    exit 1
}

# Read .env.local
$envContent = Get-Content ".env.local" | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' }
$envVars = @{}

foreach ($line in $envContent) {
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $envVars[$key] = $value
    }
}

# Check if R2 variables are set
$requiredVars = @('R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ACCOUNT_ID')
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($envVars[$var])) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "Error: Missing R2 environment variables in .env.local:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Example .env.local entries:" -ForegroundColor Yellow
    Write-Host "R2_BUCKET=your-bucket-name"
    Write-Host "R2_ACCESS_KEY_ID=your-access-key"
    Write-Host "R2_SECRET_ACCESS_KEY=your-secret-key"
    Write-Host "R2_ACCOUNT_ID=your-account-id"
    Write-Host "S3_URL=https://your-account-id.r2.cloudflarestorage.com (optional)"
    exit 1
}

Write-Host "Found R2 configuration. Adding to Vercel..." -ForegroundColor Green

# Function to add environment variable
function Add-VercelEnv {
    param (
        [string]$Name,
        [string]$Value
    )
    
    Write-Host "Adding $Name..." -ForegroundColor Cyan
    $Value | npx vercel env add $Name production
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $Name added successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to add $Name" -ForegroundColor Red
    }
}

# Add each variable
Add-VercelEnv -Name "R2_BUCKET" -Value $envVars['R2_BUCKET']
Add-VercelEnv -Name "R2_ACCESS_KEY_ID" -Value $envVars['R2_ACCESS_KEY_ID']
Add-VercelEnv -Name "R2_SECRET_ACCESS_KEY" -Value $envVars['R2_SECRET_ACCESS_KEY']
Add-VercelEnv -Name "R2_ACCOUNT_ID" -Value $envVars['R2_ACCOUNT_ID']

# Add S3_URL if present
if ($envVars.ContainsKey('S3_URL') -and -not [string]::IsNullOrWhiteSpace($envVars['S3_URL'])) {
    Add-VercelEnv -Name "S3_URL" -Value $envVars['S3_URL']
}

Write-Host ""
Write-Host "✅ R2 environment variables added to Vercel!" -ForegroundColor Green
Write-Host ""
Write-Host "Now redeploy your application for the changes to take effect:" -ForegroundColor Yellow
Write-Host "  npx vercel --prod" -ForegroundColor Cyan