# Stripe Checkout Runbook

## Overview

This runbook covers the setup, testing, and troubleshooting of the Stripe checkout implementation in the Medusa backend.

## Prerequisites

1. **Stripe Account**: Access to Stripe Dashboard
2. **Stripe CLI**: Installed and authenticated
3. **Environment Variables**: Properly configured
4. **Node.js**: Version 18+ (20+ for Medusa)

## Environment Setup

### Required Environment Variables

```bash
# .env file in /medusa directory

# Feature Flags
USE_NEW_CHECKOUT=true              # Enable new checkout system
ENABLE_LEGACY_CHECKOUT=false       # Disable legacy checkout

# Stripe Configuration
STRIPE_API_KEY=sk_test_...         # Secret key from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...    # Webhook endpoint secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Publishable key for frontend

# Medusa Configuration
MEDUSA_BACKEND_URL=http://localhost:9000
DATABASE_URL=postgresql://...
```

### Stripe Dashboard Setup

1. **API Keys**:
   - Navigate to Developers → API keys
   - Copy secret key to `STRIPE_API_KEY`
   - Copy publishable key to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

2. **Webhook Endpoint**:
   - Navigate to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/webhooks/stripe`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
     - `checkout.session.completed`
     - `charge.refunded`
     - `charge.dispute.created`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

3. **Payment Methods**:
   - Navigate to Settings → Payment methods
   - Enable desired payment methods (cards, wallets, etc.)

## Testing with Stripe CLI

### Local Development Setup

1. **Install Stripe CLI**:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# Download from https://stripe.com/docs/stripe-cli
```

2. **Login to Stripe**:
```bash
stripe login
```

3. **Forward webhooks to localhost**:
```bash
stripe listen --forward-to localhost:9000/webhooks/stripe
```

4. **Copy webhook signing secret**:
```bash
# The CLI will output:
# Ready! Your webhook signing secret is whsec_test_...
# Copy this to STRIPE_WEBHOOK_SECRET in .env
```

### Test Scenarios

#### 1. Successful Payment Flow

```bash
# 1. Create cart
curl -X POST http://localhost:9000/store/carts \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-cart-001" \
  -d '{
    "region_id": "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ",
    "email": "test@example.com",
    "currency_code": "usd"
  }'

# Save cart_id from response

# 2. Add items (assuming variant exists)
curl -X POST http://localhost:9000/store/carts/{cart_id}/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "variant_123",
    "quantity": 2
  }'

# 3. Set addresses
curl -X POST http://localhost:9000/store/carts/{cart_id}/addresses \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": {
      "first_name": "John",
      "last_name": "Doe",
      "address_1": "123 Main St",
      "city": "San Francisco",
      "province": "CA",
      "postal_code": "94105",
      "country_code": "us"
    }
  }'

# 4. Create payment session
curl -X POST http://localhost:9000/store/carts/{cart_id}/payment-sessions \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-payment-001" \
  -d '{
    "provider_id": "stripe"
  }'

# Save client_secret and payment_intent_id from response

# 5. Trigger payment success (using Stripe CLI)
stripe trigger payment_intent.succeeded \
  --override payment_intent:metadata.cart_id={cart_id}

# 6. Complete checkout
curl -X POST http://localhost:9000/store/carts/{cart_id}/complete \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-complete-001" \
  -d '{
    "payment_intent_id": "{payment_intent_id}"
  }'
```

#### 2. Failed Payment Flow

```bash
# After creating payment session...

# Trigger payment failure
stripe trigger payment_intent.payment_failed \
  --override payment_intent:metadata.cart_id={cart_id}

# Check cart status - should still be open
curl http://localhost:9000/store/carts/{cart_id}
```

#### 3. Refund Flow

```bash
# After successful order creation...

# Trigger refund
stripe trigger charge.refunded \
  --override charge:metadata.order_id={order_id}

# Check order status
curl http://localhost:9000/store/orders/{order_id}
```

### Test Cards

Use these test card numbers in the frontend:

| Scenario | Card Number | Details |
|----------|------------|---------|
| Success | 4242 4242 4242 4242 | Any CVC, future expiry |
| Decline | 4000 0000 0000 0002 | Card declined |
| Insufficient funds | 4000 0000 0000 9995 | Decline: insufficient funds |
| 3D Secure Required | 4000 0027 6000 3184 | Requires authentication |
| Expired Card | 4000 0000 0000 0069 | Card expired |

## Monitoring & Debugging

### Check Webhook Events

```bash
# View recent webhook events
stripe events list --limit 10

# View specific event
stripe events retrieve evt_...
```

### Debug Payment Intent

