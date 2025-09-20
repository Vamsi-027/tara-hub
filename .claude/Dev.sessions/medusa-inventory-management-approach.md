# Inventory Management – Medusa v2 Implementation Approach (SMB E‑Commerce, Fabric Store)

This document proposes a production‑ready inventory management architecture and rollout plan for the current Medusa v2 service in this repository, tailored for an SMB fabric store (cut‑to‑length, yard‑based, multi‑location) while aligning with Medusa’s module architecture and the code already present in `medusa/`.

## 1) Current State (from repo scan)

- Core modules/flows in use: `@medusajs/medusa/core-flows` for regions, sales channels, stock locations, and `createInventoryLevelsWorkflow` (see `medusa/src/scripts/seed.ts`).
- Inventory levels are seeded to a fixed high quantity for all items (1,000,000) at one location (“European Warehouse”).
- Product import pipeline supports inventory columns and rules:
  - `manage_inventory`, `inventory_quantity` mapping and validation exist (`medusa/src/modules/product_import/*`).
  - Business rules contain inventory policies like negative-stock guardrails and low‑stock thresholds.
- No custom inventory service is defined yet; Medusa Admin is used, modules are configured via `medusa/medusa-config.ts`.
- Fabric context appears (e.g., `stock_unit: "yard"` and fabric seeding scripts), but no end‑to‑end cut/measurement or UOM conversion logic exists in services.

Implication: The building blocks (Inventory, Stock Locations, Workflows, Import) exist. What’s missing is the domain policy for fabric UOM and the glue across cart→order→fulfillment→returns, plus multi‑location allocation, stock transfers, low‑stock alerts, and admin ergonomics.

## 2) Goals & Non‑Goals

Goals
- Accurate stock by variant and location, with reservations and allocation across the order lifecycle.
- Fabric‑specific UOM, cut rules, rounding/increments, and “usable balance” calculations.
- Multi‑location readiness with simple priority allocation and stock transfer.
- Low‑stock thresholds, alerts, reorder points, and periodic reconciliation.
- Smooth path from current seed/import to live inventory operations.

Non‑Goals
- Warehouse‑grade WMS (bin/slotting, RF scanning) — keep SMB‑appropriate.
- Real‑time ERP integration initially; plan webhooks and extension points for later.

## 3) Data Model & Entities (Medusa v2 modules + metadata)

Use Medusa’s Inventory and Stock Location modules. Extend with metadata where needed; avoid schema forks unless clearly justified.

- Product Variant (existing):
  - Fields already supported via import: `manage_inventory`, initial `inventory_quantity`.
  - Add metadata for fabric cut rules and UOM: `uom` ("yard"), `min_increment` (e.g., 0.25 yard), `min_cut` (e.g., 1 yard), `rounding_mode` (up/down/nearest), `waste_pct` (optional), `backorder_policy` ("deny" | "allow_date" | "allow_any").
  - Optional: `conversion_base_unit` (e.g., store inventory in “quarter‑yards” as integer to avoid float issues) and `conversion_factor`.

- Inventory Item (per variant, implicit in v2):
  - Keep standard item creation via product workflows.
  - Metadata: `reorder_point`, `safety_stock`, `low_stock_threshold`, `lot_tracking` (false by default), `roll_length` (for roll‑based fabrics if needed), `unit_label` ("yd").

- Inventory Level (per location):
  - Use `stocked_quantity`, `reserved_quantity`, `incoming_quantity` where exposed.
  - Metadata per location: `buffer` (location‑specific safety), `count_last_at`, `count_confidence`.

- Stock Locations:
  - Start with one location; allow multiple later. Link to sales channels (already present in seed).

Storage convention: Represent physical stock in integer “base units” to avoid floating arithmetic (e.g., 1 yard = 4 base units if `min_increment=0.25`). Expose decimal UX, convert at the edges.

## 4) Core Workflows

4.1 Product Creation & Import
- Importer already maps `manage_inventory` and `inventory_quantity`.
- Extend import mapping to set fabric metadata (UOM, increments, cut rules) and thresholds:
  - Add optional CSV columns: `uom`, `min_increment`, `min_cut`, `reorder_point`, `safety_stock`, `low_stock_threshold`, `backorder_policy`.
  - In `product_import/business-rules.ts`, validate increments, negative stock, ceiling for max stock, and cross‑field consistency (e.g., `min_cut` multiple of `min_increment`).
