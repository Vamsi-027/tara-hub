# 🏗️ SESSION 1C-VARIANT: VARIANT-MATERIAL LINK - PRODUCTION IMPLEMENTATION

**Date**: 2025-09-26
**Duration**: 2-3 days
**Approach**: Medusa v2 Variant-Level Material Mapping with Framework Compliance
**Developer**: [Assign to team member]
**Priority**: 🔴 **CRITICAL ARCHITECTURE CORRECTION**

---

## 🎯 OBJECTIVE

Implement **product variant → material association** using Medusa v2 Link Module patterns, replacing the incorrect product-level mapping with business-aligned variant-level relationships.

**Success Criteria**:
- ✅ Materials linked to product variants, not products
- ✅ Customer sees material per variant selection
- ✅ Inventory tracked per variant-material combination at checkout
- ✅ Admin UI manages material per variant
- ✅ Framework-compliant implementation with zero raw SQL
- ✅ Support for both single-variant and multi-variant products

---

## 📊 BUSINESS ARCHITECTURE

### **Correct Relationship Model**
```
Product "Cotton T-Shirt"
├── Variant "Small/Red" → Material "100% Cotton" → Inventory Unit
├── Variant "Small/Blue" → Material "100% Cotton" → Inventory Unit
├── Variant "Large/Red" → Material "Cotton Blend" → Inventory Unit
└── Variant "Large/Blue" → Material "Cotton Blend" → Inventory Unit

Customer Journey:
1. Select Product: "Cotton T-Shirt"
2. Choose Variant: "Large/Blue"
3. See Material: "Cotton Blend"
4. Add to Cart: Variant + Material tracked for inventory
```

### **Framework Alignment**
- **Entity**: `product_variant` (Medusa core entity)
- **Custom Module**: `materials` (existing)
- **Link Pattern**: 1:1 variant-to-material relationship
- **Inventory**: Variant-level material consumption

---

## 🚨 CRITICAL BUSINESS DECISION

**Relationship Cardinality** (based on business requirements):

✅ **DECISION: 1:1 Variant-to-Material**
```typescript
defineLink("product_variant", "material", { isList: false })
```

**Rationale**:
- Each variant uses one primary material for sourcing
- Inventory tracking per variant-material pair
- Customer clarity: one material per size/color selection
- Supplier alignment: materials sourced per variant specification

---

## 🔄 MIGRATION STRATEGY

### **Phase 0: Cleanup Current Implementation (30 minutes)**

#### **Step 0.1: Safe Rollback of Session 1C**
```bash
cd medusa

# 1. Drop incorrect product-material table
psql $DATABASE_URL -c "DROP TABLE IF EXISTS product_material_link CASCADE;"

# 2. Remove incorrect link definition
rm -f src/links/product-material.ts

# 3. Backup current API implementations (in case needed for reference)
mkdir -p backup/session-1c-product-level
cp src/api/admin/products/route.ts backup/session-1c-product-level/
cp src/api/admin/products/[id]/route.ts backup/session-1c-product-level/
cp src/admin/widgets/product-material-select.tsx backup/session-1c-product-level/
```

---

## 🚀 IMPLEMENTATION PLAN

### **PHASE 1: FRAMEWORK FOUNDATION (45 minutes)**

#### **Step 1.1: Variant-Material Link Definition (15 minutes)**
```bash
mkdir -p src/links
```

```typescript
// File: src/links/variant-material.ts
import { defineLink } from "@medusajs/framework/utils"

export default defineLink("product_variant", "material", {
  isList: false // 1:1 variant to material mapping
})
```

#### **Step 1.2: Service Discovery & Validation (15 minutes)**
```bash
# Test link service resolution
node -e "
const { createMedusaContainer } = require('@medusajs/framework/utils');
const container = createMedusaContainer();

// Test service keys
['linkModuleService', 'link'].forEach(key => {
  try {
    const service = container.resolve(key);
    console.log('✅ Working service key:', key);
  } catch (e) {
    console.log('❌ Failed key:', key);
  }
});
"

# Test variant entity availability
node -e "
const { Modules } = require('@medusajs/framework/utils');
console.log('✅ Available modules:', Object.keys(Modules));
console.log('✅ PRODUCT module available:', !!Modules.PRODUCT);
"
```

