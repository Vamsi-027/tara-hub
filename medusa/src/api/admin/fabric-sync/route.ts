import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    // Manual fabric sync endpoint - only runs when called
    const materialsSync = req.scope.resolve("materialsSyncService")

    const result = await materialsSync.sync({
      actorId: req.auth?.actor_id || "admin",
      requestId: req.headers["x-request-id"] as string,
      dryRun: req.query?.dry_run === "true",
      force: req.query?.force === "true"
    })

    res.json({
      success: true,
      message: "Fabric sync completed",
      result
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Fabric sync failed",
      error: error.message
    })
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  // Get sync status
  res.json({
    message: "Fabric sync endpoint ready",
    usage: {
      "POST /admin/fabric-sync": "Trigger manual fabric sync",
      "POST /admin/fabric-sync?dry_run=true": "Dry run sync",
      "POST /admin/fabric-sync?force=true": "Force sync even if in progress"
    }
  })
}