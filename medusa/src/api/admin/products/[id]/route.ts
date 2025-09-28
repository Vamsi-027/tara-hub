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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  try {
    const query = req.scope.resolve("query") as any
    const {
      data: [product],
    } = await query.graph({
      entity: "product",
      fields: ["*"],
      filters: { id: (req as any).params.id },
    })

    if (!product) {
      res.status(404).json({ error: "Product not found" })
      return
    }

    res.json({ product })
  } catch (error: any) {
    res.status(400).json({
      error: "Failed to retrieve product",
      details: error?.message,
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const productId = (req as any).params.id
  const updateData = (req as any).body || {}

  try {
    if (Object.keys(updateData).length > 0) {
      const productService = req.scope.resolve(Modules.PRODUCT) as any
      await productService.updateProducts([{ id: productId, ...updateData }])
    }

    return res.json({ success: true })
  } catch (error: any) {
    return res.status(400).json({
      code: "PRODUCT_UPDATE_FAILED",
      error: "Failed to update product",
      details: error?.message,
    })
  }
}
