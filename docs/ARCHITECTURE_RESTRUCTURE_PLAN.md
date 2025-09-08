# 🏗️ Tara Hub Architecture Restructuring Plan

## 📊 Current State Analysis

### **Issues Identified:**
1. **Mixed Concerns**: Frontend and backend code intermingled
2. **Duplicate Code**: Multiple implementations of similar functionality
3. **Legacy Dependencies**: Unused NextAuth, duplicate R2 clients, old patterns
4. **Import Chaos**: 165+ files with incorrect import paths
5. **Inconsistent Structure**: Mix of flat and module-based architecture
6. **Build Issues**: Experience apps failing due to dependency conflicts

### **Unused/Legacy Code Identified:**
- `lib/` directory (165+ files using old imports)
- `components/` root directory (moved to src/shared)
- `hooks/` root directory (moved to src/shared)
- NextAuth implementation (62 files)
- Multiple R2 clients (3 legacy versions)
- Test endpoints in production API
- Duplicate cache providers
- Legacy auth schemas

## 🎯 **New Architecture: Clean Separation**

### **Frontend Structure**
```
frontend/
├── admin/                      # Next.js 15 Admin Dashboard
│   ├── app/                   # App router pages
│   ├── components/            # Admin-specific components
│   └── lib/                   # Admin utilities
├── fabric-store/              # Customer Store (port 3006)
│   ├── app/                   # Store pages
│   ├── components/            # Store components
│   └── lib/                   # Store utilities
├── store-guide/               # Store Management (port 3007)
│   ├── app/                   # Guide pages
│   ├── components/            # Guide components
│   └── lib/                   # Guide utilities
└── shared/                    # Shared frontend code
    ├── components/ui/         # shadcn/ui components
    ├── hooks/                 # React hooks
    ├── utils/                 # Utility functions
    └── types/                 # Frontend types
```

### **Backend Structure**
```
backend/
├── api-gateway/               # Main API Gateway (Express/Next.js API)
│   ├── routes/               # API route handlers
│   │   ├── auth/            # Authentication routes
│   │   ├── commerce/        # Commerce bridge routes
│   │   ├── admin/           # Admin API routes
│   │   └── public/          # Public API routes
│   ├── middleware/          # Request middleware
│   └── controllers/         # Route controllers
├── medusa/                   # E-commerce Service (Medusa v2)
│   ├── src/
│   │   ├── modules/         # Custom Medusa modules
│   │   ├── api/            # Medusa API extensions
│   │   └── workflows/      # Business logic workflows
│   └── config/             # Medusa configuration
├── infrastructure/          # Core Services
│   ├── auth/               # Authentication service
│   │   ├── services/       # Auth business logic
│   │   ├── middleware/     # Auth middleware
│   │   └── utils/          # Auth utilities
│   ├── database/           # Database layer
│   │   ├── repositories/   # Data access layer
│   │   ├── schemas/        # Drizzle schemas
│   │   └── migrations/     # Database migrations
│   ├── cache/              # Caching layer
│   │   ├── providers/      # Cache implementations
│   │   └── strategies/     # Cache strategies
│   └── storage/            # File storage
│       ├── r2/            # Cloudflare R2 integration
│       └── providers/     # Storage abstractions
└── shared/                 # Shared backend code
    ├── types/              # Backend types
    ├── utils/              # Utility functions
    ├── constants/          # Constants
    └── config/             # Configuration schemas
```

### **Shared Structure**
```
shared/
├── types/                  # TypeScript definitions
│   ├── api.ts             # API contracts
│   ├── entities.ts        # Business entities
│   └── config.ts          # Configuration types
└── config/                 # Configuration files
    ├── database.config.ts  # Database configuration
    ├── cache.config.ts     # Cache configuration
    └── app.config.ts       # Application configuration
```

## 🔧 **Migration Strategy**

