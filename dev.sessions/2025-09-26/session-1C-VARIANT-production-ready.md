# 🚀 SESSION 1C-VARIANT: Production-Ready Variant-Material Link

**Date**: 2025-09-26
**Duration**: 3-4 hours
**Approach**: Medusa v2 Link Module (Variant-Level)
**Developer**: [Assign to team member]
**Priority**: 🔴 **CRITICAL ARCHITECTURAL CORRECTION**

---

## 🎯 OBJECTIVE

To correctly implement the `ProductVariant -> Material` association using Medusa v2 best practices. This plan replaces all previous versions of Session 1C and correctly targets product variants instead of the product itself, aligning with the confirmed business requirements.

**Success Criteria**:
- ✅ The `product_variant_material_link` table is created with full database integrity (PK, FKs, Indexes).
- ✅ The API provides an endpoint to manage material links for each specific product variant.
- ✅ The Admin UI allows material selection within the variant management section.
- ✅ All data operations use the `linkModuleService`, with zero raw SQL.
- ✅ The solution handles products both with and without explicit variants (by targeting Medusa's default variant).

---

## ⚠️ BUSINESS DECISION: CARDINALITY

**This decision must be confirmed before proceeding.** Based on our discussion, we will proceed with **Option A**, as it is the most common scenario for fabric stores.

- ✅ **Option A: One Material per Variant (1:1)**
- **Option B:** Multiple Materials per Variant (1:many)

---

## 🚀 EXECUTION PLAN

### **PHASE 1: Link Definition & Migration (60 minutes)**

1.  **Define Link (15 mins):** Create the file `medusa/src/links/product_variant-material.ts`.
    ```typescript
    // medusa/src/links/product_variant-material.ts
    import { defineLink } from "@medusajs/framework/utils"

    // Using strings for maximum compatibility and clarity
    export default defineLink("product_variant", "material", {
      // Based on our decision for a 1:1 relationship
      isList: false,
    })
    ```

2.  **Create & Enhance Migration (45 mins):**
    a. Generate the base migration file: `cd medusa && npx medusa db:generate`
    b. **Manually edit the generated SQL file** to ensure it contains the correct production-grade constraints for a 1:1 relationship.

    **Required SQL for `product_variant_material_link`:**
    ```sql
    CREATE TABLE IF NOT EXISTS product_variant_material_link (
      product_variant_id VARCHAR(255) NOT NULL,
      material_id        VARCHAR(255) NOT NULL,
      created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      -- A variant can only have one material link
      PRIMARY KEY (product_variant_id),

      -- Ensures data integrity against the core tables
      CONSTRAINT fk_pvml_variant FOREIGN KEY (product_variant_id)
        REFERENCES public.product_variant(id) ON DELETE CASCADE,
      CONSTRAINT fk_pvml_material FOREIGN KEY (material_id)
        REFERENCES public.materials(id) ON DELETE RESTRICT
    );

    -- Index for performance when looking up all variants using a specific material
    CREATE INDEX IF NOT EXISTS idx_pvml_material_id ON product_variant_material_link (material_id);
    ```
    c. Apply the migration: `npx medusa db:migrate`
    d. Verify the table and constraints in your database.

### **PHASE 2: API Refactoring (90 minutes)**

1.  **Create New Variant-Specific Route (60 mins):**
    a. Create the file: `medusa/src/api/admin/products/[id]/variants/[variant_id]/route.ts`.
    b. Implement the `GET` and `POST` methods in this new file.

    **`GET` Logic:**
    - Use `query.graph` to fetch the `product_variant` and expand its linked `material`.
    - Example: `fields: ["*", "material.id", "material.name"]`

    **`POST` Logic (for updating the link):**
    ```typescript
    const { variant_id } = req.params;
    const { material_id } = req.body;
    const linkService = req.scope.resolve("linkModuleService");

    // This "dismiss then create" pattern ensures a clean update for a 1:1 link
    await linkService.dismiss([{ product_variant: { id: variant_id } }]);

    if (material_id) {
      await linkService.create([{
        product_variant: { id: variant_id },
        material: { material_id: material_id }
      }]);
    }

    res.json({ success: true, variant_id, material_id: material_id || null });
    ```

2.  **Cleanup Old Endpoints (30 mins):**
    - Go to `medusa/src/api/admin/products/route.ts` and `medusa/src/api/admin/products/[id]/route.ts`.
    - **Completely remove all code related to `material_id`**. These endpoints should no longer be aware of materials. This prevents confusion and ensures there is only one way to manage the link.

### **PHASE 3: Admin UI Implementation (60 minutes)**

1.  **Create New Variant Widget File:** Create `medusa/src/admin/widgets/variant-material-select.tsx`.

2.  **Update Widget Configuration:** The widget must be registered to the correct UI location.
    ```typescript
    // In medusa/src/admin/widgets/variant-material-select.tsx
    import { WidgetConfig } from "@medusajs/admin-sdk"

    export const config: WidgetConfig = {
      // This zone places the widget on the variant details screen
      zone: "product.variants.details.after",
    };
    ```

3.  **Implement Widget Logic:**
    - The widget will receive a `variant` prop from the Admin UI.
    - The `useEffect` hook should read the initial material from `variant.material`.
    - The `handleSave` function must call the new variant-specific endpoint: `POST /admin/products/:id/variants/:variant_id`.

### **PHASE 4: Validation (45 minutes)**

1.  **Update E2E Tests:** Modify the existing tests to target the new variant-specific API endpoint. The tests must now:
    a. Create a product with at least two variants.
    b. Assign a *different* material to each variant.
    c. Verify in the `product_variant_material_link` table that both links are stored correctly and independently.

2.  **Manual UI Testing:**
    a. Open a product with multiple variants in Medusa Admin.
    b. For each variant, select a different material and save.
    c. Refresh the page and confirm that each variant has retained its correct, unique material assignment.

---

## ✅ Justification of Medusa v2 Best Practices

- **Module Isolation:** We use `defineLink` to connect `ProductVariant` and `Material` without modifying either core module, ensuring upgrade safety.
- **Service-Oriented Architecture:** All data changes are executed through the `linkModuleService`, completely avoiding raw SQL in the API layer.
- **Database Integrity:** We enforce data consistency at the database level with `FOREIGN KEY` constraints, the most reliable method for preventing orphaned data.
- **Targeted Extensibility:** We use the documented `product.variants.details.after` widget zone to extend the Admin UI precisely where the functionality is needed.

This plan represents the correct, production-ready path forward. 