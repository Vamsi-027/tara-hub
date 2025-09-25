@echo off
echo Starting Medusa Local Deployment for Windows...

REM Method 1: Try Docker Desktop
where docker >nul 2>nul
if %errorlevel%==0 (
    echo Docker found! Using Docker deployment...

    REM Stop existing containers
    docker-compose down 2>nul

    REM Build and start
    docker-compose up --build -d

    echo.
    echo Local deployment started!
    echo Admin Panel: http://localhost:9000/app
    echo Store API: http://localhost:9000/store
    echo.
    echo View logs: docker-compose logs -f medusa
    echo Stop: docker-compose down

    exit /b 0
)

REM Method 2: Use WSL
echo Docker not found. Trying WSL...
wsl ./local-deploy.sh

if %errorlevel%==0 (
    echo WSL deployment started!
    exit /b 0
)

REM Method 3: Direct Windows Node.js
echo Trying direct Node.js on Windows...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...

    REM Clean cache
    call npm cache clean --force 2>nul

    REM Try to install
    call npm ci --production=false --legacy-peer-deps --no-optional
    if %errorlevel% neq 0 (
        call npm install --legacy-peer-deps --no-optional --force
    )
)

REM Create .env if needed
if not exist ".env" (
    echo Creating .env file...
    (
        echo NODE_ENV=development
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa_db
        echo JWT_SECRET=supersecret
        echo COOKIE_SECRET=supersecret
        echo STORE_CORS=http://localhost:3000,http://localhost:3006,http://localhost:3007,http://localhost:8000
        echo ADMIN_CORS=http://localhost:3000,http://localhost:7001,http://localhost:9000
        echo AUTH_CORS=http://localhost:3000,http://localhost:9000,http://localhost:8000
        echo MEDUSA_BACKEND_URL=http://localhost:9000
    ) > .env
)

REM Start Medusa
echo Starting Medusa...
call npx medusa develop --host 0.0.0.0

pause