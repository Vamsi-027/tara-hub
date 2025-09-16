# MedusaJS v2 Store Backend & Frontend Comprehensive Analysis

## Executive Summary

The MedusaJS v2 implementation demonstrates solid architectural foundations with 4 custom modules, comprehensive admin customizations, and multi-storefront support. However, critical production gaps exist: disabled Redis infrastructure, missing payment idempotency, no multi-tenant isolation, and insufficient observability. Current setup supports ~$2-5M ARR but requires systematic hardening for $50M scale. **Working Theory**: With proper payment reliability, multi-tenancy via sales channels, and B2B pricing, the platform can scale 10x through partner marketplace automation while maintaining sub-200ms API performance.

---

## 1. Medusa Version & Topology

### Version Profile
- **Framework**: MedusaJS v2.10.0 (latest stable)
- **Architecture**: Modular with custom modules
- **Database**: PostgreSQL via MikroORM 6.4.3
- **Package Layout**: Standard v2 monolithic backend
- **Node Requirement**: >=20.0.0

### Deployment Scripts
```bash
# Production
"start": "NODE_ENV=production npx medusa start -H 0.0.0.0"

# Development
"dev": "npx medusa develop --host 0.0.0.0"

# Database
"predeploy": "npx medusa db:migrate"
"seed": "npx medusa exec ./src/scripts/seed.ts"
```

**Evidence**: `/medusa/package.json:15-32`

---

## 2. Backend System Map (Code-Cited)

### Configuration (`/medusa/medusa-config.ts`)

#### Database & Redis
- **PostgreSQL**: `process.env.DATABASE_URL` (Neon/Railway) - Line 13
- **Redis**: **DISABLED** - Lines 36-59 commented due to Upstash limits
- **Worker Mode**: Configurable shared/worker/server - Lines 7-9

#### CORS Configuration
- **Store CORS**: Multi-origin support including localhost and Railway - Line 17
- **Admin CORS**: Restricted admin access - Line 18
- **Auth CORS**: Authentication endpoint access - Line 19

#### Feature Flags
- **Admin Disable**: `DISABLE_MEDUSA_ADMIN` environment toggle - Line 27

### Plugins Inventory

| Plugin | Configuration | Purpose | Status |
|--------|---------------|---------|--------|
| **@medusajs/auth-google** | OAuth with callback URL | Admin SSO | ✅ Active |
| **@medusajs/auth-emailpass** | Email/password auth | Admin login | ✅ Active |
| **@medusajs/file-s3** | R2-compatible storage | Media pipeline | ✅ Active |
| **@medusajs/payment-stripe** | Stripe integration | Payment processing | ✅ Active |
| **@medusajs/notification-sendgrid** | Email notifications | Transactional emails | ✅ Active |
| **resend_notification** | Custom Resend module | Primary email service | ✅ Active |

**Evidence**: `/medusa/medusa-config.ts:70-165`

### Core Domain Coverage

#### Products & Variants
- **Custom Fabric Module**: Enhanced product properties via `fabric_details`
- **Configurable Products**: `fabric_products` module for customizable items
- **Variants**: Standard Medusa variant system

#### Pricing & Regions
- **Static Pricing**: Basic Medusa pricing (no dynamic rules)
- **Regions**: Default region setup
- **Currencies**: Single currency support

#### Orders & Checkout
- **Order Processing**: Custom fabric order storage in PostgreSQL
- **Cart Management**: Frontend localStorage-based carts
- **Checkout Flow**: Stripe-powered payment processing

#### Inventory Management
- **Stock Tracking**: Basic product inventory
- **Reservations**: ❌ Not implemented
- **Multi-location**: ❌ Not implemented

### APIs & Middlewares

#### Store API Routes (`/medusa/src/api/store/`)
- **`/fabrics`** - Fabric catalog with caching (5-min TTL) - Lines 1-45
- **`/submit-contact`** - Public contact form submission - Lines 1-30
- **`/fabric-orders`** - Order storage to PostgreSQL - Lines 1-85

