# AI Coding Prompts: TDD‑First Hybrid Plan (Context‑Engineered)

Use these prompts with your AI coding tool to implement the admin enhancements via sessions. Each session is TDD‑first: write failing tests, implement to green, then refactor. Prompts include context engineering: product goals, repository constraints, security/perf non‑negotiables, and explicit outputs.

Execution protocol (per session)
- Read prior context: if `dev.logs/session_<N-1>.log` exists, load it before coding.
- Keep scope to this session only; do not run future sessions.
- On completion, update `dev.sessions/tasks.md` checkboxes for tasks finished in this session.
- Create `dev.logs/session_<N>.log` summarizing objective, changes, tests, and follow‑ups (use `dev.sessions/session-log-template.md`).
- Run tests from repo root: `npx vitest --config app/admin/vitest.config.js`; include pass/fail summary in the log. If test execution isn’t available, validate syntax and note the limitation in the log.
- Reset per‑test security windows (e.g., rate limiter) when needed to keep tests deterministic.

---

## Global Context (Read First)

- You are an expert TypeScript/Next.js engineer working on a multi‑tenant SaaS admin app.
- Tech stack: Next.js App Router (TS), Tailwind, Drizzle ORM (Postgres), Vitest + Testing Library (happy-dom), lucide-react.
- Repo structure and conventions:
  - App: `app/admin/*` (pages/layouts), API routes in `app/api/*`.
  - Core DB: `src/core/database/schemas/*`, client at `@/core/database/drizzle/client`.
  - Modules: `src/modules/*` (services, rules), Shared: `src/shared/{components,hooks,utils}`.
  - Tests colocated under `src/**/*.{test,spec}.{ts,tsx}`; setup at `src/tests/setup.ts`.
  - Aliases: `@/core`, `@/modules`, `@/shared` from repo config.
- Coding standards: TypeScript strict, 2‑space indent, PascalCase components/hooks, kebab‑case files, Tailwind utility‑first, named exports (except Next pages/layouts), minimal diff changes.
- Constraints (Non‑negotiable):
  - All API handlers must wrap with `withSecurity` (JWT auth, roles, CSRF for mutations, per‑user rate limiting).
  - In‑memory repositories allowed only in `NODE_ENV=test`; production must use Drizzle repos.
  - Tenant isolation required on every DB query.
  - Use Drizzle transactions for multi‑table ops; batch updates where applicable.
  - Stable cursor pagination: `(created_at, id)` with SHA‑256 checksum and TTL (1h in prod).
  - Notification actions: allowlisted only; add idempotency where needed.
  - No Redis/BullMQ, no Socket.io. Polling now; short‑burst SSE (≤25s) later.
  - Realistic SLAs: API p95 ≤ 500ms warm, p99 ≤ 1000ms cold. Add Server‑Timing segments (db, serialize).
- TDD policy: For each session, write failing unit/API/component/hook tests first, then implement. Maintain ≥70% coverage for new modules.
- Rollout: Feature flags, cohort migration, and “switch back” for dashboard. Prefer small, verifiable increments.

Output rules for the AI coding tool
- Produce file patches only; no prose output beyond brief rationale where requested by the tool.
- Keep changes scoped to the session; do not introduce third‑party services or infrastructure.
- Maintain repository aliases and folder structure. Add tests next to new modules/components.
- When adding schemas, update `drizzle.config.ts` and generate SQL via project scripts (documented steps ok).
 - Always include in the patch: (a) code changes, (b) `dev.sessions/tasks.md` updates, and (c) `dev.logs/session_<N>.log` for this session.
- Respect the quality gates in `dev.sessions/QUALITY_GATE.md`.

Status: Sessions 1–7 completed and validated; prompts below for Sessions 8+ incorporate security hardening and test patterns.

Prompt template (reuse per session)
- System: You are an expert TS/Next engineer. Work TDD‑first. Keep changes minimal and aligned to repo conventions. Follow constraints above exactly.
- Goals: [what to deliver this session]
- Context to load: [files/dirs to review or rely on]
- Tasks:
  1) Tests: [unit/API/component/hook]
  2) Implementation: [files to add/update]
  3) Wiring: [integration points]
  4) Security/Perf: [checks, headers]
