# 🚨 BREAKING: Remove Legacy Checkout Implementation

## Overview

This PR safely removes the existing cart, checkout, and payment implementation from the Medusa backend to prepare for a clean re-implementation. The removal is controlled by a feature flag (`ENABLE_LEGACY_CHECKOUT`) to allow for safe rollback if needed.

**⚠️ Important**: Order storage, retrieval, and Admin UI functionality are preserved and remain fully functional.

## Motivation

The current checkout implementation has accumulated technical debt and inconsistencies. By removing it cleanly and starting fresh, we can:
- Implement proper Medusa v2 workflows
- Ensure consistent error handling
- Improve payment provider integration
- Reduce complexity and maintenance burden

## Changes

### ✅ What's Been Done

1. **Database Backup Infrastructure**
   - Added backup/restore scripts in `medusa/scripts/db-backup/`
   - Comprehensive documentation for rollback procedures
   - Automated metadata tracking for backups

2. **Feature Flag System**
   - Added `ENABLE_LEGACY_CHECKOUT` environment variable (defaults to `true`)
   - Created centralized feature flag configuration
   - All legacy endpoints check the flag before execution

3. **Code Audit & Documentation**
   - Complete audit of all cart/checkout/payment code in `medusa/audit/checkout-heatmap.md`
   - Identified what to remove vs. preserve
   - Documented all affected endpoints

4. **Shared Utilities Extraction**
   - Extracted fabric store integration utilities to `src/utils/fabric-store-integration.ts`
   - Preserved order transformation functions
   - Kept customer management utilities

5. **Route Disabling**
   - Cart creation routes return 501 when flag is `false`
   - Checkout orchestration routes return 501 when flag is `false`
   - Payment creation routes return 501 when flag is `false`
   - Order retrieval routes remain functional

6. **Payment Provider Conditional Loading**
   - Stripe provider only loads when legacy checkout is enabled
   - Prevents unnecessary module initialization

7. **Testing**
   - Added comprehensive test suite for order endpoints
   - Tests verify legacy endpoints are disabled
   - Tests confirm order retrieval still works

8. **Implementation Scaffold**
   - Created `medusa/docs/checkout-scratch-start.md` with TODOs
   - Detailed implementation plan for new checkout flow
   - Best practices and guidelines included

### 📁 Files Changed

#### New Files
- `medusa/scripts/db-backup/backup_db.sh` - Database backup script
- `medusa/scripts/db-backup/restore_db.sh` - Database restore script
- `medusa/scripts/db-backup/README.md` - Backup documentation
- `medusa/src/config/feature-flags.ts` - Feature flag configuration
- `medusa/src/utils/fabric-store-integration.ts` - Extracted utilities
- `medusa/src/api/__tests__/order-endpoints.test.ts` - Order endpoint tests
- `medusa/audit/checkout-heatmap.md` - Complete code audit
- `medusa/docs/checkout-scratch-start.md` - Implementation scaffold

#### Modified Files
- `medusa/medusa-config.ts` - Conditional Stripe loading
- `medusa/src/api/store/orders/create/route.ts` - Added feature flag check
- `medusa/src/api/store/create-order-direct/route.ts` - Added feature flag check
- `medusa/src/api/store/debug/cart-creation/route.ts` - Added feature flag check
- `medusa/src/api/admin/orders/create-fabric-order/route.ts` - Added feature flag check

#### Moved to Deprecated
- `medusa/scripts/fix-stripe-*.js` → `medusa/scripts/deprecated/`
- `medusa/scripts/test-fabric-store-api.ts` → `medusa/scripts/deprecated/`
- `medusa/scripts/verify-complete-flow.ts` → `medusa/scripts/deprecated/`

## Testing

### Prerequisites
```bash
# 1. Create a database backup
cd medusa/scripts/db-backup
./backup_db.sh pre_checkout_removal

# 2. Run tests
cd medusa
npm test src/api/__tests__/order-endpoints.test.ts
```

### Test Scenarios

#### With `ENABLE_LEGACY_CHECKOUT=true` (default)
- ✅ All existing functionality works
- ✅ Can create carts
- ✅ Can complete checkout
- ✅ Payment processing works
- ✅ Orders are created

#### With `ENABLE_LEGACY_CHECKOUT=false`
- ✅ Order listing endpoints work
- ✅ Admin can view existing orders
- ✅ Order creation endpoints return 501
- ✅ Cart creation endpoints return 501
- ✅ No errors in server logs

## Rollback Plan

### Immediate Rollback (< 5 minutes)
```bash
# 1. Set environment variable
echo "ENABLE_LEGACY_CHECKOUT=true" >> medusa/.env

# 2. Restart Medusa
cd medusa
npm run dev

# Legacy checkout is now re-enabled
```

### Database Rollback (if data issues)
```bash
# 1. Stop Medusa server
# Ctrl+C or kill the process

# 2. Restore database
cd medusa/scripts/db-backup
./restore_db.sh pre_checkout_removal

# 3. Set feature flag
echo "ENABLE_LEGACY_CHECKOUT=true" >> ../../.env

# 4. Restart Medusa
cd ../..
npm run dev
```

### Code Rollback
```bash
# Revert this PR
git revert <commit-hash>
git push origin main
```

## Deployment Checklist

### Pre-Deployment
- [ ] Create production database backup
- [ ] Document current order count
- [ ] Verify rollback procedure in staging
- [ ] Ensure `ENABLE_LEGACY_CHECKOUT=true` is set in production

### Deployment
- [ ] Deploy with `ENABLE_LEGACY_CHECKOUT=true`
- [ ] Verify existing functionality works
- [ ] Monitor error logs
- [ ] Check order creation/retrieval

### Post-Deployment Testing
- [ ] Test with flag `false` in staging
- [ ] Verify 501 responses for disabled endpoints
- [ ] Confirm order management still works
- [ ] Test rollback procedure

### Gradual Rollout
1. Week 1: Deploy with flag `true`, monitor
2. Week 2: Set flag to `false` in staging
3. Week 3: Set flag to `false` in production for 1 hour, monitor
4. Week 4: Permanently disable if stable

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Accidental data loss | High | Database backups, no table drops |
| Breaking existing orders | High | Preserved all order endpoints |
| Unable to create orders | High | Feature flag enables quick rollback |
| Payment webhooks fail | Medium | Webhooks logged but not processed |
| Admin UI breaks | Low | Admin order views unchanged |

## Next Steps

1. **Review & Approve** this PR
2. **Deploy to Staging** with flag enabled
3. **Test Thoroughly** both flag states
4. **Deploy to Production** with flag enabled
5. **Begin New Implementation** using scaffold in `docs/checkout-scratch-start.md`

## Questions?

- Check `medusa/audit/checkout-heatmap.md` for detailed code mapping
- See `medusa/docs/checkout-scratch-start.md` for implementation plan
- Review `medusa/scripts/db-backup/README.md` for backup procedures

## Related Issues
- Fixes: #[issue-number] (if applicable)
- Related to: [New checkout implementation epic]

---

**Review Checklist:**
- [ ] Code follows project standards
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] Rollback plan is clear
- [ ] No sensitive data exposed
- [ ] Feature flag works correctly

**Reviewers:** @senior-dev @lead-engineer @devops-team