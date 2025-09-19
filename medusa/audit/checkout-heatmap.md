# Checkout, Cart, and Payment Code Audit

Generated: 2025-01-18
Purpose: Complete audit of all cart, checkout, and payment-related code for safe removal

## Summary

This document maps all code related to cart, checkout, and payment functionality in the Medusa backend. Code marked with 🔴 will be removed/disabled, code marked with 🟢 will be preserved, and code marked with 🟡 requires modification.

## Categories

### 1. Payment Provider Configuration 🔴

**To be removed/disabled:**
- `/medusa/medusa-config.ts` (lines 126-141) - Stripe payment provider configuration
- `/medusa/scripts/fix-stripe-payment-provider.ts` - Stripe provider fix script
- `/medusa/scripts/fix-stripe-production.js` - Production Stripe fixes
- `/medusa/scripts/fix-stripe-provider-id.js` - Provider ID utilities

### 2. Cart Management 🔴

**To be removed/disabled:**
- `/medusa/src/api/store/debug/cart-creation/route.ts` - Cart creation debug API

### 3. Order Management 🟢

**To be preserved (these handle order storage/retrieval):**
- `/medusa/src/api/store/orders/route.ts` - Order listing
- `/medusa/src/api/store/orders/[id]/route.ts` - Individual order retrieval
- `/medusa/src/api/store/orders/customer/route.ts` - Customer orders
- `/medusa/src/api/store/orders-by-email/route.ts` - Email-based order lookup
- `/medusa/src/api/admin/orders/route.ts` - Admin order management
- `/medusa/src/api/admin/orders/[id]/route.ts` - Admin order operations
- `/medusa/src/api/admin/orders/[id]/preview/route.ts` - Order preview
- `/medusa/src/api/admin/orders/raw/route.ts` - Raw order access
- `/medusa/src/api/admin/orders/raw/[id]/route.ts` - Raw individual orders

**To be removed (these create new orders via checkout):** 🔴
- `/medusa/src/api/store/orders/create/route.ts` - Full checkout flow implementation
- `/medusa/src/api/store/create-order-direct/route.ts` - Direct order bypass
- `/medusa/src/api/admin/orders/create-fabric-order/route.ts` - Fabric order creation

### 4. Middleware 🟡

**To be modified:**
- `/medusa/src/api/middlewares.ts` (lines 285-546)
  - Keep: `injectFabricOrders`, `injectFabricCustomers`, `transformFabricOrder`
  - Remove: Payment intent handling, Stripe-specific code

### 5. Database Scripts 🟢

**To be preserved (order management utilities):**
- `/medusa/src/scripts/force-delete-orders.ts`
- `/medusa/src/scripts/delete-all-orders.ts`
- `/medusa/src/scripts/check-and-delete-orders.ts`
- `/medusa/scripts/check-orders.ts`
- `/medusa/scripts/check-database-orders.ts`
- `/medusa/scripts/test-order-storage.ts`
- `/medusa/scripts/test-order-database.ts`

**To be removed (checkout testing):** 🔴
- `/medusa/scripts/test-fabric-store-api.ts`
- `/medusa/scripts/verify-complete-flow.ts`

### 6. Regional Setup 🟡

**To be modified (remove payment provider references):**
- `/medusa/src/scripts/setup-us-region-complete.ts` - Keep region setup, remove Stripe

## Implementation Plan

### Phase 1: Feature Flag Integration
1. Add `ENABLE_LEGACY_CHECKOUT` check to:
   - Order creation routes
   - Cart debug route
   - Payment-related middleware
   - Stripe configuration in medusa-config.ts

### Phase 2: Route Disabling
When `ENABLE_LEGACY_CHECKOUT=false`:
1. Return 501 Not Implemented for:
   - POST `/store/orders/create`
   - POST `/store/create-order-direct`
   - POST `/admin/orders/create-fabric-order`
   - ALL `/store/debug/cart-creation/*`

2. Disable in medusa-config.ts:
   - Stripe payment module loading

### Phase 3: Middleware Cleanup
1. Extract shared utilities from middlewares.ts:
   - `injectFabricOrders` (keep)
   - `injectFabricCustomers` (keep)
   - `transformFabricOrder` (keep)

2. Remove payment-specific code:
   - Stripe payment intent handling
   - Payment status management

### Phase 4: Scripts Cleanup
1. Move to `deprecated/` folder:
   - All `fix-stripe-*.js` scripts
   - `test-fabric-store-api.ts`
   - `verify-complete-flow.ts`

## Files to Monitor (Not Remove)

These files may reference checkout/cart but are essential:
- `/medusa/src/models/*` - Keep all models
- `/medusa/src/modules/*` - Keep all modules
- Database migration files - Never remove

## Rollback Strategy

1. **Immediate Rollback:**
   ```bash
   # Set environment variable
   export ENABLE_LEGACY_CHECKOUT=true

   # Restart Medusa
   npm run dev
   ```

2. **Database Rollback (if needed):**
   ```bash
   cd scripts/db-backup
   ./restore_db.sh pre_checkout_removal
   ```

3. **Code Rollback:**
   ```bash
   git revert <commit-hash>
   ```

## Testing Checklist

After removal with `ENABLE_LEGACY_CHECKOUT=false`:
- [ ] Order listing endpoints still work (GET `/store/orders`)
- [ ] Admin can view existing orders
- [ ] Order creation endpoints return 501
- [ ] Cart creation endpoints return 501
- [ ] No errors in server logs
- [ ] Database integrity maintained

With `ENABLE_LEGACY_CHECKOUT=true`:
- [ ] All existing functionality works
- [ ] Can create carts
- [ ] Can complete checkout
- [ ] Payment processing works

## Notes

- Never remove order models or tables
- Keep all order retrieval/listing functionality
- Preserve admin UI for order management
- This is Phase 1 - actual table drops come later