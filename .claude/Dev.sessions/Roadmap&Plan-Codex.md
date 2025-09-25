# Precision Product Roadmap — Tara Hub ($50M ARR Potential)

## Executive Summary
Tara Hub is a multi-tenant, Medusa-backed Next.js monorepo with a working storefront (fabric-store), admin app, custom auth, Sanity content, and partial backend clean-architecture layer. Commerce data flows via Medusa (products, images, auth), while the fabric-store currently uses a local cart + Stripe Payment Intents and persists orders to a file with optional DB write. The backend package includes strong foundations (use cases, repositories, DI, Redis-ready cache/eventing) but isn’t fully wired to App Router routes. To reach $50M ARR, prioritize: multi-tenant hardening, Agent Core for SMB automation (catalog syncs, pricing, content, A2A/A2B workflows), Medusa-first checkout lifecycle with idempotency/webhooks, search/faceting, R2 asset pipeline, partner onboarding via templates + Sanity, and Observability + SLOs. This plan sequences revenue-driving features first (listing automation, marketplace syncs, quoting) while incrementally adding platform primitives (events, queueing, authZ) and growth instrumentation.

## 1) System Map (from code)
- Apps/Packages
  - Next.js root app: `app/` with App Router APIs for auth and fabrics (app/api/*) and middleware multi-tenant header (middleware.ts).
  - Frontend monorepo: `frontend/experiences/fabric-store` (Next 15) with API routes for checkout, orders, fabrics, Stripe integration; `frontend/experiences/store-guide`; `frontend/admin` (Next) [see frontend/package.json).
  - Medusa v2 service: `medusa/` with modules (auth, materials, fabric_products) and S3 (R2) storage; Stripe provider (medusa/medusa-config.ts).
  - Backend clean-architecture lib: `backend/` with use-cases/repos/DI; route map defined but not mounted to Next routes.
- Entrypoints & Routes (examples)
  - Auth: `app/api/auth/signin/route.ts` POST, Google OAuth: `app/api/auth/google*/route.ts` GET.
  - Fabrics (root): `app/api/fabrics/route.ts` GET (PG or mock).
  - Fabric Store APIs: `frontend/experiences/fabric-store/app/api/create-payment-intent/route.ts` POST; `.../app/api/orders/route.ts` GET/POST/PUT; `.../app/api/fabrics/route.ts` GET (filters via Sanity/fallback); CORS in `.../lib/cors.ts`.
  - Medusa Store APIs used client-side: `frontend/experiences/fabric-store/lib/medusa-api.ts` (fetches `/store/products`, transforms to fabric domain).
  - Backend route contract: `backend/interfaces/routes/fabric.routes.ts` maps Next routes like `GET /api/v1/fabrics` → controller methods.
- Next.js routing modes: App Router (`app/**/route.ts`, `page.tsx`).
- Medusa Plugins/Customizations: Stripe payments, S3 file provider (R2), Google/email auth, custom modules (materials/fabric_*) (medusa/medusa-config.ts).
- Sanity CMS: Studio at `frontend/experiences/sanity-studio/`; schemas `schemaTypes/*.ts` incl. `heroSlide.ts`, `fabric.ts`; client in `fabric-store/lib/sanity.ts`.
- DB/Cache/Storage
  - Postgres via pg + Drizzle ORM (`backend/infrastructure/database/**`, `app/api/fabrics/route.ts`).
  - Redis-ready cache and event bus (Redis optional; Vercel KV fallback) (`backend/shared/ioc/container.ts`, `infrastructure/cache/**`).
  - R2/S3 via Medusa file module; test script `medusa/src/scripts/test-image-upload.ts`.

Request Flows
- Product detail (PDP): UI hook → `fabricAPI.getFabric` (fabric-store/hooks/useFabrics.ts) → REST (`.../app/api/fabrics/route.ts`) or Medusa via `lib/medusa-api.ts` transform.
- Cart/Checkout: LocalStorage cart + `create-payment-intent` (Stripe PI) → then `orders` POST persists file and attempts DB (`.../lib/order-storage.ts`, `.../app/api/orders/route.ts`).
- Catalog Sync: Medusa script `medusa/src/scripts/sync-materials.ts` copies admin fabrics into `materials` table.
- Image Upload: Medusa S3 provider (R2) configured in `medusa/medusa-config.ts`; test in `src/scripts/test-image-upload.ts`.
- Agent/Automation: None wired; foundations exist for events/caching in `backend/` but no agent services found.

API/Jobs/Webhooks Inventory (by file path)
- HTTP APIs
  - `app/api/auth/*/route.ts` (signin, signout, session, google oauth, verify)
  - `app/api/fabrics/route.ts` GET
  - `frontend/experiences/fabric-store/app/api/*/route.ts` (orders, create-payment-intent, fabrics, contact, hero-slides)
- Background/Queues/Cron: None in app; Medusa supports BullMQ but Redis modules commented (medusa/medusa-config.ts). No cron found.
- Webhooks: Stripe webhook secret env is referenced (ENVIRONMENT_VARIABLES.md) but no webhook route in repo.

## 2) Capability vs Objective Matrix
| Objective | Status | Evidence |
|---|---|---|
| 1. AI Agentic E‑commerce | Missing | No agent services; only UI + APIs.
| 2. A2A workflows | Missing | No threads/jobs/queues.
| 3. B2A automation (Etsy, pricing, images, CS) | Partial | Etsy admin pages exist (app/admin/etsy-products/*.tsx) but no sync service; pricing absent; images via R2.
| 4. A2B actions (RFQ/PO) | Missing | No RFQ/order negotiation endpoints.
| 5. Multi-tenant storefronts | Partial | Tenant header set in `middleware.ts` but no DB tenant enforcement.
| 6. Marketplace + hub | Partial | Medusa + Next; no collaboration hub.
| 7. Multiple AI Agents | Missing | None found.
| 8. Production system (SMB/manufacturing) | Partial | Order storage file/DB fallback; no MES.
| 9. Lead gen & marketing | Partial | Sanity hero, email via Resend; no campaigns engine.
| 10. Campaigns/Calendar | Missing | None found.
| 11. Vault for files/docs | Partial | R2 via Medusa; no UI/workflows.
| 12. B2B tools (quote/pricing/project) | Partial | Order endpoints; no quotes/pricing engine.
| 13. Rapid product creation | Partial | Medusa modules + scripts; admin forms exist.
| 14. SEO improvements | Partial | Next 15 + sitemap/robots present (app/sitemap.ts, robots.ts). No ISR strategy codified.
| 15. Auto blog publish | Partial | Sanity present; no auto-publish pipeline.

Multi-tenant boundaries: Header `x-tenant-id` set (middleware.ts) but no `tenant_id` fields or RLS observed. Gap.

## 3) Gaps (Impact/Effort/Evidence/Remediation)
- Multi-tenant enforcement
  - Impact: Critical for partner storefronts, billing, data isolation.
  - Effort: M.
  - Evidence: `middleware.ts` sets tenant header; no DB tenant columns; no guards.
  - Remediation: Add `tenant_id` to key tables (fabrics, materials, orders); propagate from middleware to APIs; add RLS or app-level guards; audit log.
- Checkout hardening & order lifecycle
  - Impact: Revenue leakage risk; no idempotency/webhooks.
  - Effort: M.
  - Evidence: `fabric-store/app/api/create-payment-intent/route.ts`, `.../orders/route.ts` file-based storage.
  - Remediation: Medusa-native cart/checkout; Stripe webhooks; idempotent orders; retries + backoff.
- Agent core and automations
  - Impact: Key differentiator for SMB growth and ARR.
  - Effort: M-L.
  - Evidence: No agent modules; backend has event bus and cache scaffolding.
  - Remediation: Build Agent Core (tool registry, Redis queue, Postgres state), A2A/A2B workflows.
- Catalog ingestion & marketplace syncs (Etsy/Shopify/Amazon)
  - Impact: Uplifts GMV and onboarding.
  - Effort: M.
  - Evidence: Admin UI for Etsy but no sync worker; scripts exist for materials sync (medusa/src/scripts/sync-materials.ts).
  - Remediation: Dedicated sync service with idempotency keys, retries, DLQ.
- Pricing & promotions
  - Impact: Margin lift and conversion.
  - Effort: M.
  - Evidence: No pricing engine; basic pricing in transforms.
  - Remediation: Rules engine + AB tests integrated to Medusa prices.
- Search/faceting
  - Impact: Conversion on PLP.
  - Effort: M.
  - Evidence: Filtering in `fabric-store/app/api/fabrics/route.ts`; no GIN/trigram indices.
  - Remediation: Server-side facets, Postgres GIN/trigram, cached results.
- Observability
  - Impact: SLOs and scale.
  - Effort: S-M.
  - Evidence: console logs; no metrics/tracing.
  - Remediation: Add structured logging, OpenTelemetry traces, dashboards, error budgets.
- Sanity ISR/revalidation
  - Impact: Content freshness & SEO.
  - Effort: S.
  - Evidence: `sanity.ts` fetch with CDN + fallback; no revalidate hooks.
  - Remediation: ISR + onContentPublish webhook to revalidate pages.

## 4) Target Architecture (incremental)
Text Diagram
- Next.js Apps (Admin, Fabric Store, Store Guide)
  -> API routes (App Router) ↔ Agent Core (Node service)
  -> Medusa Storefront (orders, products, payments)
  -> Sanity CMS (content)
  -> Asset Plane (R2 via S3 provider)
  -> Event Bus (Redis Streams/pub-sub)
  -> Postgres (tenant data, agent state, orders)
  -> Redis (jobs, cache)

Evolution from current code
- Agent Core: New service using Redis (BullMQ) + Postgres tables for agent state; expose HTTP tools. Integrate with `backend` DI container for cache/events. Add HITL checkpoints.
- Eventing: Add Redis Streams/publish in Medusa hooks and Next APIs; subscribe for syncs, pricing updates.
- Multi-tenant: Add `tenant_id` to Medusa custom resources/materials and app DB; propagate from `middleware.ts` to APIs; guards in controllers.
- Commerce plane: Migrate fabric-store checkout to Medusa cart/checkout; Stripe webhooks → order state updates.
- Content plane: Sanity schemas for partner pages/PLP/PDP blocks; Next.js ISR + revalidate on publish.
- Asset plane: Signed URL uploads via Medusa file service; background optimization workers.
- Observability: Add pino logs, OpenTelemetry (SDK + exporters), dashboards; SLOs (P95 read<300ms/write<900ms).

## 5) $50M Revenue Model & Growth Levers (Working Theory)
- Bottom-up model (illustrative): 1,000 partners × 3 storefronts/partner × $500k GMV/storefront/year × 2% take-rate = $30M; plus 20k SaaS seats × $50/mo ARPA ≈ $12M; add premium agent packs, integrations (+$8M) → $50M potential.
- Growth levers
  - Listing automation (AI) → +15–25% GMV uplift.
  - Marketplace syncs (Etsy/Shopify/Amazon) → +20–40% reach.
  - A2A/A2B quoting & RFQ threads → higher close rate (+10–15%).
  - Storefront templates + domains → faster onboarding (time-to-value ↓50%).
  - Pricing engine + promos → margin + conversion uplift.
  - Asset pipeline (faster media) → conversion lift.
  - SEO + blog auto-publish → organic traffic growth.
  - Campaigns/CRM wiring → retention and repeat.

## 6) Prioritized Roadmap (30/60/90 + Q2–Q4)
Top 12 (summary)
| Item | Effort | RICE |
|---|---:|---:|
| Multi-tenant foundation | M | 72 |
| Agent Core v1 | L | 64 |
| Etsy/Marketplace Sync | M | 54 |
| Pricing & Promotions | M | 45 |
| Partner Onboarding | M | 60 |
| Search & Faceting | M | 44 |
| R2 Asset Pipeline | M | 40 |
| Observability v1 | S | 48 |
| Checkout Hardening | M | 56 |
| Collaboration & RFQ | M | 42 |
| Sanity Schema Hardening | S | 36 |
| Growth Experiments Pack | S | 32 |

30 days
- Multi-tenant foundation
  - Objective: Add tenant_id, guards, audit.
  - Evidence: `middleware.ts`, lack of tenant columns.
  - Effort: M; RICE: 72; Owner: Platform Eng.
  - Exit: RLS/app guards in key read/write paths; audit log events.
  - Metrics: No data cross-tenant; P95 read<300ms.
- Checkout hardening
  - Objective: Idempotency + Stripe webhook + DB orders.
  - Evidence: `fabric-store/app/api/create-payment-intent/route.ts`, `.../orders/route.ts`.
  - Effort: M; RICE: 56; Owner: Commerce Eng.
  - Exit: Webhooks live; orders persisted; retries/backoff; <1% failed orders.
- Observability v1
  - Objective: pino logs, traces, dashboards.
  - Evidence: console logs across APIs.
  - Effort: S; RICE: 48; Owner: SRE.
  - Exit: Dashboards for P95, error rate; alerts.

60 days
- Agent Core v1
  - Objective: Redis queue, Postgres state, tool registry, HITL.
  - Evidence: No agents; DI/event scaffolding exists.
  - Effort: L; RICE: 64; Owner: AI Platform.
  - Exit: Run 3 tools (catalog sync, pricing run, image gen); 95% job success.
- Etsy/Marketplace Sync
  - Objective: Full sync with idempotency; DLQ.
  - Evidence: Admin Etsy UIs; no service.
  - Effort: M; RICE: 54; Owner: Integrations.
  - Exit: Bidirectional sync; SLA 99.5%.
- Search & Faceting
  - Objective: GIN/trigram + cached filters.
  - Evidence: Filter API exists.
  - Effort: M; RICE: 44; Owner: Web Eng.
  - Exit: P95 PLP < 400ms; CTR +10%.

90 days
- Pricing & Promotions Service
  - Objective: Rules/AB tests → Medusa prices.
  - Effort: M; RICE: 45; Owner: Commerce Eng.
  - Exit: 3 promo types live; uplift measured.
- Partner Onboarding Flows
  - Objective: Templates, Sanity partner pages, domain binding.
  - Effort: M; RICE: 60; Owner: Growth Eng.
  - Exit: Time-to-first-sale < 7 days.
- Collaboration & RFQ
  - Objective: A2A/A2B threads, quotes, approvals.
  - Effort: M; RICE: 42; Owner: B2B PM.
  - Exit: 50 active threads; quote→order rate tracked.

Q2–Q4 Themes
- Q2: Content plane (Sanity ISR/revalidation), Asset pipeline (signed URLs, transforms), SEO/blog autopublish.
- Q3: Campaigns/Calendar, CRM integrations, attribution.
- Q4: Manufacturing/workshop (WIP, BOM), advanced multi-tenant billing & roles, marketplace partnerships.

Security & Compliance
- PCI: Stripe-hosted fields or Medusa PCI-minimized flows; isolate keys; add Stripe webhooks signer validation.
- PII map: Auth emails, order addresses; encrypt at rest; restrict access; audit events.
- Rate limits: Per-tenant IP and token limits on auth/APIs.

SLOs (initial)
- API read P95 < 300ms, write P95 < 900ms, error rate < 1%.
- Uptime 99.9% for public endpoints.

Rollout Plan
- Canary feature flags by tenant; staged rollout per app; incident rollback scripts; migration playbooks.

## 7) Appendix
- API Inventory: See section 1 (file-cited list).
- DB schema deltas: Add `tenant_id`, `audit_log` table, agent state tables (`agent_runs`, `agent_tasks`).
- Sanity schema recs: Partner pages, PLP/PDP blocks, revalidation webhook to Next.
- Medusa plugin plan: Enable Redis modules when available, add order webhooks, pricing hooks.
- Observability plan: Pino + OTEL SDK, collectors, Grafana dashboards per app/service.
