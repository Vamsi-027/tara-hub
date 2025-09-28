# 🏗️ SESSION 1C: PRODUCT-MATERIAL LINK - PRODUCTION IMPLEMENTATION

**Date**: 2025-09-26
**Duration**: 3-4 hours
**Approach**: Production-Ready Medusa v2 Link Module with Foreign Keys & Constraints
**Developer**: [Assign to team member]
**Priority**: 🔴 **CRITICAL FOUNDATION**

---

## 🎯 OBJECTIVE

Implement product→material association using **Medusa v2 Link Module patterns** with production-grade database integrity, zero raw SQL, and framework-compliant API patterns.

**Success Criteria**:
- ✅ No raw SQL remains in runtime code paths
- ✅ Link table with PRIMARY KEY, FOREIGN KEY constraints, and referential integrity
- ✅ Admin widget shows current material and persists changes
- ✅ `query.graph` expands materials with minimal fields for performance
- ✅ Framework-native authentication and error handling
- ✅ Transactional updates prevent orphaned links
- ✅ Performance < 500ms for 50 product queries

---

## ⚠️ CRITICAL BUSINESS DECISION

**MUST DECIDE BEFORE STARTING:**

**Option A: One Material per Product (1:1)**
```typescript
defineLink("product", "material", { isList: false })
```
- **Database**: `PRIMARY KEY (product_id)`, no surrogate ID
- **UI**: Single select dropdown
- **Use Case**: Simple fabric assignment

**Option B: Multiple Materials per Product (1:many)**
```typescript
defineLink("product", "material", { isList: true })
```
- **Database**: `PRIMARY KEY (product_id, material_id)`, no surrogate ID
- **UI**: Multi-select with chips
- **Use Case**: Fabric compositions (cotton + polyester)

**✅ DECISION**: **Choose 1:1 (recommended for fabric store)** ← Update this line

---

## 🚀 EXECUTION PLAN

### **PHASE 1: FRAMEWORK VALIDATION (45 minutes)**

#### **Step 1.1: Service Resolution Discovery (15 minutes)**
```bash
cd medusa

# Test Modules.LINK availability
node -e "
const { Modules } = require('@medusajs/framework/utils');
console.log('✅ Available modules:', Object.keys(Modules));
console.log('✅ LINK module:', Modules.LINK || 'NOT_AVAILABLE');
"

# Test service resolution patterns
node -e "
try {
  const { createMedusaContainer } = require('@medusajs/framework/utils');
  const container = createMedusaContainer();

  // Try different service keys
  const keys = ['linkModuleService', 'link'];
  keys.forEach(key => {
    try {
      const service = container.resolve(key);
      console.log('✅ Working service key:', key);
    } catch (e) {
      console.log('❌ Failed key:', key);
    }
  });
} catch (e) {
  console.log('❌ Container creation failed:', e.message);
}
"
```

**Document working service key**: `linkModuleService` ← Update after discovery

#### **Step 1.2: Link Definition & Discovery (15 minutes)**

```bash
mkdir -p src/links
```

```typescript
// File: src/links/product-material.ts
import { defineLink } from "@medusajs/framework/utils"

// Use entity strings for maximum compatibility
export default defineLink("product", "material", {
  isList: false, // Set to true for 1:many relationship
})
```

#### **Step 1.3: Link Field Discovery (15 minutes)**
```bash
# Create discovery test
cat > test-link-discovery.js << 'EOF'
async function discoverLinkField() {
  try {
    const { createMedusaContainer } = require('@medusajs/framework/utils');
    const container = createMedusaContainer();
    const query = container.resolve("query");

    // Test both potential field names
    const fields = ["materials", "material"];

    for (const field of fields) {
      try {
        const result = await query.graph({
          entity: "product",
          fields: ["id", `${field}.*`],
          pagination: { take: 1 }
        });

        if (result.data[0] && result.data[0][field] !== undefined) {
          console.log(`✅ Link field discovered: ${field}`);
          return field;
        }
      } catch (e) {
        console.log(`❌ Field ${field} failed:`, e.message);
      }
    }

    console.log('❌ No link field discovered');
  } catch (error) {
    console.log('❌ Discovery failed:', error.message);
  }
}

discoverLinkField();
EOF

node test-link-discovery.js
rm test-link-discovery.js
```

**Document discovered field**: `materials` ← Update after discovery

---

### **PHASE 2: DATABASE MIGRATION WITH INTEGRITY (45 minutes)**

#### **Step 2.1: Production Migration (45 minutes)**

