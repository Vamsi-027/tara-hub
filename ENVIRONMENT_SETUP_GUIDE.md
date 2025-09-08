# Environment Variables Setup Guide

This guide provides comprehensive instructions for setting up all required environment files when cloning the Tara Hub monorepo to a new device.

## 🏗️ Architecture Overview

The Tara Hub monorepo uses a distributed environment variable architecture:
- **Root Level**: Global configurations shared across all services
- **Frontend**: Client-side specific variables
- **Medusa**: E-commerce backend configuration  
- **Backend**: API service configuration
- **Fabric Store**: Experience app specific variables

## 📁 Environment Files Structure

```
tara-hub/
├── .env.local                                    # Global (Copy from .env.example)
├── .env.example                                  # Global template ✅
├── frontend/
│   ├── .env                                      # Frontend-specific (active)
│   └── .env.example                              # Frontend template ✅
├── frontend/experiences/fabric-store/
│   ├── .env.local                                # Fabric Store (active)
│   └── .env.example                              # Fabric Store template ✅
├── backend/
│   ├── .env                                      # Backend (active)
│   └── .env.example                              # Backend template ✅  
└── medusa/
    ├── .env                                      # Medusa (active)
    ├── .env.template                             # Medusa template ✅
    └── .env.test                                 # Test environment
```

## 🚀 Quick Setup Checklist

After cloning the repository, create these files in order:

### 1. Root Directory: `/tara-hub/.env.local`
```bash
cp .env.example .env.local
```

**Required Variables:**
```env
# Environment
NODE_ENV=development

# URLs (Global)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Feature Flags (Global)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true

# Medusa Backend
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_EMAIL=admin@yourdomain.com
MEDUSA_ADMIN_PASSWORD=your_secure_password

# Database (PostgreSQL - for Medusa)
DATABASE_URL=postgresql://username:password@host:port/medusa?sslmode=require

# Redis (for Medusa caching)
REDIS_URL=rediss://default:token@host:port

# Security
JWT_SECRET=your_jwt_secret_here
COOKIE_SECRET=your_cookie_secret_here
```

### 2. Frontend: `/tara-hub/frontend/.env`
**Already exists - verify these variables:**
```env
# Public Keys (Safe for client-side)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# Frontend-specific URLs
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000
NEXT_PUBLIC_FABRIC_STORE_URL=http://localhost:3006
NEXT_PUBLIC_STORE_GUIDE_URL=http://localhost:3007

# Feature Flags
NEXT_PUBLIC_ENABLE_CHAT=false
NEXT_PUBLIC_ENABLE_REVIEWS=true
```

### 3. Fabric Store: `/tara-hub/frontend/experiences/fabric-store/.env.local`
```bash
cd frontend/experiences/fabric-store
cp .env.example .env.local
```

**Required Variables:**
```env
# Sanity CMS Configuration (PRODUCTION READY ✅)
NEXT_PUBLIC_SANITY_PROJECT_ID=d1t5dcup
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-sanity-api-token-here

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 4. Backend: `/tara-hub/backend/.env`
**Already exists - verify these critical variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tara_hub
POSTGRES_URL=postgresql://user:password@localhost:5432/tara_hub

# Authentication (Backend Only)
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret
COOKIE_SECRET=your-cookie-secret

# Email Service (Backend Only)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Cache (Backend Only)
REDIS_URL=redis://localhost:6379
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Storage (Backend Only) - Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Third-party APIs (Backend Only)
STRIPE_SECRET_KEY=
GOOGLE_CLIENT_SECRET=
WEBHOOK_SECRET=

# Medusa Configuration
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_ADMIN_CORS=http://localhost:3000
MEDUSA_STORE_CORS=http://localhost:3006,http://localhost:3007

```

### 5. Medusa: `/tara-hub/medusa/.env`
```bash
cd medusa
cp .env.template .env
```