- Inventory Item + Level creation:
  - After product/variant creation, ensure an inventory item exists and create levels via `createInventoryLevelsWorkflow` only where quantities provided.
  - If no quantity provided but `manage_inventory=true`, default to zero with clear warnings.

4.2 Availability Check (Storefront & Cart)
- On listing/product detail: compute “available to sell” per variant/location = `stocked - reserved`. If multi‑location, aggregate or pick the default location configured for the active sales channel.
- Enforce fabric increments in the cart add flow:
  - Round incoming quantity to nearest valid increment per variant rules.
  - Validate `min_cut`/`max_per_order` if configured.
- Return structured availability info for client UX (e.g., valid increments and current ATS).

4.3 Reservations (Cart/Checkout)
- Strategy: “Reserve on checkout start, extend on activity, release on timeout/failure.” For low volume SMB this avoids oversell without heavy contention.
- Create reservations when the cart transitions from idle to checkout (or on payment intent creation), using the inventory module’s reservation APIs/workflows. Store `reservation_id` on cart/line items.
- Keep reservations per location; default to primary location first. If not enough, optionally try next location (if enabled) and record chosen location for later allocation.
- Release reservations when: cart is abandoned, payment fails, or cart is cleared. Tie into order cancelled/expired events too.

4.4 Allocation & Deduction (Order Placement → Fulfillment)
- On order placement (or on payment capture if you keep capture separate), convert reservations to allocations and deduct from `stocked_quantity` atomically via Medusa workflows.
- Keep `reserved_quantity` accurate until allocation occurs; de‑reserve what’s not allocated.
- On fulfillment:
  - Confirm allocation from the selected stock location; support split fulfillment if multiple locations.
  - On shipment created, ensure final deduction is persisted (some stacks deduct at allocation; choose one point and keep it consistent).

4.5 Backorders / Preorders
- Variant metadata drives behavior:
  - `backorder_policy=deny`: reject if ATS < requested.
  - `allow_date`: allow if expected restock date provided; create negative reservation or create backorder line with `incoming_date`.
  - `allow_any`: permit negative, within a max negative bound defined in business rules.
- Display backorder messages in storefront; ensure admin visibility for inbound.

4.6 Returns, Exchanges, Cancellations
- On cancellation before fulfillment: release reservations. If already allocated, increase `stocked_quantity` back.
- On return received: restock according to policy (full restock unless damaged). If fabric is cut‑specific, consider “scrap” rules and partial wastage on restock.
- Exchanges: treat as return + new order with normal reservation/allocation.

4.7 Stock Transfers
- Provide an admin action to transfer stock between locations:
  - Decrement from source level (create transfer record), increment destination `incoming_quantity`, then promote to `stocked_quantity` when received.
  - Lock out oversell during in‑transit by not touching `stocked_quantity` at destination until receiving.

4.8 Cycle Counts & Adjustments
- Add an admin workflow to perform periodic counts:
  - Adjust `stocked_quantity`, record reason and auditor.
  - Update `count_last_at` and `count_confidence` metadata.

4.9 Manual Adjustments with Reasons (Audit Trail)
- Create a thin, append-only audit log for inventory changes with immutable records (no edits, only corrections via a new record):
  - Fields: `id`, `inventory_item_id`, `location_id`, `adjustment_type` ("manual_adjustment" | "cycle_count" | "damage" | "shrinkage" | "initial_stock" | "correction" | "return_restock" | "transfer_receive"), `delta` (or `from_quantity` + `to_quantity`), `actor_id`, `note`, `reference` (e.g., order/return/transfer id), `created_at`.
  - Implementation: lightweight custom module `inventory_audit` with a single table and service to write entries, or store as structured events if you prefer event-sourced reporting. Prefer the table for easy reporting/filters.
- Apply within any stock change workflow (manual adjust, transfer receive, return restock) and include reason + actor.

## 5) Fabric‑Specific Rules (UOM, Cut, Rounding)

- Increment enforcement: Any requested quantity Q is converted to base units BU and rounded per `rounding_mode` to nearest multiple of `min_increment`.
- Min cut: Reject if Q < `min_cut`.
- Waste factor: Optionally inflate reservation amount by `waste_pct` (SMB choice: default off, can be enabled for certain materials).
- Display logic: UI shows decimal yards; backend stores integers in base units.

Example conversion (stored at service boundary):
- `min_increment=0.25 yd`, set `base_unit = quarter_yard`.
- Input 2.3 yd → 9.2 BU → round per rule → 9 BU (2.25 yd) or 10 BU (2.5 yd).
- Validate ATS in BU, reserve BU, persist BU.

