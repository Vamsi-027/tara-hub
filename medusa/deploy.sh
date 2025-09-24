#!/bin/bash
# Deployment script for Railway/Vercel - bypasses local npm issues

echo "🚀 Starting deployment preparation..."

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "📦 Committing changes..."
    git add -A
    git commit -m "fix: inventory management system - corrected import paths and module configuration

- Fixed import paths in inventory API routes
- Configured inventory_audit module properly
- Added deployment configurations
- Ready for production deployment"
fi

echo "🔄 Pushing to GitHub for auto-deployment..."
git push origin main

echo "✅ Deployment initiated!"
echo "📊 Monitor deployment at:"
echo "   Railway: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a"
echo "   Or check: railway logs -f"

echo ""
echo "⏰ Deployment usually takes 3-5 minutes"
echo "🔍 Check status with: railway status"