**Document working service key**: `linkModuleService` ← Update after discovery

#### **Step 1.3: Link Field Discovery (15 minutes)**
```bash
# Create variant-material link discovery test
cat > test-variant-link-discovery.js << 'EOF'
async function discoverVariantMaterialLink() {
  try {
    const { createMedusaContainer } = require('@medusajs/framework/utils');
    const container = createMedusaContainer();
    const query = container.resolve("query");

    // Test variant material expansion
    const fields = ["materials", "material"];

    for (const field of fields) {
      try {
        const result = await query.graph({
          entity: "product_variant",
          fields: ["id", `${field}.*`],
          pagination: { take: 1 }
        });

        if (result.data[0] && result.data[0][field] !== undefined) {
          console.log(`✅ Variant link field discovered: ${field}`);
          return field;
        }
      } catch (e) {
        console.log(`❌ Variant field ${field} failed:`, e.message);
      }
    }

    // Test via product expansion
    try {
      const productResult = await query.graph({
        entity: "product",
        fields: ["id", "variants.id", "variants.materials.*"],
        pagination: { take: 1 }
      });

      if (productResult.data[0]?.variants?.[0]?.materials !== undefined) {
        console.log('✅ Product→Variant→Materials expansion works');
        return 'materials';
      }
    } catch (e) {
      console.log('❌ Product expansion failed:', e.message);
    }

    console.log('❌ No variant-material link field discovered');
  } catch (error) {
    console.log('❌ Discovery failed:', error.message);
  }
}

discoverVariantMaterialLink();
EOF

node test-variant-link-discovery.js
rm test-variant-link-discovery.js
```

**Document discovered field**: `materials` ← Update after discovery

---

### **PHASE 2: DATABASE SCHEMA (30 minutes)**

#### **Step 2.1: Variant-Material Migration (30 minutes)**

```sql
-- File: src/migrations/[timestamp]-create-variant-material-link.sql
-- Production-grade variant-material link table

CREATE TABLE IF NOT EXISTS variant_material_link (
  variant_id VARCHAR(255) NOT NULL,
  material_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  -- Primary key: 1:1 variant to material
  PRIMARY KEY (variant_id),

  -- Foreign key constraints with proper cascading
  CONSTRAINT fk_vml_variant
    FOREIGN KEY (variant_id) REFERENCES product_variant(id) ON DELETE CASCADE,
  CONSTRAINT fk_vml_material
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_vml_material_id
ON variant_material_link (material_id);

CREATE INDEX IF NOT EXISTS idx_vml_deleted_at
ON variant_material_link (deleted_at) WHERE deleted_at IS NULL;

-- Optional: Add material_id to product_variant for quick access (denormalized)
-- Only if performance requires it, otherwise use link table joins
-- ALTER TABLE product_variant ADD COLUMN material_id VARCHAR(255) NULL;
-- CREATE INDEX IF NOT EXISTS idx_product_variant_material_id ON product_variant (material_id);
```

```bash
# Generate and apply migration
npx medusa db:generate materialsModule

# If auto-generation fails, use manual migration above
npx medusa db:migrate

# Verify table structure
psql $DATABASE_URL -c "
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'variant_material_link';
"

# Verify foreign key targets exist
psql $DATABASE_URL -c "SELECT COUNT(*) as variant_count FROM product_variant LIMIT 5;"
psql $DATABASE_URL -c "SELECT COUNT(*) as material_count FROM materials LIMIT 5;"
```

---

### **PHASE 3: API LAYER IMPLEMENTATION (90 minutes)**

#### **Step 3.1: Variant Material Management APIs (45 minutes)**