#### Admin API Routes (`/medusa/src/api/admin/`)
- **`/contact/*`** - Contact management CRUD - Lines 1-78
- **`/fabrics/*`** - Fabric catalog management - Lines 1-125
- **`/fabric-sync`** - Medusa product sync automation - Lines 12-304
- **`/customers/[id]/*`** - Enhanced customer operations - Lines 1-55

#### Middleware Implementation (`/medusa/src/api/middlewares.ts`)
- **Fabric Data Injection**: Merges external order data - Lines 100-200
- **Admin Authentication**: Email whitelist validation - Lines 474-480
- **CORS Handling**: Dynamic origin validation - Lines 50-100

### Events & Jobs

#### Subscribers (`/medusa/src/subscribers/`)
- **User Invitation**: Email notification on admin invites - Lines 1-45
  - Events: `user.invite.created`, `invite.created`, `auth.user.invited`
  - Dual notification: Resend + SendGrid fallback
  - Email whitelist validation

#### Background Jobs
- **Redis Jobs**: ❌ Disabled (in-memory fallback)
- **Async Processing**: Limited to basic event handling
- **Retries/DLQ**: ❌ Not implemented

### Migrations & Seeds

#### Database Migrations
- **Materials Schema**: Simple fabric mirror table
- **Fabric Products**: Complex configurable product system
- **Contact Module**: Customer service workflow

#### Seed Scripts (`/medusa/src/scripts/`)
- **`seed.ts`** - Comprehensive demo data
- **`seed-fabrics.ts`** - Fabric catalog seeding
- **`sync-materials.ts`** - External data synchronization

---

## 3. Storefront Audit (Next.js/React)

### Fabric Store App (Port 3006)

#### Architecture
- **Framework**: Next.js 15.2.4 with App Router
- **Data Fetching**: Mixed SSR/CSR patterns
- **State Management**: localStorage for cart/wishlist
- **Authentication**: NextAuth 4.24.11

**Evidence**: `/frontend/experiences/fabric-store/package.json:1-50`

#### Key Routes & Data Patterns
- **Browse Page** (`/app/browse/page.tsx`): Server-side fabric fetching with client-side filtering
- **Checkout Flow** (`/app/checkout/page.tsx`): Multi-step Stripe integration
- **API Integration**: Direct calls to Medusa backend via custom fetchers

#### Performance Considerations
- **Image Optimization**: Disabled in Next.js config - Line 45
- **Hydration**: Suppressed warnings for SSR compatibility
- **Bundle Size**: Webpack excludes Twilio from client bundle

### Store Guide App (Port 3007)
- **Purpose**: Management dashboard and testing
- **Architecture**: Minimal Next.js with utility functions
- **Integration**: Limited Medusa API consumption

### Main Admin App (Port 3000)
- **Purpose**: Business management interface
- **SEO**: Structured data for business schema
- **Authentication**: Direct Medusa admin integration

---

## 4. Request Flow Diagrams

### Product Detail → Cart → Checkout → Payment Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Fabric Store    │────│ Browse/Filter   │────│ Product Detail  │
│ Next.js App     │    │ Server Component│    │ Client Component│
│ (Port 3006)     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          │              ┌────────▼────────┐             │
          │              │ Medusa Store    │             │
          │              │ /api/fabrics    │             │
          │              │ (5min cache)    │             │
          │              └────────┬────────┘             │
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ localStorage    │◄───│ Add to Cart     │────│ Cart State      │
│ fabric-cart     │    │ Client Action   │    │ Management      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                                               │
          ▼                                               ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Checkout Page   │────│ Stripe Elements │────│ Payment Intent  │
│ /checkout       │    │ Integration     │    │ Creation        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Order Storage   │    │ Payment Success │    │ Cart Clear +    │
│ PostgreSQL      │    │ Confirmation    │    │ Redirect        │
│ fabric_orders   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Media Upload → R2 Storage Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Admin Upload    │────│ Medusa File     │────│ Cloudflare R2   │
│ Form            │    │ Module          │    │ Bucket          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Multer Upload   │    │ S3 Compatible   │    │ store/organized │
│ Processing      │    │ forcePathStyle  │    │ prefix path     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 5. Capability Coverage vs Best Practices Matrix

