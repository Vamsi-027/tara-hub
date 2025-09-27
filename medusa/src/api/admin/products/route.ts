import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

function isAdmin(req: MedusaRequest): boolean {
  return (
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.type === "admin" ||
    (req as any).user?.role === "admin" ||
    Boolean((req as any).session?.user_id)
  )
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const body = (req as any).body || {}
  const { material_id, ...productInput } = body

  try {
    // Validate material exists if provided
    if (material_id) {
      const materialsService = req.scope.resolve("materialsModuleService") as any
      await materialsService.retrieveMaterial(material_id)
    }

    // Create product via Product module service (core behavior)
    const productService: any = req.scope.resolve(Modules.PRODUCT)
    const created = await productService.createProducts(productInput)
    const product = Array.isArray(created) ? created[0] : created

    // Persist material_id if provided
    if (material_id && product?.id) {
      const query: any = req.scope.resolve("query")
      try {
        await query.graph({
          entity: "product",
          fields: ["id"],
          data: [
            {
              id: product.id,
              material_id,
            },
          ],
        })
      } catch (_) {
        const { Pool } = await import("pg")
        const pool = new Pool({ connectionString: process.env.DATABASE_URL })
        try {
          await pool.query("UPDATE product SET material_id = $1 WHERE id = $2", [material_id, product.id])
        } finally {
          await pool.end()
        }
      }
    }

    res.status(201).json({ product: { ...product, material_id: material_id ?? null } })
  } catch (e: any) {
    res.status(400).json({ error: "Failed to create product", details: e?.message })
  }
}

