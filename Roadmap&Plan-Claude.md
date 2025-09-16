# Tara Hub: $50M ARR Product Roadmap & Strategic Plan

## Executive Summary

Tara Hub is a Next.js 15/MedusaJS v2 fabric marketplace platform with strong technical foundations but limited agent automation and multi-tenancy capabilities. Current architecture supports ~$2-5M ARR through single-tenant fabric commerce. **To reach $50M ARR**, we need: (1) Multi-tenant agent automation for SMB e-commerce, (2) Marketplace sync engine for Etsy/Amazon, (3) A2A/B2A workflow orchestration, and (4) Partner storefront templates. The platform has excellent bones—modern stack, clean architecture, extensible modules—but requires strategic pivots toward AI-first automation and true multi-tenancy. **Working Theory**: 10,000 partners × $5,000 ARPA reaches $50M ARR through agent-powered automation that increases GMV by 3-5x per partner.

---

## 1. System Map & Current Architecture

### 1.1 Package/Service Inventory

| Component | Port | Framework | Purpose | Key Files |
|-----------|------|-----------|---------|-----------|
| **Main Admin** | 3000 | Next.js 15 | Internal dashboard | `/app/page.tsx`, `/app/api/auth/` |
| **Medusa Backend** | 9000 | MedusaJS v2 | E-commerce API | `/medusa/medusa-config.ts`, `/medusa/src/api/` |
| **Fabric Store** | 3006 | Next.js | Customer storefront | `/frontend/experiences/fabric-store/` |
| **Store Guide** | 3007 | Next.js | Management tools | `/frontend/experiences/store-guide/` |
| **Sanity Studio** | - | Sanity CMS | Content management | `/frontend/experiences/sanity-studio/` |
| **Backend Service** | - | Clean Architecture | Domain layer | `/backend/domain/`, `/backend/application/` |

### 1.2 Database Schema Objects

| Schema | ORM | Key Tables | Purpose | Location |
|--------|-----|------------|---------|----------|
| **Auth** | Drizzle | `users`, `accounts`, `sessions` | NextAuth integration | `/backend/infrastructure/database/migrations/0000_*.sql` |
| **Contacts** | MikroORM | `contact` | Lead management | `/medusa/src/modules/contact/models/contact.ts` |
| **Fabrics** | MikroORM | `product_fabric_config`, `order_fabric_selections` | Product configuration | `/medusa/src/modules/fabric_products/migrations/` |
| **Materials** | MikroORM | Materials tables | Inventory sync | `/medusa/src/modules/materials/` |

### 1.3 API Inventory (File-Path-Cited)

| Type | Endpoint | Implementation | Purpose |
|------|----------|----------------|---------|
| **HTTP** | `/api/auth/*` | `/app/api/auth/` | Google OAuth, session management |
| **HTTP** | `/api/fabrics/` | `/app/api/fabrics/route.ts:1-45` | PostgreSQL fabric queries with mock fallback |
| **HTTP** | `/admin/contact/` | `/medusa/src/api/admin/contact/route.ts:1-78` | Contact CRUD, statistics |
| **HTTP** | `/store/*` | Medusa core | Product catalog, checkout |
| **Background** | Fabric sync | `/scripts/sync-fabrics-to-materials.ts:1-120` | Data synchronization |
| **Background** | Material sync | `/medusa/src/scripts/sync-materials.ts:1-85` | Inventory updates |

### 1.4 Request Flow Analysis

#### Product Detail Page Flow:
1. **Frontend**: `/frontend/experiences/fabric-store/` → Sanity CMS fabric schema
2. **API**: Sanity GraphQL → Fabric data (`/frontend/experiences/sanity-studio/schemaTypes/fabric.ts:1-303`)
3. **Medusa**: Product API → Inventory/pricing (`/medusa/src/modules/fabric_products/`)
4. **Cache**: Vercel KV (Redis) fallback → Memory

#### Cart/Checkout Flow:
1. **Stripe**: Payment processing via Medusa Stripe module
2. **Orders**: `/medusa/src/modules/fabric_products/` → Custom fabric selection logic
3. **Fulfillment**: Basic order management, no automation

---

## 2. Current Capability vs. Objective Matrix

