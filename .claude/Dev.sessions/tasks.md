# Inventory Management – Tasks Checklist

Authoritative checklist for session-by-session progress. Update statuses and dates in this file during each session. See `.claude/dev.sessions/implementation-taks.md` for detailed descriptions and acceptance criteria.

Legend: [ ] Not Started · [~] In Progress · [x] Done

## Epic A — Inventory Policy & Conversions

- [ ] A1: Create `inventory-policy.service.ts`
  - Status: [ ]  Owner:  Date:
- [ ] A2: Wire cart validations in `cart.service.ts`/`cart.service.fixed.ts`
  - Status: [ ]  Owner:  Date:

## Epic B — Reservations & Allocation

- [ ] B1: Checkout reservation orchestration service
  - Status: [ ]  Owner:  Date:
- [ ] B2: Stale reservation sweeper job
  - Status: [ ]  Owner:  Date:

## Epic C — Import Enhancements (Fabric Metadata)

- [ ] C1: Add columns + validation in importer
  - Status: [ ]  Owner:  Date:
- [ ] C2: Level creation from import defaults
  - Status: [ ]  Owner:  Date:

## Epic D — Admin Inventory Endpoints & Audit

- [ ] D1: GET `/admin/inventory/health`
  - Status: [ ]  Owner:  Date:
- [ ] D2: POST `/admin/inventory/adjust`
  - Status: [ ]  Owner:  Date:
- [ ] D3: Inventory audit module + migrations
  - Status: [ ]  Owner:  Date:

## Epic E — Stock Transfers

- [ ] E1: Transfer service + endpoints
  - Status: [ ]  Owner:  Date:

## Epic F — Alerts & Reporting

- [ ] F1: Low-stock scan job + notifications
  - Status: [ ]  Owner:  Date:
- [ ] F2: Reports endpoints + CSV export
  - Status: [ ]  Owner:  Date:

## Epic G — RBAC & Seeding

- [ ] G1: Define scopes + route middleware
  - Status: [ ]  Owner:  Date:
- [ ] G2: Seed roles/scopes (Warehouse Manager)
  - Status: [ ]  Owner:  Date:

## Epic H — Admin UI (Extension)

- [ ] H1: Inventory Health page (admin)
  - Status: [ ]  Owner:  Date:
- [ ] H2: Adjust modal + audit link
  - Status: [ ]  Owner:  Date:

## Testing & Quality Gates

- [ ] Unit tests added for A1 (policy conversions & ATS)
  - Status: [ ]  Owner:  Date:
- [ ] Integration tests for cart normalization and reservations
  - Status: [ ]  Owner:  Date:
- [ ] Admin endpoints tests (D1, D2) with RBAC guards
  - Status: [ ]  Owner:  Date:
- [ ] E2E smoke for purchase + reservation
  - Status: [ ]  Owner:  Date:

