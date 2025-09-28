# Session 1C — Developer Prompt: Product↔Material Link (Production-Ready)

You are the Medusa v2 developer. Implement a framework‑native Product→Material association using the Link Module. Enforce DB integrity, remove raw SQL, and align the Admin UI. Follow these steps exactly.

— Decisions (locked for this session)
- Cardinality: 1:1 (single material per product)
- Link field alias: materials
- Link service DI key: linkModuleService

— Preconditions
- Directory: `medusa/`
- Neon DB URL set in env (e.g., `DATABASE_URL`)
- Materials module installed and `materials` table exists
- Admin auth available (you can call admin endpoints)

— Phase 0: Status + Safety
- Start log: `node ../dev.sessions.log/update-tasks-status.js 1C IN_PROGRESS "Implement link (1:1), DI=linkModuleService, alias=materials"`
- Create a short local branch or snapshot (optional) and proceed.

— Phase 1: Define Link (10 min)
1) Create file `medusa/src/links/product-material.ts` with:
```ts
import { defineLink } from "@medusajs/framework/utils"
export default defineLink("product", "material", { isList: false })
```
2) Optional: Quick discovery to confirm field alias (expect `materials`).
```bash
node -e "const { createMedusaContainer }=require('@medusajs/framework/utils');const q=createMedusaContainer().resolve('query');(async()=>{for(const f of ['materials','material']){try{const r=await q.graph({entity:'product',fields:[`id`,`${f}.*`],pagination:{take:1}});if(r.data?.[0]?.[f]!==undefined){console.log('FIELD',f);break}}catch(e){}}})()"
```

— Phase 2: DB Migration with Integrity (20–25 min)
Create `medusa/src/migrations/[timestamp]-create-product-material-link.sql` with:
```sql
CREATE TABLE IF NOT EXISTS product_material_link (
  product_id  VARCHAR(255) NOT NULL,
  material_id VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL,
  PRIMARY KEY (product_id),
  CONSTRAINT fk_pml_product  FOREIGN KEY (product_id)
    REFERENCES public.product(id) ON DELETE CASCADE,
  CONSTRAINT fk_pml_material FOREIGN KEY (material_id)
    REFERENCES public.materials(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_pml_material_id ON product_material_link (material_id);
CREATE INDEX IF NOT EXISTS idx_pml_deleted_at ON product_material_link (deleted_at) WHERE deleted_at IS NULL;
```
Apply and verify:
```bash
cd medusa
npx medusa db:migrate
psql "$DATABASE_URL" -c "\d+ product_material_link"
```

— Phase 3: API Refactor (30–40 min)
Files: `medusa/src/api/admin/products/route.ts`, `medusa/src/api/admin/products/[id]/route.ts`

1) Remove all raw SQL fallbacks (any import/use of `pg`/`Pool`).

2) Product create — link on material_id:
```ts
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Use framework admin auth middleware if available; otherwise ensure robust admin check
  const { material_id, ...productData } = req.body
  try {
    const productService = req.scope.resolve(Modules.PRODUCT)
    const [product] = await productService.createProducts([productData])
    if (material_id) {
      const linkService = req.scope.resolve('linkModuleService')
      await linkService.create([{ product: { product_id: product.id }, material: { material_id } }])
    }
    return res.status(201).json({ product })
  } catch (error: any) {
    if (error?.code === '23505') return res.status(409).json({ code: 'MATERIAL_LINK_CONFLICT', error: 'Material assignment conflict' })
    return res.status(400).json({ code: 'PRODUCT_CREATION_FAILED', error: 'Failed to create product', details: error?.message })
  }
}
```

3) Product get — selective expansion for performance:
```ts
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve('query')
    const expand = (req.query as any)?.expand_materials === 'true'
    const fields = expand ? ['*','materials.id','materials.name','materials.code'] : ['*']
    const { data: [product] } = await query.graph({ entity: 'product', fields, filters: { id: (req as any).params.id } })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    return res.json({ product })
  } catch (error: any) {
    return res.status(400).json({ error: 'Failed to retrieve product', details: error?.message })
  }
}
```

4) Product update — dismiss then create link (transactional intent):
```ts
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { material_id, ...updateData } = req.body
  const productId = (req as any).params.id
  try {
    if (Object.keys(updateData).length > 0) {
      const productService = req.scope.resolve(Modules.PRODUCT)
      await productService.updateProducts([{ id: productId, ...updateData }])
    }
    if (material_id !== undefined) {
      const linkService = req.scope.resolve('linkModuleService')
      try { await linkService.dismiss([{ product: { product_id: productId } }]) } catch {}
      if (material_id) {
        await linkService.create([{ product: { product_id: productId }, material: { material_id } }])
      }
    }
    return res.json({ success: true })
  } catch (error: any) {
    if (error?.code === '23505') return res.status(409).json({ code: 'MATERIAL_LINK_CONFLICT', error: 'Material assignment conflict' })
    return res.status(400).json({ code: 'PRODUCT_UPDATE_FAILED', error: 'Failed to update product', details: error?.message })
  }
}
```

— Phase 4: Admin UI Alignment (15–20 min)
File: `medusa/src/admin/widgets/product-material-select.tsx`
- Read: `const initial = product?.materials?.[0]?.id ?? null`
- Save: `POST /admin/products/:id` with `{ material_id }`
- On 409 with code `MATERIAL_LINK_CONFLICT`, show friendly message.

— Phase 5: Validation (20–25 min)
E2E
```bash
curl -X POST "http://localhost:9000/admin/products" -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" -d '{
  "title":"Test Cotton Fabric","handle":"test-cotton-fabric","material_id":"mat_cotton_001",
  "options":[{"title":"Default","values":["Default"]}] }'
psql "$DATABASE_URL" -c "SELECT * FROM product_material_link LIMIT 3;"
curl "http://localhost:9000/admin/products/{product_id}?expand_materials=true" -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.product.materials'
```
Constraints
```sql
-- 1:1 uniqueness should reject second assignment for same product
INSERT INTO product_material_link (product_id,material_id) VALUES ('test_prod','test_mat1');
INSERT INTO product_material_link (product_id,material_id) VALUES ('test_prod','test_mat2'); -- expect PK violation
```
Performance
```bash
time curl -s "http://localhost:9000/admin/products?limit=50" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null  # <200ms
time curl -s "http://localhost:9000/admin/products?limit=20&expand_materials=true" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null  # <500ms
```

— Clean‑up and Guardrails
- Remove/ignore any legacy `product.material_id` usage and all raw SQL fallbacks.
- Add lightweight logs for link create/dismiss including product_id/material_id.

— Completion
- Mark done: `node ../dev.sessions.log/update-tasks-status.js 1C COMPLETED "Link operational; Admin/UI aligned; integrity enforced"`
- Handoff notes: service key=linkModuleService; alias=materials; cardinality=1:1; no raw SQL remains.

