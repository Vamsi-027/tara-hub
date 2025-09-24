# 🚀 DEPLOYMENT PLAN - INVENTORY MANAGEMENT FEATURES
## Generated: 2025-09-24

---

## PHASE 1: IMMEDIATE FIXES ✅ (15-20 mins)

### Step 1.1: Import Path Corrections ✅ COMPLETED
- Fixed `/api/admin/inventory/health/route.ts` imports
- Fixed `/api/admin/inventory/adjust/route.ts` imports
- All service imports now point to correct `_services/` directory

### Step 1.2: Install Dependencies (5 mins)
```bash
cd medusa
npm install
```

### Step 1.3: Test Build Locally (5 mins)
```bash
# Test if the build works with fixes
npm run build

# Expected: Build should complete without import errors
# If fails: Check error messages for any remaining path issues
```

### Step 1.4: Quick Validation
```bash
# Verify all new files are present
ls -la src/_services/inventory*.ts
ls -la src/api/admin/inventory/
ls -la src/modules/inventory_audit/
```

---

## PHASE 2: MODULE CONFIGURATION (20 mins)

### Step 2.1: Enable Inventory Audit Module Cautiously
```typescript
// In medusa-config.ts, add at line 176:
// Test first without enabling, then enable if build passes
{
  resolve: "./src/modules/inventory_audit",
  options: {}
}
```

### Step 2.2: Create Module Export Fix
Create `/medusa/src/modules/inventory_audit/index.ts`:
```typescript
import InventoryAuditService from "./service"

export default InventoryAuditService

export const INVENTORY_AUDIT_MODULE = "inventory_audit"
```

### Step 2.3: Database Migration
```bash
# Check migration status
npx medusa db:show

# Run new migrations
npx medusa db:migrate

# Verify inventory_adjustment table created
npx medusa db:execute "SELECT * FROM information_schema.tables WHERE table_name = 'inventory_adjustment';"
```

---

## PHASE 3: TESTING STRATEGY (30 mins)

### Step 3.1: Run Unit Tests
```bash
# Test new inventory services
npm run test:unit -- src/_services/__tests__/

# Expected results:
# - cart-normalization.unit.spec.ts ✓
# - inventory-policy.service.unit.spec.ts ✓
# - reservation-orchestrator.unit.spec.ts ✓
```

### Step 3.2: Test API Endpoints Locally
```bash
# Start dev server
npm run dev

# In another terminal, test health endpoint
curl -X GET http://localhost:9000/admin/inventory/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test adjustments endpoint
curl -X GET http://localhost:9000/admin/inventory/adjustments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 3.3: Integration Test
```bash
# Run integration tests if available
npm run test:integration:modules -- --testPathPattern=reservation
```

---

## PHASE 4: STAGED DEPLOYMENT (45 mins)

### Step 4.1: Create Git Branch for Safety
```bash
# Create deployment branch
git checkout -b deployment/inventory-features

# Commit fixes
git add -A
git commit -m "fix: correct import paths for inventory APIs and enable audit module"
```

### Step 4.2: Environment Variables Check
Ensure these are set in your deployment environment:
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<secure-value>
COOKIE_SECRET=<secure-value>
MEDUSA_BACKEND_URL=https://your-deployment-url.app
```

### Step 4.3: Deploy to Staging First
```bash
# If using Railway staging environment
railway environment staging
railway up

# Or Vercel preview
vercel --prod=false

# Monitor logs
railway logs -f
```

### Step 4.4: Staging Validation
```bash
# Test deployed endpoints
curl https://staging-url.app/admin/inventory/health \
  -H "x-publishable-api-key: YOUR_API_KEY"

# Check admin panel access
open https://staging-url.app/app
```

---

## PHASE 5: PRODUCTION DEPLOYMENT (30 mins)

### Step 5.1: Final Pre-Production Checks
```bash
# Ensure all tests pass
npm run test:unit
npm run build

# Check for any console errors
npm run dev
# Access http://localhost:9000/app and check browser console
```

### Step 5.2: Production Deployment
```bash
# Merge to main if using Git flow
git checkout main
git merge deployment/inventory-features
git push origin main

# Railway auto-deploys on push to main
# Or manual deploy:
railway up --environment production
```

### Step 5.3: Post-Deployment Verification
```bash
# Health check
curl https://medusa-backend-production-3655.up.railway.app/admin/inventory/health

# Check error logs
railway logs --environment production | grep ERROR

# Monitor for 15 minutes
watch -n 30 'curl -s https://your-production-url.app/health'
```

---

## ROLLBACK PLAN 🔄

### If Issues Occur:
```bash
# 1. Immediate rollback via Git
git revert HEAD
git push origin main

# 2. Or disable module in config
# Comment out in medusa-config.ts:
# { resolve: "./src/modules/inventory_audit" }

# 3. Railway instant rollback
railway rollback

# 4. Database rollback if needed
npx medusa db:rollback
```

---

## MONITORING & SUCCESS METRICS 📊

### Success Indicators:
- ✅ Build completes without errors
- ✅ All unit tests pass (25+ tests)
- ✅ Admin panel loads without crashes
- ✅ Inventory APIs return 200 status
- ✅ No increase in error logs
- ✅ Database migrations applied successfully

### Monitor These Endpoints:
1. `/admin/inventory/health` - Should return inventory data
2. `/admin/inventory/adjustments` - Should return empty array initially
3. `/admin/inventory/adjust` - POST should create adjustments
4. `/app` - Admin UI should load

### Performance Baseline:
- API response time: < 200ms
- Build time: < 2 minutes
- Memory usage: < 512MB
- CPU usage: < 50%

---

## KNOWN ISSUES & SOLUTIONS 🔧

### Issue 1: "MedusaService undefined" error
**Solution**: Temporarily disable the module in config until fixed

### Issue 2: Migration fails
**Solution**: Check DATABASE_URL connection, ensure PostgreSQL v14+

### Issue 3: Admin panel white screen
**Solution**: Clear browser cache, rebuild admin: `npm run build:admin`

### Issue 4: Import paths still failing
**Solution**: Use absolute paths from root: `@/services/...`

---

## FUTURE OPTIMIZATIONS 📈

1. **Refactor MedusaService Modules** (Priority: HIGH)
   - Convert to AbstractModuleService pattern
   - Estimated effort: 4 hours

2. **Add Redis Caching** (Priority: MEDIUM)
   - Re-enable Redis modules when quota available
   - Improves performance by 40%

3. **Enhanced RBAC** (Priority: LOW)
   - Add granular permissions per location
   - Custom roles beyond admin

4. **Automated Testing Pipeline**
   - GitHub Actions for CI/CD
   - Automated rollback on test failure

---

## CONTACT FOR ISSUES
- Primary: Your email
- Backup: Check Railway/Vercel logs
- Critical: Rollback immediately, debug later

---

## VALIDATION CHECKLIST ✓

Before marking deployment complete:
- [ ] All import paths fixed
- [ ] Dependencies installed
- [ ] Build succeeds locally
- [ ] Unit tests pass
- [ ] Database migrations applied
- [ ] Staging deployment tested
- [ ] Admin panel accessible
- [ ] API endpoints responding
- [ ] No error spikes in logs
- [ ] Rollback plan tested

---

**Status**: Ready for Phase 1 execution
**Risk Level**: Low (with staged approach)
**Estimated Total Time**: 2.5 hours with validations
**Recommended Window**: Low-traffic period