- Acceptance criteria: [what tests assert and UX behavior]
- Output: Provide a single patch with changed files. No extraneous commentary.
- Ask‑backs (if needed): [strict, minimal questions]. Otherwise proceed.

---

## Session 1: Test Scaffolding + Helpers
- Goals: Establish test fixtures, per‑test DB rollback, and utilities for TDD.
- Context: `src/tests/setup.ts`, `vitest.config.*`, aliases; Drizzle client.
- Tasks:
  1) Tests: Add a sample passing spec proving rollback helper works.
  2) Impl: Add `src/tests/factories/{user,team,tenant}.ts`, `src/tests/db-helpers.ts` (withTransaction, beforeEach/afterEach rollback), `src/tests/utils.ts`.
  3) Wiring: Ensure setup includes happy‑dom, router/env mocks; export factory builders.
  4) Perf/Sec: None.
- Acceptance: `npm run test:unit` runs; sample spec passes; factories create valid records.
- Output: Single patch adding the above files and minimal sample tests, plus `dev.logs/session_1.log` and updated `dev.sessions/tasks.md` for items completed.

## Session 2: Notifications Schemas (+ Preferences)
- Goals: Add Drizzle schemas for `notifications` and `notification_preferences` with `actions` JSON.
- Context: Drizzle config and schema folder.
- Tasks:
  1) Tests: Unit tests asserting insert/select defaults, indexes present, `actions` JSON shape.
  2) Impl: `src/core/database/schemas/notification.schema.ts`; update `drizzle.config.ts`.
  3) Wiring: N/A.
  4) Perf/Sec: Created_at default; indexes `(user_id, created_at)`.
- Acceptance: Tests pass; migration generates clean SQL.
- Output: Patch with schema + tests, plus `dev.logs/session_2.log` and updated tasks.

## Session 3: Stable Cursor + Notification Service
- Goals: Implement stable cursor utility and `notifications` service.
- Context: `src/shared/utils` and `src/modules/notifications`.
- Tasks:
  1) Tests: `cursor` tests (compound, checksum, invalidation), service tests for `listForUser`, `markRead`, `dismiss`, `executeAction`.
  2) Impl: `src/shared/utils/cursor.ts`, `src/modules/notifications/service.ts` (idempotent markRead, allowlist actions).
  3) Wiring: None yet.
  4) Perf/Sec: Server‑Timing headers planned at API layer; ensure stable ordering and cursor checksum.
 - After: Run tests; update tasks; write `dev.logs/session_3.log` with test results and any coverage metrics.
- Acceptance: Pagination stable under concurrent inserts; unknown action rejected.
- Output: Patch with utils, service, and tests, plus `dev.logs/session_3.log` and updated tasks.

## Session 4: Secure Action Registry + Notification APIs
- Goals: Add secure server‑side action registry and App Router handlers.
- Context: `app/api/notifications/*`, `src/shared/utils/csrf.ts`.
- Tasks:
  1) Tests: API tests for `GET /api/notifications`, `POST /read`, `POST /:id/action`, `DELETE /:id` with CSRF/origin checks.
  2) Impl: Routes with multi‑tenant checks, server‑timing, action registry (enum/allowlist), CSRF helper.
  3) Wiring: None.
  4) Perf/Sec: p95 target ≤ 500ms warm; enforce CSRF + origin; add Server‑Timing header.
 - After: Run tests; update tasks; write `dev.logs/session_4.log` with results.
- Acceptance: 403 on missing CSRF, 400 on unknown action, 200 when valid; cursors function.
- Output: Patch with route files, utils, tests, plus `dev.logs/session_4.log` and updated tasks.

