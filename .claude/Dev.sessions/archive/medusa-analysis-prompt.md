Master Prompt — Medusa.js Store Backend & Frontend Audit → Roadmap Generator

You are a senior Medusa.js engineer and product strategist. Analyze the codebase and produce a Medusa-focused implementation plan and roadmap grounded in code evidence. When you hypothesize, label it Working Theory.

Scope (strict)

Backend: Medusa.js core v2, services, repositories, modules, workflows, subscribers, plugins, REST endpoints (/store/*, /admin/*), event bus, background jobs.

Frontend: Storefront built on Next.js/React that consumes Medusa Store API (whether via medusa-js, custom fetchers, or GraphQL gateway if present).

Integrations: PostgreSQL, Redis (cache/event bus), Cloudflare R2 (S3-compatible file storage).

Exclude: Non-Medusa agent/orchestrator components unless they directly touch Medusa.

Tasks
1) Detect Medusa Version & Topology

Read package.json to detect Medusa major version and notable packages (@medusajs/medusa, @medusajs/medusa-cli, @medusajs/modules-*, legacy medusa-telemetry).

Output Version Profile: v1 vs v2, monolith vs modular, package layout, dev/prod start scripts.

2) Backend System Map (code-cited)

Produce a file-path-cited inventory covering:

Configuration: medusa-config.(ts|js) or v2 config—database URL, Redis URL/event bus, CORS, admin/store CORS, feature flags.

Plugins: payment (e.g., Stripe/Adyen), tax (TaxJar/Manual), file service (S3 driver → ensure R2 endpoint), analytics, search, notifications, fulfillment.

Core Domains: products, variants/options, prices/price lists, regions/currencies, sales channels, customer groups, inventory/stock locations, carts, orders, returns/exchanges/claims, discounts/promotions, gift cards.

APIs & Middlewares: store/admin routes, idempotency key middleware usage on write endpoints, authN/Z strategies (JWT/cookie, API keys).

Events & Jobs: subscribers, queues, retries, DLQ if present.

Migrations & Seeds: migration strategy and seeding.

Deliver a diagram (ASCII is fine) showing request flows for: PDP fetch → cart add → checkout → payment webhook → order creation → fulfillment; and media pipeline (upload → R2).

3) Storefront Audit (Next.js/React)

Routing mode (pages/ vs app/), data-fetching patterns (SSR/ISR/CSR), where medusa-js or REST fetchers are instantiated, cart state management, checkout flow, error boundaries.

Performance: hydration cost, over-fetching, cache usage, P95 for PDP/PLP/cart actions (Working Theory if metrics absent).

SEO/UX basics: structured data on PDP, canonical URLs, pagination/facets, image optimization using R2 URLs.

4) Capability Coverage vs Best Practices Matrix

Mark Supported / Partial / Missing with file citations:

Multi-currency/regions; sales channels for partner segmentation.

Tiered/B2B pricing via price lists; customer groups; tax-inclusive vs exclusive handling.

Inventory at stock locations with reservations.

Promotions/discounts (dynamic rules) and gift cards.

Payments: provider config, idempotent create/update, webhook verification, 3DS where applicable.

Fulfillment: provider(s), shipping options, rules, returns/claims flow.

Media/file service: Cloudflare R2 via S3 driver (endpoint, forcePathStyle, signed URLs).

Observability: structured logs, traces/metrics, error tracking, audit log.

Security: input validation, rate limits, CORS, secrets hygiene.

5) Gap Analysis (Impact/Effort/Evidence)

For each gap:

Gap: concise description.

Impact: revenue/GMV risk, conversion, ops cost, compliance.

Effort: S/M/L.

Evidence: file paths/lines.

Remediation: exact steps or code stubs.

6) Target Architecture (Incremental)

Propose an incremental Medusa-aligned design:

v1→v2 path (if on v1): module migration plan; or v2 hardening if already on v2.

Event Bus with Redis: retries, backoff, idempotency, DLQ policy.

Multi-tenant strategy using sales channels + partner scoping; authZ guards per channel; admin roles.

Pricing/Promotions service plan (price lists + campaign rules).

Inventory with stock locations & reservations; oversell prevention.

File service using R2 (S3-compatible) with signed URL workflow and background image optimization.

Observability: log structure, correlation IDs, P95 SLOs, error budgets.

7) Roadmap with Acceptance Criteria

Produce:

Top 10 High-Priority Items (table with Title, Objective, Evidence, Effort, RICE, Owner role, Exit Criteria, Metrics).

30/60/90-day plan and Q2–Q4 themes specific to Medusa and Storefront.

Risk Register (top 10 with mitigations).

Change Management: migration strategy, dark-launch/feature flags, rollout/rollback.

8) Deliverables (required)

Executive Summary (≤250 words).

Backend System Map & Storefront Audit (bulleted, code-cited).

Capability Matrix (Supported/Partial/Missing).

Top 10 Priorities table.

30/60/90 roadmap + Q2–Q4 themes.

Risk Register.

Appendix: API inventory, plugin config table, DB schema diffs, R2 file-service config, example idempotent handlers.

Machine-readable JSON array named priorities.json with keys: id,title,objective,evidence,effort,rice,metrics,exit_criteria.

Starter “Top 10” Medusa High-Priority Items (baseline to refine post-scan)

Cloudflare R2 File Service
Configure S3 driver for R2 (endpoint, credentials, forcePathStyle), signed URLs, background image optimization.
Exit: All media uploaded/read via R2, PDP/LCP image sizes optimized.

Idempotent Checkout & Payments
Enforce idempotency on cart, payment, order routes; verify webhooks; retries with backoff; DLQ.
Exit: Zero duplicate orders on retry; payment reconciliation job green for 7 days.

Sales Channels as Tenant Boundary
Model partners as sales channels; enforce channel scoping across catalog/cart/order; admin role guards.
Exit: Cross-channel data leakage tests pass; channel-specific catalogs live.

B2B Pricing via Price Lists & Customer Groups
Tiered pricing rules; attach to channels/groups; API coverage on PLP/PDP.
Exit: Group-based pricing visible and honored in cart/checkout.

Inventory with Stock Locations & Reservations
Prevent oversell; pick/pack flows; auto-release reservations on timeout/cancel.
Exit: Reservation leak tests pass; zero oversell in sandbox load test.

Promotions/Discounts Engine Hardening
Stacking rules, exclusions, schedule windows, affiliate codes.
Exit: Promotion matrix test suite green; no double-discount defects.

Fulfillment Provider Abstraction
Normalize shipping options/rates; returns/claims workflows cover exchanges.
Exit: Return→exchange success path verified; labels generated.

Observability v1
Structured logs, correlation IDs, error tracking; dashboards for cart add, checkout, webhook P95, error rate.
Exit: P95 add-to-cart < 150ms; checkout write P95 < 900ms for last 7 days.

Storefront Data-Fetching Discipline
SSR/ISR where appropriate; cache keys; avoid over-fetch; graceful errors; PDP schema markup.
Exit: Lighthouse Perf ≥ 90 on PDP/PLP; TTFB within SLO.

Security & Secrets Hygiene
CORS strict, input validation, rate limits; secret scanning; environment separation.
Exit: Baseline security scan clean; pen-test checklist items closed.

Output Format

Markdown report with all sections above.

A final JSON block named priorities.json containing the prioritized backlog.

Constraints

Cite specific files/lines for every claim.

Prefer incremental changes; avoid rewrites unless ROI is proven.
