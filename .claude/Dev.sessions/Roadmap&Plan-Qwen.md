# Tara Hub - $50M ARR Product Roadmap & Plan

## Executive Summary

Tara Hub is a sophisticated Next.js 15 fabric marketplace platform with a MedusaJS v2 backend, built as a monorepo using Turbo. The platform currently supports a single-tenant fabric marketplace with a working storefront, admin dashboard, and rich domain model for fabric products. However, to reach $50M ARR, the platform needs to evolve into a multi-tenant, AI-powered e-commerce solution for SMBs with robust agent orchestration, marketplace integrations, and partner onboarding capabilities.

**Current State**: Single-tenant fabric marketplace with strong technical foundations but missing key platform primitives (multi-tenancy, agent core, marketplace syncs, advanced pricing).

**Target State**: Multi-tenant AI-powered e-commerce platform with SMB automation, marketplace integrations, and partner ecosystem.

**Key Gaps**: Multi-tenancy, agent orchestration, marketplace syncs, advanced pricing engine, partner onboarding flows.

## System Map

### Packages & Applications

1. **Main Admin Dashboard** (`/`) - Next.js 15 admin interface (port 3000)
2. **Medusa Backend** (`/medusa`) - E-commerce backend with custom modules (port 9000)
3. **Fabric Store Experience** (`/frontend/experiences/fabric-store`) - Customer storefront (port 3006)
4. **Store Guide Experience** (`/frontend/experiences/store-guide`) - Partner management (port 3007)
5. **Sanity Studio** (`/frontend/experiences/sanity-studio`) - Content management
6. **Backend Services** (`/backend`) - Clean architecture domain layer
7. **Fabric API** (`/backend/fabric-api`) - Express API for fabric data

### Core Services & Infrastructure

- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Caching**: Vercel KV (Redis) with hybrid strategy
- **Storage**: Cloudflare R2 for assets
- **Authentication**: JWT-based magic links
- **Payment**: Stripe integration
- **Email**: Resend API
- **Content**: Sanity CMS

### Entry Points

- **Next.js App Router**: `/app` for admin dashboard
- **Express API**: `/backend/fabric-api/server.js`
- **Medusa API**: `/medusa/src/api`
- **Medusa Admin**: `/medusa/src/admin`

### Next.js Routing

- **App Router** (Next.js 15) for all frontend applications
- **Dynamic routes** for fabrics, products, and admin sections
- **Middleware** for authentication and tenant resolution

### Medusa Customizations

- **Contact Module**: Contact form submissions
- **Fabric Details Module**: Fabric properties and specifications
- **Fabric Products Module**: Configurable fabric products
- **Materials Module**: Simplified materials sync
- **Resend Notification Module**: Email notifications

### Sanity Schemas

- **Fabric Schema**: Comprehensive fabric product definition
- **Hero Slide Schema**: Carousel content management

### Database Schema Objects

- **fabrics**: Core fabric entity with 60+ properties
- **fabric_price_history**: Price change tracking
- **fabric_stock_movements**: Inventory movements
- **fabric_images**: Image management with R2 integration
- **users, accounts, sessions**: Authentication
- **login_attempts, verification_tokens**: Security

### Redis Usage

- **Caching Strategy**: Hybrid Redis/Memory with fallback
- **Container Integration**: Redis-ready DI container
- **Cache Keys**: Search results, fabric details
- **Current Status**: Disabled in Medusa, available in backend

### R2 Buckets

- **Configuration**: S3-compatible with Cloudflare R2
- **Usage**: Fabric images, swatches, textures
- **Integration**: Medusa S3 plugin, direct R2 access

## Current Capability vs. Objective Matrix

