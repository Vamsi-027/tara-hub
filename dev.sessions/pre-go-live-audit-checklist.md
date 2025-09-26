# Pre-Go-Live Audit & Implementation Plan

**Objective:** To provide a comprehensive checklist of all critical, security, and operational tasks that must be completed to ensure a stable, secure, and successful production launch. This plan is prioritized, with the most critical items listed first.

---

### **Category 1: Critical Blockers (Must-Fix Before Go-Live)**

*This category addresses the foundational data and logic issues that make it impossible to conduct a valid transaction. The system cannot go live until every item here is complete.*

- [ ] **Unify the Product Catalog**
    - [ ] **Task:** Migrate all product data from the custom API (`/api/fabrics`) into Medusa.
    - [ ] **Task:** Refactor the entire frontend to fetch all product data exclusively from the Medusa backend.
    - [ ] **Task:** Delete the custom `/api/fabrics` API route and its underlying data source.
    - [ ] **Verification:** The products displayed on the live site are identical to the products listed in the Medusa Admin.

- [ ] **Configure Core Commerce Logic**
    - [ ] **Task:** In Medusa Admin, configure your primary sales **Region(s)** with the correct currencies.
    - [ ] **Task:** In each Region, configure at least one **Shipping Option** with a valid rate.
    - [ ] **Task:** Decide on a tax strategy (manual rates or an automated plugin) and configure it for your primary sales region.
    - [ ] **Verification:** A test cart at checkout correctly displays shipping options and calculates taxes.

- [ ] **Complete a Full End-to-End Test Order**
    - [ ] **Task:** Manually place a test order from start to finish in a production-like environment.
    - [ ] **Verification:** The order is successfully created in Medusa Admin with the correct product, price, shipping, and tax. The payment is successfully processed in Stripe.

---

### **Category 2: Security & Hardening**

*This category addresses security vulnerabilities that would put your business and customers at risk in a live environment.*

- [ ] **Tighten CORS Policies**
    - [ ] **Task:** In `medusa-config.ts`, review the `storeCors`, `adminCors`, and `authCors` settings.
    - [ ] **Action:** Remove all `localhost` entries and any permissive wildcards from your production environment variables. The CORS settings should only allow your specific production frontend and admin domains.

- [ ] **Final Secrets Audit**
    - [ ] **Task:** Manually search the codebase one last time for any hardcoded API keys, secrets, or passwords.
    - [ ] **Action:** Ensure all secrets are loaded exclusively from environment variables and that no `.env` files are checked into git.

- [ ] **Review Public API Security**
    - [ ] **Task:** Review any custom, public-facing API endpoints.
    - [ ] **Action:** Ensure endpoints that expose sensitive order or customer data require authentication. Implement rate limiting to prevent abuse.

---

### **Category 3: Production Readiness & Operations**

*This category addresses operational issues that could cause instability, data loss, or an inability to debug problems in production.*

- [ ] **Enable Redis**
    - [ ] **Task:** The `medusa-config.ts` shows Redis is disabled. In-memory event buses and caches are not suitable for production and will lose data on restart.
    - [ ] **Action:** Provision a production-ready Redis instance and re-enable the Redis modules for caching, events, and workflows.

- [ ] **Establish a Database Backup Strategy**
    - [ ] **Task:** Your PostgreSQL database contains all your critical business data.
    - [ ] **Action:** Configure regular, automated backups of your production database. Confirm you have a tested process for restoring from a backup.

- [ ] **Configure Production Logging**
    - [ ] **Task:** `console.log` is not sufficient for a production environment.
    - [ ] **Action:** Integrate a professional logging service (like Sentry, Datadog, or Logtail) to capture, view, and get alerts on errors from both your Medusa backend and Next.js frontend.

- [ ] **Implement a CI/CD Pipeline**
    - [ ] **Task:** Automate your testing and deployment process.
    - [ ] **Action:** Set up a GitHub Action (or similar CI/CD tool) that automatically runs your tests (especially the Playwright E2E test) on every pull request. This prevents regressions from being merged.

---

### **Category 4: Code & Feature Cleanup**

*This category focuses on ensuring the codebase is clean, consistent, and free of confusing, half-implemented features.*

- [ ] **Finalize the "Sample" Strategy**
    - [ ] **Task:** You have two competing plans for samples ("Curated Bundles" vs. "Customer-Choice").
    - [ ] **Action:** You must make a final decision for the go-live version. The code for the rejected strategy must be completely removed to avoid confusion.

- [ ] **Review and Remove Unused Code**
    - [ ] **Task:** The codebase contains many components and routes that may have been part of previous experiments.
    - [ ] **Action:** Perform a review to identify and delete any components, pages, or API routes that are no longer used in the final application.

- [ ] **Verify Transactional Emails**
    - [ ] **Task:** Your `medusa-config.ts` is configured to use SendGrid and Resend.
    - [ ] **Action:** Place a test order and verify that the "Order Confirmation" email is sent correctly and looks professional. Test other key emails like "Shipment Created" and "Password Reset."
