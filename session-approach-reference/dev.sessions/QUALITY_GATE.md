# Quality Gate: Production-Grade, Bug-Free Standards

Purpose: Enforce consistent, production-quality outputs per session and milestone.

Non‑negotiables (each session)
- Tests first: unit/API/component/hook specs added before implementation.
- All tests green locally (where runnable) with coverage ≥ 70% for new/changed files.
- No new TypeScript errors in changed files; strict types (no `any` unless justified).
- Security: Mutations require CSRF + origin/referrer checks; permission guard; input validation with Zod.
- Idempotency: All mutating endpoints accept an idempotency key or protect against duplicates.
- Pagination: Use stable cursors (createdAt,id) and handle invalid/expired cursors.
- Transactions: Multi-table writes wrapped in `withTransaction` with retry/backoff.
- Server-Timing: APIs include `Server-Timing` where applicable.
- Logging: Failure paths log actionable context; no secrets logged.
- Accessibility: Interactive components have labels, focus states, and keyboard interaction.
- Performance: Respect SLAs (API p95 ≤ 500ms warm, p99 ≤ 1000ms cold; dashboard FCP ≈ 2000ms).

Release checklist (per milestone)
- Threat model review of new endpoints and UI paths.
- Rate limiting story documented for high-risk endpoints (mentions, search).
- Feature flags in place and documented; cohort rollout plan updated.
- Migrations generated, reviewed, and applied to target DB (where applicable).
- Observability hooks added (basic metrics + logs) and dashboards updated.