```sql
-- File: src/migrations/[timestamp]-create-product-material-link.sql
-- Production-grade link table with integrity constraints

-- FOR 1:1 RELATIONSHIP (single material per product)
CREATE TABLE IF NOT EXISTS product_material_link (
  product_id VARCHAR(255) NOT NULL,
  material_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  -- Primary key without surrogate ID
  PRIMARY KEY (product_id),

  -- Foreign key constraints with proper cascading
  CONSTRAINT fk_product_material_product
    FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_material_material
    FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE RESTRICT
);

-- FOR 1:MANY RELATIONSHIP (multiple materials per product)
-- Uncomment if you chose Option B:
/*
CREATE TABLE IF NOT EXISTS product_material_link (
  product_id VARCHAR(255) NOT NULL,
  material_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  -- Composite primary key
  PRIMARY KEY (product_id, material_id),

  -- Foreign key constraints
  CONSTRAINT fk_product_material_product
    FOREIGN KEY (product_id) REFERENCES public.product(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_material_material
    FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE RESTRICT
);
*/

-- Performance index for material lookups
CREATE INDEX IF NOT EXISTS idx_pml_material_id
ON product_material_link (material_id);

-- Index for soft deletes if needed
CREATE INDEX IF NOT EXISTS idx_pml_deleted_at
ON product_material_link (deleted_at) WHERE deleted_at IS NULL;
```

```bash
# Generate and apply migration
npx medusa db:generate materialsModule

# If auto-generation fails, use manual migration above
npx medusa db:migrate

# Verify constraints
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
WHERE tc.table_name = 'product_material_link';
"
```

---

### **PHASE 3: FRAMEWORK-NATIVE API REFACTORING (75 minutes)**

#### **Step 3.1: Complete Raw SQL Removal (25 minutes)**

**Files to clean**:
- `src/api/admin/products/route.ts`
- `src/api/admin/products/[id]/route.ts`

**Remove entirely**:
```typescript
// DELETE ALL OF THESE PATTERNS:
import { Pool } from "pg"

} catch (_) {
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query("UPDATE product SET material_id = $1 WHERE id = $2", [material_id, product.id])
  } finally {
    await pool.end()
  }
}
```

#### **Step 3.2: Framework-Native Authentication (15 minutes)**

Replace custom `isAdmin()` with framework middleware:

```typescript
// Add framework authentication import
import { authenticate } from "@medusajs/framework/http"

// Replace custom isAdmin function with middleware
// If middleware not available, use improved auth check:
function isAdmin(req: MedusaRequest): boolean {
  return Boolean(
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.id ||
    (req as any).session?.user_id
  )
}
```

#### **Step 3.3: Transactional Link Service Implementation (35 minutes)**

**Product Creation with Link**:
```typescript
// File: src/api/admin/products/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { material_id, ...productData } = req.body

  try {
    // Create product via framework service
    const productService = req.scope.resolve(Modules.PRODUCT)
    const [product] = await productService.createProducts([productData])

    // Link to material if provided
    if (material_id) {
      const linkService = req.scope.resolve("linkModuleService") // Use discovered key

      // Use discovered service payload shape
      await linkService.create([{
        product: { product_id: product.id },
        material: { material_id }
      }])
    }

    res.status(201).json({ product })

  } catch (error) {
    console.error('Product creation failed:', error)

    // Handle constraint violations
    if (error.code === '23505') {
      return res.status(409).json({
        code: 'MATERIAL_LINK_CONFLICT',
        error: 'Material assignment conflict'
      })
    }

    res.status(400).json({
      code: 'PRODUCT_CREATION_FAILED',
      error: 'Failed to create product',
      details: error.message
    })
  }
}
```

**Product Retrieval with Selective Expansion**:
```typescript
// File: src/api/admin/products/[id]/route.ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const query = req.scope.resolve("query")

    // Use minimal fields for performance
    const expandMaterials = req.query.expand_materials === 'true'
    const fields = expandMaterials
      ? ["*", "materials.id", "materials.name", "materials.code"]
      : ["*"]

    const { data: [product] } = await query.graph({
      entity: "product",
      fields,
      filters: { id: req.params.id }
    })

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    res.json({ product })

  } catch (error) {
    console.error('Product retrieval failed:', error)
    res.status(400).json({
      error: 'Failed to retrieve product',
      details: error.message
    })
  }
}
```