```typescript
// File: src/api/admin/variants/[id]/material/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

function isAdmin(req: MedusaRequest): boolean {
  return Boolean(
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.id ||
    (req as any).session?.user_id
  )
}

function getRequestContext(req: MedusaRequest) {
  const requestIdHeader = req.headers["x-request-id"]
  const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader || "unknown"
  const userId = (req as any).user?.id || (req as any).session?.user_id || "unknown"
  return { requestId, userId }
}

// GET variant material
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    const variantId = (req as any).params.id
    const query = req.scope.resolve("query") as any

    // Get variant with material expansion
    const { data: [variant] } = await query.graph({
      entity: "product_variant",
      fields: ["id", "title", "materials.id", "materials.name", "materials.code"],
      filters: { id: variantId }
    })

    if (!variant) {
      res.status(404).json({ error: "Variant not found" })
      return
    }

    const material = variant.materials?.[0] || variant.materials || null
    res.json({
      variant_id: variant.id,
      material_id: material?.id || null,
      material: material
    })

  } catch (error: any) {
    res.status(400).json({
      error: "Failed to retrieve variant material",
      details: error?.message
    })
  }
}

// POST/PUT variant material assignment
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const variantId = (req as any).params.id
  const body = (req as any).body || {}
  let { material_id } = body
  const { requestId, userId } = getRequestContext(req)

  // Input validation
  if (material_id !== undefined && material_id !== null && typeof material_id !== "string") {
    return res.status(400).json({
      code: "INVALID_MATERIAL_ID",
      error: "Material ID must be a string or null"
    })
  }

  if (material_id === "") {
    material_id = null
  }

  try {
    // Verify variant exists
    const query = req.scope.resolve("query") as any
    const { data: [variant] } = await query.graph({
      entity: "product_variant",
      fields: ["id"],
      filters: { id: variantId }
    })

    if (!variant) {
      return res.status(404).json({ error: "Variant not found" })
    }

    const linkService = req.scope.resolve("linkModuleService") as any
    const logger = req.scope.resolve("logger") as any

    // Remove existing material links for this variant
    try {
      await linkService.dismiss([{
        product_variant: { variant_id: variantId }
      }])
      logger?.info?.("variant.material.link.dismissed", {
        variant_id: variantId,
        request_id: requestId,
        user_id: userId
      })
    } catch (dismissError) {
      logger?.warn?.("variant.material.link.dismiss.failed", {
        variant_id: variantId,
        error: dismissError?.message,
        request_id: requestId
      })
    }

    // Create new link if material_id provided
    if (material_id) {
      await linkService.create([{
        product_variant: { variant_id: variantId },
        material: { material_id }
      }])
      logger?.info?.("variant.material.link.created", {
        variant_id: variantId,
        material_id,
        request_id: requestId,
        user_id: userId
      })
    }

    res.json({ success: true, variant_id: variantId, material_id })

  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        code: "VARIANT_MATERIAL_CONFLICT",
        error: "Variant already has a material assigned"
      })
    }

    return res.status(400).json({
      code: "VARIANT_MATERIAL_UPDATE_FAILED",
      error: "Failed to update variant material",
      details: error?.message
    })
  }
}

// DELETE variant material
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const variantId = (req as any).params.id
  const { requestId, userId } = getRequestContext(req)

  try {
    const linkService = req.scope.resolve("linkModuleService") as any
    const logger = req.scope.resolve("logger") as any

    await linkService.dismiss([{
      product_variant: { variant_id: variantId }
    }])

    logger?.info?.("variant.material.link.deleted", {
      variant_id: variantId,
      request_id: requestId,
      user_id: userId
    })

    res.json({ success: true, variant_id: variantId })

  } catch (error: any) {
    res.status(400).json({
      error: "Failed to delete variant material",
      details: error?.message
    })
  }
}
```

#### **Step 3.2: Enhanced Product APIs with Variant Materials (45 minutes)**

