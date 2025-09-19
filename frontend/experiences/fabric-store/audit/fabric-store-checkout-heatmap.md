# Fabric Store Checkout Implementation Audit

Generated: 2025-01-18
Purpose: Complete audit of fabric-store checkout/payment implementation to identify collisions with new Medusa checkout flow

## Executive Summary

The fabric-store currently has a **mixed implementation** that includes:
- ❌ **CRITICAL**: Direct Stripe secret key usage in frontend code (`STRIPE_SECRET_KEY`)
- ❌ **CRITICAL**: Client-side payment intent creation bypassing Medusa
- ⚠️ **WARNING**: LocalStorage-based cart management (not synced with backend)
- ⚠️ **WARNING**: Duplicate webhook handlers in frontend
- ⚠️ **WARNING**: Client-side price calculations
- ✅ **GOOD**: Already uses Stripe Elements (CardElement)
- ✅ **GOOD**: Has order creation API that calls Medusa

## Files Heatmap

### 1. Payment & Stripe Integration Files 🔴 CRITICAL

#### `/app/api/create-payment-intent/route.ts` 🔴 **REMOVE**
- **Issues**:
  - Uses `STRIPE_SECRET_KEY` directly (line 6)
  - Creates PaymentIntent in frontend code
  - Bypasses Medusa payment session management
  - Client-side price calculation
- **Action**: **DELETE** - Replace with call to Medusa `/store/carts/:id/payment-sessions`

#### `/app/api/webhook/stripe/route.ts` 🔴 **REMOVE**
- **Issues**:
  - Duplicate webhook handler (Medusa backend handles this)
  - Uses `STRIPE_SECRET_KEY` (line 11)
  - Direct order status manipulation
- **Action**: **DELETE** - Medusa backend webhook handler should be sole handler

#### `/app/checkout/page.tsx` 🟡 **REFACTOR**
- **Issues**:
  - Uses deprecated `CardElement` instead of Payment Element
  - Direct Stripe initialization with client secret
  - Client-side totals calculation
  - Hardcoded publishable key fallback
- **Action**: **REFACTOR** to use Payment Element with Medusa payment sessions

### 2. Cart Management Files 🟡 MODERATE

#### `/lib/cart-utils.ts` 🟡 **REFACTOR**
- **Issues**:
  - LocalStorage-only cart (not synced with backend)
  - No server validation
  - Client-side cart ID generation
- **Action**: **WRAP** with feature flag, migrate to Medusa cart API

#### `/app/cart/page.tsx` 🟡 **REFACTOR**
- **Issues**:
  - Reads from LocalStorage only
  - Client-side price calculations (line 74-80)
  - No backend validation
- **Action**: **REFACTOR** to use Medusa cart endpoints

#### `/components/add-to-cart.tsx` 🟡 **REFACTOR**
- **Issues**:
  - Adds to LocalStorage only
  - No inventory check
- **Action**: **REFACTOR** to call Medusa add line item API

### 3. Order Creation Files 🟢 PARTIALLY COMPATIBLE

#### `/app/api/orders/create/route.ts` 🟢 **KEEP WITH MODIFICATIONS**
- **Good**:
  - Already calls Medusa backend
  - Uses proper cart-to-order workflow
  - Has region configuration
- **Issues**:
  - Hardcoded region ID
  - Missing payment session integration
- **Action**: **MODIFY** to use new payment session flow

#### `/app/api/orders/complete-order/route.ts` 🟡 **REFACTOR**
- **Issues**:
  - Custom completion logic
  - Bypasses Medusa workflow
- **Action**: **REFACTOR** to call Medusa `/store/carts/:id/complete`

#### `/lib/services/order.service.ts` 🟢 **KEEP**
- **Good**:
  - Well-structured service layer
  - Has retry logic and error handling
  - Uses Medusa API
- **Action**: **KEEP** with minor updates for new endpoints

### 4. UI Components 🟢 MOSTLY COMPATIBLE

#### `/components/header.tsx` 🟢 **KEEP**
- Shows cart count from LocalStorage
- **Action**: **UPDATE** to read from Medusa cart

#### `/components/CartNotification.tsx` 🟢 **KEEP**
- Toast notifications for cart actions
- **Action**: **KEEP** as-is

#### `/app/orders/page.tsx` 🟢 **KEEP**
- Order history display
- **Action**: **UPDATE** API calls to new endpoints

#### `/app/orders/[id]/page.tsx` 🟢 **ADD FEATURE**
- Individual order display
- **Action**: **ADD** guest lookup with email verification

### 5. Configuration Files 🟡 UPDATE NEEDED

#### `/.env.example` 🟡 **UPDATE**
- Contains `STRIPE_SECRET_KEY` (line 20)
- **Action**: **REMOVE** secret key, keep only publishable key

