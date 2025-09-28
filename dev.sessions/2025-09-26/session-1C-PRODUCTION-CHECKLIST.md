# Session 1C — Product↔Material Link: Developer Checklist (Production)

Objective: Implement product→material association using Medusa v2 Link Module with full DB integrity, no raw SQL, and framework‑native APIs.

- Decision: 1:1 (single material per product)
- Link field alias: materials (verify; if discovery returns singular, use material)
- Link service key: linkModuleService (resolve via DI container)

Phase 1 — Framework Validation (15–20 min)
- Verify modules: `node -e "const { Modules, defineLink } = require('@medusajs/framework/utils'); console.log(!!defineLink)"`
- Resolve service: `node -e "const { createMedusaContainer } = require('@medusajs/framework/utils'); const c=createMedusaContainer(); ['linkModuleService','link'].forEach(k=>{try{c.resolve(k)&&console.log('OK',k)}catch{}})"`
- Outcome: use `linkModuleService` for DI

Phase 2 — Define Link (10 min)
- File: `medusa/src/links/product-material.ts`
- Contents:
  ```ts
  import { defineLink } from "@medusajs/framework/utils"
  export default defineLink("product", "material", { isList: false })
  ```
- Discovery (optional, one‑time):
  ```bash
  node -e "const { createMedusaContainer }=require('@medusajs/framework/utils');const q=createMedusaContainer().resolve('query');(async()=>{for(const f of ['materials','material']){try{const r=await q.graph({entity:'product',fields:[`id`,`${f}.*`],pagination:{take:1}});if(r.data?.[0]?.[f]!==undefined){console.log('FIELD',f);break}}catch(e){}}})()"
  ```

Phase 3 — DB Migration with Integrity (20–25 min)
- File: `medusa/src/migrations/[timestamp]-create-product-material-link.sql`
- SQL (1:1, no surrogate PK; requires `materials` table exists):
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
- Apply: `cd medusa && npx medusa db:migrate`
- Verify: `psql "$DATABASE_URL" -c "\d+ product_material_link"`

Phase 4 — API Refactor (30–40 min)
- Remove raw SQL fallbacks in:
  - `medusa/src/api/admin/products/route.ts`
  - `medusa/src/api/admin/products/[id]/route.ts`
- Product create (link if `material_id` provided):
  ```ts
  const productService = req.scope.resolve(Modules.PRODUCT)
  const [product] = await productService.createProducts([productData])
  if (material_id) {
    const linkService = req.scope.resolve('linkModuleService')
    await linkService.create([{ product: { product_id: product.id }, material: { material_id } }])
  }
  ```
- Product get (selective expansion):
  ```ts
  const expand = req.query.expand_materials === 'true'
  const fields = expand ? [ '*', 'materials.id', 'materials.name', 'materials.code' ] : [ '*' ]
  const { data: [product] } = await query.graph({ entity: 'product', fields, filters: { id: req.params.id } })
  ```
- Product update (transactional intent: dismiss then create):
  ```ts
  if (material_id !== undefined) {
    const linkService = req.scope.resolve('linkModuleService')
    try { await linkService.dismiss([{ product: { product_id } }]) } catch {}
    if (material_id) {
      await linkService.create([{ product: { product_id }, material: { material_id } }])
    }
  }
  ```
- Auth: prefer framework middleware; otherwise ensure robust admin check is applied consistently.
- Errors: use 409 on uniqueness/constraint violations with `code: 'MATERIAL_LINK_CONFLICT'`.

Phase 5 — Admin UI (15–20 min)
- File: `medusa/src/admin/widgets/product-material-select.tsx`
- Read: from `product.materials?.[0]?.id` (or call GET with `?expand_materials=true`).
- Save: `POST /admin/products/:id` with `{ material_id }`; handle 409 and show friendly message.

Phase 6 — Validation (20–25 min)
- E2E
  - Create product with `material_id` → 201
  - `SELECT * FROM product_material_link` shows row
  - GET `.../admin/products/{id}?expand_materials=true` returns `materials` with id/name/code
- Constraints
  - 1:1: second insert for same `product_id` → API 409, DB PK violation
  - FK: invalid product/material → FK error
- Performance
  - List 50 (no expand) < 200ms; list 20 with expand < 500ms; single product with expand < 100ms

De‑risking & Ops Notes
- Preconditions: `materials` table exists before adding FKs.
- Idempotency: all DDL uses IF NOT EXISTS; safe to reapply.
- Observability: log link create/dismiss with request id + product_id/material_id.
- Legacy: stop using `product.material_id` or `metadata.material_id`; remove raw SQL paths.

Acceptance Checklist
- [ ] No raw SQL in admin product routes
- [ ] Link table with PK + FKs exists and populated
- [ ] Create/update routes manage links via DI service
- [ ] Admin widget reads/saves correctly
- [ ] `query.graph` expands `materials` with minimal fields
- [ ] Performance targets met; 409 on conflicts; structured errors

Rollback
- If migration causes issues: `DROP TABLE IF EXISTS product_material_link;` (only if safe).
- Revert API to previous commit; keep raw SQL removed to avoid silent drift.

Status Logging
- Start: `node ../dev.sessions.log/update-tasks-status.js 1C IN_PROGRESS "Product–Material link implementation (1:1, service=linkModuleService)"`
- Complete: `node ../dev.sessions.log/update-tasks-status.js 1C COMPLETED "Link operational; API/UI aligned; integrity enforced"`

