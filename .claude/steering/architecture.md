# Architecture Steering Document

## Overview

Tara Hub is a modern multi-experience platform built with Next.js 15, featuring a clean separation between admin functionality and customer-facing experiences. The architecture follows a **Turborepo-powered monorepo pattern** with **NPM Workspaces** for optimal dependency management, enabling independent deployable experiences that share common resources through dedicated packages while maintaining complete isolation.

## Current Implementation

### Technology Stack

**Frontend Framework**
- Next.js 15 with App Router architecture
- React 19 with modern hooks and patterns
- TypeScript for type safety across the entire application

**Styling & UI**
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible component foundations
- Shadcn/ui component library for consistent design system
- Lucide React for iconography

**Authentication & Authorization**
- NextAuth.js for authentication management
- Google OAuth provider for admin authentication
- Email provider for user authentication
- Role-based access control (admin/user roles)

**Database & ORM**
- Drizzle ORM for type-safe database operations
- PostgreSQL via Neon Database for production
- Database connection with graceful fallback handling

**State Management**
- Server-side state via React Server Components
- Client-side state with React hooks (useState, useEffect)
- Session management through NextAuth.js providers

**Build & Development Tools**
- Turborepo for optimized builds with caching and parallel execution
- NPM Workspaces for dependency management and package sharing
- Shared packages architecture (@tara-hub/ui, @tara-hub/lib)

**Deployment & Infrastructure**
- Vercel platform for hosting and deployment
- Independent Vercel projects per experience
- Automatic deployments from GitHub main branch
- Edge runtime optimization where applicable
- Smart deployment triggers based on changed paths

### Application Structure

```
tara-hub/
├── app/                        # Admin Dashboard Application
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx               # Redirects to /admin
│   ├── admin/                 # Admin functionality
│   │   ├── blog/              # Blog management
│   │   ├── fabrics/           # Fabric inventory management
│   │   ├── products/          # Product management
│   │   └── page.tsx           # Admin dashboard
│   └── api/                   # API routes
│       ├── auth/              # Authentication endpoints
│       ├── fabrics/           # Fabric CRUD operations
│       └── products/          # Product endpoints
│
├── experiences/               # Independent Customer Experiences
│   ├── fabric-store/          # Fabric ordering platform (port 3006)
│   │   ├── app/               # Next.js app directory
│   │   ├── package.json       # Uses @tara-hub/* packages
│   │   ├── vercel.json        # Independent deployment config
│   │   └── next.config.js     # Separate configuration
│   │
│   └── store-guide/           # Customer store interface (port 3007)
│       ├── app/               # Next.js app directory
│       ├── package.json       # Uses @tara-hub/* packages
│       ├── vercel.json        # Independent deployment config
│       └── next.config.js     # Separate configuration
│
├── packages/                  # NPM Workspace Packages (NEW)
│   ├── ui/                    # @tara-hub/ui package
│   │   ├── components/        # All shared UI components
│   │   ├── index.ts          # Package exports
│   │   └── package.json      # Package definition
│   │
│   ├── lib/                   # @tara-hub/lib package
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript definitions
│   │   ├── hooks/            # React hooks
│   │   ├── data/             # Shared data
│   │   └── package.json      # Package definition
│   │
│   └── config/               # @tara-hub/config package
│       └── package.json      # Shared configurations
│
├── components/                # Legacy components (being migrated)
├── lib/                       # Legacy libraries (being migrated)
├── hooks/                     # Legacy hooks (being migrated)
│
├── turbo.json                # Turborepo configuration
├── package.json              # Root with workspaces config
└── vercel.json               # Admin app deployment config
```

### Multi-Experience Architecture

**Experience Isolation**
- Each experience in `/experiences` is completely independent
- Separate package.json for dependency management
- Individual Next.js configuration files
- Dedicated ports for development (3006, 3007, etc.)
- Can be deployed to different domains/subdomains

**Shared Resource Strategy (Turborepo + NPM Workspaces)**
- Common components in `@tara-hub/ui` package - zero duplication
- Shared utilities and types in `@tara-hub/lib` package
- Import from packages: `import { Button } from '@tara-hub/ui'`
- Single source of truth with automatic dependency resolution
- Turborepo caching for unchanged packages
- Authentication logic shared through packages
- Database connections shared through `@tara-hub/lib`

**Port Allocation**
- Port 3000: Admin Dashboard (main app)
- Port 3006: Fabric Store
- Port 3007: Store Guide
- Future experiences: 3008+

### Component Architecture

**Provider Pattern**
- Centralized provider management in `components/providers.tsx`
- Session context via NextAuth SessionProvider
- Theme context via custom ThemeProvider
- Proper hydration handling with suppressHydrationWarning

**Layout Strategy**
- Root layout defines HTML structure and global providers
- Conditional layouts based on route groups
- Responsive design with Tailwind breakpoints

