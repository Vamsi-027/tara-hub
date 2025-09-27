import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Admin API routes for individual Material operations
 * Following Medusa v2 API patterns
 */

function isAdmin(req: MedusaRequest): boolean {
  return (
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.type === "admin" ||
    (req as any).user?.role === "admin" ||
    Boolean((req as any).session?.user_id)
  )
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }

  const materialsService = req.scope.resolve("materialsModuleService") as any
  try {
    const material = await materialsService.retrieveMaterial(req.params.id)
    res.json({ material })
  } catch (e: any) {
    res.status(404).json({ error: `Material with id: ${req.params.id} not found` })
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const materialsModuleService = req.scope.resolve("materialsModuleService")

  const material = await materialsModuleService.updateMaterial(
    req.params.id,
    req.validatedBody
  )

  res.json({
    material,
  })
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const materialsModuleService = req.scope.resolve("materialsModuleService")

  await materialsModuleService.deleteMaterial(req.params.id)

  res.status(200).json({
    id: req.params.id,
    object: "material",
    deleted: true,
  })
}

// Configuration for routes
export const ADMIN_MATERIAL_GET_CONFIG = {
  retrieveConfig: {
    select: ["id", "name", "properties", "created_at", "updated_at"],
    relations: [],
  },
}

export const ADMIN_MATERIAL_POST_CONFIG = {
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
    additionalProperties: false,
  },
}
