# GEMINI.md

## Project Overview

This is a production-ready Next.js 15 fabric marketplace with a MedusaJS v2 backend. The project is a monorepo managed with `turbo`.

The main application is an admin dashboard that allows for managing fabrics, products, and other content. The project also includes a customer-facing e-commerce store and a store guide.

The frontend is built with Next.js, React, and TypeScript, and it uses `radix-ui` and `tailwindcss` for the UI. The backend is built with a clean architecture and Domain-Driven Design principles. It uses PostgreSQL for the database, Redis for caching, and JWT for authentication.

## Building and Running

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
npm install
```

### Environment Variables

Copy the `.env.example` file to `.env.local` and fill in the required environment variables:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` - PostgreSQL connection
- `KV_REST_API_URL` - Redis/KV store
- `JWT_SECRET` - Authentication secret
- `RESEND_API_KEY` - Email service
- `R2_*` - Cloudflare R2 storage

### Development

To run the development server, use the following command:

```bash
npm run dev
```

This will start all the services in the monorepo. You can also run individual services:

- **Admin Dashboard:** `npm run dev:admin` (port 3000)
- **Fabric Store:** `npm run dev:fabric-store` (port 3006)
- **Store Guide:** `npm run dev:store-guide` (port 3007)
- **Backend:** `npm run dev:backend`

### Testing

To run the tests, use the following command:

```bash
npm test
```

## Development Conventions

- The project uses `eslint` for linting and `prettier` for formatting.
- The project uses a custom `useAuth` hook for authentication in the admin dashboard.
- The `middleware.ts` file handles authentication and multi-tenancy.
- The project uses a clean architecture and Domain-Driven Design principles for the backend.
