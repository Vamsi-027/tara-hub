# Structure Steering Document - Tara Hub

## Directory Organization

```
tara-hub/
├── app/                          # Admin Dashboard Application ONLY
│   ├── admin/                   # Admin pages
│   │   ├── blog/                # Blog management
│   │   ├── fabrics/             # Fabric inventory
│   │   ├── products/            # Product management
│   │   └── page.tsx             # Admin dashboard
│   ├── api/                     # API Routes
│   │   ├── auth/                # Authentication endpoints
│   │   ├── fabrics/             # Fabric CRUD
│   │   └── products/            # Product endpoints
│   ├── layout.tsx               # Root layout with providers
│   └── page.tsx                 # Redirects to /admin
│
├── packages/                     # NPM Workspace Packages (Shared Code)
│   ├── ui/                      # @tara-hub/ui - Shared UI Components
│   │   ├── components/          # All UI components from shadcn/ui
│   │   │   ├── button.tsx      # Button component
│   │   │   ├── card.tsx        # Card component
│   │   │   ├── dialog.tsx      # Dialog component
│   │   │   └── ...             # Other UI components
│   │   ├── index.ts            # Package exports
│   │   └── package.json        # Package configuration
│   │
│   ├── lib/                     # @tara-hub/lib - Shared Libraries
│   │   ├── utils/              # Utility functions
│   │   │   ├── cn.ts          # Class name utility
│   │   │   └── utils.ts       # General utilities
│   │   ├── types/              # TypeScript definitions
│   │   │   └── types.ts       # Shared types
│   │   ├── hooks/              # React hooks
│   │   ├── data/               # Shared data
│   │   │   └── fabric-swatch-data.ts
│   │   ├── index.ts            # Package exports
│   │   └── package.json        # Package configuration
│   │
│   └── config/                  # @tara-hub/config - Shared Configs
│       └── package.json         # Configuration package
│
├── experiences/                  # Independent Customer Experiences
│   ├── fabric-store/            # Fabric ordering platform (port 3006)
│   │   ├── app/                 # Next.js app directory
│   │   │   ├── browse/          # Browse fabrics page
│   │   │   ├── checkout/        # Checkout flow
│   │   │   └── page.tsx         # Store homepage
│   │   ├── package.json         # Uses @tara-hub/* packages
│   │   ├── vercel.json          # Deployment configuration
│   │   ├── next.config.js       # Separate configuration
│   │   └── tsconfig.json        # TypeScript config
│   │
│   └── store-guide/             # Customer store interface (port 3007)
│       ├── app/                 # Next.js app directory
│       │   ├── fabrics/         # Fabric catalog
│       │   ├── products/        # Product catalog
│       │   └── page.tsx         # Store guide home
│       ├── package.json         # Uses @tara-hub/* packages
│       ├── vercel.json          # Deployment configuration
│       └── next.config.js       # Separate configuration
│
├── components/                   # Legacy Components (Migrated to packages/ui)
│   ├── ui/                      # Being moved to @tara-hub/ui
│   ├── admin-dashboard.tsx     # Admin interface components
│   ├── fabric-*.tsx            # Fabric-related components
│   └── providers.tsx           # Context providers
│
├── lib/                         # Legacy Libraries (Migrated to packages/lib)
│   ├── auth.ts                 # NextAuth.js configuration
│   ├── db.ts                   # Database connection
│   ├── types.ts                # Being moved to @tara-hub/lib/types
│   ├── fabric-swatch-data.ts   # Being moved to @tara-hub/lib/data
│   └── utils.ts                # Being moved to @tara-hub/lib/utils
│
├── hooks/                       # Legacy Hooks (Migrated to packages/lib/hooks)
│   ├── use-auth.ts             # Authentication hook
│   └── use-api.ts              # API interaction hook
│
├── styles/                      # Global Styling Assets
│   └── globals.css             # Global CSS with Tailwind
│
├── .claude/                     # Claude AI Steering Documents
│   └── steering/
│       ├── architecture.md      # Updated architecture document
│       ├── structure.md        # This file - development guidelines
│       └── ...                 # Other steering docs
│
├── turbo.json                  # Turborepo configuration
├── package.json                # Root with NPM workspaces config
├── next.config.mjs             # Main app Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Admin app deployment config
└── README.md                   # Project documentation
```

## Naming Conventions

### Files & Directories
```
✅ CORRECT
kebab-case/                     # Directory names
component-name.tsx              # Component files
utility-functions.ts            # Utility files
auth-schema.ts                  # Multi-word files
[...nextauth]/                  # Dynamic routes
page.tsx                        # Next.js special files
layout.tsx                      # Next.js special files

❌ INCORRECT
camelCase/                      # Avoid camelCase directories
ComponentName.tsx               # Avoid PascalCase files
utility_functions.ts            # Avoid snake_case
authSchema.ts                   # Avoid camelCase for files
```