```typescript
// File: src/api/admin/products/[id]/route.ts (Updated)
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

function isAdmin(req: MedusaRequest): boolean {
  return Boolean(
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.id ||
    (req as any).session?.user_id
  )
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    const query = req.scope.resolve("query") as any
    const expand = ((req.query as any)?.expand_variant_materials || "") === "true"

    // Base fields for product
    const fields = ["*", "variants.id", "variants.title", "variants.sku"]

    // Add variant material expansion if requested
    if (expand) {
      fields.push(
        "variants.materials.id",
        "variants.materials.name",
        "variants.materials.code"
      )
    }

    const { data: [product] } = await query.graph({
      entity: "product",
      fields,
      filters: { id: (req as any).params.id }
    })

    if (!product) {
      res.status(404).json({ error: "Product not found" })
      return
    }

    res.json({ product })
  } catch (error: any) {
    res.status(400).json({
      error: "Failed to retrieve product",
      details: error?.message
    })
  }
}

// Bulk variant material assignment for product
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const productId = (req as any).params.id
  const body = (req as any).body || {}
  const { variant_materials, ...updateData } = body // { variant_materials: [{ variant_id, material_id }] }

  try {
    // Update product core data if provided
    if (Object.keys(updateData).length > 0) {
      const productService = req.scope.resolve(Modules.PRODUCT) as any
      await productService.updateProducts([{ id: productId, ...updateData }])
    }

    // Handle bulk variant material assignment
    if (variant_materials && Array.isArray(variant_materials)) {
      const linkService = req.scope.resolve("linkModuleService") as any
      const logger = req.scope.resolve("logger") as any

      for (const { variant_id, material_id } of variant_materials) {
        if (!variant_id) continue

        try {
          // Remove existing link
          await linkService.dismiss([{
            product_variant: { variant_id }
          }])

          // Create new link if material_id provided
          if (material_id) {
            await linkService.create([{
              product_variant: { variant_id },
              material: { material_id }
            }])
          }

          logger?.info?.("variant.material.bulk.updated", {
            product_id: productId,
            variant_id,
            material_id
          })
        } catch (linkError) {
          logger?.error?.("variant.material.bulk.failed", {
            product_id: productId,
            variant_id,
            material_id,
            error: linkError?.message
          })
        }
      }
    }

    res.json({ success: true })

  } catch (error: any) {
    res.status(400).json({
      code: "PRODUCT_UPDATE_FAILED",
      error: "Failed to update product",
      details: error?.message
    })
  }
}
```

---

### **PHASE 4: ADMIN UI IMPLEMENTATION (120 minutes)**

#### **Step 4.1: Variant Material Management Widget (60 minutes)**