## Session 5: NotificationBell + Panel (Polling)
- Goals: Build UI and hook for notifications with polling + mark‑all‑read.
- Context: `app/admin/layout.tsx`, `@/components/ui/*`.
- Tasks:
  1) Tests: Component tests for badge updates, list render, mark‑all‑read, pagination.
  2) Impl: `src/shared/hooks/use-notifications.ts`, `src/shared/components/notification-bell.tsx`, `notification-panel.tsx`.
  3) Wiring: Add bell to `app/admin/layout.tsx` header.
  4) Perf/Sec: No inline HTML injection; sanitize renders; ensure accessibility (labels, focus management).
 - After: Run tests; update tasks; write `dev.logs/session_5.log`.
- Acceptance: Tests pass; no console errors; types clean.
- Output: Patch with hook, components, tests, layout change, plus `dev.logs/session_5.log` and updated tasks.

## Session 6: Comments Schemas + Service + API (Transactions)
- Goals: Add comments with @mentions using transactions and enqueue fan‑out job (outbox).
- Context: `app/api/comments/*`, schemas folder.
- Tasks:
  1) Tests: Unit/API tests for create/list/edit/delete, mentions, transaction rollback, permission checks; concurrency test.
  2) Impl: `comment_threads`, `comments`, `comment_mentions` schemas; `src/modules/comments/service.ts` with `withTransaction` and enqueue outbox job.
  3) Wiring: Routes under `/api/comments` and `/api/comments/mentions/suggest`.
  4) Perf/Sec: Multi‑tenant checks; inputs validated (Zod); transactions with retry/backoff; idempotency for creates.
 - After: Run tests; update tasks; write `dev.logs/session_6.log`.
- Acceptance: No orphan rows on failures; ≥8/10 parallel creates succeed.
- Output: Patch with schemas, service, routes, tests, plus `dev.logs/session_6.log` and updated tasks.

## Session 7: Outbox Fan‑out + Processor
- Goals: Implement `fan_out_jobs` schema and batch processor for mention notifications.
- Context: `src/modules/notifications/fanout-processor.ts` and schema.
- Tasks:
  1) Tests: Job lifecycle (pending→processing→completed/failed), idempotency key, batch size.
  2) Impl: `fan_out_jobs` schema; processor that reads preferences in bulk and inserts notifications in batches.
  3) Wiring: Cron-friendly entry point (script/route) guarded by feature flag.
  4) Perf/Sec: Backoff on failures; attempts capped; metrics collected; idempotency via keys.
 - After: Run tests; update tasks; write `dev.logs/session_7.log`.
- Acceptance: Large mention sets complete within SLA; retries honored.
- Output: Patch with schema, processor, tests, plus `dev.logs/session_7.log` and updated tasks.

## Session 8: Drizzle Repositories + Transactions + Tenant Isolation
- Goals: Implement Postgres repos for notifications and comments with tenant/user scoping, batch operations, and transactions; swap routes to Drizzle.
- Context: Drizzle client `@/core/database/drizzle/client`; schemas under `src/core/database/schemas/*`; existing route handlers using `withSecurity`.
- Tasks:
  1) Tests: Repo unit tests for batch mark‑read/dismiss; comment create + mentions + outbox enqueue in one transaction; tenant isolation; pagination stable.
  2) Impl: `src/modules/notifications/repo.drizzle.ts`, `src/modules/comments/repo.drizzle.ts` with Drizzle transactions and batch updates.
  3) Wiring: Replace in‑memory repos in API routes with Drizzle repos (guarded by env flag for tests).
  4) Perf/Sec: Add Server‑Timing segments: `db`, `serialize`; optional 5s per‑user cache for list/count.
- Acceptance: Routes use Drizzle repos; tests green; queries scoped by tenant; batch ops transactional; no regressions.
- Output: Patch with repos, route wiring, tests, plus `dev.logs/session_8.log` and updated tasks.
- Goals: `/admin/messages` hub and reusable `<CommentsPanel>` integrated on one entity page.
- Context: `app/admin/messages/page.tsx`, shared components.
- Tasks:
  1) Tests: CommentsPanel (CRUD, mentions, optimistic), Messages filters (Assigned to me, Mentions).
  2) Impl: `src/shared/components/comments-panel.tsx`, route page, minimal styles.
  3) Wiring: Use panel on posts/fabrics detail page.
  4) Perf/Sec: Avoid heavy client state; fetch on visibility; accessibility labels; keyboard nav.
 - After: Run tests; update tasks; write `dev.logs/session_8.log`.
