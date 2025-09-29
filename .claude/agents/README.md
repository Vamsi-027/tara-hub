# Tara Hub Claude Code Sub-Agents

This directory contains specialized Claude Code sub-agents designed to provide domain-specific expertise for the Tara Hub fabric marketplace platform.

## Agent Directory

### Core Business & Commerce
1. **[Medusa Commerce Specialist](./medusa-commerce-specialist.md)**
   - MedusaJS v2 framework expertise
   - Commerce workflow design and optimization
   - Payment gateway integration and multi-tenant architecture

2. **[Materials-Inventory Expert](./materials-inventory-expert.md)**
   - Fabric materials management and synchronization
   - Variant-level inventory tracking and optimization
   - Real-time stock management and supplier integration

3. **[Fabric Store Business Expert](./fabric-store-business-expert.md)**
   - Textile industry business logic and workflows
   - B2B2C marketplace strategy and customer segmentation
   - Pricing strategies and demand forecasting

### Security & Compliance
4. **[API Security Specialist](./api-security-specialist.md)**
   - API security architecture and threat modeling
   - Authentication, authorization, and compliance (PCI DSS, SOX, GDPR)
   - Security monitoring and incident response

5. **[Legal Compliance Specialist](./legal-compliance-specialist.md)**
   - E-commerce legal frameworks and data privacy regulations
   - Textile industry compliance and consumer protection
   - Risk assessment and regulatory change monitoring

### Infrastructure & Operations
6. **[Deployment Specialist](./deployment-specialist.md)**
   - Production deployment strategy and multi-cloud architecture
   - CI/CD pipeline optimization and infrastructure as code
   - Performance monitoring and disaster recovery

7. **[Database Migration Expert](./database-migration-expert.md)**
   - PostgreSQL schema evolution and zero-downtime migrations
   - Query optimization and performance tuning
   - Data integrity and backup strategies

8. **[Performance Monitoring Specialist](./performance-monitoring-specialist.md)**
   - Application performance monitoring and optimization
   - Real-time observability and intelligent alerting
   - Scalability planning and SLA monitoring

### Testing & Quality Assurance
9. **[E2E Testing Orchestrator](./e2e-testing-orchestrator.md)**
   - End-to-end testing strategy and automation
   - Cross-application workflow validation
   - Performance testing and quality gates

### Frontend & User Experience
10. **[Frontend Integration Specialist](./frontend-integration-specialist.md)**
    - React/Next.js architecture and multi-app coordination
    - Performance optimization and accessibility
    - Design system implementation and mobile optimization

## How to Use These Agents

### Activation Patterns
Each agent includes specific **"Activation Trigger"** sections that define when to call that particular specialist. Use these triggers to select the most appropriate agent for your current task.

### Agent Coordination
- Agents can work together on complex tasks requiring multiple domains
- Cross-reference related agents for comprehensive solutions
- Use the business context provided in each agent to understand interdependencies

### Code Examples
Each agent includes:
- **Technical patterns** and implementation examples
- **Business logic** specific to their domain
- **Best practices** and validation checklists
- **Common scenarios** and troubleshooting guidance

## Agent Specialization Matrix

| Domain | Primary Agents | Secondary Agents |
|--------|---------------|------------------|
| **Commerce Logic** | Medusa Commerce, Materials-Inventory | Fabric Store Business, API Security |
| **User Experience** | Frontend Integration | Performance Monitoring, E2E Testing |
| **Security** | API Security, Legal Compliance | Deployment, Database Migration |
| **Operations** | Deployment, Database Migration | Performance Monitoring, E2E Testing |
| **Business Intelligence** | Fabric Store Business | Materials-Inventory, Performance Monitoring |

## Quick Reference

### For New Feature Development
1. **Fabric Store Business Expert** - Define business requirements
2. **Medusa Commerce Specialist** - Design commerce architecture
3. **Frontend Integration Specialist** - Implement user interface
4. **E2E Testing Orchestrator** - Validate complete workflows

### For Performance Issues
1. **Performance Monitoring Specialist** - Identify bottlenecks
2. **Database Migration Expert** - Optimize queries and schema
3. **Frontend Integration Specialist** - Frontend optimizations
4. **Deployment Specialist** - Infrastructure scaling

### For Security & Compliance
1. **API Security Specialist** - Security architecture review
2. **Legal Compliance Specialist** - Regulatory requirements
3. **Database Migration Expert** - Data protection measures
4. **Deployment Specialist** - Secure deployment practices

### For Production Issues
1. **Performance Monitoring Specialist** - System health assessment
2. **Deployment Specialist** - Infrastructure diagnosis
3. **API Security Specialist** - Security incident response
4. **Database Migration Expert** - Data integrity checks

## Integration with Tara Hub Architecture

These agents are designed specifically for the Tara Hub platform architecture:
- **MedusaJS v2** backend with custom modules
- **Next.js 15** multi-app frontend (fabric-store, admin, store-guide)
- **PostgreSQL** with Neon hosting
- **Vercel** frontend deployment, **Railway** backend deployment
- **Turbo** monorepo structure

Each agent maintains deep context of this architecture and provides solutions that align with the established patterns and technologies.

## Development Logging Standard

All agents must log their activities to `/dev.sessions.log/` using the standardized format:

```
[TIMESTAMP] [SUB_AGENT] [agent-name] Activity: <description>
Patterns: <technologies/patterns used>
Challenges: <encountered difficulties>
Gaps: <missing capabilities>
Effectiveness: <high/medium/low>
Next Actions: <recommended follow-ups>
---
```

This enables the **Enricher agent** to monitor development patterns and evolve the agent ecosystem based on real project needs.

## Contributing

When updating agents:
1. Maintain consistency with the established architecture
2. Update cross-references between related agents
3. Include practical code examples and business context
4. Test recommendations against the actual Tara Hub codebase