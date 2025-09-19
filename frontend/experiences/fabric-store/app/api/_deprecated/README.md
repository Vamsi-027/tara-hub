# ⚠️ DEPRECATED API ROUTES

These routes have been moved here because they contain critical security issues:

## Security Issues Found

### `/create-payment-intent`
- **CRITICAL**: Uses `STRIPE_SECRET_KEY` in frontend code
- **CRITICAL**: Creates payment intents directly, bypassing Medusa
- **Issue**: Client-side price calculation

**Replacement**: Use Medusa's `/store/carts/:id/payment-sessions` endpoint

### `/webhook/stripe`
- **CRITICAL**: Duplicate webhook handler (should be in Medusa backend only)
- **CRITICAL**: Uses `STRIPE_SECRET_KEY` in frontend
- **Issue**: Direct order manipulation

**Replacement**: Medusa backend handles all Stripe webhooks at `/webhooks/stripe`

## Migration Instructions

1. These routes are disabled when `USE_NEW_CHECKOUT=true`
2. They will be completely removed in the next major version
3. Do not re-enable these routes in production

## Why This Is Dangerous

Exposing Stripe secret keys in frontend code allows attackers to:
- Create arbitrary charges
- Access all payment data
- Modify customer information
- Refund payments

**Never put secret keys in frontend code!**