import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { ZodError, z } from "zod"

import { assertAdminRequest } from "../../utils/admin-auth"

const syncMaterialsSchema = z
  .object({
    dry_run: z.boolean().optional(),
    force: z.boolean().optional(),
  })
  .strict()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const admin = assertAdminRequest(req)
    const payload = syncMaterialsSchema.parse((req as any).body ?? {})
    const requestId = extractRequestId(req)

    const syncService = req.scope.resolve("materialsSyncService") as any

    if (!syncService?.sync) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Materials sync service unavailable"
      )
    }

    const result = await syncService.sync({
      actorId: admin.actorId ?? "unknown",
      requestId,
      dryRun: payload.dry_run,
      force: payload.force,
    })

    return res.status(payload.dry_run ? 200 : 202).json({
      success: true,
      request_id: requestId,
      result,
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

    const status =
      error instanceof MedusaError &&
      error.type === MedusaError.Types.NOT_ALLOWED
        ? 401
        : error instanceof MedusaError &&
            error.type === MedusaError.Types.INVALID_DATA
        ? 409
        : 500

    return res.status(status).json({
      type: error instanceof MedusaError ? error.type : "unknown_error",
      message: (error as any)?.message ?? "Failed to sync materials",
      request_id: extractRequestId(req),
    })
  }
}

function extractRequestId(req: MedusaRequest) {
  const value = req.headers["x-request-id"]
  return Array.isArray(value) ? value[0] : value ?? null
}