## 6) Multi‑Location Allocation Strategy

Start simple; evolve as needed.
- Default location per sales channel. Try to fulfill entirely from there.
- If insufficient and multi‑location allowed, fall back to next priority locations. Record chosen location per line item.
- Expose admin toggle to allow/disallow split shipments.
- Future: proximity‑based selection using shipping address country/region.

## 7) Low‑Stock Alerts, Reorder Points, Reporting

- Thresholds: `low_stock_threshold`, `reorder_point`, `safety_stock` per inventory item and/or per location.
- Scheduler:
  - Daily job scans levels, computes ATS and flags low stock.
  - Send notification via existing `resend_notification` module (see `medusa/src/modules/resend_notification`).
- Reports:
  - Simple endpoints for “Low Stock”, “Out of Stock”, and “Backordered” variants.
  - CSV export for purchasing.

## 8) Integration Points & Events

- Emit domain events at key transitions (reservation created/released, allocated, transferred, adjusted). Use Medusa’s event bus.
- Webhooks: Expose events for external systems (ERP, purchasing), but keep disabled until needed.

## 9) API & Service Surface (v2)

Prefer Medusa workflows where available; add thin services when business policy is fabric‑specific.

Service candidates (under `medusa/src/services/` or module):
- `inventory-policy.service.ts` — conversions, increments, min_cut validation, ATS computation.
- `reservation-orchestrator.service.ts` — cart/checkout hooks that create/release reservations using inventory module workflows.
- `stock-transfer.service.ts` — admin‑initiated transfers with in‑transit bookkeeping.
- `inventory-alerts.service.ts` — scheduled scans + notifications.

Admin API Endpoints (extend admin interfaces)
- `GET /admin/inventory/health`
  - Purpose: List ATS by variant/location with threshold status to power the “Inventory Health” dashboard.
  - Query params: `q` (search term), `location_id`, `status` (in_stock | low_stock | out_of_stock | backordered), `offset`, `limit`, `order` (e.g., `ats:asc`).
  - Response item: `{ variant_id, sku, title, location_id, location_name, ats, stocked, reserved, incoming, low_stock_threshold, status }`.
  - Authorization: `inventory:read` scope (see RBAC section).
- `POST /admin/inventory/adjust`
  - Purpose: Perform a manual stock adjustment with an audit record.
  - Body: `{ inventory_item_id, location_id, delta? , to_quantity?, reason, note?, reference? }` (either `delta` or `to_quantity`).
  - Behavior: Wrap in transaction; adjust level via inventory workflows; write audit log entry; emit event `inventory.adjusted`.
  - Authorization: `inventory:write` scope.

HTTP Interfaces (admin/store):
- Admin: endpoints for transfers, adjustments, thresholds, and reports.
- Store: read‑only availability per variant and valid increments; cart validation endpoint that returns rounded quantity and ATS by location.

## 10) Admin UX

- Use Medusa Admin for base inventory screens. Add custom fields via metadata panels for UOM, increments, thresholds.
- Provide simple admin pages (or actions) for stock transfer, adjustment, and low‑stock reports. Keep ergonomics SMB‑friendly (few clicks, defaults sensible).

Inventory Health Dashboard (from Gemini plan, adapted)
- Page: a filterable/sortable table consuming `GET /admin/inventory/health`.
- Columns: Product Title, Variant SKU, Location, ATS, Stocked, Reserved, Incoming, Low-Stock Threshold, Status.
- Actions: “Adjust Stock” opens a modal to submit `POST /admin/inventory/adjust` with reason + note; “Transfer” triggers stock transfer flow.
- RBAC: hide actions for users without `inventory:write`.

## 11) Background Jobs & Scheduling

- “Low stock scan” daily.
- “Reservation sweeper” to release stale carts.
- Optional: “Reconciliation” comparing `reserved` vs active carts/orders.

Use Medusa’s worker engine (Redis optional later). Keep jobs idempotent and logged.

## 12) Testing Strategy (Medusa v2, Jest)

- Unit:
  - Conversion and rounding functions (decimal ↔ base units).
  - ATS calculation (stocked/reserved/incoming) + thresholds.
  - Policy decisions (backorder, min_cut, increments).
- Integration:
  - Import → inventory items/levels created with metadata.
  - Cart add → quantity normalization and availability validation.
  - Checkout → reservations created; order placed → allocation/deduction; cancel/return flows restore correctly.
  - Stock transfer → in‑transit then received.
