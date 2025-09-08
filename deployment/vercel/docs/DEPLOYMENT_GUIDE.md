# 🚀 Tara Hub Deployment Guide

## Quick Start

### Deploy Everything to Production
```bash
npm run deploy:prod
```

### Deploy Individual Apps
```bash
npm run deploy:admin          # Deploy admin to production
npm run deploy:fabric-store   # Deploy fabric store to production
npm run deploy:store-guide     # Deploy store guide to production
```

### Quick Deploy Presets
```bash
npm run deploy:quick admin-only    # Quick admin deployment
npm run deploy:quick all-prod      # Deploy everything to production
npm run deploy:quick hotfix        # Emergency deployment (skips checks)
```

## Available Deployment Commands

### Main Commands
| Command | Description |
|---------|------------|
| `npm run deploy` | Deploy all apps to preview |
| `npm run deploy:prod` | Deploy all apps to production (parallel) |
| `npm run deploy:preview` | Deploy all apps to preview (parallel) |
| `npm run deploy:all` | Deploy everything to production |

### Individual App Deployments
| Command | Description |
|---------|------------|
| `npm run deploy:admin` | Deploy admin app to production |
| `npm run deploy:admin-preview` | Deploy admin app to preview |
| `npm run deploy:fabric-store` | Deploy fabric store to production |
| `npm run deploy:store-guide` | Deploy store guide to production |
| `npm run deploy:experiences` | Deploy both experiences (skip admin) |

### Utility Commands
| Command | Description |
|---------|------------|
| `npm run deploy:quick` | Show quick deploy options |
| `npm run vercel:env` | Pull environment variables from Vercel |
| `npm run vercel:link` | Link project to Vercel |

## Deployment Scripts Architecture

```
scripts/
├── deploy-all.js          # Master deployment orchestrator
├── deploy-admin.js        # Admin app deployment
├── deploy-fabric-store.js # Fabric store deployment
├── deploy-store-guide.js  # Store guide deployment
└── quick-deploy.js        # Preset deployment configurations
```

## Advanced Usage

### Deploy with Options
```bash
# Deploy all apps in parallel to production
node scripts/deploy-all.js --prod --parallel

# Deploy with skipping certain apps
node scripts/deploy-all.js --prod --skip-admin

# Deploy without type checking (faster)
node scripts/deploy-admin.js --prod --skip-typecheck --skip-lint

# Force deployment with uncommitted changes
node scripts/deploy-all.js --force
```

### Available Flags

#### deploy-all.js
- `--prod` - Deploy to production
- `--parallel` - Deploy apps in parallel
- `--force` - Deploy with uncommitted changes
- `--skip-install` - Skip npm install
- `--skip-admin` - Skip admin deployment
- `--skip-fabric-store` - Skip fabric store deployment
- `--skip-store-guide` - Skip store guide deployment

#### Individual deploy scripts
- `--prod` - Deploy to production
- `--preview` - Deploy to preview
- `--force` - Deploy with uncommitted changes
- `--skip-typecheck` - Skip TypeScript checking
- `--skip-lint` - Skip linting
- `--skip-build` - Skip local build test
- `--test` - Run tests before deployment

## GitHub Actions Automated Deployment

### Automatic Deployments
- **Push to `main`** → Deploy to preview
- **Push to `production`** → Deploy to production
- **Pull Request** → Deploy preview for testing

### Manual Deployment via GitHub
1. Go to Actions tab in GitHub
2. Select "Deploy to Vercel" workflow
3. Click "Run workflow"
4. Choose:
   - Deployment target (all/admin/fabric-store/store-guide)
   - Environment (preview/production)

## Environment Variables Setup

### Required Secrets in GitHub
Add these secrets in GitHub repository settings:

```env
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
VERCEL_PROJECT_ID_ADMIN=xxx
VERCEL_PROJECT_ID_FABRIC_STORE=xxx
VERCEL_PROJECT_ID_STORE_GUIDE=xxx
```

### Required Environment Variables in Vercel
Each app needs these environment variables:

```env
# Database
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...

# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret

# Email
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=admin@domain.com

# Storage (R2)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx

# Optional: Vercel KV
KV_REST_API_URL=xxx
KV_REST_API_TOKEN=xxx
```

## Deployment Workflow

### Development Workflow
1. Make changes locally
2. Test with `npm run dev:admin`
3. Deploy preview: `npm run deploy:preview`
4. Test preview deployment
5. Deploy to production: `npm run deploy:prod`

### Hotfix Workflow
```bash
# For emergency fixes
npm run deploy:quick hotfix
```

### CI/CD Workflow
1. Create feature branch
2. Make changes and push
3. PR automatically deploys preview
4. Merge to main → auto-deploy to preview
5. Merge to production branch → auto-deploy to production

## Troubleshooting

### Common Issues

#### "ENOENT: package.json not found"
- Solution: Ensure you're in the root directory
- Check: `.vercelignore` isn't excluding critical files

#### "Build failed"
- Check build logs: `vercel logs`
- Test locally: `npm run build:admin`
- Verify environment variables: `vercel env ls`

#### "Deployment not ready"
- Wait a few minutes for deployment to complete
- Check status: `vercel ls`

#### "Unauthorized"
- Verify VERCEL_TOKEN is set correctly
- Re-link project: `vercel link`

### Debug Commands
```bash
# View deployment logs
vercel logs

# List all deployments
vercel ls

# Get deployment details
vercel inspect [deployment-url]

# Pull environment variables
vercel env pull

# Check project settings
vercel project ls
```

## Best Practices

1. **Always test locally first**
   ```bash
   npm run build:admin
   npm test
   ```

2. **Use preview deployments for testing**
   ```bash
   npm run deploy:preview
   ```

3. **Deploy in parallel for speed**
   ```bash
   npm run deploy:prod  # Uses --parallel flag
   ```

4. **Keep environment variables in sync**
   ```bash
   npm run vercel:env  # Pull latest env vars
   ```

5. **Use GitHub Actions for team deployments**
   - Consistent deployment process
   - Automatic preview deployments
   - Deployment history in GitHub

## Production URLs

After successful deployment:

- **Admin App**: https://tara-hub.vercel.app
- **Fabric Store**: https://tara-hub-fabric-store.vercel.app
- **Store Guide**: https://tara-hub-store-guide.vercel.app

## Support

For deployment issues:
1. Check deployment logs: `vercel logs`
2. Verify environment variables
3. Test local build: `npm run build:admin`
4. Check Vercel dashboard for errors
5. Review GitHub Actions logs if using CI/CD