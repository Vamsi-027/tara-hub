@echo off
echo Installing Python 3.12.7...
echo.
echo Please follow these steps:
echo.
echo 1. Open your web browser and go to: https://www.python.org/downloads/
echo 2. Click the "Download Python 3.12.7" button
echo 3. Run the downloaded installer
echo 4. IMPORTANT: Check the box "Add Python to PATH" at the bottom of the installer
echo 5. Click "Install Now"
echo 6. Once complete, restart your terminal
echo.
echo Press any key to open the Python download page...
pause > nul
start https://www.python.org/downloads/
echo.
echo After installation, run: python --version
echo to verify the installation.
pause