```typescript
// File: src/admin/widgets/variant-material-manager.tsx
import React, { useEffect, useState } from "react"
import { ProductDetailsWidgetProps, WidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast, Badge } from "@medusajs/ui"
import MaterialSelect from "../components/MaterialSelect"

interface VariantMaterial {
  variant_id: string
  material_id: string | null
  material?: {
    id: string
    name: string
    code: string
  }
}

const VariantMaterialManager: React.FC<ProductDetailsWidgetProps> = ({ product }) => {
  const [variantMaterials, setVariantMaterials] = useState<VariantMaterial[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product?.variants) {
      // Initialize variant materials from product data
      const initialMaterials = product.variants.map((variant: any) => ({
        variant_id: variant.id,
        material_id: variant.materials?.[0]?.id || variant.materials?.id || null,
        material: variant.materials?.[0] || variant.materials || null
      }))
      setVariantMaterials(initialMaterials)
    }
  }, [product])

  const updateVariantMaterial = (variantId: string, materialId: string | null) => {
    setVariantMaterials(prev =>
      prev.map(vm =>
        vm.variant_id === variantId
          ? { ...vm, material_id: materialId }
          : vm
      )
    )
  }

  const saveVariantMaterial = async (variantId: string, materialId: string | null) => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/variants/${variantId}/material`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_id: materialId })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))

        if (res.status === 409 && err?.code === "VARIANT_MATERIAL_CONFLICT") {
          toast.error("Variant already has a material assigned. Clear it first.")
          return
        }

        throw new Error(err?.error || "Failed to save variant material")
      }

      toast.success("Variant material updated")
    } catch (e: any) {
      toast.error(e?.message || "Failed to save variant material")
    } finally {
      setSaving(false)
    }
  }

  const saveAllChanges = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/products/${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_materials: variantMaterials.map(vm => ({
            variant_id: vm.variant_id,
            material_id: vm.material_id
          }))
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Failed to save variant materials")
      }

      toast.success("All variant materials updated")
    } catch (e: any) {
      toast.error(e?.message || "Failed to save variant materials")
    } finally {
      setSaving(false)
    }
  }

  if (!product?.variants || product.variants.length === 0) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Variant Materials</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            No variants found for this product.
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Variant Materials</Heading>
        <Text className="text-ui-fg-subtle mt-1">
          Assign materials to product variants for inventory tracking
        </Text>
      </div>

      <div className="px-6 py-4 space-y-6">
        {variantMaterials.map((vm, index) => {
          const variant = product.variants.find((v: any) => v.id === vm.variant_id)
          if (!variant) return null

          return (
            <div key={vm.variant_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Text weight="semibold">{variant.title}</Text>
                  {variant.sku && (
                    <Text className="text-ui-fg-subtle text-sm">SKU: {variant.sku}</Text>
                  )}
                </div>
                {vm.material && (
                  <Badge variant="secondary">
                    {vm.material.name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <MaterialSelect
                    value={vm.material_id}
                    onChange={(materialId) => updateVariantMaterial(vm.variant_id, materialId)}
                    placeholder="Select material..."
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateVariantMaterial(vm.variant_id, null)}
                  disabled={saving || !vm.material_id}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveVariantMaterial(vm.variant_id, vm.material_id)}
                  disabled={saving}
                >
                  Save
                </Button>
              </div>
            </div>
          )
        })}

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={saveAllChanges}
            disabled={saving}
            loading={saving}
          >
            {saving ? "Saving All..." : "Save All Changes"}
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config: WidgetConfig = {
  zone: "product.details.after"
}

export default VariantMaterialManager
```

#### **Step 4.2: Customer-Facing Variant Material Display (30 minutes)**

```typescript
// File: src/api/store/products/[id]/route.ts (Store API for customer)
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve("query") as any

    const { data: [product] } = await query.graph({
      entity: "product",
      fields: [
        "*",
        "variants.id",
        "variants.title",
        "variants.manage_inventory",
        "variants.allow_backorder",
        "variants.materials.id",
        "variants.materials.name",
        "variants.materials.code",
        "variants.materials.description"
      ],
      filters: {
        id: (req as any).params.id,
        status: "published" // Only published products for customers
      }
    })

    if (!product) {
      res.status(404).json({ error: "Product not found" })
      return
    }

    // Format for customer consumption
    const customerProduct = {
      ...product,
      variants: product.variants?.map((variant: any) => ({
        id: variant.id,
        title: variant.title,
        manage_inventory: variant.manage_inventory,
        allow_backorder: variant.allow_backorder,
        material: variant.materials?.[0] || variant.materials || null
      }))
    }

    res.json({ product: customerProduct })
  } catch (error: any) {
    res.status(400).json({
      error: "Failed to retrieve product",
      details: error?.message
    })
  }
}
```

#### **Step 4.3: Bulk Material Assignment Component (30 minutes)**

```typescript
// File: src/admin/components/BulkVariantMaterialAssign.tsx
import React, { useState } from "react"
import { Button, Select, toast } from "@medusajs/ui"
import MaterialSelect from "./MaterialSelect"

interface BulkVariantMaterialAssignProps {
  variants: Array<{ id: string; title: string }>
  onAssignComplete: () => void
}