**Component Composition**
- Atomic design principles with reusable UI components
- Compound components for complex UI patterns (Sidebar, Dashboard)
- Props drilling minimized through context providers

### Data Flow Architecture

**Server-Side Rendering**
- Static generation for public pages
- Server components for data fetching
- Client components only when interactivity is required

**Authentication Flow**
- OAuth integration with Google for admin access
- Email magic links for general user access
- Session persistence through HTTP-only cookies
- Role-based UI conditional rendering

**Database Access Pattern**
- Centralized database connection with graceful degradation
- Type-safe queries through Drizzle ORM
- Connection pooling handled by Neon serverless Postgres

## Technical Guidelines

### Architecture Principles

1. **Separation of Concerns**
   - Clear separation between UI components, business logic, and data access
   - Authentication logic isolated in `lib/auth.ts`
   - Database schema separate from application logic

2. **Type Safety**
   - Comprehensive TypeScript coverage
   - Database schema types generated by Drizzle
   - Strict type checking for props and state

3. **Performance Optimization**
   - Server-side rendering for SEO and initial load performance
   - Image optimization through Next.js Image component
   - Bundle analysis available via Next.js bundle analyzer

4. **Accessibility**
   - Radix UI primitives ensure WCAG compliance
   - Semantic HTML structure
   - Proper ARIA labels and screen reader support

### Code Organization Standards

**File Naming Conventions**
- kebab-case for file names
- PascalCase for React components
- camelCase for utility functions and variables

**Import Organization**
- External libraries first
- Workspace packages (`@tara-hub/ui`, `@tara-hub/lib`)
- Internal components and utilities
- Type imports clearly separated
- Package imports for shared resources
- Local imports using relative paths or aliases

**Component Structure**
```typescript
"use client" // Only when client-side features needed

import { External } from "external-library"
import { InternalComponent } from "@/components/internal"
import type { TypeDefinition } from "@/lib/types"

interface ComponentProps {
  // Props definition
}

export function ComponentName({ props }: ComponentProps) {
  // Component implementation
}
```

## Database Architecture

### Connection Strategy
- Conditional database initialization based on environment variables
- Graceful fallback when DATABASE_URL is not provided
- Connection pooling through Neon serverless architecture

### Schema Design
- NextAuth.js standard tables (users, accounts, sessions, verification_tokens)
- Composite primary keys for verification tokens
- Proper foreign key relationships with cascade deletion
- Timestamps for audit trails (createdAt, updatedAt)

### Type Safety
- Drizzle schema exports for type inference
- Automatic TypeScript types from database schema
- Runtime validation through Drizzle ORM

## Security Architecture

### Authentication Security
- NextAuth.js handles secure authentication flows
- Session tokens stored as HTTP-only cookies
- CSRF protection built into NextAuth.js
- Environment variable protection for secrets

### Authorization Model
- Role-based access control with admin/user roles
- Email-based admin identification
- Route protection through session checks
- API route security through authentication middleware

### Data Protection
- Environment variables for sensitive configuration
- Database connection strings secured
- OAuth client secrets properly managed

## Future Considerations

### Scalability Planning
- Database connection pooling for high traffic
- CDN integration for static assets
- Caching strategies for frequently accessed data
- Horizontal scaling through Vercel's edge network

### Feature Expansion
- API rate limiting for external integrations
- Real-time updates through WebSocket or Server-Sent Events
- Advanced analytics and reporting capabilities
- Multi-tenant architecture considerations

### Performance Optimization
- Bundle splitting for better loading performance
- Service worker implementation for offline capabilities
- Database query optimization and indexing
- Image optimization and lazy loading strategies

## Development Guidelines

### Adding New Features
1. Define TypeScript interfaces in `lib/types.ts`
2. Create reusable UI components in `components/ui/`
3. Implement business logic in separate utility modules
4. Add authentication checks for protected features
5. Update database schema using Drizzle migrations

### Testing Strategy
- Component testing with React Testing Library
- Integration testing for authentication flows
- End-to-end testing for critical user journeys
- Database testing with test fixtures

### Deployment Process

**Independent Vercel Projects**
- Each experience deploys to its own Vercel project
- Admin app: `tara-hub-admin`
- Fabric Store: `tara-hub-fabric-store`  
- Store Guide: `tara-hub-store-guide`

**Build Commands**
- Admin: `npm run build:admin`
- Experiences: `cd ../.. && npm install && cd experiences/[name] && npm run build`
- Turborepo handles dependency building

**Deployment Triggers**
- Path-based ignore commands prevent unnecessary builds
- Only rebuilds when relevant files change
- Shared packages trigger rebuilds for dependent apps

**Development Workflow**
- Local: `npx turbo dev` (all apps parallel)
- Individual: `npm run dev:admin` or experience-specific
- Turborepo caching speeds up rebuilds

This architecture provides a solid foundation for a modern, scalable web application while maintaining developer productivity and code quality.