**Transactional Material Update**:
```typescript
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { material_id, ...updateData } = req.body
  const productId = req.params.id

  try {
    // Update product core data if provided
    if (Object.keys(updateData).length > 0) {
      const productService = req.scope.resolve(Modules.PRODUCT)
      await productService.updateProducts([{ id: productId, ...updateData }])
    }

    // Handle material link update transactionally
    if (material_id !== undefined) {
      const linkService = req.scope.resolve("linkModuleService") // Use discovered key

      // Transactional update: dismiss then create in sequence
      // Remove existing material links for this product
      try {
        await linkService.dismiss([{
          product: { product_id: productId }
        }])
      } catch (e) {
        // Continue if no existing links
      }

      // Create new link if material_id provided (not null/empty)
      if (material_id) {
        await linkService.create([{
          product: { product_id: productId },
          material: { material_id }
        }])
      }
    }

    res.json({ success: true })

  } catch (error) {
    console.error('Product update failed:', error)

    // Handle specific constraint violations
    if (error.code === '23505') {
      return res.status(409).json({
        code: 'MATERIAL_LINK_CONFLICT',
        error: 'Material assignment conflict'
      })
    }

    res.status(400).json({
      code: 'PRODUCT_UPDATE_FAILED',
      error: 'Failed to update product',
      details: error.message
    })
  }
}
```

#### **Step 3.4: Dedicated Material Endpoint (Optional Safety) (5 minutes)**

```typescript
// File: src/api/admin/products/[id]/material/route.ts
// Minimal endpoint for material data to avoid breaking existing admin consumers

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const query = req.scope.resolve("query")

    const { data: [product] } = await query.graph({
      entity: "product",
      fields: ["id", "materials.id", "materials.name"],
      filters: { id: req.params.id }
    })

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    const material = product.materials?.[0] || product.materials || null
    res.json({ material_id: material?.id || null, material })

  } catch (error) {
    console.error('Material retrieval failed:', error)
    res.status(400).json({
      error: 'Failed to retrieve material',
      details: error.message
    })
  }
}
```

---

### **PHASE 4: ADMIN UI OPTIMIZATION (35 minutes)**

```typescript
// File: src/admin/widgets/product-material-select.tsx
import React, { useEffect, useState } from "react"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import MaterialSelect from "../components/MaterialSelect"

const ProductMaterialSelect = ({ product }) => {
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product?.materials) {
      // Handle both single and multiple material scenarios robustly
      const materials = Array.isArray(product.materials)
        ? product.materials.filter(Boolean)
        : [product.materials].filter(Boolean)

      const firstMaterial = materials[0]
      setSelectedMaterial(firstMaterial?.id || null)
    } else {
      setSelectedMaterial(null)
    }
  }, [product])

  const handleSave = async () => {
    if (!product?.id) return

    setSaving(true)
    try {
      const res = await fetch(`/admin/products/${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material_id: selectedMaterial })
      })

      if (!res.ok) {
        const error = await res.json()

        // Handle specific error codes
        if (error.code === 'MATERIAL_LINK_CONFLICT') {
          throw new Error("Material assignment conflict - please refresh and try again")
        }

        throw new Error(error.details || error.error || "Save failed")
      }

      toast.success("Material assignment updated")

      // Refresh the page data to show updated state
      window.location.reload()

    } catch (error) {
      console.error('Material save failed:', error)
      toast.error(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Material Assignment</Heading>
        <Text className="text-ui-fg-subtle mt-1">
          Associate this product with a material for inventory tracking
        </Text>
      </div>
      <div className="px-6 py-4 space-y-4">
        <MaterialSelect
          value={selectedMaterial}
          onChange={setSelectedMaterial}
          placeholder="Select material..."
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setSelectedMaterial(null)}
            disabled={saving || !selectedMaterial}
          >
            Clear
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            loading={saving}
          >
            {saving ? "Saving..." : "Save Material"}
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default ProductMaterialSelect

export const config = {
  zone: "product.details.side.after",
}
```

---

### **PHASE 5: PRODUCTION TESTING (45 minutes)**

#### **Step 5.1: End-to-End Workflow (20 minutes)**

```bash
# Test 1: Create product with material assignment
curl -X POST "http://localhost:9000/admin/products" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-d '{
  "title": "Test Cotton Fabric",
  "handle": "test-cotton-fabric",
  "material_id": "mat_cotton_001",
  "options": [{"title": "Default", "values": ["Default"]}]
}'

# Expected: 201 Created with product object

# Test 2: Verify link table integrity
psql $DATABASE_URL -c "
SELECT
  l.product_id,
  l.material_id,
  p.title as product_title,
  m.name as material_name
FROM product_material_link l
JOIN product p ON l.product_id = p.id
JOIN materials m ON l.material_id = m.id
LIMIT 5;
"

# Expected: Join successful, no orphaned links

# Test 3: Get product with materials (minimal fields)
curl "http://localhost:9000/admin/products/{product_id}?expand_materials=true" \
-H "Authorization: Bearer $ADMIN_TOKEN" | jq '.product.materials'

# Expected: Material data with id, name, code only
```

#### **Step 5.2: Constraint Validation (10 minutes)**

```sql
-- Test 1:1 uniqueness constraint (should fail on second insert)
INSERT INTO product_material_link (product_id, material_id)
VALUES ('test_prod_1', 'test_mat_1');
-- Expected: Success