**Required Variables:**
```env
# CORS Configuration
STORE_CORS=http://localhost:8000,https://docs.medusajs.com
ADMIN_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com
AUTH_CORS=http://localhost:5173,http://localhost:9000,https://docs.medusajs.com

# Database
DATABASE_URL=postgresql://username:password@host:port/medusa
DB_NAME=medusa

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=supersecret
COOKIE_SECRET=supersecret
```

## 🔑 Critical Environment Variables Explained

### Database Configuration
- **DATABASE_URL**: PostgreSQL connection string (used by Medusa and Backend)
- **POSTGRES_URL**: Alternative name for DATABASE_URL (both work)
- **DB_NAME**: Database name for Medusa

### Sanity CMS (Hero Carousel) ✅ PRODUCTION READY
- **NEXT_PUBLIC_SANITY_PROJECT_ID**: `d1t5dcup` (pre-configured)
- **NEXT_PUBLIC_SANITY_DATASET**: `production` (pre-configured)
- **SANITY_API_TOKEN**: Required for write operations (obtain from Sanity dashboard)

### Security Keys
- **JWT_SECRET**: Used for token signing (must be consistent across services)
- **NEXTAUTH_SECRET**: NextAuth.js secret key
- **COOKIE_SECRET**: Session cookie encryption

### CORS Configuration
- **ADMIN_CORS**: Admin dashboard origins
- **STORE_CORS**: Store frontend origins
- **AUTH_CORS**: Authentication origins

## 📋 Service Dependencies

### Required External Services:
1. **PostgreSQL Database** (Neon, Supabase, or local)
2. **Redis Cache** (Upstash or local)
3. **Sanity CMS Account** (for hero carousel)
4. **Resend API Key** (for email authentication)
5. **Cloudflare R2** (for image storage - optional but recommended)

## 🚦 Development Ports

- **Admin App**: http://localhost:3000
- **Fabric Store**: http://localhost:3006  
- **Store Guide**: http://localhost:3007
- **Medusa Backend**: http://localhost:9000
- **Medusa Admin**: http://localhost:9000/app

## ✅ Verification Checklist

After setting up all environment files:

1. **Root Admin App**: `npx next dev` (port 3000)
2. **Medusa Backend**: `cd medusa && npm run dev` (port 9000)
3. **Fabric Store**: `cd frontend/experiences/fabric-store && npm run dev` (port 3006)
4. **Sanity Studio**: `cd frontend/experiences/sanity-studio && npm run dev` (port 3333)

### Test Critical Features:
- [ ] Hero carousel loads with Sanity data
- [ ] Cart functionality works without alert popups
- [ ] Medusa admin accessible at http://localhost:9000/app
- [ ] All CORS APIs functional

## 🔒 Security Notes

- **Never commit actual values** to version control
- **Use .env.local for local development** (automatically ignored by Git)
- **Keep sensitive keys secure** (JWT secrets, API tokens, database passwords)
- **Use environment-specific values** for development vs production

## 🆘 Troubleshooting

### Common Issues:
1. **CORS Errors**: Check ADMIN_CORS and STORE_CORS values
2. **Database Connection**: Verify DATABASE_URL format and credentials
3. **Sanity Integration**: Ensure SANITY_API_TOKEN has proper permissions
4. **Port Conflicts**: Check if ports 3000, 3006, 3007, 9000 are available

### Quick Fixes:
```bash
# Check running processes on ports
lsof -ti:3000,3006,3007,9000

# Kill processes if needed
npx kill-port 3000 3006 3007 9000

# Restart services
npm run dev  # From root
cd medusa && npm run dev  # Medusa backend
```

## 📚 Additional Resources

- **Medusa Documentation**: https://docs.medusajs.com
- **Sanity Documentation**: https://www.sanity.io/docs
- **Next.js Environment Variables**: https://nextjs.org/docs/basic-features/environment-variables

---

🤖 **Generated with [Claude Code](https://claude.ai/code)**

**Last Updated**: 2025-09-01
**Tara Hub Version**: Phase 1 - Abhi Branch