| Objective | Status | Evidence | Gap Analysis |
|-----------|--------|----------|--------------|
| **1. AI Agentic E-commerce** | ❌ Missing | No agent core found | Need agent orchestration, tool registry |
| **2. Agent↔Agent (A2A)** | ❌ Missing | No A2A workflows | Need event bus, state management |
| **3. Business→Agent (B2A)** | 🟡 Partial | Basic scripts in `/scripts/` | Need job queue, HITL checkpoints |
| **4. Agent→Business (A2B)** | ❌ Missing | No quotation/RFQ system | Need collaboration module |
| **5. Multi-tenant Storefronts** | ❌ Missing | Single-tenant architecture | Need tenant isolation, partner onboarding |
| **6. Marketplace Hub** | 🟡 Partial | Etsy UI (`/app/admin/etsy-products/`) | Need sync engine, API integrations |
| **7. Multiple AI Agents** | ❌ Missing | No agent specialization | Need agent skills registry |
| **8. Production System** | 🟡 Partial | Basic order management | Need workflow automation |
| **9. Lead Generation** | 🟡 Partial | Contact module (`/medusa/src/modules/contact/`) | Need automation, multichannel |
| **10. Campaign Management** | ❌ Missing | No campaign tools | Need calendar, automation |
| **11. Asset Vault** | 🟡 Partial | R2 storage configured | Need asset pipeline, transforms |
| **12. B2B Tools** | 🟡 Partial | Basic contact management | Need quotation engine, pricing |
| **13. Rapid Product Creation** | 🟡 Partial | Fabric product module | Need automation, AI generation |
| **14. SEO Improvements** | 🟡 Partial | Next.js ISR capability | Need automated content, schema |
| **15. Auto Blog Publishing** | ❌ Missing | Basic blog UI exists | Need AI content generation |

---

## 3. Gap Analysis (Engineering + Product)

### 3.1 Architecture Gaps

| Gap | Impact | Effort | Evidence | Remediation |
|-----|--------|--------|----------|-------------|
| **Agent Orchestration** | 🔴 Critical | L | No agent core found | Build Redis-based job queue + state store |
| **Multi-tenant Isolation** | 🔴 Critical | L | No `tenant_id` in schemas | Add tenant boundaries, row-level security |
| **Event Bus** | 🟡 High | M | No pub/sub system | Implement Redis Streams for agent events |
| **Idempotency** | 🟡 High | S | No retry/dedup logic | Add idempotency keys to critical APIs |
| **Observability** | 🟡 High | M | Basic logging only | Structured logs, traces, SLO dashboards |

### 3.2 Product Gaps

| Gap | Impact | Effort | Evidence | Remediation |
|-----|--------|----------|----------|-------------|
| **Marketplace Sync** | 🔴 Critical | L | Etsy UI but no API (`/app/admin/etsy-products/`) | Build Etsy/Amazon sync service |
| **Partner Onboarding** | 🔴 Critical | L | No self-serve flow | Storefront templates + domain binding |
| **Pricing Engine** | 🟡 High | M | Static pricing only | Rule engine + A/B testing framework |
| **Search/Faceting** | 🟡 High | M | Basic Sanity queries | Postgres GIN indexes + Redis cache |
| **Asset Pipeline** | 🟡 High | M | R2 storage basic | Signed URLs, transforms, optimization |

### 3.3 Data Gaps

| Gap | Impact | Effort | Evidence | Remediation |
|-----|--------|----------|----------|-------------|
| **Search Performance** | 🟡 High | M | No full-text indexes | Add Postgres trigram, GIN indexes |
| **Caching Strategy** | 🟡 High | S | Redis disabled (`/medusa/medusa-config.ts:36-59`) | Re-enable Redis, cache invalidation |
| **Migration Hygiene** | 🟡 Medium | S | 8 migrations, good structure | Add migration testing, rollback procedures |

---

## 4. Target Architecture (Incremental Evolution)

### 4.1 Agent Core Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Agent Core    │────│   Job Queue      │────│   State Store   │
│   (Node.js)     │    │   (Redis)        │    │   (Postgres)    │
│                 │    │                  │    │                 │
│ • Tool Registry │    │ • Priority Queue │    │ • Agent State   │
│ • HITL Checkpts │    │ • Dead Letter    │    │ • Conversation  │
│ • Skill Manager │    │ • Retry Logic    │    │ • Tool Results  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Event Bus (Redis Streams)                    │
│  • Agent Events  • Catalog Sync  • Order Lifecycle  • HITL     │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Path**:
1. Add Redis job queue to existing Medusa setup
2. Extend contact module for agent state storage
3. Build tool registry in `/backend/application/services/`

### 4.2 Multi-Tenant Enforcement

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Tenant Guard  │────│   Row-Level Sec  │────│   Audit Logger  │
│   (Middleware)  │    │   (Postgres RLS) │    │   (Event Store) │
│                 │    │                  │    │                 │
│ • tenant_id     │    │ • Policy Rules   │    │ • User Actions  │
│ • Rate Limits   │    │ • Schema Guards  │    │ • Data Changes  │
│ • API Keys      │    │ • Query Filters  │    │ • Agent Events  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Implementation Path**:
1. Add `tenant_id` to all schemas (`/backend/infrastructure/database/migrations/`)
2. Update Medusa auth to inject tenant context
3. Add RLS policies for data isolation

