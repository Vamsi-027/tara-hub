# CRITICAL: Order Management Hardening Plan (Codex)

Status: Active for go-live
Decision: No data migration — `.orders.json` contains junk/test data. Focus on cleanup, hardening, and standardizing Medusa-only flows.

---

## Goals
- Eliminate all file-based order storage/backup and ad-hoc order routes.
- Enforce a single, Medusa v2–compliant order creation and retrieval flow.
- Remove hardcoded keys, reduce PII exposure, and secure public order endpoints.
- Validate end-to-end checkout with Stripe and ensure Admin visibility.

---

## P0 Actions (Blockers)

- Remove legacy file storage and backup paths (no runtime writes allowed):
  - File: `frontend/experiences/fabric-store/.orders.json` (delete from workspace; ensure ignored by Git)
  - Route: `frontend/experiences/fabric-store/app/api/orders/backup/route.ts` (disable/remove)
  - Module: `frontend/experiences/fabric-store/lib/order-storage.ts` (remove; confirm no runtime references)

- Decommission non-standard order creation route:
  - Route: `frontend/experiences/fabric-store/app/api/create-order-with-items/route.ts`
    - Rationale: uses localStorage/filesystem; bypasses Medusa workflow.
    - Action: delete or guard with feature flag OFF in all environments.

- Secrets hygiene (frontend):
  - Remove hardcoded publishable key fallbacks from:
    - `frontend/experiences/fabric-store/app/api/orders/create/route.ts`
    - `frontend/experiences/fabric-store/app/api/orders/route.ts`
  - Enforcement: require env vars; in dev add `.env.local` entries; never commit keys.

- Git hygiene:
  - Ensure `.gitignore` excludes `frontend/experiences/fabric-store/.orders.json` and `frontend/experiences/fabric-store/orders/`.
  - Verify junk file not present in history; if committed, plan repo history scrub post‑release.

---

## Medusa-Only Flows (Source of Truth)

- Create orders only via: `frontend/experiences/fabric-store/app/api/orders/create/route.ts`
  - Must follow Medusa v2 flow: Create Cart → Add Line Items → Set Addresses → Set Shipping Method → Create Payment Collection → Create Payment Session (Stripe `pp_stripe_stripe`).

- Read orders only via: `frontend/experiences/fabric-store/app/api/orders/route.ts`
  - Prefer email-scoped list using Medusa store endpoint `/store/orders/customer`.
  - Allow specific order lookups via `/store/public-orders/:id`.

- Remove all other ad-hoc or test-only endpoints from runtime bundles.

---

## Backend Endpoint Security (Medusa)

Targets:
- `medusa/src/api/store/public-orders/route.ts`
- `medusa/src/api/store/public-orders/[id]/route.ts`
- `medusa/src/api/store/orders/customer/route.ts`

Hardening checklist:
- Rate limiting: apply IP-based limits (e.g., 60 req/min) with burst control.
- CORS: restrict origins to known frontends; deny `*` in production.
- Data minimization: for unauthenticated requests, exclude addresses and sensitive fields by default unless requester is verified.
- Optional verification: support signed token links for order lookup by ID (email→link with short-lived token) to view full details.
- Audit logging: log email hash, endpoint, and count — never log full email or addresses.

---

## Operational Readiness (Stripe/Region/Shipping)

- Stripe provider: confirm provider ID `pp_stripe_stripe` is installed and configured in Medusa backend.
- Regions: confirm at least one active region (e.g., US) and currency (`usd`), as used in `orders/create` route.
- Shipping options: ensure at least one option is returned for carts (route currently selects the first).
- Sales channel: verify products are assigned to the default sales channel used by the fabric-store experience.

---

## Frontend Order UX Constraints (MVP)

- Single checkout flow: samples handled as variants (no separate sample checkout for MVP).
- Required legal pages present to avoid broken links and compliance issues:
  - `app/{privacy,terms,shipping,returns,care,trade,about}/page.tsx`
- Logging: remove or redact PII in logs (email addresses, client secrets). Do not log `client_secret` in production.

---

## Testing & Validation

Staging validations:
- Place order E2E (browse → add to cart → checkout → Stripe session init → success screen).
- Verify order appears in Medusa Admin and via `GET /store/public-orders/:id` and frontend `/api/orders?id=...`.
- Verify `/api/orders?email=...` returns list with minimal fields and correct pagination.
- Negative tests: invalid email, missing region, missing Stripe keys — confirm friendly errors.
- Abuse tests: repeated calls to customer endpoints trigger rate limiting; CORS blocks unknown origins.

Smoke scripts to run (where applicable):
- `frontend/experiences/fabric-store/test-medusa-stripe.js`
- `frontend/experiences/fabric-store/test-final-order.js`
- `frontend/experiences/fabric-store/scripts/test-orders-api.js`

---

## Rollout Plan

- Phase 1 (same PR): remove legacy files/routes, secrets hygiene edits, and add minimal endpoint hardening + legal pages.
- Phase 2 (follow-up): add tokenized order lookup, add rate limiter module if not already present, and tighten CORS to exact domains.

Rollback:
- Revert PR; no data migration performed; Medusa remains source of truth.

---

## Risk Register

- Public endpoints exposure: mitigate with rate limits, CORS, and tokenized access for detailed views.
- Shipping/region misconfiguration: blocks checkout — include preflight checks and alerts in CI or deploy scripts.
- Hardcoded keys or PII logs: periodic scans and CI checks; manual code review before release.

---

## Owner‑Tagged Action List

- Frontend (Orders): remove backup + ad‑hoc routes; enforce env-only keys; scrub logging; add legal pages.
- Backend (Medusa): apply rate limits/CORS; minimize fields on public endpoints; validate region/Stripe/shipping; confirm sales channel.
- DevOps: set envs in Vercel/Railway; add monitoring (errors + CWV); verify no PII in logs; ensure `.gitignore` coverage.
- QA: run scripts + E2E; verify Admin order visibility; confirm endpoint security behaviors.

---

This plan reflects the “no migration” decision and focuses exclusively on eliminating legacy paths, securing order data access, and validating the Medusa‑native order lifecycle for go‑live.

