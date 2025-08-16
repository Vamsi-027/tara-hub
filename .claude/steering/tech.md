# Technical Steering Document - Tara Hub

## Technology Stack

### Core Framework & Runtime
- **Language**: TypeScript 5.x (strict mode enabled)
- **Framework**: Next.js 15.2.4 with App Router architecture
- **Runtime**: Node.js with React 19 and React DOM 19
- **Package Manager**: npm (leveraging latest package versions)

### Frontend Architecture
- **UI Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 3.4.1 with custom design system
- **Component Library**: Radix UI primitives with Shadcn/ui component system
- **Icons**: Lucide React for consistent iconography
- **Animations**: Tailwind CSS Animate for smooth transitions
- **Charts & Visualizations**: Recharts for analytics dashboards

### Backend & Data Layer
- **Database**: PostgreSQL via Neon Database (serverless)
- **ORM**: Drizzle ORM 0.44.4 with type-safe schema definitions
- **Database Migration**: Drizzle Kit for schema management
- **Caching**: Vercel KV (Redis-compatible) with fallback to in-memory storage
- **Session Storage**: Database-backed sessions with NextAuth.js adapter

### Authentication & Security
- **Authentication**: NextAuth.js (latest) with multiple providers
  - Google OAuth integration
  - Email/Magic link authentication
  - Role-based access control (admin/user roles)
- **Session Management**: Database sessions with automatic cleanup
- **CSRF Protection**: Built-in NextAuth.js CSRF protection
- **Email Service**: Nodemailer for transactional emails

### Development & Build Tools
- **TypeScript**: Strict type checking with comprehensive type definitions
- **ESLint**: Next.js ESLint configuration for code quality
- **PostCSS**: CSS processing and optimization
- **Bundle Analyzer**: Next.js Bundle Analyzer for performance monitoring
- **Image Optimization**: Next.js Image component with WebP/AVIF support

### Deployment & Infrastructure
- **Hosting**: Vercel with automatic deployments from Git
- **CDN**: Vercel Edge Network for global content delivery
- **Database**: Neon PostgreSQL with connection pooling
- **Storage**: Vercel KV for caching and session data
- **Domain Management**: Custom domain with SSL certificates
- **Environment Management**: Environment variables with validation

### External Integrations
- **AI/LLM**: OpenAI SDK integration for content generation
- **E-commerce**: Etsy API integration for order management
- **Analytics**: Built-in performance monitoring and error tracking
- **Image Hosting**: Support for Unsplash, local assets, and Vercel domains

## Development Standards

### Code Style & Quality
```typescript
// Type-first development with strict TypeScript
interface CalendarPost {
  id: number;
  date: string;
  status: 'Published' | 'Scheduled' | 'Draft';
  theme: string;
  goal: 'Engagement' | 'Announce' | 'Education' | 'Promotion';
  type: 'Static Photo' | 'Carousel' | 'Reel';
  channels: Array<'IG' | 'FB' | 'Pin' | 'All'>;
}

// Utility-first CSS with Tailwind
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      }
    }
  }
);
```

### Component Architecture
- **Atomic Design**: Organized UI components from atoms to pages
- **Server/Client Components**: Strategic use of React Server Components
- **Custom Hooks**: Reusable logic extraction with TypeScript generics
- **Error Boundaries**: Comprehensive error handling at component level
- **Loading States**: Suspense boundaries and skeleton components

