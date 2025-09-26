# Go-Live Stabilization Plan

**Objective:** To establish Medusa as the single, reliable source of truth for all core commerce data (Products, Pricing, Shipping, Taxes) and ensure a basic transaction can be successfully processed from end to end. All new feature development is to be paused until this stabilization is complete.

---

### **Phase 1: Unify the Product Catalog (Highest Priority)**

**Goal:** Decommission the custom product API and make Medusa the one and only source for product data.

1.  **Data Migration:**
    *   **Task:** Your developer must extract all product data that is currently powering the custom `/api/fabrics` endpoint.
    *   **Action:** This data needs to be cleaned and imported into Medusa as standard Medusa products. This can be done with a script or manually. **All products displayed on the store must exist in Medusa.**

2.  **Frontend Refactoring:**
    *   **Task:** The developer must modify the product browsing and detail pages.
    *   **Action:** All data fetching logic must be changed to call the Medusa backend exclusively. The function `fetchMedusaProducts` in `lib/medusa-api.ts` should be used for this.

3.  **Decommission and Delete:**
    *   **Task:** Remove the old, custom system.
    *   **Action:** Once the frontend is loading all product data from Medusa, the custom API route at `app/api/fabrics/` and its underlying data source must be **deleted**.

**Definition of Done for Phase 1:** The storefront displays the exact same products that are visible in the Medusa Admin, and they are loaded directly from the Medusa API.

---

### **Phase 2: Configure Core Commerce Logic**

**Goal:** Set up the fundamental business rules for shipping and taxes. This is primarily configuration work in the Medusa Admin dashboard.

1.  **Configure Shipping:**
    *   **Task:** Define how you ship your products.
    *   **Action:** In Medusa Admin, go to **Settings -> Regions**. For each region you sell in, you **must** create at least one **Shipping Option** (e.g., "Standard Ground - $9.99"). This is a blocker for checkout.

2.  **Configure Taxes:**
    *   **Task:** Define how you calculate taxes.
    *   **Action:** You must choose a strategy.
        *   **Manual:** In Medusa Admin, go to **Settings -> Taxes** and manually create the tax rates for every state or country you sell to.
        *   **Automated (Recommended):** Have your developer install and configure a tax provider plugin (e.g., TaxJar, Avalara) to calculate taxes automatically.

**Definition of Done for Phase 2:** A product in the cart proceeds to checkout and is presented with a valid shipping option and a calculated tax amount.

---

### **Phase 3: Full End-to-End Validation**

**Goal:** Prove that a basic transaction can be completed successfully on the newly stabilized system.

1.  **Place a Test Order:**
    *   **Task:** Perform a complete test purchase.
    *   **Action:** Go to the storefront, add a product to the cart, select a shipping method, enter a shipping address in a region where you've configured taxes, and complete the payment with a test card.

2.  **Verify Everything:**
    *   **Task:** Confirm the order from every angle.
    *   **Action:**
        *   Did the order confirmation page appear?
        *   Did the order appear in the **Medusa Admin** with the correct products, price, shipping cost, and tax?
        *   Was the payment captured correctly in Stripe?

**Definition of Done for Phase 3:** You can confidently say "Yes, a customer can successfully buy a product from my store."

---

This three-phase plan addresses the most critical issues we have discovered. By focusing on this stabilization work first, you will build a reliable foundation, making all future development faster and safer.