- Acceptance: Tests pass; hub lists threads; actions work.
- Output: Patch with components, page, tests, plus `dev.logs/session_8.log` and updated tasks.

## Session 9: Simple RBAC Engine (Swappable) + Enforcement
- Goals: Introduce `PolicyEngine` interface and `SimpleRBACEngine` and inject into services; enforce roles in routes.
- Context: SECURITY_REVIEW_PRAGMATIC.md policy guidance; `withSecurity` supports `roles`.
- Tasks:
  1) Tests: Allow/deny by role across actions; cross‑tenant denial; service integration.
  2) Impl: `src/modules/auth/rbac.ts`; wire into services; update routes to pass `roles`.
  3) Perf/Sec: Keep checks fast; add minimal metrics for denies.
- Acceptance: Role checks enforced consistently; tests green.
- Output: Patch with RBAC engine, wiring, tests, plus `dev.logs/session_9.log` and updated tasks.
- Goals: Define rule contracts, scoring, ranking, overrides, and explanations.
- Context: `src/modules/dashboard/rules.ts`, `service.ts`.
- Tasks:
  1) Tests: Prioritization (urgent deadlines > stale drafts), overrides, conflict resolution, cap, explanations.
  2) Impl: Zod‑validated rules; scoring helpers; service that returns `next_best_actions[]` with scores + reasons.
  3) Wiring: N/A.
  4) Perf/Sec: Pure functions; test coverage high; guard against rule explosions and caps.
 - After: Run tests; update tasks; write `dev.logs/session_9.log`.
- Acceptance: Deterministic ranking and explanations are stable.
- Output: Patch with rules/service/tests, plus `dev.logs/session_9.log` and updated tasks.

## Session 10: Dashboard API + Widgets
- Goals: `/api/dashboard` aggregator and `NextBestActions` + `QuickActions` widgets.
- Context: App Router; shared hooks/components.
- Tasks:
  1) Tests: API responses; widgets render; role‑aware quick actions.
  2) Impl: Route `app/api/dashboard/route.ts`, hook `use-dashboard.ts`, components `next-best-actions.tsx`, `quick-actions.tsx`; server‑timing header.
  3) Wiring: Replace static `app/admin/page.tsx` sections with widgets.
  4) Perf/Sec: Cache cheap joins; respect SLAs; include Server‑Timing header.
 - After: Run tests; update tasks; write `dev.logs/session_10.log`.
- Acceptance: Tests pass; FCP measured; stable UI.
- Output: Patch with route, hook, widgets, tests, page update, plus `dev.logs/session_10.log` and updated tasks.

## Session 11: Widget Registry + Layout Persistence
- Goals: Type‑safe widget registry (Zod), permission/feature checks, `dashboard_layouts` + GET/PUT APIs.
- Context: `src/shared/components/dashboard-widgets-registry.ts`.
- Tasks:
  1) Tests: Invalid configs rejected; permission/feature checks enforced; layout save/load.
  2) Impl: Schema `dashboard_layouts`; APIs `/api/dashboard/layout` GET/PUT; registry utility.
  3) Wiring: Dashboard loads saved layout; static slot reorder only (no drag‑drop).
  4) Perf/Sec: Validate user ownership; tenant checks; Zod validate configs.
 - After: Run tests; update tasks; write `dev.logs/session_11.log`.
- Acceptance: Only allowed widgets render; layout persists.
- Output: Patch with schema, APIs, registry, tests, plus `dev.logs/session_11.log` and updated tasks.

## Session 12: Activity Schema + Feed
- Goals: Activity table/service/API and compact dashboard widget.
- Context: `src/modules/activity/*`, `app/api/activity/*`.
- Tasks:
  1) Tests: Record/list with filters; stable cursor; fan‑out to notifications via outbox.
  2) Impl: Schema, service, route; hook `use-activity.ts`; component `activity-feed.tsx`.
  3) Wiring: Dashboard compact widget.
  4) Perf/Sec: Indexes; SLAs respected; stable cursor tests.
 - After: Run tests; update tasks; write `dev.logs/session_12.log`.