### Functions & Variables
```typescript
// ✅ CORRECT - Functions: camelCase
function getUserData() { }
const handleSubmit = () => { }
const isAuthenticated = true;

// ✅ CORRECT - Components: PascalCase
export function UserProfile() { }
const LoginButton = () => { }

// ✅ CORRECT - Constants: SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// ✅ CORRECT - Types/Interfaces: PascalCase
interface UserData { }
type CalendarPost = { }
enum PostStatus { }
```

### CSS Classes & IDs
```css
/* ✅ CORRECT - Tailwind utility classes */
.btn-primary { }
.text-balance { }

/* ✅ CORRECT - BEM methodology for custom styles */
.calendar-post { }
.calendar-post__header { }
.calendar-post--featured { }
```

## Code Organization

### Component Structure
```typescript
// ✅ Standard component file structure
"use client" // Client directive if needed

import { useState } from 'react' // React imports first
import Link from 'next/link' // Next.js imports
import { Button } from '@/components/ui/button' // Internal UI components
import { Menu, X } from 'lucide-react' // External components
import { config } from '@/lib/config' // Internal utilities
import type { NavItem } from '@/lib/types' // Type imports last

// Component definition
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState<StateType>(initialValue)
  
  // Event handlers
  const handleEvent = () => { }
  
  // Render
  return (
    <div className="container mx-auto">
      {/* JSX content */}
    </div>
  )
}

// Types after component (if not imported)
interface ComponentProps {
  prop1: string
  prop2?: number
}
```

### Directory-Based Features
```
components/
├── ui/                    # Base components (buttons, inputs, etc.)
├── layout/               # Layout components (header, footer, nav)
├── marketing/            # Marketing dashboard components
├── catalog/              # Fabric catalog components
├── auth/                 # Authentication components
└── shared/               # Shared business components
```

### Import Organization (Updated for Packages)
```typescript
// 1. React and Next.js imports
import React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// 2. External library imports
import { format } from 'date-fns'
import { z } from 'zod'

// 3. Workspace package imports (NEW)
import { Button, Card, Dialog } from '@tara-hub/ui'
import { cn, formatCurrency } from '@tara-hub/lib/utils'
import type { SwatchFabric, SwatchOrder } from '@tara-hub/lib/types'
import { useAuth } from '@tara-hub/lib/hooks'

// 4. Local/internal imports (experience-specific)
import { LocalComponent } from './components/local'
import { localUtil } from './utils/local'

// 5. Type imports (with 'type' keyword)
import type { LocalType } from './types'
```

## Data Flow Architecture

### State Management Pattern
```typescript
// Context for global state
const DatabaseContext = createContext<DatabaseContextType>()

// Provider component
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Database>(initialData)
  
  return (
    <DatabaseContext.Provider value={{ data, setData }}>
      {children}
    </DatabaseContext.Provider>
  )
}

// Hook for consuming context
export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider')
  }
  return context
}
```

### Server/Client Component Strategy
```typescript
// ✅ Server Component (default) - Data fetching
export default async function PostsPage() {
  const posts = await getCalendarPosts()
  return <PostsList posts={posts} />
}

// ✅ Client Component - Interactive features
"use client"
export function PostEditor({ post }: { post: Post }) {
  const [isEditing, setIsEditing] = useState(false)
  // Interactive logic here
}
```

### Type Safety Patterns
```typescript
// ✅ Strict typing for all data models
interface CalendarPost {
  id: number
  date: string
  status: 'Published' | 'Scheduled' | 'Draft'
  theme: string
  goal: 'Engagement' | 'Announce' | 'Education' | 'Promotion'
  type: 'Static Photo' | 'Carousel' | 'Reel'
  channels: Array<'IG' | 'FB' | 'Pin' | 'All'>
  boost: boolean
  event?: 'launch' | 'sale'
}

// ✅ Form validation with Zod
const postSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(10),
  status: z.enum(['draft', 'published', 'scheduled'])
})

type PostFormData = z.infer<typeof postSchema>
```

## Database Schema Organization

### File Structure
```
lib/
├── auth-schema.ts        # Authentication related tables
├── marketing-schema.ts   # Marketing/calendar related tables
├── catalog-schema.ts     # Product/fabric related tables
└── db.ts                # Database connection and exports
```

### Schema Definition Pattern
```typescript
// ✅ Consistent table definitions
export const calendarPosts = pgTable('calendar_posts', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  status: text('status').$type<'published' | 'scheduled' | 'draft'>().notNull(),
  theme: text('theme').notNull(),
  goal: text('goal').$type<'engagement' | 'announce' | 'education' | 'promotion'>().notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ✅ Relationships
export const postChannels = pgTable('post_channels', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').references(() => calendarPosts.id),
  channel: text('channel').$type<'IG' | 'FB' | 'Pin'>().notNull(),
})
```

## Testing Strategy

### Component Testing Structure
```
__tests__/
├── components/
│   ├── ui/
│   │   └── button.test.tsx
│   ├── header.test.tsx
│   └── providers.test.tsx
├── lib/
│   ├── utils.test.ts
│   └── auth.test.ts
└── setup.ts
```