| Objective | Status | Evidence | Notes |
|-----------|--------|----------|-------|
| 1. AI Agentic E-commerce for SMBs | **Missing** | No agent core or tool registry found | Foundations exist in backend but not wired |
| 2. Agent↔Agent (A2A) workflows | **Missing** | No workflow engine or messaging system | Need Redis-based job queue |
| 3. Business→Agent (B2A) automation | **Missing** | No automation framework | Need Etsy/marketplace sync services |
| 4. Agent→Business (A2B) actions | **Missing** | No quotation or RFQ workflow | Need approval workflows and integrations |
| 5. Multi-tenant web & mobile storefronts | **Partial** | Tenant resolution in middleware but no tenant_id in schemas | Gap in data isolation |
| 6. Marketplace + collaboration hub | **Missing** | No collaboration features | Need RFQ, quoting, partner directory |
| 7. Multiple AI Agents for SMB E-commerce | **Missing** | No agent orchestration | Need tool registry and job queue |
| 8. Production System for SMB | **Partial** | Inventory management exists | Need manufacturing workflows |
| 9. Lead Generation, Social Media Marketing | **Missing** | No marketing automation | Need campaign management |
| 10. Campaigns Management | **Missing** | No campaign system | Need marketing calendar |
| 11. Vault for managing files | **Partial** | R2 storage exists | Need document management UI |
| 12. B2B tools (quotation management) | **Missing** | No quoting system | Need RFQ workflows |
| 13. Rapid product creation | **Partial** | Fabric creation exists | Need templates and bulk import |
| 14. SEO Improvements | **Partial** | Basic SEO fields exist | Need optimization tools |
| 15. Automatic Blog Publishing | **Missing** | No blog automation | Need CMS integration |

## Gap Analysis

### Architecture Gaps

| Gap | Impact | Effort | Evidence | Remediation |
|-----|--------|--------|----------|-------------|
| **Agent Orchestration** | Critical for SMB automation | L | `/scripts/ - Basic automation scripts exist but no agent framework` | Build Redis-based job queue + state store |
| **Event Bus** | Critical for distributed workflows | M | No pub/sub system | Implement Redis Streams for agent events |
| **Idempotency & Retries** | Critical for marketplace syncs | M | No retry mechanisms | Add idempotency keys to APIs |
| **Dead-letter Handling** | Critical for reliability | M | No DLQ implementation | Add dead letter queues for failed jobs |
| **Observability** | Critical for SLOs | M | Basic logging only | Add structured logs, traces, metrics |
| **AuthN/Z** | Critical for multi-tenancy | L | Basic JWT auth exists | Add tenant-aware authZ, RBAC |
| **Rate Limits** | Critical for platform stability | L | No rate limiting | Add per-tenant rate limiting |

### Product Gaps

| Gap | Impact | Effort | Evidence | Remediation |
|-----|--------|--------|----------|-------------|
| **Partner Onboarding** | Critical for growth | M | No self-serve onboarding | Build templates + Sanity-driven setup |
| **Catalog Ingestion** | Critical for marketplace | M | No bulk import | Add CSV/API ingestion with validation |
| **Marketplace Syncs** | Critical for revenue | L | `/app/admin/etsy-products/ - UI exists but no API integration` | Build Etsy/Amazon integration |
| **Pricing Engine** | Critical for competitiveness | M | Basic pricing exists | Add rule engine + AB testing |
| **Image/Asset Pipelines** | High for experience | M | Basic R2 integration | Add transforms, optimization, CDN |
| **Negotiation/RFQ Flows** | Critical for B2B | L | No quotation system | Add A2B quoting workflows |
| **Roles/Permissions** | Critical for security | L | Basic role system | Add fine-grained RBAC |
| **Billing** | Critical for monetization | L | No billing system | Add subscription management |

### Data Gaps

