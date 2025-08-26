# Migration Guide: Moving Authentication to Railway

## Current State

Your authentication system is **already built** and running as Next.js API routes in `/app/api/auth/`. It includes:

- **Magic link authentication** using Resend API
- **JWT token generation** and session management
- **PostgreSQL** for storing verification tokens
- **Admin whitelist** enforcement

## Why Consider Railway for Auth APIs?

While your auth system works in Next.js/Vercel, moving it to Railway offers:

1. **No timeout limits** - Vercel has 10-second limit, Railway doesn't
2. **Direct database connections** - Better PostgreSQL connection pooling
3. **Persistent state** - Better for rate limiting and session management
4. **Lower costs** - Auth API calls won't count against Vercel's function invocations
5. **Better email reliability** - Dedicated service for Resend API calls

## Migration Strategy

### Option 1: Full Auth Migration (Recommended)
Move all authentication endpoints to Railway:

```
Railway API Service:
├── /auth/signin     (send magic link)
├── /auth/verify     (verify token & create session)
├── /auth/signout    (clear session)
├── /auth/session    (get current user)
└── /auth/refresh    (refresh JWT)

Vercel (Next.js):
└── All other /api/* routes stay here
```

### Option 2: Hybrid Approach
Keep lightweight endpoints in Vercel, move heavy operations to Railway:

```
Railway API Service:
├── /auth/signin     (send emails - uses Resend)
├── /auth/verify     (database operations)
└── /jobs/email      (bulk email operations)

Vercel (Next.js):
├── /auth/session    (just JWT verification)
└── /auth/signout    (just cookie clearing)
```

### Option 3: Keep Everything in Vercel (Current)
No changes needed - your current setup works fine unless you hit limits.

## Implementation Steps

### If Migrating to Railway:

1. **Deploy the api-service to Railway:**
   ```bash
   cd api-service
   npm install
   railway init
   railway add postgresql
   railway up
   ```

2. **Update environment variables in Railway:**
   - Copy all auth-related env vars from `.env.local`
   - Especially: `RESEND_API_KEY`, `NEXTAUTH_SECRET`, database URLs

3. **Update your Next.js app to use Railway for auth:**
   ```typescript
   // In your auth components/hooks
   const AUTH_API = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:4000';
   
   // Sign in
   await fetch(`${AUTH_API}/auth/signin`, {
     method: 'POST',
     body: JSON.stringify({ email })
   });
   ```

4. **Update CORS in Railway API:**
   ```typescript
   // api-service/src/index.ts
   const corsOptions = {
     origin: [
       'https://tara-hub.vercel.app',
       'http://localhost:3000'
     ],
     credentials: true // Important for cookies
   };
   ```

5. **Test the migration:**
   - Test magic link sending
   - Test token verification
   - Test session persistence
   - Test cross-origin cookie handling

## Database Schema

Your existing tables that need to be accessible from Railway:

```sql
-- Users table (legacy schema)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  email_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Verification tokens table
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Login attempts (for rate limiting)
CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables Needed in Railway

```env
# Database (Railway provides these)
DATABASE_URL=${RAILWAY_POSTGRES_URL}

# Authentication
NEXTAUTH_SECRET=<same as your Vercel app>
JWT_SECRET=<same as your Vercel app>

# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=admin@yourdomain.com

# CORS
ALLOWED_ORIGINS=https://tara-hub.vercel.app,https://tara-hub-fabric-store.vercel.app

# Application
NODE_ENV=production
PORT=3000  # Railway sets this
```

## Testing Checklist

- [ ] Magic link email sends successfully
- [ ] Token verification works
- [ ] Session cookies are set correctly
- [ ] CORS allows requests from Vercel apps
- [ ] Database connections work
- [ ] Rate limiting functions properly
- [ ] JWT tokens are valid across services

## Rollback Plan

If issues arise, you can instantly rollback by:
1. Updating your frontend to use `/api/auth/*` instead of Railway URLs
2. Your Next.js auth routes are still there and will work immediately

## Current Working Endpoints (Next.js)

These are already working in your Next.js app:
- `POST /api/auth/signin` - Sends magic link
- `GET /api/auth/verify` - Verifies token
- `POST /api/auth/signout` - Signs out
- `GET /api/auth/session` - Gets session
- `POST /api/auth/test-email` - Tests email sending

## Decision Matrix

| Factor | Keep in Vercel | Move to Railway |
|--------|---------------|----------------|
| Current Status | ✅ Working | ❌ Not deployed |
| Setup Effort | None | Medium |
| Monthly Cost | Higher (function calls) | Lower (dedicated) |
| Email Reliability | Good | Better |
| Database Connections | Limited | Unlimited |
| Timeout Limits | 10 seconds | None |
| Maintenance | Simple | Two services |

## Recommendation

**For now:** Keep using your existing Next.js auth routes - they work!

**Move to Railway when:**
- You hit Vercel function invocation limits
- You need longer timeouts for email operations
- You want to reduce Vercel costs
- You need persistent WebSocket connections for real-time auth events

The `api-service` folder is ready to use when you need it!