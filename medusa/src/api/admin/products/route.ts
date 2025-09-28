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

  try {
    const productService = req.scope.resolve(Modules.PRODUCT) as any
    const [product] = await productService.createProducts([body])

    return res.status(201).json({ product })
  } catch (error: any) {
    return res.status(400).json({
      code: "PRODUCT_CREATION_FAILED",
      error: "Failed to create product",
      details: error?.message,
    })
  }
}
