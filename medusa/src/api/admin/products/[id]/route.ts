import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, MedusaError } from "@medusajs/framework/utils"
import { ZodError, z } from "zod"

import { assertAdminRequest } from "../../../utils/admin-auth"
import { resolveContainer } from "../../../utils/container"

const PRODUCT_RETRIEVE_FIELDS = [
  "id",
  "title",
  "subtitle",
  "description",
  "handle",
  "status",
  "created_at",
  "updated_at",
  "metadata",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.materials.id",
  "variants.materials.name",
  "images.id",
  "images.url",
]

const PRODUCT_UPDATE_EVENT = "admin.product.update"

export const ADMIN_PRODUCT_GET_CONFIG = {
  retrieveConfig: {
    select: [
      "id",
      "title",
      "subtitle",
      "description",
      "handle",
      "status",
      "created_at",
      "updated_at",
      "metadata",
    ],
    relations: ["variants", "variants.materials", "images"],
  },
}

const productUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    handle: z.string().optional(),
    status: z.enum(["draft", "proposed", "published", "rejected"]).optional(),
    metadata: z.record(z.any()).optional(),
    images: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    assertAdminRequest(req)
    const query = resolveContainer(req.scope, "QUERY", "query") as any

    const {
      data: [product],
    } = await query.graph({
      entity: "product",
      fields: PRODUCT_RETRIEVE_FIELDS,
      filters: { id: req.params.id },
    })

    if (!product) {
      return res.status(404).json({
        type: "not_found",
        message: "Product not found",
      })
    }

    return res.json({ product })
  } catch (error) {
    return sendError(res, error, "Failed to retrieve product", req)
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const admin = assertAdminRequest(req)
    const productId = req.params.id
    const updateData = productUpdateSchema.parse((req as any).body ?? {})

    if (!Object.keys(updateData).length) {
      return res.status(400).json({
        type: "invalid_request",
        message: "No product fields supplied",
      })
    }

    const productService = req.scope.resolve(Modules.PRODUCT) as any
    const logger = resolveContainer(req.scope, "LOGGER", "logger") as any

    await productService.updateProducts([{ id: productId, ...updateData }])

    const requestId = extractRequestId(req)

    logger?.info?.(PRODUCT_UPDATE_EVENT, {
      product_id: productId,
      actor_id: admin.actorId,
      request_id: requestId,
      updated_fields: Object.keys(updateData),
    })

    return res.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        type: "invalid_request",
        message: error.issues[0]?.message ?? "Invalid request body",
        issues: error.issues,
        request_id: extractRequestId(req),
      })
    }

    return sendError(res, error, "Failed to update product", req)
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
