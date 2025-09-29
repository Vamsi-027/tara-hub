---
description: Run end-to-end tests for specific app or workflow
argument-hint: [app-name] [--headed]
allowed-tools: Bash, Read
---

# End-to-End Testing

Run E2E tests for: ${1:-all apps}

## Available Test Suites:

### Fabric Store (Customer Journey)
```bash
npm run test:e2e:fabric-store ${2}
```
- Browse catalog
- Add to cart
- SMS authentication
- Stripe payment
- Order confirmation

### Admin Dashboard
```bash
npm run test:e2e:admin ${2}
```
- Admin authentication
- Product management
- Material linking
- Order processing

### Medusa API
```bash
cd medusa && npm run test:e2e:all ${2}
```
- Materials module
- Products API
- Inventory tracking
- Tax calculation
- Shipping rates

## Test Modes:

**Headless** (CI/CD):
```bash
npm run test:e2e
```

**Headed** (debugging):
```bash
npm run test:e2e:headed
```

**Specific test file**:
```bash
npx playwright test tests/fabric-store/checkout.spec.ts ${2}
```

## Post-Test Analysis:
- Review test results in `playwright-report/`
- Check for flaky tests
- Analyze failure screenshots
- Update test data if needed

Use e2e-testing-orchestrator agent for test strategy and fixes.