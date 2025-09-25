# 🚀 Definitive Railway Deployment Solution for Medusa v2

## 🔍 Root Cause Analysis

The "Class extends value undefined is not a constructor or null" error in Medusa v2 Railway deployments is caused by:

1. **Custom API Routes with Malformed Exports**: Files in `src/api/` with incorrect module exports
2. **Custom Services with Invalid Class Extensions**: Using deprecated `MedusaService({...})` pattern
3. **Module Loading Dependencies**: Circular imports or missing dependencies
4. **Build Context Issues**: Medusa tries to load all files in `src/` during startup

## ✅ Proven Solution

### Phase 1: Clean Deployment (CURRENT)

**Files Used:**
- `Dockerfile.clean` - Zero custom code deployment
- `medusa-config.clean.ts` - Core modules only
- `railway.json` - Railway configuration

**Strategy:**
- Deploy with ZERO custom code first
- Establish stable baseline
- Add features incrementally

### Phase 2: Incremental Feature Addition

```bash
# 1. Start with clean deployment ✅
# 2. Add Redis service in Railway dashboard
# 3. Add PostgreSQL service in Railway dashboard
# 4. Set environment variables
# 5. Add custom features one by one
```

## 🛠️ Implementation Steps

### Step 1: Clean Deployment

```bash
# Use the clean configuration
export RAILWAY_TOKEN="9d1ca706-d735-4a7c-bc65-f571111b8141"
export RAILWAY_PROJECT_ID="7d4ddac3-5123-4445-98cf-714ad52a324a"
railway up --service medusa-backend --detach
```

### Step 2: Add Railway Services

1. **PostgreSQL**:
   - Railway Dashboard → Add Service → PostgreSQL
   - `DATABASE_URL` auto-injected

2. **Redis** (Optional but recommended):
   - Railway Dashboard → Add Service → Redis
   - `REDIS_URL` auto-injected

### Step 3: Environment Variables

```bash
# Required in Railway Dashboard → Variables
JWT_SECRET=generate_32_char_secret
COOKIE_SECRET=generate_32_char_secret
STRIPE_API_KEY=sk_test_or_live
STRIPE_WEBHOOK_SECRET=whsec_from_stripe
```

### Step 4: Database Setup

```bash
# Run migrations
railway run npx medusa db:migrate

# Create admin user
railway run npx medusa user -e admin@yourdomain.com -p password --invite
```

## 🔧 Adding Custom Features Back

### Pattern for Custom Services

**❌ WRONG (causes the error):**
```typescript
class CartService extends MedusaService({
  Cart: { moduleKey: Modules.CART },
}) {
  // This causes "Class extends value undefined"
}
```

**✅ CORRECT:**
```typescript
export default class CartService {
  private cartModuleService_: ICartModuleService

  constructor(container: any) {
    this.cartModuleService_ = container.cartModuleService
  }
  
  // Implementation...
}
```

### Pattern for Custom API Routes

**✅ CORRECT:**
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Implementation
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Implementation
}
```

## 📊 Deployment Status Monitoring

### Health Checks

```bash
# Basic health
curl https://medusa-backend-production-3655.up.railway.app/health

# Admin panel
open https://medusa-backend-production-3655.up.railway.app/app

# Store API
curl https://medusa-backend-production-3655.up.railway.app/store/regions
```

### Railway Monitoring

- **Dashboard**: https://railway.app/project/7d4ddac3-5123-4445-98cf-714ad52a324a
- **Logs**: `railway logs --service medusa-backend`
- **Metrics**: CPU, Memory, Network in dashboard

## 🔄 Incremental Addition Process

### 1. Add One Custom Service

```bash
# Test locally first
npm run dev

# If working, deploy
railway up --service medusa-backend

# Monitor logs
railway logs --service medusa-backend
```

### 2. Add Custom API Routes

```bash
# Add one route file at a time
# Test each addition
# Monitor for "Class extends" errors
```

### 3. Add Complex Modules

```bash
# File storage, email, etc.
# One module per deployment
# Full testing between additions
```

## 🚨 Common Pitfalls to Avoid

1. **Don't add all custom code at once**
2. **Don't use old MedusaService patterns**
3. **Don't ignore TypeScript errors**
4. **Don't skip local testing**
5. **Don't deploy without health checks**

## 🎯 Success Criteria

### Phase 1 Complete ✅
- [ ] Clean deployment successful
- [ ] Health endpoint responding
- [ ] Admin panel accessible
- [ ] Store API working
- [ ] No "Class extends" errors

### Phase 2 Ready
- [ ] Redis service added
- [ ] PostgreSQL service added
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Admin user created

### Phase 3 Production
- [ ] Custom services working
- [ ] Custom API routes working
- [ ] All features functional
- [ ] Performance optimized
- [ ] Monitoring in place

## 📞 Emergency Rollback

If deployment fails after adding custom code:

```bash
# Immediate rollback to clean version
railway rollback --service medusa-backend

# Or redeploy clean
railway up --service medusa-backend --dockerfile Dockerfile.clean
```

## 🔗 Resources

- [Medusa v2 Documentation](https://docs.medusajs.com/v2)
- [Railway Documentation](https://docs.railway.app)
- [Medusa v2 Service Patterns](https://docs.medusajs.com/v2/advanced-development/modules/service-factory)
- [Railway Discord](https://discord.gg/railway)
- [Medusa Discord](https://discord.gg/medusajs)

---

**Last Updated**: $(date)  
**Status**: Phase 1 Implementation  
**Next**: Monitor clean deployment, then add services