### 4.3 Commerce + Content Plane Integration

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Medusa Core   │────│   Pricing Svc    │────│   Sanity CMS    │
│   (Commerce)    │    │   (Rules Engine) │    │   (Content)     │
│                 │    │                  │    │                 │
│ • Products      │    │ • Dynamic Rules  │    │ • Partner Pages │
│ • Inventory     │    │ • A/B Testing    │    │ • PLP/PDP       │
│ • Orders        │    │ • Promotion Eng  │    │ • ISR/Webhooks  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Asset Plane (Cloudflare R2 + CDN)                 │
│  • Signed URLs  • Image Transforms  • Background Optimization   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. $50M Revenue Model & Growth Levers (Working Theory)

### 5.1 Bottom-Up Revenue Model

| Segment | Partners | Storefronts/Partner | Avg GMV/Storefront | Take Rate | Annual Revenue |
|---------|----------|---------------------|-------------------|-----------|----------------|
| **Custom Cushion Makers** | 2,000 | 1.2 | $150K | 3% | $10.8M |
| **Interior Designers** | 3,000 | 1.5 | $200K | 2.5% | $22.5M |
| **Fabric Manufacturers** | 500 | 2.0 | $500K | 2% | $10M |
| **Marketing Agencies** | 1,000 | 3.0 | $100K | 4% | $12M |
| **Influencers** | 3,500 | 1.0 | $50K | 5% | $8.75M |
| **Total** | **10,000** | **1.6 avg** | **$180K avg** | **3.2% avg** | **$50.1M** |

### 5.2 Growth Levers

| Lever | Feature Tie | Impact Hypothesis | Measurement |
|-------|-------------|-------------------|-------------|
| **Listing Automation** | Agent auto-publishes to Etsy/Amazon | +200% GMV per partner | Listings/week, conversion rate |
| **A2A Quoting** | Agents negotiate B2B deals | +40% close rate | Quote volume, conversion |
| **Storefront Templates** | Self-serve partner onboarding | -60% onboarding time | Time to first sale |
| **AI Content Generation** | Auto blogs, SEO, social | +150% organic traffic | Page views, search ranking |
| **Dynamic Pricing** | Real-time market pricing | +25% margins | Price elasticity, revenue |
| **Inventory Sync** | Multi-channel sync | -80% stockouts | Fulfillment rate, satisfaction |
| **Lead Qualification** | AI screens inquiries | +300% sales efficiency | Lead score accuracy, conversion |
| **Campaign Automation** | Multi-channel marketing | +180% marketing ROI | Campaign performance, ROAS |

---

## 6. Top 12 High-Priority Items

| Priority | Title | Objective | Evidence | Effort | RICE | Owner | Exit Criteria |
|----------|-------|-----------|----------|--------|------|-------|---------------|
| 1 | **Multi-Tenant Foundation** | Enable partner isolation | No `tenant_id` in schemas | L | 400 | Engineering | RLS policies active, tenant auth |
| 2 | **Agent Core v1** | Basic agent orchestration | No agent system found | L | 380 | Engineering | Job queue + tool registry working |
| 3 | **Etsy Sync Service** | Marketplace automation | UI exists (`/app/admin/etsy-products/`) | L | 360 | Engineering | Bi-directional sync, 99% uptime |
| 4 | **Partner Onboarding** | Self-serve storefront creation | No onboarding flow | M | 340 | Product | <10min time to first storefront |
| 5 | **Pricing Engine** | Dynamic pricing rules | Static pricing only | M | 320 | Engineering | A/B testing, rule engine live |
| 6 | **Search & Faceting** | Product discovery | Basic Sanity queries | M | 300 | Engineering | <200ms query response |
| 7 | **Asset Pipeline** | R2 optimization | Basic R2 setup | M | 280 | Engineering | Auto-transforms, signed URLs |
| 8 | **Observability v1** | SLO monitoring | Basic logging only | M | 260 | DevOps | P95 <300ms read, <900ms write |
| 9 | **Checkout Hardening** | Payment reliability | Basic Stripe integration | S | 240 | Engineering | 99.9% payment success rate |
| 10 | **RFQ Module** | B2B collaboration | Contact module exists | M | 220 | Product | Quote workflow, approval chain |
| 11 | **Sanity Schema v2** | Partner content management | Basic fabric schema | S | 200 | Product | Partner page templates live |
| 12 | **Growth Experiments** | Conversion optimization | No A/B testing | S | 180 | Growth | 3 experiments running |

---

