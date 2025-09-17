# Medusa.js Audit → Roadmap (Code-Cited)

This analysis follows .claude/Dev.sessions/medusa-analysis-prompt.md and focuses strictly on Medusa backend (v2) and the storefront consuming its Store API.

## Executive Summary (≤250 words)
The repo runs Medusa v2 with modular config and custom modules for materials, fabric product selection, and fabric properties (medusa/medusa-config.ts; medusa/src/modules/*). Payments via Stripe and file storage via S3 driver (Cloudflare R2) are configured; Redis modules (cache, event bus, workflow engine) are present but commented. The current storefront (frontend/experiences/fabric-store) fetches Medusa products for PLP/PDP but performs checkout with a custom Stripe PI endpoint and file-backed orders, bypassing Medusa’s cart/order flows. To align with Medusa best practices and unlock multi-tenant, B2B pricing, and reliable fulfillment, we will: enable Redis eventing and workflow workers, migrate checkout to Medusa carts/orders with idempotency and Stripe webhooks, model sales channels as tenant boundaries, implement price lists and customer groups, and wire inventory/stock locations and reservations. Cloudflare R2 becomes the unified media plane with signed URLs and background optimization. We’ll add store endpoints for configurable fabric selection and PDP enrichment, and instrument observability (structured logs, OTEL) with P95 SLOs. The roadmap sequences high-impact changes first: idempotent checkout + webhooks, sales channels + pricing, then inventory/reservations and promotions, with storefront data-fetching discipline.

## 1) Version Profile & Topology
- Medusa version: v2 modular
  - Dependencies: "@medusajs/framework": "2.10.0", "@medusajs/medusa": "2.10.0", CLI present (medusa/package.json).
- Topology
  - Single service with optional worker mode: MEDUSA_WORKER_MODE (medusa/medusa-config.ts).
  - Modules: auth (google, emailpass), payment (stripe), file (S3/R2), notifications (sendgrid, resend), custom modules: materials, fabric_details, fabric_products.
  - Redis modules available but commented in medusa/medusa-config.ts.

## 2) Backend System Map (code-cited)
- Configuration: medusa/medusa-config.ts
  - DB: databaseUrl from env; CORS for store/admin/auth; jwtSecret/cookieSecret.
  - Redis (cache, event-bus, workflow-engine) commented; enable with REDIS_URL.
- Plugins/Modules
  - Payment: @medusajs/payment + @medusajs/payment-stripe (medusa/medusa-config.ts).
  - File: @medusajs/file with @medusajs/file-s3; endpoint/forcePathStyle for R2; prefix "store/organized/".
  - Notifications: @medusajs/notification-sendgrid; custom resend_notification (medusa/src/modules/resend_notification/service.ts).
  - Auth: @medusajs/auth (google, emailpass).
- Core domains (observed usage)
  - Products/variants/prices exist via Medusa Store API consumption (frontend/experiences/fabric-store/lib/medusa-api.ts fetches /store/products and maps fields).
  - Price lists, regions/currencies, sales channels, inventory, returns/claims not explicitly configured.
- APIs & middlewares
  - Medusa REST not shown directly, but store APIs assumed standard; webhook route not present for Stripe (gap).
- Events & jobs
  - No active Redis event bus/workflows (commented in medusa-config.ts). Scripts exist for sync tasks (medusa/src/scripts/sync-materials.ts).
- Migrations & seeds
  - predeploy runs medusa db:migrate; multiple seed scripts (medusa/package.json and src/scripts/*).

ASCII flow: PDP→Cart→Checkout→Webhook→Order→Fulfillment
User → Next.js PDP → GET /store/products (frontend/…/lib/medusa-api.ts) → add-to-cart UI (currently local) →
Checkout (should use Medusa carts/orders) → Payment via Stripe (webhook to Medusa) → Order created/paid → Fulfillment provider (TBD)

Media: Upload → @medusajs/file-s3 (R2) → public URL (prefix) → PDP images; tested by medusa/src/scripts/test-image-upload.ts

## 3) Storefront Audit (Next.js)
- Routing: App Router with Next.js 15 (frontend/experiences/fabric-store/app/*).
- Data fetching: CSR for many views; PLP/PDP fetch Medusa Store API via custom fetchers (frontend/…/lib/medusa-api.ts).
- Cart/Checkout: LocalStorage cart; Stripe PI via custom API (frontend/…/app/api/create-payment-intent/route.ts); file-backed orders (…/app/api/orders/route.ts). Not using Medusa cart/order APIs.
- Performance (Working Theory): Over-fetching risk on CSR; missing server-side caching; unknown P95.
- SEO/UX (Working Theory): PDP schema markup not evident; R2 image optimization depends on Next image and sizes; canonical/pagination unclear.

## 4) Capability Matrix (Supported/Partial/Missing)
- Multi-currency/regions: Missing (no regions in medusa-config.ts).
- Sales channels for tenants: Missing (not configured).
- B2B pricing (price lists, customer groups): Missing.
- Inventory with locations/reservations: Missing.
- Promotions/discounts/gift cards: Missing explicit config; likely defaults only.
- Payments (Stripe): Partial (provider configured in medusa-config.ts; no webhook route wired; storefront bypasses Medusa checkout).
- Fulfillment providers/shipping: Missing.
- Media/file service (R2): Supported (medusa-config.ts + test-image-upload.ts).
- Observability: Missing (no structured logs or metrics).
- Security: Partial (CORS configured; secrets via env; no explicit rate limiting shown).

## 5) Gap Analysis (Impact/Effort/Evidence/Remediation)
- Idempotent checkout via Medusa
  - Impact: Prevent duplicate orders; core revenue path.
  - Effort: M.
  - Evidence: Frontend uses custom PI and file orders (frontend/…/app/api/create-payment-intent/route.ts; …/app/api/orders/route.ts).
  - Remediation: Use /store carts, line items, checkout session; add Stripe webhook handler in Medusa; remove file-based orders.
- Sales channels as tenant boundary
  - Impact: Required for partner segmentation and multi-tenant.
  - Effort: M.
  - Evidence: No channels in medusa-config.ts.
  - Remediation: Create channels per partner, scope catalog/cart/order queries by channel.
- B2B pricing via price lists & groups
  - Impact: Margin and enterprise deals.
  - Effort: M.
  - Evidence: No price lists in code.
  - Remediation: Define price lists, attach to channels and customer groups; expose in PLP/PDP.
- Inventory & reservations
  - Impact: Oversell risk and customer trust.
  - Effort: M-L.
  - Evidence: Not configured.
  - Remediation: Enable inventory module; stock locations; reservation on cart add; release on timeout.
- Promotions/discounts engine
  - Impact: Conversion and campaigns.
  - Effort: M.
  - Evidence: Not configured.
  - Remediation: Configure discounts with rules, stacking, schedule.
- Fulfillment provider abstraction
  - Impact: Shipping, returns, exchanges.
  - Effort: M.
  - Evidence: Not present.
  - Remediation: Add provider and shipping profiles; returns/claims flows.
- Redis event bus/workflows
  - Impact: Reliability, retries, DLQ.
  - Effort: S-M.
  - Evidence: Commented in medusa-config.ts.
  - Remediation: Enable Redis modules; set retry/backoff and DLQ policy.
- Observability
  - Impact: Operating SLOs.
  - Effort: S.
  - Evidence: No structured logs/metrics.
  - Remediation: Pino + OTEL; dashboards for cart, checkout, webhooks.

## 6) Target Architecture (Incremental)
- v2 hardening (already on v2)
  - Enable Redis cache/event-bus/workflows (medusa/medusa-config.ts), split server/worker via MEDUSA_WORKER_MODE.
- Event Bus & Workflows
  - Retries with exponential backoff; idempotent handlers; DLQ topics with alerting.
- Multi-tenant via Sales Channels
  - One channel per partner; storefront authenticates/scopes by channel ID; admin role guards.
- Pricing/Promotions
  - Price lists bound to channels/groups; campaign schedule; A/B toggles.
- Inventory & Reservations
  - Stock locations; reservation on cart add; release job.
- File Service on R2
  - Signed upload URLs; background optimization worker; consistent URL prefix.
- Observability
  - Correlation IDs per request; P95 SLOs; error budgets.

## 7) Roadmap with Acceptance Criteria
Top 10 Priorities (see priorities.json for machine-readable)
- R2 File Service hardening — Objective: Signed URLs + optimization. Evidence: medusa/medusa-config.ts; test-image-upload.ts. Effort: M. Exit: 100% media via R2.
- Idempotent Checkout & Payments — Objective: Move to Medusa carts/orders; webhook. Evidence: frontend custom PI/order routes. Effort: M. Exit: 0 duplicate orders.
- Sales Channels as Tenant Boundary — Objective: Channel-scoped catalog/cart/order. Evidence: none configured. Effort: M. Exit: cross-channel tests pass.
- B2B Pricing (Price Lists & Groups) — Objective: Tiered pricing. Effort: M. Exit: group pricing honored.
- Inventory & Reservations — Objective: Prevent oversell. Effort: M-L. Exit: reservation leak tests pass.
- Promotions/Discounts Engine — Objective: Rules/stacking. Effort: M. Exit: matrix tests green.
- Fulfillment Provider — Objective: Shipping + returns/claims. Effort: M. Exit: return→exchange works.
- Observability v1 — Objective: Logs, traces, dashboards. Effort: S. Exit: P95 add-to-cart <150ms; checkout P95 <900ms.
- Storefront Data-Fetching Discipline — Objective: SSR/ISR where needed; caching; schema markup. Effort: M. Exit: Lighthouse ≥90 PDP/PLP.
- Security & Secrets Hygiene — Objective: CORS strict; inputs validated; rate limits. Effort: S. Exit: baseline scan clean.

30/60/90 Plan
- 30 days: Enable Redis modules; migrate checkout to Medusa (idempotency, webhooks); R2 signed URLs; basic dashboards.
- 60 days: Sales channels + B2B pricing; inventory with stock locations/reservations; promotions engine basics.
- 90 days: Fulfillment provider + returns/claims; storefront SSR/ISR and SEO; observability maturity; security hardening.

Q2–Q4 Themes
- Q2: Multi-tenant & pricing maturity; promotion campaigns; performance.
- Q3: Returns/claims workflows; search & merchandising; content integrations.
- Q4: Advanced analytics and partner-level SLAs; internationalization.

Risk Register (top 10)
- Duplicate orders during migration → Mitigation: idempotency keys + shadow writes.
- Redis outages → Fallback to memory cache; queue persistence and DLQ.
- Stripe webhook drift → Signature verification; replay window checks; reconciliation job.
- Cross-tenant leakage → Channel guards + tests; audit logs.
- R2 availability → Exponential backoff; cached thumbnails.
- Inventory inaccuracies → Reservation watchdog; periodic reconciliation.
- Performance regressions → P95 dashboards + alerts; feature flags/canary.
- Secrets exposure → ENV scanning; separate envs; limited IAM.
- Data migrations → Backups; runbooks; down-migrations.
- Vendor API limits (Working Theory) → Backoff; batching; circuit breakers.

## Appendix
- API inventory: Standard Medusa /store/* used by frontend (frontend/…/lib/medusa-api.ts). Custom endpoints to add for fabric selection/properties.
- Plugin config table: See medusa/medusa-config.ts (auth, file-s3, payment-stripe, notification-sendgrid; Redis modules commented).
- DB schema diffs: Materials model (medusa/src/modules/materials/models.ts); fabric product config models referenced in fabric_products/service.ts.
- R2 config: file-s3 provider options in medusa/medusa-config.ts (endpoint, s3ForcePathStyle, prefix).
- Example idempotent handlers: Stripe webhook (to implement) verifying STRIPE_WEBHOOK_SECRET and updating payment/order once.