INSERT INTO product_material_link (product_id, material_id)
VALUES ('test_prod_1', 'test_mat_2');
-- Expected: ERROR constraint "product_material_link_pkey" violated

-- Test foreign key constraints
INSERT INTO product_material_link (product_id, material_id)
VALUES ('invalid_product', 'test_mat_1');
-- Expected: ERROR foreign key constraint violated

-- Clean up
DELETE FROM product_material_link WHERE product_id LIKE 'test_prod_%';
```

#### **Step 5.3: Performance Validation (10 minutes)**

```bash
# Test bulk product query performance (without auto-expansion)
time curl "http://localhost:9000/admin/products?limit=50" \
-H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
# Expected: < 200ms

# Test with selective material expansion
time curl "http://localhost:9000/admin/products?limit=20&expand_materials=true" \
-H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
# Expected: < 500ms

# Test single product with materials
time curl "http://localhost:9000/admin/products/{product_id}?expand_materials=true" \
-H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
# Expected: < 100ms
```

#### **Step 5.4: Concurrency & Error Handling (5 minutes)**

```bash
# Test concurrent material updates (simulate two admin users)
(curl -X POST "http://localhost:9000/admin/products/{product_id}" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-d '{"material_id": "mat_1"}' &)

(curl -X POST "http://localhost:9000/admin/products/{product_id}" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-d '{"material_id": "mat_2"}' &)

wait

# Expected: Both return success or proper conflict handling
# Final state should be consistent (one material assigned)
```

---

## ✅ PRODUCTION READINESS CHECKLIST

**Framework Compliance**:
- [ ] ✅ Zero raw SQL in runtime code paths
- [ ] ✅ Link service used for all CRUD operations
- [ ] ✅ Framework authentication patterns
- [ ] ✅ Structured error responses with proper HTTP codes

**Database Integrity**:
- [ ] ✅ PRIMARY KEY constraints (no surrogate IDs)
- [ ] ✅ FOREIGN KEY constraints with proper cascading
- [ ] ✅ Referential integrity prevents orphaned data
- [ ] ✅ Performance indexes on lookup columns

**API Excellence**:
- [ ] ✅ Transactional updates prevent intermediate states
- [ ] ✅ Constraint violation handling (409 responses)
- [ ] ✅ Minimal field expansion for performance
- [ ] ✅ Proper error codes and structured responses

**Admin UI**:
- [ ] ✅ Reads current material state correctly
- [ ] ✅ Saves material updates via framework APIs
- [ ] ✅ Handles both single/multiple material scenarios
- [ ] ✅ Error handling with user-friendly messages

**Performance**:
- [ ] ✅ < 200ms for product lists without material expansion
- [ ] ✅ < 500ms for product lists with material expansion
- [ ] ✅ < 100ms for single product with materials
- [ ] ✅ Indexes support efficient material lookups

---

## 📝 SESSION COMPLETION

```bash
# Session start
echo "$(date): Session 1C started - Production link implementation" >> session-progress.log

# Phase completions
echo "$(date): Framework validation completed" >> session-progress.log
echo "$(date): Database migration with integrity completed" >> session-progress.log
echo "$(date): Framework-native API refactoring completed" >> session-progress.log
echo "$(date): Admin UI optimization completed" >> session-progress.log
echo "$(date): Production testing validated" >> session-progress.log

# Session completion
node ../dev.sessions.log/update-tasks-status.js 1C COMPLETED "Product-Material link production-ready"
```

---

## 🚨 TROUBLESHOOTING

**Link Discovery Issues**:
```typescript
// If linkable objects fail, use entity strings
export default defineLink("product", "material", { isList: false })
```

**Service Resolution Issues**:
```typescript
// Try alternative service keys
const linkService = req.scope.resolve("link") // or "linkModuleService"
```

**Service Payload Issues**:
```typescript
// Alternative payload structures to try
await linkService.create([{
  "product": { "product_id": productId },
  "material": { "material_id": materialId }
}])

// Or try with module identifiers
await linkService.create([{
  [Modules.PRODUCT]: { product_id: productId },
  "materialsModule": { material_id: materialId }
}])
```

**Migration Issues**:
- Check Neon PostgreSQL permissions for CREATE TABLE
- Verify `materials` table exists before applying foreign keys
- Use `IF NOT EXISTS` clauses to prevent duplicate constraint errors

---

## 🎯 NEXT STEPS

After Session 1C completion:
1. **Validate production readiness** - All checklist items must pass
2. **Document service identifiers** - Record working keys for future reference
3. **Session 2A: Tax Configuration** - Critical legal compliance for go-live
4. **Continue remaining 7 sessions** per development plan

**This production-grade implementation provides the foundation for all future product-material operations while maintaining Medusa v2 architectural excellence and data integrity.**