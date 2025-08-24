# Port Management Best Practices

## Designated Ports

This project uses specific ports for each service:

- **Admin Dashboard**: Port 3001
- **Fabric Store**: Port 3006
- **Store Guide**: Port 3007
- **Main App (if separate)**: Port 3000

## Best Practices

### 1. Always Kill Existing Services Before Starting

Before starting any service, always check and kill existing processes on the designated port:

```bash
# Windows - Check port usage
netstat -ano | findstr :3001

# Windows - Kill process by PID
powershell -Command "Stop-Process -Id [PID] -Force"

# Linux/Mac - Check port usage
lsof -i :3001

# Linux/Mac - Kill process
kill -9 [PID]
```

### 2. Never Allow Port Auto-Increment

When Next.js detects a port is in use, it will try to auto-increment (3000 → 3001 → 3002, etc.). This should be prevented:

- Always specify the PORT explicitly
- Kill existing processes instead of allowing auto-increment
- Use environment variables to enforce specific ports

### 3. Starting Services on Specific Ports

```bash
# Admin on port 3001
set PORT=3001 && npm run dev:admin

# Or use cross-env for cross-platform compatibility
npx cross-env PORT=3001 npm run dev:admin
```

### 4. Port Cleanup Script

Create a cleanup script to free all project ports:

```bash
# cleanup-ports.bat (Windows)
@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do powershell -Command "Stop-Process -Id %%a -Force" 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3006') do powershell -Command "Stop-Process -Id %%a -Force" 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3007') do powershell -Command "Stop-Process -Id %%a -Force" 2>nul
echo Ports cleaned!
```

### 5. Environment Configuration

Add to `.env.local`:
```env
# Port configuration
ADMIN_PORT=3001
FABRIC_STORE_PORT=3006
STORE_GUIDE_PORT=3007
```

### 6. Development Workflow

1. Before starting development, run port cleanup
2. Start services on their designated ports only
3. If a port is occupied, investigate why (don't just increment)
4. Use background processes with IDs for easy management
5. Always kill services cleanly when done

## Troubleshooting

### Port Already in Use

If you see "Port 3001 is in use", DO NOT let it auto-increment. Instead:

1. Find what's using the port
2. Determine if it's a leftover process
3. Kill the process if appropriate
4. Start your service on the correct port

### Service Won't Stop

If a service won't stop cleanly:

1. Use force kill (kill -9 on Unix, /F flag on Windows)
2. Check for child processes
3. Restart terminal/command prompt if needed
4. As last resort, restart the development machine

## Important Notes

- Never commit port configuration changes that use non-standard ports
- Always document if a service requires a specific port
- Keep port assignments consistent across the team
- Use the same ports in development and CI/CD environments