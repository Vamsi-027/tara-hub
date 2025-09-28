import { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export type AdminIdentity = {
  actorId: string | null
  actorType: string | null
  email?: string | null
}

export function assertAdminRequest(req: MedusaRequest): AdminIdentity {
  const auth: any = (req as any).auth
  const user: any = (req as any).user
  const session: any = (req as any).session

  const actorType = auth?.actor_type ?? user?.type ?? null
  const actorId = auth?.actor_id ?? user?.id ?? session?.user_id ?? null

  const isAdmin = Boolean(
    (auth?.actor_type && ["admin", "user"].includes(auth.actor_type)) ||
      user?.type === "admin" ||
      user?.role === "admin" ||
      (session?.user_id && session?.scope === "admin")
  )

  if (!isAdmin || !actorId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Admin authentication required"
    )
  }

  return {
    actorId,
    actorType,
    email: user?.email ?? auth?.actor_email ?? null,
  }
}
