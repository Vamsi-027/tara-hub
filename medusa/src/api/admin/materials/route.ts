import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function isAdmin(req: MedusaRequest): boolean {
  return (
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.type === "admin" ||
    (req as any).user?.role === "admin" ||
    Boolean((req as any).session?.user_id)
  )
}

/**
 * Admin API routes for Materials
 * Following Medusa v2 API patterns
 */

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const materialsService = req.scope.resolve("materialsModuleService") as any
  const { limit, offset, q } = req.query as Record<string, string | undefined>

  // Validate query params
  const parsedLimit = limit !== undefined ? Number(limit) : undefined
  const parsedOffset = offset !== undefined ? Number(offset) : undefined
  if (parsedLimit !== undefined && (!Number.isFinite(parsedLimit) || parsedLimit < 1 || parsedLimit > 100)) {
    res.status(400).json({ error: "Invalid limit" })
    return
  }
  if (parsedOffset !== undefined && (!Number.isFinite(parsedOffset) || parsedOffset < 0)) {
    res.status(400).json({ error: "Invalid offset" })
    return
  }
  if (q !== undefined && typeof q !== "string") {
    res.status(400).json({ error: "Invalid q" })
    return
  }

  const result = await materialsService.listWithMeta({
    limit: parsedLimit,
    offset: parsedOffset,
    q,
  })

  res.json(result)
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const materialsModuleService = req.scope.resolve("materialsModuleService")

  const material = await materialsModuleService.createMaterial(req.validatedBody)

  res.status(201).json({
    material,
  })
}

// Input validation schemas
export const ADMIN_MATERIALS_GET_CONFIG = {
  retrieveConfig: {
    select: ["id", "name", "properties", "created_at", "updated_at"],
    relations: [],
  },
  listConfig: {
    select: ["id", "name", "properties", "created_at", "updated_at"],
    relations: [],
    defaultLimit: 20,
    isList: true,
  },
}

export const ADMIN_MATERIALS_POST_CONFIG = {
  schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        minLength: 1,
        maxLength: 255,
      },
      properties: {
        type: "object",
        additionalProperties: true,
      },
    },
    required: ["name"],
    additionalProperties: false,
  },
}