| Gap | Impact | Effort | Evidence | Remediation |
|-----|--------|--------|----------|-------------|
| **Postgres Normalization** | Medium for performance | M | Mixed schema design | Normalize key entities |
| **Search (Facets)** | High for UX | M | Basic text search only | Add GIN indexes, faceting |
| **Caching Strategy** | Medium for performance | L | Hybrid cache exists | Optimize cache keys, TTLs |
| **Migration Hygiene** | Low for maintenance | L | Migrations exist | Add rollback scripts |
| **PII/PCI Boundaries** | Critical for compliance | M | No data classification | Add encryption, tokenization |

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Admin App   │  │ Fabric Store │  │ Store Guide  │  │ Sanity Studio│      │
│  │ (Next.js)   │  │ (Next.js)    │  │ (Next.js)    │  │ (React)      │      │
│  └─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                           API GATEWAY                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Proxy  │  │ Rate Limiter │  │ Tenant Guard │  │ CORS Handler │      │
│  └─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                           SERVICE LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Agent Core  │  │ Medusa API   │  │ Fabric API   │  │ Content API  │      │
│  │ (BullMQ)    │  │ (Medusa)     │  │ (Express)    │  │ (Sanity)     │      │
│  └─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                        ORCHESTRATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Job Queue   │  │ Event Bus    │  │ State Store  │  │ Tool Registry│      │
│  │ (Redis/Bull)|  │ (Redis)      │  │ (Postgres)   │  │ (Postgres)   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                           DOMAIN LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Fabric      │  │ Pricing      │  │ Inventory    │  │ Partnership  │      │
│  │ (Entity)    │  │ (Service)    │  │ (Service)    │  │ (Aggregate)  │      │
│  └─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                          INFRASTRUCTURE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL  │  │ Redis        │  │ Cloudflare   │  │ Stripe       │      │
│  │ (Neon)      │  │ (Upstash)    │  │ R2           │  │ Payments     │      │
│  └─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Evolution from Current Code

1. **Agent Core**: New service using Redis (BullMQ) + Postgres tables for agent state; expose HTTP tools
2. **Event Bus**: Add Redis Streams/publish in Medusa hooks and Next APIs; subscribe for syncs, pricing updates
3. **Multi-tenant**: Add `tenant_id` to Medusa custom resources/materials and app DB; propagate from middleware to APIs
4. **Commerce Plane**: Enable Redis modules when available, add order webhooks, pricing hooks
5. **Content Plane**: Enhance Sanity schemas for landing, PLP/PDP content, partner pages; add ISR hooks
6. **Asset Plane**: Add signed URLs, transforms, background optimization jobs
7. **Observability**: Add structured logs, traces, metrics dashboards; define SLOs

## $50M Revenue Model & Growth Levers

### Bottom-Up Model

**Revenue Streams**:
1. **SaaS Subscriptions**: $500-5,000/month per partner storefront
2. **Transaction Fees**: 2-5% on GMV from marketplace integrations
3. **AI Agent Services**: $100-1,000/month per active agent
4. **Marketplace Listings**: $50-500/month per integrated channel

**Projection**:
- **Year 1**: 100 partners × $1,000 avg = $1.2M ARR
- **Year 2**: 500 partners × $1,500 avg + 10% GMV fee = $9M ARR
- **Year 3**: 2,000 partners × $2,000 avg + 15% GMV fee = $48M ARR

### Growth Levers

| Lever | Impact | KPI | Feature Tie-in |
|-------|--------|-----|----------------|
| **Listing Automation** | High GMV uplift | 25% increase in listings | Etsy/Amazon sync services |
| **A2A Quoting** | Higher close rate | 40% faster quotes | RFQ workflow system |
| **Storefront Templates** | Faster onboarding | 50% reduced setup time | Partner onboarding flows |
| **Auto-pricing** | Margin optimization | 15% improved margins | Pricing engine |
| **Content Generation** | SEO improvement | 3x organic traffic | AI content tools |
| **Inventory Sync** | Reduced stockouts | 99% availability | Multi-channel sync |

### PMF Milestones

1. **Milestone 1**: 50 active partners with $10K+ GMV/month
2. **Milestone 2**: 200 partners with integrated marketplace listings
3. **Milestone 3**: 1,000 partners with AI agent automation
4. **Milestone 4**: $10M ARR with 30% MoM growth

