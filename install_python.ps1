# Install Python using Windows Package Manager (winget)
Write-Host "Installing latest Python version..." -ForegroundColor Green

# Check if winget is available
$wingetPath = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetPath) {
    Write-Host "Using Windows Package Manager to install Python..." -ForegroundColor Yellow
    winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
    
    Write-Host "`nPython installation complete!" -ForegroundColor Green
    Write-Host "Please restart your terminal or computer for PATH changes to take effect." -ForegroundColor Yellow
} else {
    Write-Host "Windows Package Manager not found. Downloading Python installer..." -ForegroundColor Yellow
    
    # Download Python installer directly
    $pythonUrl = "https://www.python.org/ftp/python/3.12.7/python-3.12.7-amd64.exe"
    $installerPath = "$env:TEMP\python-installer.exe"
    
    Write-Host "Downloading Python 3.12.7..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $pythonUrl -OutFile $installerPath
    
    Write-Host "Starting Python installer..." -ForegroundColor Yellow
    Write-Host "Please follow the installer prompts and make sure to check 'Add Python to PATH'" -ForegroundColor Red
    
    Start-Process -FilePath $installerPath -ArgumentList "/quiet", "InstallAllUsers=1", "PrependPath=1" -Wait
    
    Write-Host "`nPython installation complete!" -ForegroundColor Green
}

# Verify installation
Write-Host "`nVerifying Python installation..." -ForegroundColor Yellow
python --version
pip --version