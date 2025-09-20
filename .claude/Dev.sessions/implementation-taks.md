# Inventory Management – Implementation Tasks

Note: Use `.claude/dev.sessions/tasks.md` as the authoritative checklist to update status across sessions. This file holds the detailed breakdown; keep both in sync when adding new tasks.

This file breaks the approach into actionable tasks aligned with the current repo. Grouped by epics with file anchors and acceptance criteria.

## Epic A — Inventory Policy & Conversions

- A1: Create `inventory-policy.service.ts`
  - Path: `medusa/src/services/inventory-policy.service.ts`
  - Content: conversion (decimal↔base units), increment/min_cut validation, ATS computation `(stocked - reserved + incoming?)`, backorder policy decisions.
  - AC: Unit tests cover rounding modes, increment enforcement, min_cut violations, ATS calculations.

- A2: Wire cart validations
  - Path: `medusa/src/services/cart.service.ts` (or existing `cart.service.fixed.ts`)
  - Behavior: Normalize requested qty to valid increments; reject invalid; return normalized qty to caller.
  - AC: Integration test adds to cart with 2.3 yd where increment=0.25 → normalized per policy; rejects < min_cut.

## Epic B — Reservations & Allocation

- B1: Checkout reservation orchestration
  - Path: `medusa/src/services/reservation-orchestrator.service.ts`
  - Behavior: On checkout start, reserve quantities per location using inventory workflows; store reservation refs on cart/line.
  - AC: Reservation created on start; released on timeout/abandon; allocation on order placement deducts stock.

- B2: Stale reservation sweeper (job)
  - Path: `medusa/src/loaders/index.ts` (register), `medusa/src/services/inventory-alerts.service.ts` or separate `reservation-sweeper.service.ts`
  - AC: Job releases reservations older than TTL; idempotent.

## Epic C — Import Enhancements (Fabric Metadata)

- C1: Add columns and validation
  - Paths: `medusa/src/modules/product_import/column-mapper.ts`, `schemas.ts`, `business-rules.ts`
  - Columns: `uom`, `min_increment`, `min_cut`, `reorder_point`, `safety_stock`, `low_stock_threshold`, `backorder_policy`.
  - AC: Import accepts new columns; validations enforce increment/multiples; metadata set on variants/items.

- C2: Level creation from import
  - Behavior: Create inventory levels on provided quantity; default zero for managed variants without qty.
  - AC: Integration test creates variants + levels as expected.

## Epic D — Admin Inventory Endpoints & Audit

- D1: GET `/admin/inventory/health`
  - Paths: `medusa/src/interfaces/http/admin/inventory/health/route.ts`, `.../validators.ts`
  - Behavior: Returns ATS per variant/location with status (in_stock/low/out/backordered) and pagination/filtering.
  - AC: Endpoint returns expected shape; RBAC enforced (`inventory:read`).

- D2: POST `/admin/inventory/adjust`
  - Paths: `medusa/src/interfaces/http/admin/inventory/adjust/route.ts`
  - Behavior: Transactional manual adjustment with reason + note; writes audit record; emits `inventory.adjusted` event.
  - AC: Stock changes reflect; audit record present; RBAC enforced (`inventory:write`).

- D3: Inventory Audit Module
  - Paths: `medusa/src/modules/inventory_audit/index.ts`, `service.ts`, `migrations/*.sql`
  - Behavior: Append-only table storing adjustment records with fields per approach doc.
  - AC: Migration creates table; service writes records; basic list/query method exists.

## Epic E — Stock Transfers

- E1: Transfer service and endpoints
  - Paths: `medusa/src/services/stock-transfer.service.ts`, `medusa/src/interfaces/http/admin/inventory/transfers/*`
  - Behavior: Create transfer (decrement source, mark destination incoming), receive transfer (increment destination stocked), both audited.
  - AC: Transfer lifecycle works; split shipments toggle respected; RBAC (`inventory:transfer`).

## Epic F — Alerts & Reporting

- F1: Low‑stock scan job
  - Paths: `medusa/src/loaders/index.ts` registration; `medusa/src/services/inventory-alerts.service.ts`
  - Behavior: Daily scan thresholds; send email using Resend module.
  - AC: Email triggered when ATS <= threshold; idempotent; configurable time.

- F2: Reports endpoints (optional initial)
  - Paths: `medusa/src/interfaces/http/admin/inventory/reports/*`
  - Behavior: Low Stock / Out of Stock / Backordered lists; CSV export.
  - AC: Endpoints return correct aggregates; CSV downloads.

## Epic G — RBAC & Seeding

- G1: Define scopes and middleware
  - Paths: `medusa/src/interfaces/http/admin/_middleware.ts` (or per-route), shared auth utils.
  - Scopes: `inventory:read`, `inventory:write`, `inventory:transfer`.
  - AC: Requests without scope return 403; UI actions hidden for insufficient scopes.

- G2: Seed roles
  - Path: `medusa/src/scripts/seed.ts` (or a dedicated seed script)
  - Behavior: Create “Warehouse Manager” role with inventory scopes; ensure Admin keeps full.
  - AC: Seeded environment has roles/scopes; documentation updated.

## Epic H — Admin UI (Extension)

- H1: Inventory Health page
  - Behavior: Table consuming `/admin/inventory/health` with filters, sorting.
  - AC: Displays ATS/status; paginated; respects RBAC (hide actions without write scope).

- H2: Adjust modal
  - Behavior: Modal to submit adjustments with reason/note; shows result inline.
  - AC: Successful adjustments update row; audit link available.

## Testing & Quality Gates

- Unit: Policy conversions, ATS, rounding, RBAC guards.
- Integration: Import→levels, add-to-cart normalization, reservation→allocation, manual adjust + audit, transfer lifecycle.
- E2E smoke: Purchase flow with reservation; admin low‑stock dashboard renders.
- Lint/format: `npm run lint && npm run format` must pass.

## Suggested Sequence

1) A1, C1 → A2 → B1 → D1 → D2/D3 → F1 → E1 → G1/G2 → B2 → F2 → H1/H2.

## Notes

- Avoid schema forks for core inventory; use metadata. The audit table is append-only and isolated in a small module for minimal risk.
- Keep quantities in integer base units internally; expose decimals at the edges.