## Prioritized Roadmap

### 30/60/90-Day Plan

#### 30 Days

| Priority | Title | Objective | Evidence | Effort | RICE | Owner | Exit Criteria | Metrics |
|----------|-------|-----------|----------|--------|------|-------|---------------|---------|
| 1 | Multi-Tenant Foundation | Enable partner isolation | `/backend/infrastructure/database/migrations/ - No tenant_id columns found` | L | 400 | Engineering | All database tables have tenant_id column | 100% schema coverage with tenant_id |
| 2 | Agent Core v1 | Basic agent orchestration | `/scripts/ - Basic automation scripts exist but no agent framework` | M | 350 | Engineering | Redis job queue operational | Job processing latency <5s |
| 3 | Etsy Sync Service | Marketplace synchronization | `/app/admin/etsy-products/ - UI exists but no API integration` | M | 320 | Engineering | Etsy API integration with OAuth | Sync latency <30s for product updates |
| 4 | Pricing & Promotions Service | Advanced pricing engine | Basic pricing exists but no rule engine | M | 300 | Product | Rule engine with AB testing | 95% pricing accuracy |
| 5 | Partner Onboarding Flows | Self-serve setup | No self-serve onboarding | M | 280 | Product | Storefront templates deployed | 50% faster onboarding |

#### 60 Days

| Priority | Title | Objective | Evidence | Effort | RICE | Owner | Exit Criteria | Metrics |
|----------|-------|-----------|----------|--------|------|-------|---------------|---------|
| 6 | Search & Faceting | Enhanced product discovery | Basic text search only | M | 250 | Engineering | PostgreSQL GIN indexes deployed | 3x search performance |
| 7 | Asset Pipeline on R2 | Optimized media delivery | Basic R2 integration | M | 240 | Engineering | Background optimization jobs | 50% image load time reduction |
| 8 | Observability v1 | Platform monitoring | Basic logging only | M | 230 | DevOps | SLO dashboards operational | 99.5% uptime, <300ms P95 |
| 9 | Checkout Hardening | Reliable transactions | Basic Stripe integration | M | 220 | Engineering | Idempotent order processing | 99.9% checkout success |
| 10 | Collaboration & RFQ | B2B workflows | No quotation system | M | 210 | Product | Quote generation with approval workflow | 80% of quotes auto-generated |

#### 90 Days

| Priority | Title | Objective | Evidence | Effort | RICE | Owner | Exit Criteria | Metrics |
|----------|-------|-----------|----------|--------|------|-------|---------------|---------|
| 11 | Sanity Schema Hardening | Content management | Basic Sanity schemas | L | 200 | Product | Partner pages with ISR | 90% content cache hit rate |
| 12 | Growth Experiments Pack | Revenue optimization | No experimentation framework | M | 190 | Growth | KPI instrumentation complete | 3 experiments running |

### Quarter 2–4 Themes

#### Q2: Platform Foundation
- Complete multi-tenancy implementation
- Deploy agent orchestration core
- Launch marketplace integrations
- Implement advanced pricing engine

#### Q3: Partner Growth
- Scale partner onboarding
- Optimize search and discovery
- Enhance collaboration tools
- Deploy growth experimentation

#### Q4: AI & Automation
- Launch AI agent services
- Implement auto-content generation
- Add predictive analytics
- Optimize for $10M ARR milestone

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Redis Availability** | High | Medium | Use hybrid cache strategy, fallback to memory |
| **Medusa Redis Modules** | High | High | Enable when Upstash quota available |
| **Tenant Data Leakage** | Critical | Low | Implement RLS, audit logging |
| **Marketplace Sync Failures** | High | Medium | Add retry logic, DLQ, monitoring |
| **Performance Degradation** | High | Medium | Implement observability, SLOs |
| **Security Vulnerabilities** | Critical | Low | Regular security audits, penetration testing |
| **Compliance Issues** | High | Low | Implement data classification, encryption |
| **Partner Adoption** | High | Medium | User research, feedback loops |
| **Agent Reliability** | High | Medium | Add error handling, monitoring |
| **Integration Complexity** | High | High | Start with simple APIs, iterate |