## 7. 30/60/90-Day Roadmap

### 30-Day Sprint (Foundation)
**Theme**: Multi-Tenant Core + Agent Infrastructure

| Week | Deliverable | Owner | Metrics |
|------|-------------|-------|---------|
| 1-2 | Add `tenant_id` to all schemas, implement RLS | Engineering | 100% schema coverage |
| 2-3 | Redis job queue + basic agent core | Engineering | Job processing working |
| 3-4 | Tenant authentication + rate limiting | Engineering | Partner auth flow live |
| 4 | Observability baseline (logging, metrics) | DevOps | Dashboard operational |

### 60-Day Sprint (Core Features)
**Theme**: Marketplace Sync + Partner Onboarding

| Week | Deliverable | Owner | Metrics |
|------|-------------|-------|---------|
| 5-6 | Etsy API integration + bi-directional sync | Engineering | 1000+ products synced |
| 7-8 | Partner onboarding flow + storefront templates | Product/Engineering | 5 partner signups |
| 8-9 | Pricing engine + A/B testing framework | Engineering | Dynamic pricing live |
| 9 | Asset pipeline optimization | Engineering | <100ms image loads |

### 90-Day Sprint (Growth)
**Theme**: Agent Automation + Growth Experiments

| Week | Deliverable | Owner | Metrics |
|------|-------------|-------|---------|
| 10-11 | Agent automation for listing management | Engineering | Auto-publish working |
| 11-12 | RFQ/quotation workflow | Product | B2B quote flow live |
| 12-13 | Growth experiments + conversion optimization | Growth | 3 experiments, +20% conversion |

---

## 8. Q2-Q4 Theme Plan

### Q2: Agent Specialization
- **Marketing Agent**: Auto-content, SEO, social media
- **Sales Agent**: Lead qualification, follow-up automation
- **Sourcing Agent**: Inventory management, supplier negotiation

### Q3: Advanced Automation
- **A2A Workflows**: Agent-to-agent collaboration
- **Campaign Management**: Multi-channel automation
- **Advanced Analytics**: Partner performance dashboards

### Q4: Scale & Enterprise
- **Enterprise Features**: White-label, advanced customization
- **API Marketplace**: Third-party integrations
- **Global Expansion**: Multi-currency, localization

---

## 9. Risk Register (Top 10)

| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| **Redis scaling limits** | High | High | Implement Redis Cluster, fallback to Postgres |
| **Multi-tenant data leakage** | Medium | Critical | Extensive RLS testing, audit logging |
| **Agent infinite loops** | Medium | High | Circuit breakers, execution timeouts |
| **Etsy API rate limits** | High | Medium | Exponential backoff, request batching |
| **Partner churn** | Medium | High | Success metrics, proactive support |
| **PCI compliance** | Low | Critical | Use Stripe, minimize PCI scope |
| **Performance degradation** | Medium | Medium | Load testing, auto-scaling |
| **Security vulnerabilities** | Medium | High | Regular audits, dependency scanning |
| **Data migration issues** | Low | High | Blue/green deployments, rollback plans |
| **Regulatory changes** | Low | Medium | Legal monitoring, compliance framework |

---

## 10. Appendix

### 10.1 API Inventory
- **Current APIs**: 12 endpoints across 4 services
- **Authentication**: Google OAuth + session-based
- **Rate Limiting**: Not implemented (Priority #1)
- **Documentation**: Inline TypeScript, needs OpenAPI

### 10.2 Database Schema Deltas
```sql
-- Multi-tenant foundation
ALTER TABLE ALL_TABLES ADD COLUMN tenant_id UUID;
ALTER TABLE ALL_TABLES ENABLE ROW LEVEL SECURITY;

-- Agent state storage
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  agent_type VARCHAR(100),
  state JSONB,
  created_at TIMESTAMP
);
```

### 10.3 Sanity Schema Recommendations
- **Partner Schema**: Company info, branding, domain settings
- **Template Schema**: Reusable storefront layouts
- **Campaign Schema**: Marketing content, A/B variants

### 10.4 Medusa Plugin Plan
- **Agent Plugin**: Core agent orchestration
- **Multi-tenant Plugin**: Tenant isolation + billing
- **Marketplace Plugin**: Etsy/Amazon sync
- **Pricing Plugin**: Dynamic pricing engine

### 10.5 Observability Plan
- **Metrics**: Prometheus + Grafana
- **Logging**: Structured JSON + ELK stack
- **Tracing**: OpenTelemetry + Jaeger
- **Alerting**: PagerDuty integration
- **SLOs**: 99.9% uptime, P95 <300ms

---

**Document Version**: 1.0
**Last Updated**: 2025-09-16
**Next Review**: 2025-10-01