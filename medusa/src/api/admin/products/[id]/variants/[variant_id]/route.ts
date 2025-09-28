import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { ZodError, z } from "zod"

import { assertAdminRequest } from "../../../../utils/admin-auth"
import { resolveContainer } from "../../../../utils/container"

const VARIANT_FIELDS = [
  "id",
  "title",
  "sku",
  "product.id",
  "materials.id",
  "materials.name",
  "materials.code",
]

const MATERIAL_ASSIGN_EVENT = "admin.variant.materials.update"

const variantMaterialSchema = z.object({
  material_ids: z.array(z.string().min(1)),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    assertAdminRequest(req)
    const query = resolveContainer(req.scope, "QUERY", "query") as any

    const {
      data: [variant],
    } = await query.graph({
      entity: "product_variant",
      fields: VARIANT_FIELDS,
      filters: {
        id: req.params.variant_id,
        product: { id: req.params.id },
      },
    })

    if (!variant) {
      return res.status(404).json({
        type: "not_found",
        message: "Variant not found",
      })
    }

    const materials = Array.isArray(variant.materials)
      ? (variant.materials as any[]).filter((material) => material?.id)
      : []

    return res.json({
      variant: {
        ...variant,
        materials,
      },
    })
  } catch (error) {
    return sendError(res, error, "Failed to retrieve variant", req)
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const admin = assertAdminRequest(req)

    const productId = req.params.id
    const variantId = req.params.variant_id
    const { material_ids } = variantMaterialSchema.parse((req as any).body ?? {})
    const materialIds = Array.from(new Set(material_ids.map((id) => id.trim())))

    const query = resolveContainer(req.scope, "QUERY", "query") as any
    const linkService = resolveContainer(
      req.scope,
      "LINK_MODULE_SERVICE",
      "linkModuleService"
    ) as any
    const logger = resolveContainer(req.scope, "LOGGER", "logger") as any

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
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Variant not found")
    }

    const existing = new Set(
      Array.isArray(variant.materials)
        ? (variant.materials as any[]).filter((material) => material?.id).map((material) => material.id as string)
        : []
    )

    const desired = new Set(materialIds)
    const toAdd = [...desired].filter((id) => !existing.has(id))
    const toRemove = [...existing].filter((id) => !desired.has(id))

    if (toRemove.length) {
      await linkService.dismiss(toRemove.map((materialId: string) => [variantId, materialId]))
    }

    if (toAdd.length) {
      await linkService.create(toAdd.map((materialId: string) => [variantId, materialId]))
    }

    const {
      data: [updatedVariant],
    } = await query.graph({
      entity: "product_variant",
      fields: VARIANT_FIELDS,
      filters: {
        id: variantId,
        product: { id: productId },
      },
    })

    const requestId = extractRequestId(req)

    logger?.info?.(MATERIAL_ASSIGN_EVENT, {
      product_id: productId,
      product_variant_id: variantId,
      added: toAdd,
      removed: toRemove,
      actor_id: admin.actorId,
      request_id: requestId,
    })

    return res.json({
      variant: updatedVariant ?? {
        id: variantId,
        product: variant.product,
        materials: materialIds.map((id) => ({ id })),
      },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        type: "invalid_request",
        message: error.issues[0]?.message ?? "Invalid request body",
        issues: error.issues,
        request_id: extractRequestId(req),
      })
    }

    if ((error as any)?.code === "23505") {
      return res.status(409).json({
        type: "conflict",
        message: "Material assignment conflict",
        request_id: extractRequestId(req),
      })
    }

    return sendError(res, error, "Failed to update variant materials", req)
  }
}

function extractRequestId(req: MedusaRequest) {
  const value = req.headers["x-request-id"]
  return Array.isArray(value) ? value[0] : value ?? null
}

function sendError(
  res: MedusaResponse,
  error: unknown,
  fallbackMessage: string,
  req: MedusaRequest
) {
  const status =
    error instanceof MedusaError &&
    error.type === MedusaError.Types.NOT_ALLOWED
      ? 401
      : error instanceof MedusaError &&
        error.type === MedusaError.Types.NOT_FOUND
      ? 404
      : 400

  return res.status(status).json({
    type: error instanceof MedusaError ? error.type : "unknown_error",
    message: (error as any)?.message ?? fallbackMessage,
    request_id: extractRequestId(req),
  })
}