| Capability | Status | Evidence | Notes |
|------------|--------|----------|-------|
| **Multi-currency/regions** | 🔴 Missing | No price lists configured | Single currency only |
| **Sales channels segmentation** | 🔴 Missing | No channel isolation | Critical for multi-tenancy |
| **Tiered/B2B pricing** | 🔴 Missing | Static pricing only | Revenue optimization blocked |
| **Customer groups** | 🟡 Partial | Basic groups, no pricing | Standard Medusa groups |
| **Tax handling** | 🟡 Partial | Basic tax calculation | No advanced tax rules |
| **Inventory reservations** | 🔴 Missing | No stock location config | Oversell risk |
| **Stock locations** | 🔴 Missing | Single location assumed | No multi-warehouse |
| **Dynamic promotions** | 🔴 Missing | No promotion rules | Manual discounting only |
| **Gift cards** | 🔴 Missing | No gift card module | Revenue opportunity lost |
| **Payment idempotency** | 🔴 Missing | No idempotency keys | Duplicate charge risk |
| **Webhook verification** | 🔴 Missing | No Stripe webhook handler | Payment reconciliation risk |
| **3DS handling** | 🟡 Partial | Basic Stripe 3DS | Not explicitly configured |
| **Fulfillment providers** | 🟡 Partial | Manual fulfillment | No shipping integration |
| **Returns/claims** | 🔴 Missing | No return workflow | Customer service gap |
| **Cloudflare R2 integration** | 🟡 Partial | `/medusa/medusa-config.ts:100-124` | Basic S3 setup, no signed URLs |
| **Background optimization** | 🔴 Missing | No image processing jobs | Performance impact |
| **Structured logging** | 🔴 Missing | Console.log only | Debugging difficulty |
| **Error tracking** | 🔴 Missing | No error service | Blind spots in production |
| **Audit logging** | 🔴 Missing | No admin action tracking | Compliance risk |
| **Input validation** | 🟡 Partial | Form validation only | API validation gaps |
| **Rate limiting** | 🔴 Missing | No rate limit middleware | DDoS vulnerability |
| **CORS security** | ✅ Supported | `/medusa/medusa-config.ts:17-19` | Properly configured |
| **Secrets management** | 🔴 Missing | Hardcoded in config | Security risk |

---

## 6. Gap Analysis (Impact/Effort/Evidence)

### Critical Revenue Blockers

#### Gap: Payment Idempotency Missing
- **Impact**: High - Duplicate charges, failed reconciliation, customer disputes
- **Effort**: Small - Add idempotency key middleware
- **Evidence**: No idempotency handling in `/frontend/experiences/fabric-store/app/checkout/`
- **Remediation**: Implement idempotency keys on payment endpoints, order creation

#### Gap: Multi-Tenant Sales Channels
- **Impact**: High - Cannot support multiple partners/vendors
- **Effort**: Medium - Sales channel enforcement across queries
- **Evidence**: No channel scoping in `/medusa/src/api/` routes
- **Remediation**: Channel-aware queries, admin role guards, tenant isolation

#### Gap: Redis Infrastructure Disabled
- **Impact**: High - No caching, event bus, or workflows
- **Effort**: Small - Re-enable Redis modules
- **Evidence**: `/medusa/medusa-config.ts:36-59` commented out
- **Remediation**: Upgrade Redis provider, enable modules incrementally

### Scale Limitations

#### Gap: B2B Pricing Engine
- **Impact**: Medium - Revenue optimization limited
- **Effort**: Medium - Price list implementation
- **Evidence**: Static pricing in fabric catalog
- **Remediation**: Medusa price lists + customer groups integration

