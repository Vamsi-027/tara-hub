import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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

  const productId = (req as any).params.id
  const variantId = (req as any).params.variant_id

  try {
    const query = req.scope.resolve("query") as any
    const {
      data: [variant],
    } = await query.graph({
      entity: "product_variant",
      fields: ["*", "product.id", "materials.id", "materials.name", "materials.code"],
      filters: {
        id: variantId,
        product: { id: productId },
      },
    })

    if (!variant) {
      res.status(404).json({ error: "Variant not found" })
      return
    }

    const materials = Array.isArray(variant.materials)
      ? (variant.materials as any[]).filter((m) => m?.id)
      : []

    res.json({
      variant: {
        ...variant,
        materials,
      },
    })
  } catch (error: any) {
    res.status(400).json({
      error: "Failed to retrieve variant",
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
  const variantId = (req as any).params.variant_id
  const body = (req as any).body || {}

  if (!Array.isArray(body.material_ids)) {
    return res.status(400).json({
      code: "INVALID_MATERIAL_IDS",
      error: "material_ids must be an array of material IDs",
    })
  }

  const invalidEntry = body.material_ids.some(
    (id: unknown) => typeof id !== "string" || id.trim().length === 0
  )

  if (invalidEntry) {
    return res.status(400).json({
      code: "INVALID_MATERIAL_IDS",
      error: "material_ids must contain only non-empty strings",
    })
  }

  const normalizedMaterialIds = Array.from(
    new Set((body.material_ids as string[]).map((id: string) => id.trim()))
  )

  const requestIdHeader = req.headers["x-request-id"]
  const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader || "unknown"
  const userId = (req as any).user?.id || (req as any).session?.user_id || "unknown"

  try {
    const query = req.scope.resolve("query") as any
    const linkService = req.scope.resolve("linkModuleService") as any
    const logger = req.scope.resolve("logger") as any

    const {
      data: [variant],
    } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product.id", "materials.id"],
      filters: {
        id: variantId,
        product: { id: productId },
      },
    })

    if (!variant) {
      return res.status(404).json({ error: "Variant not found" })
    }

    const existingIds = new Set(
      Array.isArray(variant.materials)
        ? (variant.materials as any[]).filter((m) => m?.id).map((m) => m.id as string)
        : []
    )

    const desiredIds = new Set(normalizedMaterialIds)
    const toAdd = [...desiredIds].filter((id) => !existingIds.has(id))
    const toRemove = [...existingIds].filter((id) => !desiredIds.has(id))

    if (toRemove.length > 0) {
      await linkService.dismiss(
        toRemove.map((materialId: string) => [variantId, materialId])
      )

      logger?.info?.("product_variant.material.links.dismissed", {
        product_variant_id: variantId,
        product_id: productId,
        material_ids: toRemove,
        request_id: requestId,
        user_id: userId,
      })
    }

    if (toAdd.length > 0) {
      await linkService.create(
        toAdd.map((materialId: string) => [variantId, materialId])
      )

      logger?.info?.("product_variant.material.links.created", {
        product_variant_id: variantId,
        product_id: productId,
        material_ids: toAdd,
        request_id: requestId,
        user_id: userId,
      })
    }

    const {
      data: [updatedVariant],
    } = await query.graph({
      entity: "product_variant",
      fields: ["*", "product.id", "materials.id", "materials.name", "materials.code"],
      filters: {
        id: variantId,
        product: { id: productId },
      },
    })

    if (updatedVariant) {
      return res.json({ variant: updatedVariant })
    }

    return res.json({
      variant: {
        id: variant.id,
        product: variant.product,
        materials: [...desiredIds].map((id) => ({ id })),
      },
    })
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({
        code: "MATERIAL_LINK_CONFLICT",
        error: "Material assignment conflict",
      })
    }

    return res.status(400).json({
      code: "VARIANT_MATERIAL_UPDATE_FAILED",
      error: "Failed to update variant materials",
      details: error?.message,
    })
  }
}
