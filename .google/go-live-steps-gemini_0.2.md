# Consolidated Go-Live Plan v0.2

This plan synthesizes the strengths of three separate analyses (Gemini, Claude, Codex) to create a single, robust, and actionable strategy for launching the fabric store as soon as possible.

### Guiding Principles:
*   **User-Centric Core:** Focus on the essential customer journey from discovery to post-purchase.
*   **Business-Aware:** Elevate legal and content requirements to a primary task, not an afterthought.
*   **Technically-Grounded:** Incorporate actionable technical details and deployment best practices.

---

## **Recommended Go-Live Feature Priorities**

### 1. Homepage Revamp (CMS-Driven)
*   **Goal:** Create a professional, engaging, and easily updatable homepage.
*   **Actions:**
    *   Continue with the completed component-based refactoring.
    *   **Adopt Codex's recommendation:** Integrate a headless CMS (like Sanity) to power the hero section, featured collections, and promotional content. This makes future content changes possible without developer intervention.
*   **Rationale:** Merges my clean architecture with a scalable, content-first approach.

### 2. Advanced Product Discovery (Search & Filtering)
*   **Goal:** Allow customers to find the products they need quickly and efficiently.
*   **Actions:**
    *   Implement a prominent search bar in the header.
    *   On the product listing page, add faceted filters for critical fabric attributes (Type, Color, Use, Price).
    *   Implement sorting options (Newest, Price, etc.).
*   **Rationale:** This was a consensus critical feature across all three plans.

### 3. Comprehensive Product Detail Page (PDP)
*   **Goal:** Provide all necessary information to drive a purchase decision, compensating for the inability to physically touch the product.
*   **Actions:**
    *   Ensure high-resolution imagery with zoom is in place.
    *   Display detailed fabric specifications (composition, width, weight, care instructions).
    *   Implement a clear and functional **"Order a Sample"** button alongside the main "Add to Cart" button.
*   **Rationale:** Also a consensus critical feature, essential for this specific market.

### 4. Streamlined & Hardened Checkout
*   **Goal:** Ensure the revenue-critical checkout process is reliable, frictionless, and trustworthy.
*   **Actions:**
    *   **Adopt Codex's "Hardening" approach:** Thoroughly test the existing Stripe integration.
    *   Polish all states: loading, error, and success screens.
    *   Conduct smoke tests to ensure the entire flow (cart -> payment -> order confirmation) is flawless.
*   **Rationale:** A working checkout is non-negotiable. Focusing on reliability over new features here is key for an ASAP launch.

### 5. Essential Content & Basic Customer Accounts
*   **Goal:** Meet legal requirements for launch and provide a fundamental post-purchase customer experience.
*   **Actions:**
    *   **Elevate Claude's recommendation:** Treat the creation of **Essential Business Pages** (Privacy Policy, Terms of Service, Shipping & Returns) as a primary, high-priority development task. The content must be written and implemented.
    *   **Implement my recommendation:** Create a basic, secure customer account page behind a login where users can view their order history. 
*   **Rationale:** This hybrid approach ensures legal compliance while also providing a better foundational customer experience than a guest-only tracking page, which builds long-term value.