### **Phase 1: Backend Restructuring**
1. **Move API Gateway**: Extract `app/api/` to `backend/api-gateway/`
2. **Move Infrastructure**: Relocate `src/core/` to `backend/infrastructure/`
3. **Move Medusa**: Update `medusa-backend/` to `backend/medusa/`
4. **Clean Architecture**: Apply Repository, Service, Controller patterns

### **Phase 2: Frontend Restructuring**
1. **Move Admin App**: Extract admin pages and components
2. **Move Experience Apps**: Relocate `experiences/` to `frontend/`
3. **Consolidate Shared**: Move `src/shared/` to `frontend/shared/`
4. **Update Imports**: Fix all import paths

### **Phase 3: Cleanup & Optimization**
1. **Remove Dead Code**: Delete unused files and dependencies
2. **Dependency Scoping**: Separate frontend/backend dependencies
3. **Configuration Update**: Update build and deployment configs
4. **Documentation**: Create migration guide and architecture docs

## 🧹 **Code Cleanup Plan**

### **Files to Remove:**
```
# Legacy directories (after migration)
lib/                        # 165+ files with old imports
components/                 # Root level components
hooks/                      # Root level hooks
utils/                      # Root level utils

# Unused authentication
lib/auth-schema.ts          # NextAuth schema
lib/auth.ts                 # NextAuth config
types/next-auth.d.ts        # NextAuth types
# + 59 other NextAuth references

# Duplicate R2 clients
src/core/storage/r2/client-legacy.ts
src/core/storage/r2/client-v2-legacy.ts
src/core/storage/r2/client-v3-legacy.ts

# Duplicate cache providers
src/core/cache/providers/redis.ts      # Duplicate of vercel-kv
src/core/cache/providers/memory-store.ts # Dev only

# Test endpoints (move to dev scripts)
app/api/__tests__/          # 12 test endpoints in production API
```

### **Dependencies to Scope:**

**Frontend Dependencies:**
```json
// frontend/package.json
{
  "dependencies": {
    "next": "15.2.4",
    "react": "^19",
    "react-dom": "^19",
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.454.0"
  }
}
```

**Backend Dependencies:**
```json
// backend/package.json
{
  "dependencies": {
    "@medusajs/framework": "^2.1.4",
    "drizzle-orm": "^0.44.4",
    "@neondatabase/serverless": "^0.10.4",
    "resend": "^6.0.1",
    "@aws-sdk/client-s3": "^3.864.0",
    "@upstash/redis": "^1.34.3"
  }
}
```

## 🎯 **Benefits of New Architecture**

### **Clean Separation of Concerns:**
- **Frontend**: UI, user interactions, client-side logic
- **Backend**: Business logic, data access, API endpoints
- **Shared**: Common types, configurations, utilities

### **Improved Developer Experience:**
- **Clear Boundaries**: No confusion about where code belongs
- **Independent Development**: Frontend and backend teams can work separately
- **Easier Testing**: Each layer can be tested in isolation
- **Better Performance**: Optimized builds for each concern

### **Scalability:**
- **Microservices Ready**: Backend services can be deployed independently
- **Team Scaling**: Different teams can own different parts
- **Technology Flexibility**: Easier to change tech stack for specific parts

### **Maintainability:**
- **Consistent Patterns**: Repository, Service, Controller patterns
- **Clear Dependencies**: No circular dependencies between layers
- **Documentation**: Clear architecture documentation

## 📈 **Migration Timeline**

### **Week 1: Backend Restructuring**
- Move API routes to backend/api-gateway
- Restructure infrastructure services
- Apply clean architecture patterns
- Update configurations

### **Week 2: Frontend Restructuring**
- Move admin app to frontend/admin
- Relocate experience apps
- Consolidate shared frontend code
- Update import paths

### **Week 3: Cleanup & Testing**
- Remove dead code and unused dependencies
- Update build configurations
- Test all applications
- Create documentation

### **Week 4: Deployment & Validation**
- Update deployment scripts
- Deploy to staging environment
- Performance testing
- Final documentation

This restructuring will transform Tara Hub from a mixed monolith into a clean, scalable, maintainable architecture that follows industry best practices and supports future growth.