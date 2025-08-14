@echo off
echo Setting up pip for Python 3.13.6...
echo.

REM Ensure pip is installed
py -m ensurepip --upgrade

REM Upgrade pip to latest version
py -m pip install --upgrade pip

REM Show pip version
echo.
echo Pip setup complete! Version:
py -m pip --version

echo.
echo You can now use pip with: py -m pip install [package]
echo Or directly as: pip install [package] (after restarting terminal)
pause