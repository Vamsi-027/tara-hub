import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, MedusaError } from "@medusajs/framework/utils"
import { ZodError, z } from "zod"

import { assertAdminRequest } from "../../utils/admin-auth"
import { resolveContainer } from "../../utils/container"

const PRODUCT_CREATION_EVENT = "admin.product.create"

const productCreateSchema = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    handle: z.string().optional(),
    status: z.enum(["draft", "proposed", "published", "rejected"]).optional(),
    type_id: z.string().optional(),
    collection_id: z.string().optional(),
    categories: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
    variants: z.array(z.record(z.any())).optional(),
    images: z.array(z.string()).optional(),
  })
  .passthrough()

export const ADMIN_PRODUCTS_POST_SCHEMA = productCreateSchema

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const admin = assertAdminRequest(req)
    const productService = req.scope.resolve(Modules.PRODUCT) as any
    const logger = resolveContainer(req.scope, "LOGGER", "logger") as any

    const payload = productCreateSchema.parse((req as any).body ?? {})
    const [product] = await productService.createProducts([payload])

    const requestIdHeader = req.headers["x-request-id"]
    const requestId = Array.isArray(requestIdHeader)
      ? requestIdHeader[0]
      : requestIdHeader ?? null

    logger?.info?.(PRODUCT_CREATION_EVENT, {
      product_id: product?.id,
      actor_id: admin.actorId,
      request_id: requestId,
    })

    return res.status(201).json({ product })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        type: "invalid_request",
        message: error.issues[0]?.message ?? "Invalid request body",
        issues: error.issues,
        request_id: req.headers["x-request-id"] ?? null,
      })
    }

    const status =
      error instanceof MedusaError &&
      error.type === MedusaError.Types.NOT_ALLOWED
        ? 401
        : 400

    return res.status(status).json({
      type: error instanceof MedusaError ? error.type : "unknown_error",
      message: (error as any)?.message ?? "Failed to create product",
      request_id: req.headers["x-request-id"] ?? null,
    })
  }
}
