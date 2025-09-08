# 📦 Vercel Deployment System

This folder contains all deployment-related scripts, configurations, and documentation for the Tara Hub monorepo.

## 📁 Folder Structure

```
deployment/vercel/
├── scripts/              # Deployment scripts
│   ├── deploy-admin.js   # Admin app deployment
│   ├── deploy-fabric-store.js
│   ├── deploy-store-guide.js
│   ├── deploy-all.js     # Master deployment script
│   ├── quick-deploy.js   # Quick deployment presets
│   └── setup-deployment.js # First-time setup
├── configs/              # Vercel configurations
│   └── vercel-root.json  # Root app configuration
├── docs/                 # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   └── deploy-to-vercel.md
└── workflows/            # GitHub Actions workflows
    └── deploy.yml        # CI/CD pipeline
```

## 🚀 Quick Start

### First Time Setup
```bash
npm run deploy:setup
```

### Deploy Everything
```bash
npm run deploy:prod
```

### Deploy Individual Apps
```bash
npm run deploy:admin
npm run deploy:fabric-store
npm run deploy:store-guide
```

### Quick Deploy Options
```bash
npm run deploy:quick
```

## 📚 Documentation

- [Full Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Vercel Setup Instructions](docs/deploy-to-vercel.md)

## 🔧 Configuration Files

### Root App (`configs/vercel-root.json`)
Main admin app configuration

### Experience Apps
Each experience has its own `vercel.json` in its directory:
- `experiences/fabric-store/vercel.json`
- `experiences/store-guide/vercel.json`

## 🤖 Automation

GitHub Actions workflow is stored here but copied to `.github/workflows/` for GitHub to detect it.

To update the workflow:
1. Edit `workflows/deploy.yml`
2. Copy to `.github/workflows/deploy.yml`
3. Commit both files

## 📝 Adding New Scripts

When adding new deployment scripts:
1. Place them in `scripts/` folder
2. Update `package.json` with the correct path
3. Document in this README

## 🔑 Environment Variables

Required environment variables are documented in:
- [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md#environment-variables-setup)

## 🔐 Environment Variables Management

### Automated Environment Setup
```bash
# Validate current setup
npm run env:validate

# Generate templates from .env.local
npm run env:generate

# Push to all Vercel projects
npm run env:push

# Interactive management
npm run env:manage

# Deploy with environment sync
npm run deploy:with-env
npm run deploy:prod-with-env
```

### Manual Environment Management
```bash
# Push to specific project and environment
node deployment/vercel/scripts/manage-env-vars.js push admin production
node deployment/vercel/scripts/manage-env-vars.js push fabric-store development

# Pull from Vercel
node deployment/vercel/scripts/manage-env-vars.js pull admin development

# Generate CI/CD template
node deployment/vercel/scripts/manage-env-vars.js ci
```

## 💡 Tips

- All scripts use relative paths and work from any directory
- Scripts include error handling and rollback capabilities
- Use `--help` flag on any script for usage information
- Run `npm run deploy:quick` for preset deployment options
- Use `npm run env:validate` before deployments to catch missing variables
- Environment variables are automatically categorized by app requirements

## 🛠 Maintenance

To update deployment scripts:
1. Edit files in this folder
2. Test locally with preview deployments
3. Commit changes
4. The package.json scripts will automatically use the updated versions