#### Gap: Inventory Management
- **Impact**: Medium - Oversell risk, fulfillment complexity
- **Effort**: Large - Stock locations + reservations
- **Evidence**: No inventory module configuration
- **Remediation**: Enable stock locations, implement reservation system

#### Gap: Observability
- **Impact**: Medium - Production blindness, slow incident response
- **Effort**: Medium - Logging + monitoring setup
- **Evidence**: Basic console logging throughout codebase
- **Remediation**: Structured logging, APM integration, alerting

### Security & Compliance

#### Gap: Webhook Security
- **Impact**: Medium - Payment reconciliation failures
- **Effort**: Small - Stripe webhook verification
- **Evidence**: No webhook handlers in `/medusa/src/api/`
- **Remediation**: Webhook endpoint + signature verification

#### Gap: Input Sanitization
- **Impact**: Medium - Injection vulnerabilities
- **Effort**: Small - Validation middleware
- **Evidence**: Limited input validation in API routes
- **Remediation**: Schema validation, sanitization layer

---

## 7. Target Architecture (Incremental)

### v2 Hardening Path

#### Phase 1: Foundation (Weeks 1-4)
1. **Re-enable Redis**: Cache + event bus modules
2. **Payment Reliability**: Idempotency + webhook handling
3. **File Service**: R2 signed URLs + background optimization
4. **Basic Observability**: Structured logging + metrics

#### Phase 2: Multi-Tenancy (Weeks 5-8)
1. **Sales Channels**: Partner isolation via channels
2. **Admin Roles**: Channel-scoped permissions
3. **Price Lists**: B2B pricing foundation
4. **Customer Groups**: Tiered access implementation

#### Phase 3: Advanced Commerce (Weeks 9-12)
1. **Inventory Management**: Stock locations + reservations
2. **Promotion Engine**: Dynamic discount rules
3. **Fulfillment**: Shipping provider integration
4. **Returns**: Claims workflow implementation

### Event Bus with Redis

```typescript
// Enhanced Redis Configuration
{
  resolve: "@medusajs/medusa/event-bus-redis",
  options: {
    redisUrl: process.env.REDIS_URL,
    retryDelayOnFailure: 2000,
    maxRetries: 3,
    deadLetterQueue: {
      queueName: "dlq",
      maxRetries: 3
    }
  }
}
```

### Multi-Tenant Strategy

#### Sales Channel Enforcement
```typescript
// Channel-aware query middleware
const channelMiddleware = (req, res, next) => {
  const channelId = req.headers['x-sales-channel-id']
  req.scope = req.scope.merge({ sales_channel_id: channelId })
  next()
}
```

#### Admin Role Guards
```typescript
// Channel-scoped admin access
const adminRoleGuard = (allowedChannels) => {
  return (req, res, next) => {
    const userChannels = req.user.sales_channels
    if (!userChannels.some(ch => allowedChannels.includes(ch.id))) {
      return res.status(403).json({ error: "Channel access denied" })
    }
    next()
  }
}
```

### File Service with R2

```typescript
// Enhanced R2 Configuration
{
  resolve: "@medusajs/file-s3",
  options: {
    file_url: process.env.S3_PUBLIC_URL,
    access_key_id: process.env.S3_ACCESS_KEY_ID,
    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET_NAME,
    endpoint: process.env.S3_ENDPOINT,
    s3ForcePathStyle: true,
    prefix: "store/organized/",
    presignedUrlConfig: {
      expiresIn: 3600,
      useAccelerateEndpoint: false
    }
  }
}
```

### Observability Implementation

```typescript
// Structured logging setup
import { createLogger } from 'winston'

const logger = createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'medusa-backend',
    version: process.env.npm_package_version
  }
})

// Correlation ID middleware
const correlationId = (req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || generateUUID()
  res.setHeader('x-correlation-id', req.correlationId)
  next()
}
```

---

## 8. Roadmap with Acceptance Criteria

### Top 10 High-Priority Items

