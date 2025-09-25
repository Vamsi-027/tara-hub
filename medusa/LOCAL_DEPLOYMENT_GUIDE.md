# 🚀 LOCAL DEPLOYMENT GUIDE

## Multiple Methods to Run Locally (Choose One)

---

## Method 1: Docker (RECOMMENDED) 🐳
**Works even with npm issues!**

### Requirements:
- Docker Desktop installed

### Steps:
```bash
# From Windows PowerShell or CMD:
cd medusa
docker-compose up --build

# Or use the helper script:
./run-local-windows.bat
```

### Access:
- Admin Panel: http://localhost:9000/app
- Store API: http://localhost:9000/store
- Health Check: http://localhost:9000/health

### Commands:
```bash
# View logs
docker-compose logs -f medusa

# Stop
docker-compose down

# Reset database
docker-compose down -v
docker-compose up --build
```

---

## Method 2: WSL Direct Run 🐧

### Steps:
```bash
# From WSL terminal
cd /mnt/c/Users/varak/repos/tara-hub-1/medusa
./local-deploy.sh
```

This script will:
1. Try Docker first
2. Fall back to direct Node.js
3. Create .env automatically

---

## Method 3: Windows Direct (PowerShell) 💻

### Steps:
```powershell
# From PowerShell (as Administrator)
cd C:\Users\varak\repos\tara-hub-1\medusa

# Run the Windows batch file
.\run-local-windows.bat
```

---

## Method 4: Bypass NPM Issues 🔧

### If npm install fails, try:
```bash
# Direct Node.js execution
node bypass-npm.js

# Or with increased memory
set NODE_OPTIONS=--max-old-space-size=8192
node bypass-npm.js
```

---

## Method 5: Pre-built Container 📦

### Pull and run pre-built image:
```bash
# Create docker-compose.prod.yml
docker run -d \
  --name medusa-local \
  -p 9000:9000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/medusa_db" \
  -e JWT_SECRET="supersecret" \
  -e COOKIE_SECRET="supersecret" \
  node:20-alpine \
  sh -c "cd /app && npm run dev"
```

---

## Environment Setup 🔧

### Required .env file:
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa_db
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
STORE_CORS=http://localhost:3000,http://localhost:3006
ADMIN_CORS=http://localhost:3000,http://localhost:9000
MEDUSA_BACKEND_URL=http://localhost:9000
```

### PostgreSQL Setup:
If you don't have PostgreSQL:
```bash
# Docker PostgreSQL
docker run -d \
  --name postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=medusa_db \
  postgres:14-alpine
```

---

## Troubleshooting 🔍

### NPM Install Fails (Bus Error)
```bash
# Solution 1: Use Docker
docker-compose up --build

# Solution 2: Clear everything
rm -rf node_modules package-lock.json
rm -rf ~/.npm/_cacache
npm cache clean --force

# Solution 3: Use Yarn instead
yarn install
```

### Port 9000 Already in Use
```bash
# Windows
netstat -ano | findstr :9000
taskkill /PID <PID> /F

# Linux/WSL
lsof -i :9000
kill -9 <PID>
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Or start it
docker-compose up postgres
```

### WSL Memory Issues
Create `C:\Users\varak\.wslconfig`:
```
[wsl2]
memory=8GB
processors=4
swap=2GB
```

Then restart WSL:
```bash
wsl --shutdown
wsl
```

---

## Quick Start Commands 🎯

### Fastest Local Deployment:
```bash
# If you have Docker Desktop
docker-compose up

# If Docker fails, try Windows script
run-local-windows.bat

# If everything fails, bypass npm
node bypass-npm.js
```

---

## Health Check

Once running, verify at:
```bash
curl http://localhost:9000/health
# Should return: {"status":"ok"}
```

---

## Next Steps

1. Access admin panel: http://localhost:9000/app
2. Default login: Use the credentials from your .env
3. Run migrations: `npx medusa db:migrate`
4. Seed data: `npx medusa seed`

---

## Still Having Issues?

The production deployment is already working on Railway:
https://medusa-backend-production-3655.up.railway.app

You can use the production API for development if local deployment continues to fail.