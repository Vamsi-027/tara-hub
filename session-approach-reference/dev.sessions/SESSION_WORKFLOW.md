# Session Execution Workflow

Goal: Run each AI coding session independently, with clear handoffs. After each session:
- Update `dev.sessions/tasks.md` to mark completed items.
- Create a `dev.logs/session_<id>.log` summarizing the work. The next session must read the last log as context.

Step‑by‑step
1) Select session N from `dev.sessions/ai_coding_prompts.md`.
2) Before coding, load context:
   - `dev.logs/session_<N-1>.log` (if exists)
   - Relevant files listed in that log under “Files Changed” and any notes.
3) Execute Session N prompt (TDD‑first):
   - Write failing tests, implement to green, refactor.
   - Keep changes scoped to this session.
4) Run tests:
   - From repo root: `npx vitest --config app/admin/vitest.config.js`.
   - If tests cannot run in this environment, record this in the session log and ensure tests are syntactically valid.
5) Update tasks:
   - Edit `dev.sessions/tasks.md` and mark the relevant checkboxes for Session N as completed.
6) Create a log:
   - Write `dev.logs/session_<N>.log` using the template (date, objective, changes, tests, follow‑ups).
7) Commit or hand off patch as appropriate for your workflow.

Log format
- Use `dev.sessions/session-log-template.md` as a guide.
- Keep logs concise and factual; list file paths and key decisions.

Notes
- Do NOT pre‑execute future sessions.
- If a task spans multiple sessions, reference the partial progress in the log and leave the checkbox unchecked until done.
- If a change affects acceptance criteria/KPIs, include measurements in the log.
 - Always consult `dev.sessions/QUALITY_GATE.md` to verify gates are met before closing a session.
