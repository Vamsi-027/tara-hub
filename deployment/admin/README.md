# Tara Hub Admin - Deployment Tools 🚀

Comprehensive deployment infrastructure for the Tara Hub Admin Dashboard with support for both monolithic and modular deployments.

## Quick Start

### For Iterative/Component Deployments (Recommended)

```bash
# Deploy only frontend changes
node deployment/admin/deploy-modular.js vercel

# Deploy only database migrations
node deployment/admin/deploy-modular.js database

# Quick deployment menu (Windows)
.\deployment\admin\deploy-quick.ps1

# Quick deployment menu (Mac/Linux)
./deployment/admin/deploy-quick.sh
```

### For Full/Greenfield Deployments

```bash
# Navigate to deployment directory
cd deployment/admin

# Run full deployment
node deploy.js

# Or use npm scripts
npm run deploy:production
```

## Deployment Strategies

### 🎯 Modular Deployment (`deploy-modular.js`)
**Best for:** Iterative deployments, hotfixes, component-specific updates

```bash
# Deploy specific components
node deploy-modular.js vercel          # Frontend only
node deploy-modular.js database        # Database only
node deploy-modular.js railway         # Middleware only
node deploy-modular.js env --all       # Update all environments

# With options
node deploy-modular.js vercel --prod --skip-tests  # Production hotfix
node deploy-modular.js database --force            # Force migration
```

### ⚡ Quick Deployment Scripts
**Best for:** Common scenarios with interactive prompts

**Windows PowerShell:**
```powershell
.\deployment\admin\deploy-quick.ps1          # Interactive menu
.\deployment\admin\deploy-quick.ps1 hotfix   # Direct scenario
```

**Mac/Linux Bash:**
```bash
./deployment/admin/deploy-quick.sh          # Interactive menu
./deployment/admin/deploy-quick.sh hotfix   # Direct scenario
```

**Available Scenarios:**
- `hotfix` - Quick frontend fix to production
- `database` - Database migrations only
- `env` - Update environment variables
- `full` - Deploy entire stack
- `rollback` - Rollback deployments
- `preview` - Deploy to preview
- `emergency` - Skip all tests (use with caution!)

## Available Tools

### 1. Main Deployment Script (`deploy.js`)
Complete deployment automation with all checks and validations for greenfield deployments.

```bash
node deploy.js
```

Features:
- Git status verification
- Environment validation
- Dependency installation
- Test execution
- Build process
- Database migrations
- Vercel deployment
- Post-deployment verification

### 2. Environment Validator (`env-validator.js`)
Validates and manages environment variables.

```bash
# Basic validation
node env-validator.js

# Production readiness check
node env-validator.js --production

# Generate missing secrets
node env-validator.js --generate --save

# Export for CI/CD
node env-validator.js --export=vercel
```

### 3. Pre-Deployment Testing (`pre-deploy-test.js`)
Comprehensive testing before deployment.

```bash
node pre-deploy-test.js
```

Tests:
- Environment variables
- Database connection
- Authentication system
- API endpoints
- Build process
- Dependencies
- Security
- Performance

### 4. Database Seeding (`../../scripts/seed-data.js`)
Seeds initial data for development and testing.

```bash
# Seed all data
node ../../scripts/seed-data.js --all

# Seed specific data
node ../../scripts/seed-data.js --users --fabrics

# Reset and reseed
node ../../scripts/seed-data.js --reset --all
```

## NPM Scripts

```json
{
  "deploy": "Run full deployment process",
  "deploy:preview": "Deploy to preview environment",
  "deploy:production": "Deploy to production",
  "validate:env": "Validate environment variables",
  "validate:env:prod": "Validate for production",
  "test:predeploy": "Run pre-deployment tests",
  "seed:data": "Seed database with initial data",
  "check:all": "Run all validations"
}
```

## Deployment Workflow

### Step 1: Environment Setup
```bash
# Validate environment variables
npm run validate:env:prod

# Generate missing secrets if needed
node env-validator.js --generate --save
```

### Step 2: Pre-Deployment Testing
```bash
# Run all pre-deployment tests
npm run test:predeploy
```

### Step 3: Database Setup
```bash
# Run migrations
cd ../.. && npm run db:push

# Seed initial data (optional)
npm run seed:data
```

### Step 4: Deploy
```bash
# Deploy to preview first
npm run deploy:preview

# After testing, deploy to production
npm run deploy:production
```

## Environment Variables Required

Create `.env.local` in project root with:

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXTAUTH_URL=https://tara-hub.vercel.app
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Tara Hub <admin@deepcrm.ai>"

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...

# Optional: Vercel KV
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

## Vercel Configuration

### First-Time Setup:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

### Manual Deployment:
```bash
# Preview
vercel

# Production
vercel --prod
```

## Troubleshooting

### Common Issues:

1. **Environment Variables Missing**
   ```bash
   node env-validator.js --generate --save
   ```

2. **Build Failures**
   - Check `next.config.mjs` for disabled ESLint/TypeScript checks
   - Run `npm run lint` to see actual issues

3. **Database Connection Failed**
   - Verify DATABASE_URL is correct
   - Check network connectivity to Neon

4. **Authentication Not Working**
   - Ensure admin emails are in `lib/auth.ts`
   - Verify RESEND_API_KEY is valid
   - Check NEXTAUTH_URL matches deployment URL

## Production URLs

- **Main App:** https://tara-hub.vercel.app
- **Admin Panel:** https://tara-hub.vercel.app/admin
- **API Health:** https://tara-hub.vercel.app/api/health

## Support

For issues or questions:
- Check `DEPLOYMENT_CHECKLIST.md` for detailed steps
- Review test results from `pre-deploy-test.js`
- Contact: varaku@gmail.com

## License

MIT - Tara Hub Team 2024