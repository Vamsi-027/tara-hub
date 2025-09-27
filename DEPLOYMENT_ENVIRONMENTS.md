# Tara Hub - Environment Configuration Standards

This document standardizes environment variables across local development, testing, and cloud deployment.

## Environment Hierarchy

### 1. Local Development
- **File**: `.env.local` (not committed)
- **Database**: Local PostgreSQL or Neon DB
- **Purpose**: Daily development work

### 2. Testing (E2E/Integration)
- **File**: `.env.testing` (not committed)
- **Database**: Dedicated test database or testcontainers
- **Purpose**: Automated testing with isolation

### 3. Deployment (Staging/Production)
- **File**: Platform environment variables
- **Database**: Neon cloud database
- **Purpose**: Live deployments

## Database URL Priority (E2E Tests)

The E2E test suite follows this priority order:

1. `DATABASE_URL_TEST` - Dedicated test database (highest priority)
2. `NEON_DATABASE_URL` - Neon cloud database
3. `DATABASE_URL` - Development database (fallback)
4. **Testcontainers** - Docker PostgreSQL container (last resort)

## Environment File Templates

### Local Development: `.env.local`
```bash
# Copy from .env.example and customize
DATABASE_URL=postgresql://user:pass@neon-host/db?sslmode=require
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
JWT_SECRET=your_local_jwt_secret
```

### Testing: `.env.testing`
```bash
# Copy from .env.testing.template and customize
DATABASE_URL_TEST=postgresql://user:pass@neon-host/test_db?sslmode=require
NODE_ENV=test
JEST_TIMEOUT=120000
```

### Deployment: Platform Variables
Set these in Vercel/Railway dashboards:
```bash
DATABASE_URL=postgresql://user:pass@neon-host/prod_db?sslmode=require
NODE_ENV=production
JWT_SECRET=secure_production_secret
```

## Quick Setup Commands

### For Local Development
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your Neon database URL
nano .env.local
```

### For E2E Testing
```bash
# Copy testing template
cp .env.testing.template .env.testing

# Set your test database URL
echo "DATABASE_URL_TEST=postgresql://user:pass@neon-host/test_db?sslmode=require" >> .env.testing

# Run E2E tests
cd medusa && npm run test:e2e:materials
```

### For Deployment
```bash
# Use deployment scripts with tokens
npm run deploy:prod all

# Or deploy individual components
npm run deploy:prod medusa      # Railway backend
npm run deploy:prod fabric-store # Vercel frontend
```

## Environment Variable Reference

### Core Database Variables
- `DATABASE_URL` - Primary database connection
- `DATABASE_URL_TEST` - Dedicated test database
- `NEON_DATABASE_URL` - Neon cloud database
- `POSTGRES_URL` - Alternative PostgreSQL URL format

### Authentication & Security
- `JWT_SECRET` - JSON Web Token signing secret
- `COOKIE_SECRET` - Session cookie encryption
- `NEXTAUTH_SECRET` - NextAuth.js authentication secret

### Service Integration
- `STRIPE_API_KEY` - Payment processing
- `RESEND_API_KEY` - Email service
- `TWILIO_*` - SMS authentication
- `S3_*` - File storage (Cloudflare R2)

### CORS Configuration
- `STORE_CORS` - Frontend application URLs
- `ADMIN_CORS` - Admin panel URLs
- `AUTH_CORS` - Authentication service URLs

## Testing Workflow

### Option A: Use Neon Cloud Database (Recommended)
```bash
# 1. Create test database in Neon
# 2. Set environment variable
export DATABASE_URL_TEST="postgresql://user:pass@neon-host/test_db?sslmode=require"

# 3. Run tests
cd medusa && npm run test:e2e:materials
```

### Option B: Use Docker Testcontainers
```bash
# 1. Ensure Docker is running
docker run hello-world

# 2. Run tests (no env needed)
cd medusa && npm run test:e2e:materials
```

## Deployment Checklist

### Before Deployment
- [ ] Environment variables set in deployment platforms
- [ ] Database migrations run successfully
- [ ] E2E tests pass with cloud database
- [ ] Security secrets rotated for production

### Vercel Frontend Deployment
- [ ] `NEXT_PUBLIC_MEDUSA_BACKEND_URL` points to Railway
- [ ] `DATABASE_URL` set for admin functions
- [ ] `NEXTAUTH_SECRET` configured

### Railway Backend Deployment
- [ ] `DATABASE_URL` points to Neon production DB
- [ ] `JWT_SECRET` and `COOKIE_SECRET` set
- [ ] CORS variables include production URLs
- [ ] File storage (S3) credentials configured

## Security Best Practices

1. **Never commit** `.env.local`, `.env.testing`, or `.env.deployment.local`
2. **Use test keys** for Stripe, Resend in non-production environments
3. **Rotate secrets** regularly, especially for production
4. **Separate databases** for development, testing, and production
5. **Use SSL/TLS** for all database connections (`sslmode=require`)

## Troubleshooting

### E2E Tests Timeout
- Increase `JEST_TIMEOUT` in `.env.testing`
- Ensure Docker daemon is running if using testcontainers
- Check Neon database accessibility

### Database Connection Issues
- Verify SSL mode in connection string
- Check firewall settings for Neon database
- Ensure database exists and user has permissions

### Deployment Failures
- Verify all required environment variables are set
- Check deployment logs for specific error messages
- Ensure database migrations completed successfully