### Test File Conventions
```typescript
// ✅ Test file structure
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
  
  it('should apply variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })
})
```

## Turborepo & Workspace Management

### Development Commands
```bash
# Start all apps in parallel
npx turbo dev

# Start specific app
npm run dev:admin      # Admin dashboard
cd experiences/fabric-store && npm run dev  # Fabric store

# Build all apps
npx turbo build

# Build specific app
npm run build:admin
```

### Package Management
```bash
# Install dependencies (from root)
npm install

# Add dependency to specific package
npm install [package] -w @tara-hub/ui

# Update workspace packages
npm update
```

### Turborepo Features
- **Caching**: Unchanged packages are cached
- **Parallel Execution**: Multiple apps run simultaneously
- **Smart Rebuilds**: Only affected apps rebuild
- **Remote Caching**: Available with Vercel

## Configuration Management

### Environment Variables Organization
```typescript
// ✅ Type-safe environment config
interface Config {
  database: {
    url: string
  }
  auth: {
    secret: string
    googleClientId?: string
    googleClientSecret?: string
  }
  external: {
    etsyStoreUrl: string
    etsyFabricListingUrl: string
  }
}

export const config: Config = {
  database: {
    url: process.env.DATABASE_URL || ''
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET
  },
  external: {
    etsyStoreUrl: "https://www.etsy.com/shop/HearthandHomeStore",
    etsyFabricListingUrl: "https://www.etsy.com/listing/124021923/pillow-and-cushion-cover-fabric-swatch"
  }
}
```

### Deployment Configuration
```typescript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'localhost', 'vercel.app'],
    formats: ['image/webp', 'image/avif'],
  },
  // Only ignore during development, not production
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
}
```

## Performance Guidelines

### Component Optimization
```typescript
// ✅ Memoization for expensive components
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  const processedData = useMemo(() => 
    data.map(item => processItem(item)), [data]
  )
  
  return <div>{/* Render processedData */}</div>
})

// ✅ Lazy loading for non-critical components
const DashboardChart = lazy(() => import('@/components/dashboard-chart'))

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <DashboardChart />
    </Suspense>
  )
}
```

### Image Optimization
```typescript
// ✅ Next.js Image component usage
import Image from 'next/image'

function ProductCard({ fabric }: { fabric: Fabric }) {
  return (
    <Image
      src={fabric.swatchImageUrl}
      alt={`${fabric.name} fabric swatch`}
      width={300}
      height={200}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  )
}
```

## Security Best Practices

### Authentication Patterns
```typescript
// ✅ Role-based access control
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    return <AccessDenied />
  }
  
  return <>{children}</>
}

// ✅ Server-side protection
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions)
  
  if (!session || (session.user as any).role !== 'admin') {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }
  
  return { props: {} }
}
```

### Input Validation
```typescript
// ✅ Client and server validation
const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  status: z.enum(['draft', 'published', 'scheduled']),
  scheduledAt: z.date().optional()
})

// API route validation
export async function POST(request: Request) {
  const body = await request.json()
  const result = createPostSchema.safeParse(body)
  
  if (!result.success) {
    return new Response('Invalid input', { status: 400 })
  }
  
  // Process validated data
}
```

## Deployment & Maintenance

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-dashboard-component
git commit -m "feat: add calendar dashboard component"
git push origin feature/new-dashboard-component

# Deployment
git checkout main
git merge feature/new-dashboard-component
git push origin main  # Triggers Vercel deployment
```

### Database Migrations
```bash
# Schema changes
npm run db:generate  # Generate migration from schema changes
npm run db:migrate   # Apply migrations to database
npm run db:push      # Push schema directly (development only)
npm run db:studio    # Open Drizzle Studio for inspection
```

### Monitoring & Maintenance
- **Error Tracking**: Built-in Next.js error boundaries
- **Performance Monitoring**: Vercel Analytics and Core Web Vitals
- **Database Health**: Connection pool monitoring via Neon dashboard
- **Bundle Analysis**: Regular bundle size audits with `@next/bundle-analyzer`

## AI Context Guidelines

### Key Architecture Points for Claude
1. **Monorepo with Turborepo**: Always use Turborepo commands
2. **NPM Workspaces**: Shared code in `/packages` folder
3. **Import Pattern**: Use `@tara-hub/ui` and `@tara-hub/lib`
4. **Independent Deployments**: Each experience has its own Vercel project
5. **Port Allocation**: Admin (3000), Fabric Store (3006), Store Guide (3007)

### Common Tasks
- **Add UI Component**: Add to `packages/ui/components`
- **Add Utility**: Add to `packages/lib/utils`
- **Add New Experience**: Create in `/experiences` with own package.json
- **Update Imports**: Change from `@/components` to `@tara-hub/ui`

### Build & Deploy
- **Local Dev**: `npx turbo dev`
- **Production Build**: `npx turbo build`
- **Deploy Admin**: Push to main, deploys to `tara-hub-admin`
- **Deploy Experience**: Push to main, each deploys independently

## Project Type: nextjs-turborepo-multi-experience