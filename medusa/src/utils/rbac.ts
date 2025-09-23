import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const INVENTORY_SCOPES = {
  READ: "inventory:read",
  WRITE: "inventory:write",
  TRANSFER: "inventory:transfer",
} as const;

export type InventoryScope = typeof INVENTORY_SCOPES[keyof typeof INVENTORY_SCOPES];

export function extractScopes(req: MedusaRequest): string[] {
  const fromAuth = (req as any).auth?.scopes;
  const fromAppMeta = (req as any).auth?.app_metadata?.scopes;
  const fromUserMeta = (req as any).user?.metadata?.scopes;
  const fromSession = (req as any).session?.scopes;
  const collected = [fromAuth, fromAppMeta, fromUserMeta, fromSession]
    .filter(Boolean)
    .flat();
  return Array.isArray(collected) ? collected : [];
}

export function isAdmin(req: MedusaRequest): boolean {
  return (
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.type === "admin" ||
    (req as any).user?.role === "admin" ||
    Boolean((req as any).session?.user_id)
  );
}

export function hasAllScopes(req: MedusaRequest, required: string[]): boolean {
  const scopes = extractScopes(req);
  return required.every((s) => scopes.includes(s));
}

export function enforceScopes(
  req: MedusaRequest,
  res: MedusaResponse,
  required: string[]
): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  if (!hasAllScopes(req, required)) {
    res.status(403).json({ error: "Insufficient scope", required });
    return false;
  }
  return true;
}

