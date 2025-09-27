# Agent Prompt: Medusa v2 Inventory Implementation (Multi‑Session, Test‑Driven)

You are an AI coding agent working in this repository to implement the inventory management plan for a Medusa.js v2 SMB e‑commerce (fabric store) backend. Follow this prompt precisely for multi‑session, test‑driven development with status tracking and logs.

## Project Context

- Monorepo with Medusa v2 service under `medusa/`.
- Plans:
  - Approach: `.claude/dev.sessions/medusa-inventory-management-approach.md`
  - Tasks (detailed): `.claude/dev.sessions/implementation-taks.md`
  - Tasks (authoritative status): `.claude/dev.sessions/tasks.md`
- Build/Test commands (root):
  - Run dev: `npm run dev:medusa`
  - Tests: `npm run test:unit`, `npm run test:integration`, `npm test`
  - Formatting/Lint: `npm run format`, `npm run lint`
- Medusa tests: Jest in `medusa/` (`medusa/jest.config.js`).
- Sandbox rules: Prefer `rg` over `grep`; read files in chunks ≤ 250 lines; use `apply_patch` for edits; avoid unrelated changes.

## Goals (Summarized)

- Implement fabric‑aware inventory: base‑unit conversions, increments/min_cut, ATS calculations, reservations→allocation lifecycle, multi‑location basics, manual adjustments with audit, low‑stock alerts, and RBAC.
- Expose admin endpoints for inventory health and adjustments; add background jobs and tests.

## Working Rules

1) Always read the approach and tasks docs before coding. Keep changes minimal and scoped.
2) For each session:
   - Select 1–3 tasks from `.claude/dev.sessions/tasks.md` in order of the suggested sequence in `implementation-taks.md`.
   - Create a session log at `.claude/dev.sessions/logs/session-YYYYMMDD-HHMM.md` with:
     - Objectives & chosen tasks
     - Relevant code scan notes
     - Implementation plan (brief)
     - Patch summary (files changed)
     - Tests added/updated and rationale
     - Validation results (commands + outputs summarized)
     - Tasks status updates (what changed in tasks.md)
     - Next session candidates
3) Implement code using `apply_patch` only. Do not commit or push.
4) Add/Update tests alongside the code (unit/integration as appropriate). Favor local, specific tests to your changes.
5) Validation before ending a session:
   - Run unit and integration tests relevant to your changes.
   - Run lints/formatters when needed.
   - If tests fail due to your changes, fix before proceeding.
6) Update `.claude/dev.sessions/tasks.md` statuses (mark [~] or [x]) with date and, if helpful, a short note.
7) If scope changes, update the approach doc and reference the change in the session log.

## Session Template

Use this structure in your session log:

---
Title: Session <N> — <Short Summary>
Date: YYYY‑MM‑DD HH:MM TZ

Objectives
- Task IDs: A1, A2, ...
- Expected deliverables: <code, tests, docs>

Repo Scan Notes
- <Files/areas explored>

Plan
- <Key steps>

Patches
- Files changed:
  - `<path>` — <short purpose>

Tests
- Added/updated:
  - `<path>` — <what it validates>

Validation
- Commands:
  - `npm run test:unit`
  - `npm run test:integration`
- Results: <summary and any failures fixed>

Tasks Status Updates
- `.claude/dev.sessions/tasks.md`: <which boxes updated>

Next Session
- Candidate tasks: <IDs>
---

## Suggested Session Sequence (from plan)

1) A1 (policy service), C1 (import fields) → 2) A2 (cart normalization) → 3) B1 (reservations) → 4) D1 (inventory health) → 5) D2/D3 (adjust + audit) → 6) F1 (alerts) → 7) E1 (transfers) → 8) G1/G2 (RBAC) → 9) B2 (sweeper) → 10) F2 (reports) → 11) H1/H2 (admin UI).

## Implementation Notes

- Store quantities internally as integer base units (e.g., quarter‑yards) and convert at edges.
- Prefer metadata and lightweight services over core model forks.
- Use Medusa v2 workflows for reservations, levels, and allocations; emit events for audit.
- Keep jobs idempotent; log decisions.

## Commands Cheat Sheet

- List files fast: `rg --files -n --hidden -g '!node_modules' medusa | sed -n '1,200p'`
- Search code: `rg -n "keyword" medusa/src | sed -n '1,200p'`
- Run unit tests: `npm run test:unit`
- Run integration tests: `npm run test:integration`
- Lint/format: `npm run lint && npm run format`

## Exit Criteria Per Session

- Relevant tests added and passing.
- Session log written with results.
- Tasks checklist updated with accurate status/date.