### Database Schema Design
```sql
-- Drizzle schema with proper relationships
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Testing Requirements
- **Component Testing**: React Testing Library for UI components
- **Type Safety**: TypeScript compilation as primary test gate
- **Manual Testing**: Comprehensive manual test scripts for critical paths
- **Build Validation**: ESLint and TypeScript checks in CI/CD pipeline
- **Performance Testing**: Bundle size analysis and Core Web Vitals monitoring

### Documentation Standards
- **Code Comments**: TSDoc comments for complex business logic
- **README Files**: Comprehensive setup and deployment instructions
- **Type Definitions**: Comprehensive interfaces for all data models
- **API Documentation**: OpenAPI specifications for future API endpoints

## Architecture Patterns

### Application Architecture
- **Layered Architecture**: Clear separation between presentation, business logic, and data layers
- **Feature-Based Organization**: Components and logic grouped by business functionality
- **Server-Side Rendering**: Next.js App Router with selective client-side hydration
- **Progressive Enhancement**: Core functionality works without JavaScript

### Data Flow Patterns
```typescript
// Context-based state management
const DatabaseProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [data, setData] = useState<Database>(initialData);
  return (
    <DatabaseContext.Provider value={{data, setData}}>
      {children}
    </DatabaseContext.Provider>
  );
};

// Type-safe data fetching
async function getCalendarPosts(): Promise<CalendarPost[]> {
  return db.calendar.filter(post => post.status === 'Published');
}
```

### Design Patterns
- **Repository Pattern**: Data access abstraction with Drizzle ORM
- **Factory Pattern**: Component variants using class-variance-authority
- **Observer Pattern**: Real-time updates via React state management
- **Strategy Pattern**: Multiple authentication providers with NextAuth.js

### Security Patterns
- **Environment Variable Validation**: Runtime validation of required config
- **Input Sanitization**: Zod schemas for form validation and API inputs
- **Session Security**: HTTPOnly cookies with CSRF protection
- **Role-Based Access**: Admin/user role separation with middleware protection

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Automatic route-based code splitting with Next.js
- **Image Optimization**: Next.js Image component with WebP/AVIF formats
- **Bundle Analysis**: Regular bundle size monitoring and optimization
- **CSS Optimization**: Tailwind CSS purging and PostCSS optimization

### Backend Performance
- **Database Optimization**: Indexed queries and connection pooling
- **Caching Strategy**: Multi-layer caching with KV store and in-memory fallback
- **Static Generation**: Pre-rendered pages for catalog and content
- **Edge Functions**: Vercel Edge Runtime for global performance

### Monitoring & Observability
- **Real User Monitoring**: Core Web Vitals and performance metrics
- **Error Tracking**: Built-in error boundaries and logging
- **Database Monitoring**: Query performance and connection pool metrics
- **Build Analysis**: Bundle size tracking and dependency auditing

## Development Workflow

### Local Development
```bash
# Development setup
npm install
cp .env.example .env.local
npm run dev

# Database management
npm run db:generate    # Generate migrations
npm run db:migrate     # Apply migrations
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
```

### Deployment Pipeline
1. **Git Push** → Automatic Vercel deployment
2. **Build Process** → TypeScript compilation and bundling
3. **Database Migration** → Automatic schema deployment
4. **Environment Variables** → Secure config management
5. **Preview Deployments** → Branch-based preview environments

### Code Quality Gates
- **TypeScript Compilation**: No type errors allowed
- **ESLint Validation**: Code style and potential issue detection
- **Build Success**: Successful Next.js production build
- **Manual Testing**: Critical path validation before deployment

## Scalability Considerations

### Current Scale
- **User Base**: Small business with admin access
- **Data Volume**: Marketing calendar (~100 posts/year) + fabric catalog (~500 items)
- **Traffic Pattern**: Low to moderate with seasonal spikes
- **Geographic Scope**: US-based with potential international expansion

### Scaling Strategy
- **Database**: Neon PostgreSQL with automatic scaling
- **CDN**: Vercel Edge Network for global content delivery
- **Caching**: Multi-layer caching strategy for performance
- **API Rate Limiting**: Built-in protection for external integrations

### Future Architecture Evolution
- **Microservices**: Potential extraction of marketing vs catalog services
- **API Gateway**: Centralized API management for multiple clients
- **Event-Driven Architecture**: Real-time updates and webhook integrations
- **Multi-Tenancy**: Support for multiple store operators

## Project Type: nextjs-saas-platform