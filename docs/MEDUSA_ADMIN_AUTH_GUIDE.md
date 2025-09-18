# Medusa Admin Authentication Guide

## Problem
You're getting "Admin access required" error when trying to access admin endpoints on Railway deployment.

## Solution Steps

### 1. Access the Admin Login Page
Navigate to: `https://medusa-backend-production-3655.up.railway.app/app`

### 2. Login Process
There are two ways to authenticate:

#### Option A: Email/Password Login (if configured)
1. Enter email: `admin@tara-hub.com`
2. Enter your password
3. Click "Sign in"

#### Option B: Magic Link Login (recommended)
1. Enter email: `admin@tara-hub.com`
2. Click "Continue with email"
3. Check your email for the magic link
4. Click the link to authenticate

### 3. Required Environment Variables on Railway

Make sure these are set in your Railway deployment:

```env
# Authentication
JWT_SECRET=<secure-random-string>
COOKIE_SECRET=<secure-random-string>

# Database (already set)
DATABASE_URL=<your-postgresql-url>

# Email (for magic links)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=admin@tara-hub.com

# Backend URL
MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app

# CORS (important!)
ADMIN_CORS=https://medusa-backend-production-3655.up.railway.app
AUTH_CORS=https://medusa-backend-production-3655.up.railway.app
STORE_CORS=https://medusa-backend-production-3655.up.railway.app,http://localhost:3006
```

### 4. Setting Environment Variables in Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project (ID: 7d4ddac3-5123-4445-98cf-714ad52a324a)
3. Click on the `medusa-backend` service
4. Go to the "Variables" tab
5. Add/Update the required variables above
6. Click "Deploy" to redeploy with new variables

### 5. Create Admin User (if needed)

If you need to create a fresh admin user, SSH into Railway or run locally:

```bash
# Run this script locally with production DATABASE_URL
cd medusa
DATABASE_URL=<your-railway-postgres-url> npx tsx scripts/create-admin-user.ts
```

### 6. Test Authentication

Once logged in, you should be able to access:
- Admin Dashboard: `https://medusa-backend-production-3655.up.railway.app/app`
- Orders: `https://medusa-backend-production-3655.up.railway.app/app/orders`

### 7. API Authentication

For API calls, after logging in through the UI, your browser will have the necessary cookies. For programmatic access:

```javascript
// Example: Fetch with credentials
fetch('https://medusa-backend-production-3655.up.railway.app/admin/orders', {
  credentials: 'include',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})
```

### Troubleshooting

1. **"Unauthorized" Error**: Not logged in. Go to /app and login first.
2. **"Cannot send magic link"**: RESEND_API_KEY not configured in Railway.
3. **CORS errors**: Update ADMIN_CORS and AUTH_CORS environment variables.
4. **Cookie not setting**: Check COOKIE_SECRET and JWT_SECRET are set.

### Quick Fix Script

Run this to check your Railway config:

```bash
# Check if auth is working
curl -s "https://medusa-backend-production-3655.up.railway.app/health"

# Should return "OK"
```

## Next Steps

1. Login at: https://medusa-backend-production-3655.up.railway.app/app
2. Use email: admin@tara-hub.com
3. Once authenticated, you can access all admin endpoints
4. The session will persist via cookies