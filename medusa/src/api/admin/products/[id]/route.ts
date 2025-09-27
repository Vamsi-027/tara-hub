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

  const productId = req.params.id
  const body = (req as any).body || {}
  const { material_id, ...updateInput } = body

  try {
    if (material_id !== undefined && material_id !== null && typeof material_id !== "string") {
      return res.status(400).json({ error: "material_id must be string or null" })
    }

    // Validate material exists if provided
    if (typeof material_id === "string") {
      const materialsService = req.scope.resolve("materialsModuleService") as any
      await materialsService.retrieveMaterial(material_id)
    }

    // Update product via core Product module service
    const productService: any = req.scope.resolve(Modules.PRODUCT)
    const updated = await productService.updateProducts(productId, updateInput)
    const product = Array.isArray(updated) ? updated[0] : updated

    // Update material_id if provided (including explicit null)
    if (material_id !== undefined) {
      const query: any = req.scope.resolve("query")
      try {
        await query.graph({
          entity: "product",
          fields: ["id"],
          data: [
            {
              id: productId,
              material_id: material_id ?? null,
            },
          ],
        })
      } catch (_) {
        const { Pool } = await import("pg")
        const pool = new Pool({ connectionString: process.env.DATABASE_URL })
        try {
          await pool.query("UPDATE product SET material_id = $1 WHERE id = $2", [material_id ?? null, productId])
        } finally {
          await pool.end()
        }
      }
    }

    res.json({ product: { ...product, material_id: material_id ?? product?.material_id ?? null } })
  } catch (e: any) {
    const msg = e?.message || "Failed to update product"
    const notFound = /not found|does not exist/i.test(msg)
    res.status(notFound ? 404 : 400).json({ error: msg })
  }
}

