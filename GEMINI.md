# GEMINI Project Analysis: Tara Hub

## Project Overview

This repository contains the source code for **Tara Hub**, a sophisticated multi-tenant fabric marketplace platform. It is a full-stack application built with a modern tech stack, featuring a clean architecture backend and a comprehensive admin dashboard.

**Key Technologies:**

*   **Frontend:** Next.js 15, React 19, TypeScript
*   **Backend:** Node.js with a Clean Architecture, Domain-Driven Design (DDD)
*   **Database:** PostgreSQL (using Neon) with Drizzle ORM
*   **Monorepo Management:** Turborepo
*   **UI:** Radix UI, shadcn/ui, and Tailwind CSS
*   **Authentication:** Custom JWT-based magic links
*   **Deployment:** Vercel

**Architecture:**

The project is structured as a monorepo, with distinct packages for different parts of the application:

*   `app/`: Main admin dashboard (Next.js App Router)
*   `backend/`: Clean Architecture backend with separate layers for domain, application, infrastructure, and interfaces.
*   `frontend/`: Contains the source code for the various frontend experiences.
*   `medusa/`: Contains a Medusa e-commerce backend.

The application is designed to be multi-tenant, with tenant resolution handled in the `middleware.ts` file based on the hostname.

## Building and Running

The project uses `npm` as the package manager and `turbo` for running scripts across the monorepo.

**Key Commands:**

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Run Development Servers:**
    ```bash
    npm run dev
    ```
    This will start all the development servers in the monorepo. You can also run individual services:
    *   `npm run dev:admin`: Admin dashboard
    *   `npm run dev:fabric-store`: Fabric store experience
    *   `npm run dev:store-guide`: Store guide experience
    *   `npm run dev:backend`: Backend services

*   **Build the Project:**
    ```bash
    npm run build
    ```

*   **Run Tests:**
    ```bash
    npm run test
    ```

*   **Database Commands:**
    *   `npm run db:migrate`: Run database migrations
    *   `npm run db:push`: Push database schema changes
    *   `npm run db:studio`: Open Drizzle Studio
    *   `npm run db:seed`: Seed the database with sample data

## Development Conventions

*   **Code Formatting:** The project uses `prettier` for code formatting. You can format the code by running:
    ```bash
    npm run format
    ```

*   **Linting:** The project uses `eslint` for linting. You can check for linting errors by running:
    ```bash
    npm run lint
    ```

*   **Environment Variables:** The project uses a `.env.example` file to define the required environment variables. Copy this file to `.env.local` and fill in the required values.

*   **Branching and Commits:** (TODO: Add information about branching strategy and commit message conventions if available in the project's contribution guidelines.)
