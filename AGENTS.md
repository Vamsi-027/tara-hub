# Repository Guidelines

## Project Structure & Modules
- `app/`: Next.js App Router admin UI (entry pages, layouts).
- `frontend/`: Frontend workspaces (`admin`, `experiences/{fabric-store,store-guide}`, `shared`).
- `backend/`: Clean Architecture backend (`domain`, `application`, `infrastructure`, `interfaces`).
- `medusa/`: Medusa service (separate Node app with Jest tests).
- `public/`, `styles/`, `components/`: Shared assets and UI primitives.
- `deployment/`, `docs/`, `.env.example`: Deployment tooling and configuration examples.

## Build, Test, and Development
- `npm run dev`: Start all apps via Turbo in watch mode.
- `npm run dev:frontend` / `npm run dev:backend`: Focused dev for each area.
- `npm run dev:admin` | `dev:fabric-store` | `dev:store-guide`: Run specific frontend apps.
- `npm run dev:api` | `npm run dev:medusa`: Run API service or Medusa.
- DB: `npm run db:migrate` | `db:push` | `db:studio` (Drizzle, under `backend/infrastructure/database`).
- Tests: `npm test`, `npm run test:unit`; Medusa: `cd medusa && npm run test:unit`.
- Format/Lint: `npm run format`, `npm run lint`, `npm run type-check`.

## Architecture Overview
- Monorepo managed by Turborepo; shared tooling at repo root.
- Frontend: Next.js 15 App Router in `app/` plus workspaces under `frontend/` (React 19, Tailwind, shadcn/ui).
- Backend: Clean Architecture layers in `backend/` (DDD entities → use-cases → infra → interfaces).
- Medusa: Separate service in `medusa/` for commerce workflows; tested with Jest.
- Data: PostgreSQL via Drizzle ORM; caching with Vercel KV/Upstash; object storage via S3-compatible providers.
- Auth: JWT-based magic links; keep secrets in `.env.local` only.

## Coding Style & Naming
- TypeScript strict mode; 2‑space indentation; no semicolons preferred by Prettier.
- Linting: ESLint (Next config) + Prettier; fix before pushing.
- Aliases: `@/modules/*`, `@/core/*`, `@/shared/*` (see `tsconfig.json`).
- Naming: kebab-case directories; PascalCase React components; camelCase vars/functions.
- Next.js files: use `page.tsx`, `layout.tsx`, `route.ts`, colocate UI in `components/`.

## Testing Guidelines
- Frameworks: Vitest (+ Testing Library) for apps; Jest in `medusa/`.
- File names: `*.test.ts`/`*.test.tsx` colocated with source or in `__tests__/`.
- Add tests for new features and bug fixes; keep units fast and deterministic.
- For UI, test behavior and accessibility over implementation details.

## Commit & Pull Requests
- Commits: imperative mood, concise scope, e.g., `feat(admin): add bulk upload`.
- PRs must include: summary, linked issues (`Closes #123`), test plan/steps, screenshots for UI, and env notes if applicable.
- Ensure `npm run lint` and `npm run type-check` pass; run relevant tests.

## Security & Config
- Never commit secrets. Copy `.env.example` → `.env.local`; validate with `npm run env:validate`.
- Use `NEXT_PUBLIC_*` only for values safe to expose to the client.

## CI & Deployment
- CI: GitHub Actions at `.github/workflows/deploy.yml` runs on PRs and pushes to `main`/`production`.
- Targets: Admin, Fabric Store, Store Guide deployed to Vercel with Node 20 and cached installs.
- Local deploy: `npm run deploy` (preview) or `npm run deploy:prod -- --parallel --with-env`.
- Env management: `npm run env:manage` and `npm run env:validate`; project-specific IDs set as repo secrets (`VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_*`, `VERCEL_TOKEN`).
- Next.js build: `next.config.mjs` relaxes type/ESLint checks during builds; still fix locally before merging.