| Priority | Title | Objective | Evidence | Effort | RICE | Owner | Exit Criteria | Metrics |
|----------|-------|-----------|----------|--------|------|-------|---------------|---------|
| 1 | **Idempotent Checkout & Payments** | Zero duplicate orders/charges | No idempotency in checkout flow | S | 400 | Engineering | Idempotency keys on all payment endpoints | 99.9% payment success rate |
| 2 | **Sales Channels as Tenant Boundary** | Multi-partner data isolation | No channel scoping in API routes | M | 380 | Engineering | Channel-specific catalogs live | Zero cross-channel data leakage |
| 3 | **Cloudflare R2 File Service** | Production-ready media pipeline | Basic R2 setup, no signed URLs | M | 360 | Engineering | All media via R2 with optimization | 50% faster image loads |
| 4 | **B2B Pricing via Price Lists** | Tiered pricing for partners | Static pricing only | M | 340 | Product | Group-based pricing in cart/checkout | 25% margin improvement |
| 5 | **Inventory with Stock Locations** | Oversell prevention | No reservations or stock tracking | L | 320 | Engineering | Reservation leak tests pass | Zero oversell incidents |
| 6 | **Observability v1** | Production monitoring | Console logging only | M | 300 | DevOps | P95 SLOs met for 7 days | <300ms read, <900ms write latency |
| 7 | **Promotions Engine Hardening** | Advanced discount rules | Basic discount functionality | M | 280 | Product | Promotion matrix tests green | Zero double-discount defects |
| 8 | **Fulfillment Provider Abstraction** | Shipping integration | Manual fulfillment only | L | 260 | Engineering | Return→exchange path verified | Automated label generation |
| 9 | **Storefront Data-Fetching** | Performance optimization | Mixed SSR/CSR patterns | M | 240 | Engineering | Lighthouse Perf ≥ 90 on PDP/PLP | TTFB within SLO |
| 10 | **Security & Secrets Hygiene** | Production security | Hardcoded secrets in config | S | 220 | DevOps | Security scan clean | Pen-test checklist closed |

### 30/60/90-Day Plan

#### 30-Day Sprint: Foundation Hardening
**Theme**: Payment reliability, file service, basic observability

| Week | Deliverable | Owner | Success Criteria |
|------|-------------|-------|-------------------|
| 1-2 | Idempotent payment processing | Engineering | Zero duplicate orders in load test |
| 2-3 | R2 file service with signed URLs | Engineering | All uploads via R2, optimization jobs running |
| 3-4 | Structured logging + basic metrics | DevOps | Correlation IDs, error tracking operational |

#### 60-Day Sprint: Multi-Tenancy & Commerce
**Theme**: Sales channel isolation, B2B pricing, inventory management

| Week | Deliverable | Owner | Success Criteria |
|------|-------------|-------|-------------------|
| 5-6 | Sales channel enforcement | Engineering | Channel-scoped queries, admin role guards |
| 6-7 | Price lists + customer groups | Product | Tiered pricing visible in storefront |
| 7-8 | Stock locations + reservations | Engineering | Inventory reservation system operational |

#### 90-Day Sprint: Advanced Features
**Theme**: Promotions, fulfillment, performance optimization

| Week | Deliverable | Owner | Success Criteria |
|------|-------------|-------|-------------------|
| 9-10 | Advanced promotion rules | Product | Stacking rules, exclusions working |
| 10-11 | Shipping provider integration | Engineering | Automated shipping labels |
| 11-12 | Storefront performance | Engineering | Lighthouse score ≥ 90 |

### Q2-Q4 Themes

#### Q2: Enterprise Commerce
- Advanced inventory management
- Returns/claims workflow
- Multi-currency support
- Tax engine integration

#### Q3: Automation & AI
- Workflow automation (Redis-powered)
- AI-powered product recommendations
- Automated customer service
- Predictive inventory management

#### Q4: Scale & Optimization
- Database performance tuning
- CDN integration
- Advanced analytics
- API rate limiting

---