- Acceptance: Infinite scroll smooth; deep links work.
- Output: Patch with schema, service, route, hook, component, tests, plus `dev.logs/session_12.log` and updated tasks.

## Session 13: Reminders + Calendar Integration + Cron
- Goals: Reminders CRUD, snooze/done, ICS export; cron nudge job.
- Context: `app/api/reminders/*`, calendar module.
- Tasks:
  1) Tests: CRUD, snooze/done, ICS export; boundary test (1000 reminders within 60s via cron).
  2) Impl: Schema, APIs, cron handler; calendar chips/actions in UI.
  3) Wiring: Notification center integration for due reminders.
  4) Perf/Sec: Idempotent jobs; feature flag for cron; performance boundary tests.
 - After: Run tests; update tasks; write `dev.logs/session_13.log`.
- Acceptance: Jobs deliver within SLA; UI/notifications accurate.
- Output: Patch with schema, APIs, cron, UI, tests, plus `dev.logs/session_13.log` and updated tasks.

## Session 14: SSE Endpoints + SmartEventSource
- Goals: Short‑burst SSE (≤25s) with reconnect event and polling fallback; client wrapper.
- Context: `app/api/notifications/stream`, `app/api/activity/stream`, `src/shared/utils/smart-event-source.ts`.
- Tasks:
  1) Tests: Hook tests for connect/disconnect/backoff/fallback; API handshake/auth tests.
  2) Impl: SSE endpoints emitting `event: reconnect` before 25s; SmartEventSource class.
  3) Wiring: Hooks use SmartEventSource when flag enabled.
  4) Perf/Sec: Respect Vercel 30s limit; fallback after N failures; no memory leaks.
 - After: Run tests; update tasks; write `dev.logs/session_14.log`.
- Acceptance: Fallback engages after repeated failures; reconnection smooth; tests pass.
- Output: Patch with endpoints, wrapper, tests, plus `dev.logs/session_14.log` and updated tasks.

## Session 15: Preferences UI + Security Hardening
- Goals: Preferences UI; CSRF/origin enforcement; idempotency; server‑timing counters.
- Context: `/admin/settings/notifications`, `src/shared/utils/csrf.ts`.
- Tasks:
  1) Tests: Preferences GET/PUT; UI interaction; CSRF/origin checks on mutating endpoints; idempotency.
  2) Impl: Preferences page + route, utilities.
  3) Wiring: Link from header/settings.
  4) Perf/Sec: Server‑Timing headers and counters; CSRF/origin/idempotency enforced.
 - After: Run tests; update tasks; write `dev.logs/session_15.log`.
- Acceptance: Security checks enforced; preferences persist; timing recorded.
- Output: Patch with page, APIs, utils, tests, plus `dev.logs/session_15.log` and updated tasks.

## Session 16: Optional ML Insights (Post‑Week 8, Shadow Mode)
- Goals: Non‑blocking insights API + widget, behind a feature flag, shadow‑comparing to heuristics.
- Context: `src/modules/insights/service.ts`, `app/api/insights/route.ts`.
- Tasks:
  1) Tests: Provider interface, ranking/thresholding, feature flag gating, dashboard render.
  2) Impl: Minimal provider + service; read‑only route; insights widget region on dashboard.
  3) Wiring: Only show when flag enabled; log shadow comparisons.
  4) Perf/Sec: No impact on SLAs; privacy reviewed.
- Acceptance: Insights appear/hide by flag; logs capture comparisons; tests pass.
- Output: Patch with service, route, widget area, tests, plus `dev.logs/session_16.log` and updated tasks.

---

Tips for tool usage
- If a session requires reading multiple files, scan only what’s relevant (keep output < 250 lines per file).
- Prefer small, iterative patches per session. Do not batch unrelated features.
- If environment or schema array needs updates (`drizzle.config.ts`), include that in the same patch.
- For APIs, always return consistent JSON envelopes and include `Server-Timing` where feasible.
