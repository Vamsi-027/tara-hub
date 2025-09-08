# 🚀 Deployment Infrastructure

This folder contains all deployment-related configurations, scripts, and documentation for the Tara Hub project.

## 📁 Structure

```
deployment/
├── vercel/           # Vercel deployment system
│   ├── scripts/      # Deployment automation scripts
│   ├── configs/      # Platform configurations
│   ├── docs/         # Deployment documentation
│   └── workflows/    # CI/CD workflows
└── README.md         # This file
```

## 🎯 Deployment Platforms

### Vercel (Primary)
- **Location**: `vercel/`
- **Documentation**: [vercel/README.md](vercel/README.md)
- **Quick Deploy**: `npm run deploy:prod`

### Future Platforms
This structure allows for easy addition of other deployment platforms:
- `aws/` - AWS deployment configurations
- `docker/` - Docker configurations
- `kubernetes/` - K8s manifests

## 🚀 Quick Commands

```bash
# Setup deployment (first time)
npm run deploy:setup

# Deploy to production
npm run deploy:prod

# Deploy preview
npm run deploy:preview

# Deploy specific app
npm run deploy:admin
npm run deploy:fabric-store
npm run deploy:store-guide

# Quick deploy with presets
npm run deploy:quick
```

## 📚 Documentation

- [Vercel Deployment Guide](vercel/docs/DEPLOYMENT_GUIDE.md)
- [CI/CD Setup](vercel/workflows/deploy.yml)
- [Environment Variables](vercel/docs/DEPLOYMENT_GUIDE.md#environment-variables-setup)

## 🔧 Configuration

All deployment configurations are isolated by platform:
- Vercel configs: `vercel/configs/`
- Scripts: `vercel/scripts/`
- Workflows: `vercel/workflows/`

## 🎯 Benefits of This Structure

1. **Organization**: All deployment files in one place
2. **Scalability**: Easy to add new deployment platforms
3. **Maintainability**: Clear separation of concerns
4. **Discoverability**: Easy to find deployment resources
5. **Clean Root**: Keeps the project root uncluttered

## 🛠 Maintenance

When updating deployment configurations:
1. Make changes in the appropriate platform folder
2. Update documentation if needed
3. Test with preview deployments first
4. Deploy to production after verification

## 📝 Adding New Deployment Platforms

To add a new deployment platform:
1. Create a new folder (e.g., `aws/`)
2. Follow the same structure:
   - `scripts/` - Deployment scripts
   - `configs/` - Platform configurations
   - `docs/` - Documentation
   - `workflows/` - CI/CD workflows
3. Update this README
4. Add corresponding npm scripts to package.json

## 🔗 Related Files

While deployment files are centralized here, some files must remain in the root:
- `.github/workflows/` - GitHub Actions (copies from `vercel/workflows/`)
- `vercel.json` - Root Vercel config (active file)
- `.vercel/` - Vercel project linking (auto-generated)

## 💡 Best Practices

1. Always test deployments in preview first
2. Keep environment variables in sync across environments
3. Document any deployment changes
4. Use the provided scripts rather than manual deployments
5. Commit deployment configuration changes to version control