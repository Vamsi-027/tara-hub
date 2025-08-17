# Deployment Steering Document - Tara Hub

## Overview

Tara Hub uses a **multi-project Vercel deployment strategy** with **Turborepo** and **NPM Workspaces**, where each experience deploys as an independent Vercel project while sharing code through packages. This enables independent scaling, separate domains, and isolated deployments.

## Architecture Overview

### Deployment Structure
```
GitHub Repository (Single Monorepo)
├── Admin App → Vercel Project: tara-hub-admin → admin.domain.com
├── Fabric Store → Vercel Project: tara-hub-fabric-store → fabric.domain.com
└── Store Guide → Vercel Project: tara-hub-store-guide → guide.domain.com
```

### Build System
- **Turborepo**: Orchestrates builds with caching and parallel execution
- **NPM Workspaces**: Manages shared dependencies through packages
- **Shared Packages**: @tara-hub/ui, @tara-hub/lib, @tara-hub/config
- **Independent Deployments**: Each experience has its own Vercel project

## Vercel Project Configuration

### Project Mapping
| Application | Vercel Project | Domain | Root Directory | Port |
|------------|---------------|---------|----------------|------|
| Admin Dashboard | tara-hub-admin | admin.domain.com | `.` | 3000 |
| Fabric Store | tara-hub-fabric-store | fabric.domain.com | `experiences/fabric-store` | 3006 |
| Store Guide | tara-hub-store-guide | guide.domain.com | `experiences/store-guide` | 3007 |

### Admin App Configuration (vercel.json)
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build:admin",
  "devCommand": "npm run dev:admin",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "ignoreCommand": "git diff HEAD^ HEAD --quiet -- . ':(exclude)experiences' ':(exclude)packages'"
}
```

### Experience Configuration Template
```json
{
  "name": "tara-hub-[experience]",
  "buildCommand": "cd ../.. && npm install && cd experiences/[name] && npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "echo 'Handled by buildCommand'",
  "framework": "nextjs",
  "regions": ["iad1"],
  "ignoreCommand": "git diff HEAD^ HEAD --quiet -- experiences/[name] packages"
}
```

## Deployment Methods

### Method 1: Vercel CLI (Initial Setup)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Admin App
cd tara-hub
vercel --prod
# Project name: tara-hub-admin

# Deploy Fabric Store
cd experiences/fabric-store
vercel --prod
# Project name: tara-hub-fabric-store
# Root directory: ./

# Deploy Store Guide
cd ../store-guide
vercel --prod
# Project name: tara-hub-store-guide
# Root directory: ./
```

### Method 2: GitHub Integration

1. **Import Repository Three Times** in Vercel Dashboard

**Admin App Setup:**
```
Project Name: tara-hub-admin
Framework: Next.js
Root Directory: ./
Build Command: npm run build:admin
Install Command: npm install
```

**Fabric Store Setup:**
```
Project Name: tara-hub-fabric-store
Framework: Next.js
Root Directory: experiences/fabric-store
Build Command: cd ../.. && npm install && cd experiences/fabric-store && npm run build
Install Command: echo 'Skip'
```

**Store Guide Setup:**
```
Project Name: tara-hub-store-guide
Framework: Next.js
Root Directory: experiences/store-guide
Build Command: cd ../.. && npm install && cd experiences/store-guide && npm run build
Install Command: echo 'Skip'
```