const BulkVariantMaterialAssign: React.FC<BulkVariantMaterialAssignProps> = ({
  variants,
  onAssignComplete
}) => {
  const [selectedVariants, setSelectedVariants] = useState<string[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)

  const handleBulkAssign = async () => {
    if (!selectedMaterial || selectedVariants.length === 0) {
      toast.error("Please select material and variants")
      return
    }

    setAssigning(true)
    try {
      // Assign material to each selected variant
      const promises = selectedVariants.map(variantId =>
        fetch(`/admin/variants/${variantId}/material`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ material_id: selectedMaterial })
        })
      )

      const results = await Promise.allSettled(promises)
      const failed = results.filter(r => r.status === 'rejected').length

      if (failed === 0) {
        toast.success(`Material assigned to ${selectedVariants.length} variants`)
      } else {
        toast.warning(`${selectedVariants.length - failed} variants updated, ${failed} failed`)
      }

      onAssignComplete()
      setSelectedVariants([])
      setSelectedMaterial(null)

    } catch (e: any) {
      toast.error("Bulk assignment failed")
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Bulk Material Assignment</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Select Variants</label>
        {variants.map(variant => (
          <label key={variant.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedVariants.includes(variant.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedVariants(prev => [...prev, variant.id])
                } else {
                  setSelectedVariants(prev => prev.filter(id => id !== variant.id))
                }
              }}
            />
            <span>{variant.title}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Select Material</label>
        <MaterialSelect
          value={selectedMaterial}
          onChange={setSelectedMaterial}
          placeholder="Choose material to assign..."
        />
      </div>

      <Button
        onClick={handleBulkAssign}
        disabled={assigning || !selectedMaterial || selectedVariants.length === 0}
        loading={assigning}
      >
        Assign to {selectedVariants.length} Variants
      </Button>
    </div>
  )
}

export default BulkVariantMaterialAssign
```

---

### **PHASE 5: TESTING & VALIDATION (60 minutes)**

#### **Step 5.1: API Testing (25 minutes)**

```bash
# Test 1: Create variant material link
curl -X POST "http://localhost:9000/admin/variants/{variant_id}/material" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-d '{"material_id": "mat_cotton_001"}'

# Expected: 200 with success response

# Test 2: Get variant with material
curl "http://localhost:9000/admin/variants/{variant_id}/material" \
-H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: Material data with variant info

# Test 3: Get product with variant materials
curl "http://localhost:9000/admin/products/{product_id}?expand_variant_materials=true" \
-H "Authorization: Bearer $ADMIN_TOKEN" | jq '.product.variants[].materials'

# Expected: Material data per variant

# Test 4: Store API for customers
curl "http://localhost:9000/store/products/{product_id}" | jq '.product.variants[].material'

# Expected: Customer-friendly material info per variant
```

#### **Step 5.2: Database Integrity Testing (15 minutes)**

```sql
-- Test variant-material relationships
SELECT
  v.id as variant_id,
  v.title as variant_title,
  vml.material_id,
  m.name as material_name,
  p.title as product_title
FROM product_variant v
LEFT JOIN variant_material_link vml ON v.id = vml.variant_id
LEFT JOIN materials m ON vml.material_id = m.id
LEFT JOIN product p ON v.product_id = p.id
LIMIT 10;

-- Test constraints
-- This should succeed
INSERT INTO variant_material_link (variant_id, material_id)
VALUES ('test_variant_1', 'test_material_1');

-- This should fail (duplicate variant)
INSERT INTO variant_material_link (variant_id, material_id)
VALUES ('test_variant_1', 'test_material_2');

-- Clean up
DELETE FROM variant_material_link WHERE variant_id = 'test_variant_1';
```

#### **Step 5.3: Performance Testing (10 minutes)**

```bash
# Test product list with variant material expansion
time curl "http://localhost:9000/admin/products?expand_variant_materials=true&limit=20" \
-H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

# Expected: < 800ms for 20 products with variants

# Test single product performance
time curl "http://localhost:9000/admin/products/{product_id}?expand_variant_materials=true" \
-H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null

# Expected: < 200ms
```

#### **Step 5.4: Admin UI Testing (10 minutes)**

1. **Widget Display**: Verify variant material widget appears on product details
2. **Material Assignment**: Test individual variant material assignment
3. **Bulk Operations**: Test bulk material assignment to multiple variants
4. **Error Handling**: Test constraint violations and error messages
5. **Performance**: Verify UI responsiveness with products having many variants

---

## ✅ PRODUCTION READINESS CHECKLIST

### **Framework Compliance**
- [ ] ✅ Zero raw SQL in runtime code paths
- [ ] ✅ Link service used for all CRUD operations
- [ ] ✅ Framework authentication patterns
- [ ] ✅ Variant-level entity relationships

### **Database Integrity**
- [ ] ✅ PRIMARY KEY on variant_id (1:1 relationship)
- [ ] ✅ FOREIGN KEY constraints with proper cascading
- [ ] ✅ Performance indexes for material lookups
- [ ] ✅ Referential integrity prevents orphaned data

### **Business Logic Alignment**
- [ ] ✅ Materials linked to variants, not products
- [ ] ✅ Customer sees material per variant selection
- [ ] ✅ Inventory tracking per variant-material combination
- [ ] ✅ Admin UI manages materials per variant

### **API Excellence**
- [ ] ✅ Variant material CRUD endpoints
- [ ] ✅ Product expansion includes variant materials
- [ ] ✅ Store API provides customer-friendly material info
- [ ] ✅ Bulk operations for admin efficiency

### **Performance**
- [ ] ✅ < 200ms single product with variant materials
- [ ] ✅ < 800ms product list with variant material expansion
- [ ] ✅ Efficient queries with proper indexing
- [ ] ✅ Optional expansion to control performance

---

## 📊 MIGRATION FROM SESSION 1C

### **Data Migration** (if any product-level materials exist)

```sql
-- If migrating from product-material to variant-material
-- This would be needed if Session 1C was partially implemented

-- 1. Backup existing data
CREATE TABLE product_material_backup AS
SELECT * FROM product_material_link;

-- 2. Migrate to variant level (assign to all variants of product)
INSERT INTO variant_material_link (variant_id, material_id)
SELECT
  pv.id as variant_id,
  pml.material_id
FROM product_material_link pml
JOIN product p ON pml.product_id = p.id
JOIN product_variant pv ON p.id = pv.product_id
WHERE NOT EXISTS (
  SELECT 1 FROM variant_material_link vml
  WHERE vml.variant_id = pv.id
);

-- 3. Verify migration
SELECT
  COUNT(*) as migrated_links,
  COUNT(DISTINCT variant_id) as variants_with_materials
FROM variant_material_link;

-- 4. Drop old table (only after verification)
-- DROP TABLE product_material_link;
```

---

## 🎯 BUSINESS IMPACT

### **Customer Experience Improvements**
1. **Material Clarity**: Customers see exact material per size/color choice
2. **Informed Decisions**: Material info available during variant selection
3. **Inventory Accuracy**: Real-time availability per variant-material combo

### **Operational Benefits**
1. **Accurate Inventory**: Material consumption tracked per variant sold
2. **Supplier Alignment**: Material sourcing matches variant specifications
3. **Admin Efficiency**: Bulk material assignment for product catalogs

### **Technical Advantages**
1. **Framework Compliance**: Follows Medusa v2 best practices
2. **Scalability**: Supports complex product catalogs
3. **Maintainability**: Clear separation of concerns

---

## 📝 SESSION COMPLETION

```bash
# Session start logging
echo "$(date): Session 1C-VARIANT started - Variant-level material mapping" >> session-progress.log

# Phase completion tracking
echo "$(date): Framework foundation established" >> session-progress.log
echo "$(date): Database schema migrated" >> session-progress.log
echo "$(date): API layer implemented" >> session-progress.log
echo "$(date): Admin UI completed" >> session-progress.log
echo "$(date): Testing validated" >> session-progress.log

# Final completion
node ../dev.sessions.log/update-tasks-status.js 1C-VARIANT COMPLETED "Variant-Material link operational; business logic aligned"
```

---

## 🚨 CRITICAL SUCCESS FACTORS

1. **Variant Entity Verification**: Ensure product_variant table exists and is populated
2. **Material Module Integration**: Verify materials module is functional
3. **Link Service Discovery**: Document working service resolution keys
4. **Performance Monitoring**: Track query performance with variant expansion
5. **Business Validation**: Confirm variant-material mappings match business needs

---

## 🔄 ROLLBACK STRATEGY

If critical issues arise:

```sql
-- Emergency rollback
DROP TABLE IF EXISTS variant_material_link CASCADE;

-- Restore to clean state
-- No product-material table to restore as we're replacing incorrect implementation

-- API rollback
# Restore from backup/session-1c-product-level/ if needed
# But continue with variant approach as it's the correct business model
```

---

## 📋 NEXT STEPS

After Session 1C-VARIANT completion:

1. **Inventory Integration**: Connect variant-material links to inventory tracking
2. **Checkout Flow**: Ensure material info flows through to order processing
3. **Reporting**: Create reports for material consumption per variant
4. **Session 2A**: Tax Configuration (still needed for go-live)

**This variant-level implementation provides the correct foundation for fabric store operations, ensuring accurate inventory tracking and customer experience alignment.**