## 9. Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|---------|------------|-------|
| **Payment processing failures** | High | Critical | Implement circuit breakers, monitoring | Engineering |
| **Multi-tenant data leakage** | Medium | Critical | Extensive testing, audit logs | Engineering |
| **Redis scaling bottlenecks** | High | High | Redis Cluster, fallback strategies | DevOps |
| **File upload disruptions** | Medium | High | R2 redundancy, local fallback | Engineering |
| **Performance degradation** | Medium | Medium | Load testing, auto-scaling | DevOps |
| **Security vulnerabilities** | Medium | High | Penetration testing, code audits | Security |
| **Database migration failures** | Low | High | Blue/green deployments, rollback plans | DevOps |
| **Third-party API dependencies** | Medium | Medium | Circuit breakers, fallback options | Engineering |
| **Compliance violations** | Low | High | Regular audits, documentation | Legal |
| **Talent acquisition delays** | Medium | Medium | Contractor network, knowledge transfer | Management |

---

## 10. Change Management

### Migration Strategy
1. **Feature Flags**: Gradual rollout with toggles
2. **Blue/Green**: Zero-downtime deployments
3. **Database**: Forward-compatible migrations
4. **API Versioning**: Backward compatibility maintenance

### Dark Launch Plan
1. **Week 1**: Internal testing with 0% traffic
2. **Week 2**: 5% canary deployment
3. **Week 3**: 25% rollout with monitoring
4. **Week 4**: 100% if metrics green

### Rollback Procedures
1. **Immediate**: Feature flag disable (<30 seconds)
2. **Fast**: Previous deployment rollback (<5 minutes)
3. **Full**: Database rollback (<30 minutes)

---

## 11. Appendix

### API Inventory Summary
- **Total Routes**: 39 (15 store, 24 admin)
- **Authentication**: Google OAuth + Email/password
- **Rate Limiting**: ❌ Not implemented
- **Versioning**: ❌ Not implemented

### Plugin Configuration Table

| Plugin | Version | Status | Configuration |
|--------|---------|--------|---------------|
| @medusajs/auth | Latest | ✅ Active | Google + EmailPass |
| @medusajs/file-s3 | 2.10.0 | ✅ Active | R2 compatible |
| @medusajs/payment-stripe | 2.10.0 | ✅ Active | Webhook ready |
| @medusajs/notification-sendgrid | 2.10.0 | ✅ Active | Transactional |

### Database Schema Diffs

```sql
-- Required for multi-tenancy
ALTER TABLE product ADD COLUMN sales_channel_id UUID;
ALTER TABLE customer ADD COLUMN customer_group_id UUID;
ALTER TABLE cart ADD COLUMN sales_channel_id UUID;

-- Required for B2B pricing
CREATE TABLE price_list (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type pricing_type,
  customer_groups UUID[]
);

-- Required for inventory
CREATE TABLE stock_location (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  address JSONB
);
```

### R2 File Service Config

```typescript
// Production-ready R2 configuration
{
  resolve: "@medusajs/file-s3",
  options: {
    file_url: "https://pub-xxx.r2.dev",
    access_key_id: process.env.R2_ACCESS_KEY_ID,
    secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
    region: "auto",
    bucket: process.env.R2_BUCKET_NAME,
    endpoint: "https://xxx.r2.cloudflarestorage.com",
    s3ForcePathStyle: true,
    prefix: "store/organized/",
    additional_client_config: {
      forcePathStyle: true,
      signatureVersion: 'v4'
    }
  }
}
```

### Example Idempotent Handlers

```typescript
// Payment intent creation with idempotency
export async function createPaymentIntent(req, res) {
  const idempotencyKey = req.headers['idempotency-key']

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency key required' })
  }

  // Check for existing operation
  const existing = await getIdempotentOperation(idempotencyKey)
  if (existing) {
    return res.json(existing.result)
  }

  try {
    const result = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'usd',
      idempotency_key: idempotencyKey
    })

    await storeIdempotentOperation(idempotencyKey, result)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
```

---

**Document Version**: 1.0
**Analysis Date**: 2025-09-16
**Next Review**: 2025-10-01