### Method 3: GitHub Actions Automation

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      admin: ${{ steps.filter.outputs.admin }}
      fabric-store: ${{ steps.filter.outputs.fabric-store }}
      store-guide: ${{ steps.filter.outputs.store-guide }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            admin:
              - 'app/**'
              - 'components/**'
              - 'lib/**'
              - 'package.json'
              - 'turbo.json'
            fabric-store:
              - 'experiences/fabric-store/**'
              - 'packages/**'
            store-guide:
              - 'experiences/store-guide/**'
              - 'packages/**'

  deploy-admin:
    needs: detect-changes
    if: needs.detect-changes.outputs.admin == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_ADMIN_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-fabric-store:
    needs: detect-changes
    if: needs.detect-changes.outputs.fabric-store == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_FABRIC_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./experiences/fabric-store

  deploy-store-guide:
    needs: detect-changes
    if: needs.detect-changes.outputs.store-guide == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_GUIDE_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./experiences/store-guide
```

## Environment Variables

### Admin App Variables
```env
# Authentication
NEXTAUTH_URL=https://admin.yourdomain.com
NEXTAUTH_SECRET=[generated-secret]
GOOGLE_CLIENT_ID=[google-oauth-id]
GOOGLE_CLIENT_SECRET=[google-oauth-secret]

# Database
DATABASE_URL=[neon-postgres-url]

# Vercel KV
KV_REST_API_URL=[vercel-kv-url]
KV_REST_API_TOKEN=[vercel-kv-token]
```

### Experience Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://admin.yourdomain.com/api
NEXT_PUBLIC_APP_NAME=[Experience Name]

# Shared Resources (optional)
KV_REST_API_URL=[shared-kv-url]
KV_REST_API_TOKEN=[shared-kv-token]
```

### Setting Variables via CLI
```bash
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
vercel env pull .env.local
```

## Turborepo Integration

### Remote Caching Setup
```bash
# Login to Vercel
npx turbo login

# Link project for remote caching
npx turbo link
```

### Build Optimization
```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Parallel Builds
- Shared packages build once and cache
- Experiences build in parallel
- Unchanged packages skip rebuild
- Remote cache shared across team

## Domain Configuration

### Custom Domain Setup

```bash
# Via CLI
vercel domains add admin.yourdomain.com --project tara-hub-admin
vercel domains add fabric.yourdomain.com --project tara-hub-fabric-store
vercel domains add guide.yourdomain.com --project tara-hub-store-guide
```

### DNS Configuration
```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com

Type: CNAME  
Name: fabric
Value: cname.vercel-dns.com

Type: CNAME
Name: guide
Value: cname.vercel-dns.com
```

## Build & Deployment Optimization

### Ignore Build Commands
Prevent unnecessary rebuilds using path-based triggers:

**Admin App:**
```bash
git diff HEAD^ HEAD --quiet -- . ':(exclude)experiences' ':(exclude)packages'
```

**Experiences:**
```bash
git diff HEAD^ HEAD --quiet -- experiences/[name] packages
```

### Build Performance
```javascript
// next.config.js
module.exports = {
  experimental: {
    externalDir: true, // Support packages outside app directory
    optimizeCss: true,
    optimizePackageImports: ['@tara-hub/ui', '@tara-hub/lib']
  }
}
```

### Function Configuration
```json
{
  "functions": {
    "app/api/**.ts": {
      "maxDuration": 10
    }
  },
  "images": {
    "domains": ["images.unsplash.com"],
    "formats": ["image/webp", "image/avif"]
  }
}
```

## Monitoring & Analytics

### Vercel Analytics Integration
```typescript
// app/layout.tsx or experiences/*/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Enable Per Project
1. Go to Project Settings → Analytics → Enable
2. Go to Project Settings → Speed Insights → Enable
3. Each project has independent analytics

## Preview Deployments

### Automatic Preview URLs
- Format: `[project]-[branch]-[team].vercel.app`
- Created for every push
- Comments added to PRs

### Preview Protection
```typescript
// middleware.ts
export function middleware(request: Request) {
  const url = new URL(request.url)
  
  if (url.hostname.includes('vercel.app')) {
    const auth = request.headers.get('authorization')
    
    if (!auth || !isValidAuth(auth)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic' }
      })
    }
  }
}
```

## Rollback Procedures

### Via Dashboard
1. Go to Deployments tab
2. Find previous deployment
3. Click "..." → "Promote to Production"

### Via CLI
```bash
# List deployments
vercel ls --project tara-hub-admin

# Rollback specific project
vercel rollback [deployment-url]
```

## Production Checklist

### Pre-Deployment
- [ ] Run `npx turbo build` locally
- [ ] Check `npx turbo type-check`
- [ ] Run `npx turbo test`
- [ ] Update environment variables
- [ ] Check Turborepo cache

### Deployment Order
1. Deploy shared packages changes first
2. Deploy admin app
3. Deploy experiences
4. Verify all builds succeed

### Post-Deployment
- [ ] Test each deployed URL
- [ ] Check authentication flows
- [ ] Verify API endpoints
- [ ] Monitor error rates
- [ ] Check Analytics dashboard

## Troubleshooting

### Common Issues

#### Workspace Package Not Found
```json
// Ensure buildCommand includes npm install
"buildCommand": "cd ../.. && npm install && cd experiences/[name] && npm run build"
```

#### Out of Memory Error
```json
// Increase memory in package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

#### Module Resolution Issues
```javascript
// next.config.js
module.exports = {
  experimental: {
    externalDir: true
  }
}
```

### Debug Commands
```bash
# Check environment variables
vercel env ls

# View build logs
vercel logs [deployment-url]

# Inspect domain configuration
vercel domains inspect [domain]
```

## Cost Optimization

### Strategies
1. **Use Turborepo caching** - Reduce build minutes
2. **ISR/SSG** - Reduce function invocations
3. **Image optimization** - Reduce bandwidth
4. **Path-based deploys** - Skip unchanged apps

### Resource Monitoring
```bash
# Check usage
vercel billing

# Or in Dashboard
# Team Settings → Usage
```

### Limits (Pro Plan)
- Build Minutes: 6000/month
- Bandwidth: 1TB/month
- Function Invocations: 1M/month
- Edge Middleware: 1M/month

## Security Best Practices

### Environment Variables
- Different secrets per environment
- Never commit `.env` files
- Rotate secrets regularly
- Use encrypted storage

### Headers Configuration
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=()' }
        ]
      }
    ]
  }
}
```

### API Protection
```typescript
// app/api/protected/route.ts
import { auth } from '@/auth'

export async function GET(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // Handle authenticated request
}
```

## Future Enhancements

### Planned Improvements
1. **Edge Functions** - Deploy to edge for lower latency
2. **Database Read Replicas** - Multi-region data access
3. **Automated Testing** - E2E tests in preview deploys
4. **Cost Allocation** - Per-experience billing tracking
5. **Canary Deployments** - Gradual rollout strategy

### Infrastructure as Code
```typescript
// infrastructure/vercel-config.ts
export const projects = [
  {
    name: 'tara-hub-admin',
    env: adminEnvVars,
    domains: ['admin.domain.com']
  },
  {
    name: 'tara-hub-fabric-store',
    env: fabricEnvVars,
    domains: ['fabric.domain.com']
  }
]
```

This deployment architecture leverages Turborepo and NPM Workspaces for optimal build performance while maintaining independent deployments for each experience.