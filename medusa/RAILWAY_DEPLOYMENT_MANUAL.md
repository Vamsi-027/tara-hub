# Manual Railway Deployment Instructions

## Google OAuth Login Fix - Resolved Issues ✅

The following issues have been identified and fixed:

### Issues Fixed:
1. **URL Mismatch**: Configuration was using `medusa-production-e02c.up.railway.app` but actual URL is `medusa-backend-production-3655.up.railway.app`
2. **Google OAuth Callback URLs**: Updated to match production domain
3. **CORS Configuration**: All CORS settings now point to correct Railway domain
4. **Environment Variables**: All Medusa config variables updated

## Manual Deployment Steps

Since Railway CLI requires interactive login, here are the manual steps:

### 1. Login to Railway Dashboard
- Visit: https://railway.app/login
- Login with your credentials

### 2. Navigate to Your Project
- Project ID: `7d4ddac3-5123-4445-98cf-714ad52a324a`
- URL: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a

### 3. Update Environment Variables
In the Railway dashboard, set these environment variables:

```bash
# Core URLs (CRITICAL - Must match exactly)
MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app
MEDUSA_ADMIN_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app

# Google OAuth (CRITICAL for login fix)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://medusa-backend-production-3655.up.railway.app/auth/google/callback
GOOGLE_REDIRECT_URI=https://medusa-backend-production-3655.up.railway.app/admin/auth/google/callback
GOOGLE_AUTO_CREATE_USERS=true
GOOGLE_DEFAULT_ROLE=admin

# CORS Configuration
STORE_CORS=https://medusa-backend-production-3655.up.railway.app,http://localhost:3000,http://localhost:3006,http://localhost:3007,http://localhost:8000
ADMIN_CORS=https://medusa-backend-production-3655.up.railway.app,http://localhost:3000,http://localhost:7001,http://localhost:9000
AUTH_CORS=https://medusa-backend-production-3655.up.railway.app,http://localhost:3000,http://localhost:9000,http://localhost:8000

# Other Required Variables
NODE_ENV=production
DISABLE_MEDUSA_ADMIN=false
DATABASE_URL=postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require
REDIS_URL=rediss://default:AZS6AAIncDFiY2Q2YzgwNTA0NmQ0OWJhYWJkNmU2MjBmMGZmNmVkMHAxMzgwNzQ@excited-emu-38074.upstash.io:6379
JWT_SECRET=PWsuM6Ax3UNl9IE9TNpvUGsm2Z+gHNhKD8oAuEU7BIo=
COOKIE_SECRET=PWsuM6Ax3UNl9IE9TNpvUGsm2Z+gHNhKD8oAuEU7BIo=

# Storage (Cloudflare R2)
S3_REGION=auto
S3_BUCKET_NAME=store
S3_ENDPOINT=https://53d24b2d4e898f68c085de59b5f1ca71.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=7706574044a6bd0b09bb1eff5eba68da
S3_SECRET_ACCESS_KEY=ce54d583a573e0b21015c423f625e5ef1258574ee55ff609b8f3b0b7747ef677
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_URL=https://pub-24feed215a5e46e7b89260e44459ce21.r2.dev

# Email
RESEND_API_KEY=re_C7yWWG1y_Fsxewcn1iUuraQx2bvb2a2Wf
RESEND_FROM_EMAIL=Tara Hub Admin <admin@deepcrm.ai>

# Admin
MEDUSA_ADMIN_EMAIL=admin@tara-hub.com
MEDUSA_ADMIN_PASSWORD=supersecretpassword
```

### 4. Deploy the Service
1. Go to the service in Railway dashboard
2. Click "Deploy" or trigger a new deployment
3. Monitor build logs for any errors

### 5. Verify Google Cloud Console Settings
Make sure your Google Cloud Console OAuth app has these redirect URIs:
- `https://medusa-backend-production-3655.up.railway.app/auth/google/callback`
- `https://medusa-backend-production-3655.up.railway.app/admin/auth/google/callback`

## Testing the Fix

After deployment:

1. Visit: https://medusa-backend-production-3655.up.railway.app/app
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Should be redirected back to admin dashboard

## Root Cause Analysis

The issue was caused by:
1. **Configuration Mismatch**: The medusa-config.ts had hardcoded URLs that didn't match the actual Railway domain
2. **Environment Variable Inconsistency**: .env.local had wrong Railway domain
3. **Google OAuth Callback URLs**: Pointing to wrong domain in both config and Google Cloud Console

## Files Modified ✅

- ✅ `medusa/medusa-config.ts` - Updated all Railway URLs
- ✅ `.env.local` - Updated all Railway URLs
- ✅ `medusa/deploy-railway.sh` - Created deployment script
- ✅ `medusa/railway.toml` - Added Railway configuration
- ✅ `CLAUDE.md` - Updated deployment documentation

## Expected Result

Google OAuth login should now work correctly in production Railway environment.