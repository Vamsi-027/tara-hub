import { MedusaError, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncMaterials } from "../scripts/sync-materials"

type SyncOptions = {
  actorId: string
  requestId?: string | null
  dryRun?: boolean
  force?: boolean
}

type ContainerLike = {
  resolve?: (key: any) => unknown
  [key: string]: any
}

export default class MaterialsSyncService {
  private inProgress = false
  private readonly container: ContainerLike
  private readonly logger_: any

  constructor(container: ContainerLike) {
    this.container = container
    this.logger_ = this.resolveLogger(container)
  }

  private resolveLogger(container: ContainerLike) {
    const candidate =
      container.resolve?.(ContainerRegistrationKeys.LOGGER) ??
      container[ContainerRegistrationKeys.LOGGER as any] ??
      container.logger ??
      container.scope?.resolve?.(ContainerRegistrationKeys.LOGGER) ??
      console

    return candidate
  }

  async sync(options: SyncOptions) {
    if (this.inProgress && !options.force) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Materials sync is already running"
      )
    }

    const startedAt = Date.now()
    const context = {
      actor_id: options.actorId,
      request_id: options.requestId ?? null,
    }

    if (options.dryRun) {
      this.logger_?.info?.("materials.sync.dry_run", context)
      return {
        dry_run: true,
        in_progress: this.inProgress,
        message: this.inProgress
          ? "A sync is currently running"
          : "Ready to start materials sync",
      }
    }

    if (this.inProgress) {
      this.logger_?.warn?.("materials.sync.force", context)
    }

    this.inProgress = true
    this.logger_?.info?.("materials.sync.start", context)

    try {
      await syncMaterials()

      const duration = Date.now() - startedAt
      this.logger_?.info?.("materials.sync.completed", {
        ...context,
        duration_ms: duration,
      })

      return {
        success: true,
        duration_ms: duration,
      }
    } catch (error: any) {
      this.logger_?.error?.("materials.sync.failed", {
        ...context,
        error: error?.message,
      })
      throw error
    } finally {
      this.inProgress = false
    }
  }
}
