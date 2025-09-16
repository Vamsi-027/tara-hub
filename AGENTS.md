# Repository Guidelines

## Project Structure & Module Organization
- `frontend/` – Next.js apps: `admin/`, `experiences/{fabric-store,store-guide}`, shared UI in `frontend/shared/`.
- `backend/` – Clean Architecture: `domain/`, `application/`, `infrastructure/`, `interfaces/`.
- `medusa/` – Medusa v2 service with its own scripts and tests.
- `app/` and `src/` – App Router entry, modules, and shared frontend code.
- `deployment/`, `.github/workflows/` – Vercel deployment scripts and CI.
- `docs/`, `scripts/`, `public/`, `styles/` – Docs, utilities, assets, Tailwind config.

## Build, Test, and Development Commands
- Run all dev processes: `npm run dev` (Turbo).
- Targeted dev: `npm run dev:frontend`, `npm run dev:backend`, `npm run dev:medusa`.
- Frontend apps: `npm run dev:admin`, `npm run dev:fabric-store`, `npm run dev:store-guide`.
- Build: `npm run build:frontend`, `npm run build:backend`; Medusa: `cd medusa && npm run build`.
- Database: `npm run db:migrate`, `npm run db:push`, `npm run db:studio` (Drizzle).
- Tests: `npm test`, `npm run test:unit`, `npm run test:integration`; Medusa uses Jest in `medusa/`.
- Formatting: `npm run format` (Prettier); lint: `npm run lint`.

## Coding Style & Naming Conventions
- TypeScript across repo; 2‑space indent; semicolons optional (Prettier enforces).
- React components: PascalCase; hooks/utilities: camelCase; files: kebab‑case except Next.js route files (`page.tsx`, `layout.tsx`).
- Prefer named exports; colocate tests and styles with features.
- Lint: `eslint-config-next`; Format: Prettier. Fix before committing: `npm run format && npm run lint`.

## Testing Guidelines
- Frameworks: Vitest for unit (frontend/backend), Testing Library for React, Jest in `medusa/`.
- Name tests `*.test.ts` or `*.test.tsx` near source (e.g., `component.test.tsx`).
- Aim to cover critical paths (auth, catalog, orders) and new features.
- Run full suite before PRs: `npm test` and Medusa tests as needed: `cd medusa && npm run test:unit`.

## Commit & Pull Request Guidelines
- Commit style follows Conventional Commits (seen in history): `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `deploy:`.
- PRs: clear description, linked issues, steps to test, screenshots for UI changes, and environment notes.
- Keep PRs focused and small; ensure CI passes.

## Security & Configuration
- Copy envs from `.env.example`; keep secrets in `.env.local` (never commit). See `ENVIRONMENT_VARIABLES.md`.
- Validate DB URLs and service endpoints before deploying. Vercel/Railway config lives under `deployment/`.

## Agent-Specific Notes
- This file applies repo‑wide. See `CLAUDE.md` for AI assistant behavior and boundaries.
