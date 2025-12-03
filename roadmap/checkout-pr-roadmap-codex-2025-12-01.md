# Checkout Go-Live PR Roadmap (Codex)

## Objective
Unblock production go-live by restoring Medusa-native cart/checkout, securing payments, and aligning the fabric-store frontend to the backend flow.

## Recommended PRs

1) **Medusa cart/checkout foundation**
- Implement scaffold from `medusa/docs/checkout-scratch-start.md`: new cart model, cart repository, `src/services/cart.service.ts`, validators, and `src/workflows/checkout.workflow.ts`.
- Expose `store/carts` CRUD, line-item, addresses, shipping, payment, and `/store/checkout/:cartId/*` routes with idempotency and validation.
- Gate legacy routes behind `ENABLE_LEGACY_CHECKOUT`; keep order read endpoints intact.
- Add unit/integration tests under `medusa/src/api/__tests__` and workflow tests.

2) **Stripe payment & webhook hardening**
- Wire `@medusajs/payment-stripe` into the new checkout workflow (manual capture, idempotent session creation).
- Centralize Stripe webhooks in `medusa/src/api/webhooks/stripe/route.ts` for `payment_intent.*` and `checkout.session.completed`; remove/redirect frontend duplicates and any `STRIPE_SECRET_KEY` exposure.
- Ensure publishable/secret keys and webhook secrets come only from env; add logging + failure alerts.

3) **Shipping and tax readiness**
- Add setup scripts (e.g., `medusa/src/scripts/setup-shipping-complete.ts`, `.../setup-taxes-complete.ts`) to create fulfillment sets, service zones, shipping options, and US state tax rates.
- Document/run these in deploy flow so carts always get valid shipping/tax totals before checkout.

4) **Frontend checkout migration**
- Flip `frontend/experiences/fabric-store` to Medusa cart API: enable `useNewCheckout`, refactor `app/checkout/page.tsx`, `components/checkout/CheckoutFlow.tsx`, `lib/cart-utils.ts`, and `lib/services/order.service.ts` to use `cart-api.service.ts` + Payment Element.
- Remove direct Stripe intent endpoint `app/api/create-payment-intent/route.ts`; rely on Medusa payment sessions.
- Add guest checkout and order lookup using Medusa order endpoints; update cart badge/header to read Medusa cart.

5) **Inventory & reservation safety**
- Ensure `@medusajs/inventory` is active and hook reservation orchestrator into checkout workflow (reserve on start, release on failure/timeout).
- Add integration tests for stock validation on add-to-cart and reservation lifecycle.

6) **E2E and regression coverage**
- Update Playwright spec `frontend/experiences/fabric-store/e2e/checkout-v2.spec.ts` for the new flow (cart → shipping → pay → webhook → order visible in admin).
- Add backend smoke script (e.g., `medusa/scripts/validate-checkout.js`) and a CI job to run it before deploy.

## Immediate env/flag alignment
- Set `USE_NEW_CHECKOUT=true`, `ENABLE_LEGACY_CHECKOUT=false`, configure Stripe keys/webhook secret, and run shipping/tax setup against staging before E2E.