## Deliverables

### Executive Summary

Tara Hub has strong technical foundations but needs to evolve from a single-tenant fabric marketplace to a multi-tenant AI-powered e-commerce platform. The roadmap prioritizes platform primitives (multi-tenancy, agent core) while delivering revenue-driving features (marketplace syncs, partner onboarding). With proper execution, the platform can reach $50M ARR through SaaS subscriptions, transaction fees, and AI services.

### System Map + Capability Matrix

See above sections for detailed system map and capability matrix.

### Top 12 High-Priority Items

| Priority | Title | Objective | Status | RICE | Effort |
|----------|-------|-----------|--------|------|--------|
| 1 | Multi-Tenant Foundation | Enable partner isolation | Missing | 400 | L |
| 2 | Agent Core v1 | Basic agent orchestration | Missing | 350 | M |
| 3 | Etsy Sync Service | Marketplace synchronization | Missing | 320 | M |
| 4 | Pricing & Promotions Service | Advanced pricing engine | Missing | 300 | M |
| 5 | Partner Onboarding Flows | Self-serve setup | Missing | 280 | M |
| 6 | Search & Faceting | Enhanced product discovery | Missing | 250 | M |
| 7 | Asset Pipeline on R2 | Optimized media delivery | Missing | 240 | M |
| 8 | Observability v1 | Platform monitoring | Missing | 230 | M |
| 9 | Checkout Hardening | Reliable transactions | Missing | 220 | M |
| 10 | Collaboration & RFQ | B2B workflows | Missing | 210 | M |
| 11 | Sanity Schema Hardening | Content management | Missing | 200 | L |
| 12 | Growth Experiments Pack | Revenue optimization | Missing | 190 | M |

### 30/60/90 Roadmap + Q2–Q4 Theme Plan

See above sections for detailed roadmap and theme plan.

### Risk Register

See above section for detailed risk register.

### Appendix

#### API Inventory

**Current APIs**:
- `/api/fabrics` - Fabric search and listing
- `/api/fabrics/:id` - Fabric details
- `/api/fabric-collections` - Collections listing
- `/api/fabric-categories` - Categories listing
- Medusa store API - Customer endpoints
- Medusa admin API - Management endpoints

**Missing APIs**:
- Agent orchestration APIs
- Marketplace sync APIs
- Quoting/RFC APIs
- Partner management APIs

#### DB Schema Deltas

**Add tenant_id to**:
- fabrics
- fabric_price_history
- fabric_stock_movements
- fabric_images
- users
- orders (Medusa)
- products (Medusa)
- materials (Medusa)

**New tables**:
- agent_runs
- agent_tasks
- audit_log
- partner_configurations
- pricing_rules
- marketplace_listings

#### Sanity Schema Recommendations

**Enhance fabric schema**:
- Add tenant_id field
- Add marketplace_sync_status field
- Add auto_pricing_rules field

**New schemas**:
- partner_page: Partner-specific landing pages
- campaign: Marketing campaigns
- quote: B2B quotations
- rfq: Request for quotation

#### Medusa Plugin Plan

**Enable Redis modules**:
- Cache Redis
- Event Bus Redis
- Workflow Engine Redis

**Add custom plugins**:
- Marketplace sync plugin
- Pricing engine plugin
- Agent orchestration plugin

#### Observability Plan

**Add structured logging**:
- Request tracing
- Error tracking
- Performance metrics

**Implement monitoring**:
- Uptime monitoring
- Performance SLOs
- Business metrics dashboards

**Define SLOs**:
- API P95 latency < 300ms
- Checkout success rate > 99.9%
- Job processing latency < 5s