```bash
# Retrieve payment intent
stripe payment_intents retrieve pi_...

# View payment intent events
stripe events list --limit 10 \
  --type payment_intent.* \
  --data.object.id=pi_...
```

### Common Issues & Solutions

#### 1. Webhook Signature Verification Failed

**Error**: `Webhook signature verification failed`

**Solutions**:
- Ensure `STRIPE_WEBHOOK_SECRET` matches the one from Stripe CLI or Dashboard
- Check that raw request body is being used for signature verification
- Verify Content-Type header is correct

#### 2. Payment Intent Not Found

**Error**: `Payment intent does not match cart`

**Solutions**:
- Check metadata is properly set on payment intent creation
- Verify cart_id is correctly passed
- Ensure payment intent hasn't expired (24 hours)

#### 3. Cart Already Completed

**Error**: `Cart is already completed`

**Solutions**:
- Check idempotency keys are unique
- Verify webhook isn't being processed multiple times
- Check if order already exists for the cart

#### 4. Inventory Issues

**Error**: `Insufficient inventory`

**Solutions**:
- Check product stock levels
- Verify inventory service is running
- Check reservation logic in cart service

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Webhook endpoint accessible from internet
- [ ] SSL certificate valid
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry, etc.)
- [ ] Database backups configured
- [ ] Idempotency keys implemented

### Deployment Steps

1. **Configure Production Stripe**:
   - Switch to live mode in Stripe Dashboard
   - Update API keys to production keys
   - Configure production webhook endpoint

2. **Database Migration**:
```bash
npx medusa db:migrate
```

3. **Deploy Application**:
```bash
npm run build
npm run start
```

4. **Verify Webhook**:
```bash
# Send test webhook from Stripe Dashboard
# Check logs for successful processing
```

5. **Test Transaction**:
   - Create small test purchase
   - Verify order creation
   - Check webhook processing
   - Confirm admin can view order

### Rollback Procedure

If issues occur:

1. **Immediate Rollback**:
```bash
# Set feature flag
export USE_NEW_CHECKOUT=false
export ENABLE_LEGACY_CHECKOUT=true

# Restart application
```

2. **Database Rollback** (if needed):
```bash
cd scripts/db-backup
./restore_db.sh pre_checkout_deployment
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Payment Success Rate**:
   - Target: > 95%
   - Alert if < 90%

2. **Webhook Processing Time**:
   - Target: < 2 seconds
   - Alert if > 5 seconds

3. **Cart Abandonment Rate**:
   - Track incomplete carts
   - Send recovery emails

4. **Failed Payments**:
   - Monitor decline reasons
   - Track by card type/country

### Log Queries

```bash
# Check payment failures
grep "Payment failed" logs/medusa.log | tail -20

# Check webhook processing
grep "Processing Stripe webhook" logs/medusa.log | tail -20

# Check order creation
grep "Created order" logs/medusa.log | tail -20
```

## Security Best Practices

1. **Never log sensitive data**:
   - No card numbers
   - No CVV codes
   - No full payment intents

2. **Validate all inputs**:
   - Sanitize email addresses
   - Validate amounts server-side
   - Check address formats

3. **Use HTTPS only**:
   - Enforce SSL for all endpoints
   - Use secure cookies
   - Implement HSTS

4. **Rate limiting**:
   - Limit cart creation: 10/minute/IP
   - Limit checkout: 5/minute/cart
   - Limit webhook: 100/minute

5. **Regular security audits**:
   - Review Stripe security settings
   - Check for exposed keys
   - Audit webhook logs

## Support & Resources

### Stripe Documentation
- [Payment Intents Guide](https://stripe.com/docs/payments/payment-intents)
- [Webhook Events](https://stripe.com/docs/webhooks/stripe-events)
- [Testing Guide](https://stripe.com/docs/testing)

### Medusa Documentation
- [Payment Providers](https://docs.medusajs.com/modules/payments)
- [Cart Management](https://docs.medusajs.com/modules/carts-and-checkout)
- [Order Management](https://docs.medusajs.com/modules/orders)

### Troubleshooting Contacts
- Stripe Support: support@stripe.com
- Medusa Discord: https://discord.gg/medusajs
- Internal Team: #payments-team channel

## Appendix: Webhook Event Reference

| Event | Description | Action |
|-------|-------------|--------|
| `payment_intent.succeeded` | Payment confirmed | Create/update order |
| `payment_intent.payment_failed` | Payment failed | Update order status |
| `payment_intent.canceled` | Payment canceled | Cancel order |
| `checkout.session.completed` | Checkout completed | Track conversion |
| `charge.refunded` | Refund issued | Update order status |
| `charge.dispute.created` | Dispute opened | Alert admin |

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-18 | System | Initial runbook creation |