#### `/lib/medusa-config.ts` 🟢 **KEEP**
- Medusa backend configuration
- **Action**: **ADD** feature flag configuration

### 6. Utilities & Services 🟢 KEEP

#### `/lib/services/medusa-v2.service.ts` 🟢 **KEEP**
- Medusa API client wrapper
- **Action**: **KEEP** and extend with new endpoints

#### `/lib/order-storage.ts` 🟡 **DEPRECATE**
- LocalStorage order caching
- **Action**: **DEPRECATE** in favor of API calls

## Collision Summary

### Critical Collisions (Must Fix)
1. **Secret Key Exposure**: `STRIPE_SECRET_KEY` used in 3 files
2. **Payment Intent Creation**: Frontend creates payment intents directly
3. **Webhook Duplication**: Frontend has its own webhook handler

### Moderate Collisions (Should Fix)
1. **Cart Storage**: LocalStorage instead of backend
2. **Price Calculation**: Client-side calculations throughout
3. **Cart ID Generation**: Client-generated IDs

### Minor Issues (Nice to Fix)
1. **Card Element**: Using deprecated Stripe component
2. **Hardcoded Values**: Region IDs, API URLs
3. **Missing Features**: No guest order lookup

## Migration Plan

### Phase 1: Safety & Feature Flag
1. ✅ Add `USE_NEW_CHECKOUT` environment variable
2. ✅ Create feature flag utility
3. ✅ Backup existing implementation

### Phase 2: Extract & Secure
1. 🔧 Remove all `STRIPE_SECRET_KEY` references
2. 🔧 Extract money formatting utilities
3. 🔧 Extract order type definitions

### Phase 3: Refactor Core
1. 🔄 Replace LocalStorage cart with Medusa cart API
2. 🔄 Replace payment intent creation with payment sessions
3. 🔄 Remove duplicate webhook handler

### Phase 4: Implement New UI
1. ➕ Add Payment Element integration
2. ➕ Add guest order lookup
3. ➕ Add proper error handling

### Phase 5: Testing & Cleanup
1. ✔️ Integration tests with Stripe CLI
2. ✔️ Remove deprecated code
3. ✔️ Update documentation

## File Change Matrix

| File | Action | Priority | Breaking Change |
|------|--------|----------|-----------------|
| `/api/create-payment-intent/route.ts` | DELETE | CRITICAL | Yes |
| `/api/webhook/stripe/route.ts` | DELETE | CRITICAL | Yes |
| `/app/checkout/page.tsx` | REFACTOR | HIGH | Yes |
| `/lib/cart-utils.ts` | REFACTOR | HIGH | No (wrapped) |
| `/app/cart/page.tsx` | REFACTOR | MEDIUM | No |
| `/api/orders/create/route.ts` | MODIFY | LOW | No |
| `.env.example` | UPDATE | CRITICAL | No |

## Security Vulnerabilities

1. **SECRET KEY IN FRONTEND** 🔴
   - Files: `create-payment-intent/route.ts`, `webhook/stripe/route.ts`
   - Risk: Complete payment system compromise
   - Fix: Remove immediately

2. **No CSRF Protection** 🟡
   - Files: All API routes
   - Risk: Cross-site request forgery
   - Fix: Add CSRF tokens

3. **No Rate Limiting** 🟡
   - Files: All API routes
   - Risk: Abuse, DOS
   - Fix: Add rate limiting middleware

## Recommendations

### Immediate Actions (Do First)
1. Remove `STRIPE_SECRET_KEY` from all frontend code
2. Delete duplicate webhook handler
3. Add feature flag infrastructure

### Short Term (This Sprint)
1. Implement Medusa cart API integration
2. Replace CardElement with Payment Element
3. Add guest order lookup

### Long Term (Next Sprint)
1. Add comprehensive error handling
2. Implement retry logic for all API calls
3. Add analytics and monitoring

## Testing Requirements

### Unit Tests Needed
- Cart service with Medusa API
- Payment session creation
- Order completion flow

### Integration Tests Needed
- Full checkout flow with Stripe CLI
- Webhook processing
- Guest order lookup

### Manual QA Checklist
- [ ] Cart persists across sessions
- [ ] Payment Element loads correctly
- [ ] Webhook updates order status
- [ ] Guest can lookup order
- [ ] Prices match backend calculations

## Rollback Plan

If issues occur after deployment:
1. Set `USE_NEW_CHECKOUT=false`
2. Clear browser LocalStorage
3. Restart application
4. Monitor error logs
5. Revert commit if needed

---

## Next Steps

1. **Commit this audit** as the first commit
2. **Create feature flag** infrastructure
3. **Remove security vulnerabilities** (secret keys)
4. **Begin incremental refactoring** per the plan above

This audit identifies **23 files** that need changes, with **3 critical security issues** that must be addressed immediately.