- E2E smoke: basic purchase flow with reservations enabled.

## 13) Rollout & Migration Plan

Phase 1: Foundations
- Implement conversion/policy services and wire into cart validations and checkout reservation flow.
- Update import to handle fabric metadata and thresholds.
- Replace seed’s “million units” with rational demo data per variant (keep a helper for tests).

Phase 2: Operations
- Add stock transfer + adjustment endpoints and admin actions.
- Add low‑stock scheduler + notifications.

Phase 3: Multi‑Location & Backorders
- Enable multi‑location allocation policy and split shipments toggle.
- Implement backorder policies and storefront messaging.

Phase 4: Hardening
- Add reconciliation job and dashboards/reports.
- Performance pass on availability queries; add missing indexes if needed.

## 14) Concrete Tasks (Repo‑aligned)

Shortlist of implementation PRs with file anchors:
1) Add inventory policy service
   - `medusa/src/services/inventory-policy.service.ts` (conversion, ATS, rules)
   - Unit tests under `medusa/__tests__/services/inventory-policy.service.test.ts`

2) Wire cart validation + reservations
   - Extend `medusa/src/services/cart.service.ts` (or the fixed variant) to call policy service on item add/update; round qty and reject invalid.
   - Add a dedicated “checkout start” handler to create reservations and store reservation refs on cart/line items.

3) Import enhancements
   - `medusa/src/modules/product_import/column-mapper.ts` and `schemas.ts`: add fabric columns; validate in `business-rules.ts`.
   - Post‑create hook: create inventory levels per provided quantity; set thresholds in metadata.

4) Admin endpoints (transfers, adjustments, reports)
   - `medusa/src/interfaces/http/admin/inventory/*` routes.
   - Services: `stock-transfer.service.ts`, `inventory-adjustment.service.ts`.
   - Add: `GET /admin/inventory/health` endpoint and table DTOs.
   - Add: `POST /admin/inventory/adjust` endpoint (transactional) + audit event.

5) Schedulers
   - Loader: register cron‐like jobs in `medusa/src/loaders/index.ts` (or a dedicated loader) for low‑stock scan and stale reservation sweep.
   - Service: `inventory-alerts.service.ts` to email via Resend module.

6) RBAC & Authorization
   - Define scopes: `inventory:read`, `inventory:write`, `inventory:transfer`.
   - Protect new admin routes with scope checks and existing admin auth middleware.
   - Assign scopes to roles (e.g., Admin, Warehouse Manager) and document in ENV/seed if necessary.

6) Seed/data
   - Update `medusa/src/scripts/seed*.ts` to set fabric metadata and realistic per‑variant levels.

## 15) Risks & Edge Cases

- Concurrency spikes: Reservations avoid oversell but increase lock contention if done at add‑to‑cart. Mitigation: reserve on checkout start; short TTL; idempotent retries.
- Float math: Always use integer base units internally.
- Returns of cut goods: Define policy (restock allowed/denied); expose clear admin control.
- Multi‑currency pricing vs inventory quantity is orthogonal; no coupling.
- Split shipments increase complexity; keep opt‑in.

## 16) Success Criteria

- Zero oversell under normal concurrency for managed variants.
- Accurate ATS surfaced in storefront and admin.
- Low‑stock alerts fire within 24h of threshold breach.
- Stock transfers and adjustments are auditable and idempotent.

## 17) RBAC & Permissions

- Define inventory-specific scopes to gate capabilities:
  - `inventory:read` — view inventory health, levels, and reports.
  - `inventory:write` — make manual adjustments, set thresholds.
  - `inventory:transfer` — initiate/receive stock transfers.
- Enforcement:
  - Use Medusa v2 admin auth + an authorization middleware to verify scopes on new admin endpoints.
  - In UI, hide buttons/actions for insufficient scopes; backend always enforces.
- Seeding & Roles:
  - Add seed script updates to create a “Warehouse Manager” role with `inventory:read`, `inventory:write`, `inventory:transfer`.
  - Keep “Admin” with full scopes by default; “Support” gets `inventory:read` only.

---

Appendix: Code Touchpoints Found
- `medusa/src/scripts/seed.ts`: `createInventoryLevelsWorkflow`, stock locations, linking to sales channels.
- `medusa/src/modules/product_import/*`: inventory mapping/validation hooks exist; extend here for fabric fields.
- `medusa/medusa-config.ts`: modules and admin configured; inventory module available via core.
