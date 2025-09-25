# ✅ Fabric Store Checkout Testing Checklist

## Pre-Test Setup

### 📦 Environment Variables
```bash
cd frontend/experiences/fabric-store
```

- [ ] `.env.local` file exists
- [ ] `NEXT_PUBLIC_USE_NEW_CHECKOUT=true`
- [ ] `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`
- [ ] `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is set
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set

### 🚀 Services Running

- [ ] **Terminal 1**: Medusa Backend
  ```bash
  cd medusa && npm run dev
  ```
  - [ ] Accessible at http://localhost:9000/health
  - [ ] Admin UI at http://localhost:9000/app

- [ ] **Terminal 2**: Stripe Webhook Forwarding
  ```bash
  stripe listen --forward-to localhost:9000/webhooks/stripe
  ```
  - [ ] Webhook secret noted and added to `medusa/.env`

- [ ] **Terminal 3**: Fabric Store
  ```bash
  cd frontend/experiences/fabric-store && npm run dev
  ```
  - [ ] Accessible at http://localhost:3006

## 🛒 Cart Management Tests

### Creating Cart
- [ ] Open http://localhost:3006 in incognito/private window
- [ ] Open browser console (F12)
- [ ] Navigate to /browse
- [ ] Add first product to cart
- [ ] Console shows: `🚚 Feature check: New Checkout = ENABLED`
- [ ] Console shows: `[CartAPI] Cart created: cart_...`
- [ ] Cart icon updates with count

### Cart Persistence
- [ ] Refresh page (F5)
- [ ] Cart count remains
- [ ] Navigate to /cart
- [ ] Items are still in cart
- [ ] Check sessionStorage has `medusa_cart_id`

### Cart Operations
- [ ] Add multiple items
- [ ] Update quantity of an item
- [ ] Remove an item
- [ ] Cart totals update correctly
- [ ] Clear entire cart

## 💳 Checkout Flow Tests

### Customer Information
- [ ] Click "Proceed to Checkout" from cart
- [ ] Fill customer information:
  - [ ] Email: test@example.com
  - [ ] First Name: Test
  - [ ] Last Name: User
  - [ ] Phone: +1 (555) 123-4567
- [ ] Form validates email format
- [ ] Form validates phone format

### Shipping Address
- [ ] Fill shipping address:
  - [ ] Address: 123 Test Street
  - [ ] City: San Francisco
  - [ ] State: CA
  - [ ] ZIP: 94105
  - [ ] Country: United States
- [ ] All fields required validation works
- [ ] ZIP code format validation works

### Billing Address
- [ ] "Same as shipping" checkbox works
- [ ] Can enter different billing address
- [ ] Billing form validates properly

### Shipping Method
- [ ] Shipping options load
- [ ] Can select shipping method
- [ ] Cart total updates with shipping cost

## 💰 Payment Tests

### Stripe Payment Element
- [ ] Payment form loads
- [ ] Stripe Payment Element appears
- [ ] No console errors about Stripe

### Test Card Scenarios

#### ✅ Successful Payment
- [ ] Card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date
- [ ] CVC: Any 3 digits
- [ ] ZIP: Any 5 digits
- [ ] Payment processes successfully
- [ ] Redirects to success page
- [ ] Order ID displayed

#### ❌ Declined Payment
- [ ] Card: `4000 0000 0000 0002`
- [ ] Shows decline error message
- [ ] Cart remains intact
- [ ] Can retry payment

#### 🔐 3D Secure Test
- [ ] Card: `4000 0027 6000 3184`
- [ ] 3D Secure modal appears
- [ ] Complete authentication
- [ ] Payment processes after auth

## 📦 Order Verification

### Success Page
- [ ] Shows order confirmation
- [ ] Displays order ID
- [ ] Shows order summary
- [ ] "Continue Shopping" button works

### Database Verification
- [ ] Order appears in Medusa Admin
- [ ] Order status is "pending"
- [ ] Customer information correct
- [ ] Line items correct
- [ ] Payment captured

### Webhook Processing
- [ ] Stripe CLI shows webhook received
- [ ] `payment_intent.succeeded` event
- [ ] `checkout.session.completed` event
- [ ] Order status updates

## 🔄 Guest Order Lookup

- [ ] Navigate to /orders (logged out)
- [ ] Enter order ID and email
- [ ] Order details load
- [ ] Shows correct items
- [ ] Shows order status

## 🔥 Error Handling Tests

### Network Errors
- [ ] Stop Medusa backend
- [ ] Try to add to cart
- [ ] Error message displays
- [ ] Cart operations fail gracefully

### Invalid Data
- [ ] Enter invalid email
- [ ] Enter invalid phone
- [ ] Enter past expiry date
- [ ] All show appropriate errors

### Cart Expiry
- [ ] Create cart
- [ ] Delete `medusa_cart_id` from sessionStorage
- [ ] Try to checkout
- [ ] New cart created automatically

## 📡 API Tests

### Run Test Script
```bash
cd frontend/experiences/fabric-store
node scripts/test-checkout-flow.js
```

- [ ] Environment check passes
- [ ] API endpoints respond
- [ ] Cart creation works
- [ ] Payment session creates

### Manual API Tests
```bash
# Get regions
curl http://localhost:9000/store/regions \
  -H "x-publishable-api-key: YOUR_KEY"
```
- [ ] Returns region list
- [ ] US region exists
- [ ] Currency is USD

## 🎯 Performance Tests

### Load Time
- [ ] Checkout page loads < 3 seconds
- [ ] Payment element loads < 2 seconds
- [ ] No visible layout shifts

### Cart Operations
- [ ] Add to cart < 1 second
- [ ] Update quantity < 1 second
- [ ] Remove item < 1 second

## 📱 Mobile Testing

- [ ] Open on mobile device/emulator
- [ ] Cart drawer works
- [ ] Checkout form usable
- [ ] Payment element responsive
- [ ] Success page displays correctly

## 🔒 Security Checks

- [ ] No Stripe secret key in browser
- [ ] No sensitive data in localStorage
- [ ] Cart ID in sessionStorage only
- [ ] No price manipulation possible
- [ ] HTTPS enforced in production

## 📋 Final Verification

- [ ] Complete end-to-end purchase
- [ ] Verify in Stripe Dashboard
- [ ] Verify in Medusa Admin
- [ ] Check email notifications (if configured)
- [ ] Confirm no console errors

## 🐛 Known Issues

Document any issues found:

1. _________________________________
2. _________________________________
3. _________________________________

## 📓 Notes

_________________________________
_________________________________
_________________________________

---

**Test Date**: _____________  
**Tested By**: _____________  
**Environment**: Development / Staging / Production  
**Result**: ✅ PASS / ⚠️ PARTIAL / ❌ FAIL  

## Sign-off

- [ ] All critical paths tested
- [ ] No blocking issues found
- [ ] Ready for deployment

**Signature**: _____________