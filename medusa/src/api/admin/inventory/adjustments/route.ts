import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Inline RBAC helpers
const INVENTORY_SCOPES = {
  READ: "inventory:read",
  WRITE: "inventory:write",
  TRANSFER: "inventory:transfer",
} as const;

function isAdmin(req: MedusaRequest): boolean {
  return (
    (req as any).auth?.actor_type === "user" ||
    (req as any).user?.type === "admin" ||
    (req as any).user?.role === "admin" ||
    Boolean((req as any).session?.user_id)
  );
}

function enforceScopes(
  req: MedusaRequest,
  res: MedusaResponse,
  required: string[]
): boolean {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    if (!enforceScopes(req, res, [INVENTORY_SCOPES.READ])) return;

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const {
      inventory_item_id,
      location_id,
      reason,
      q,
      created_from,
      created_to,
      limit = "50",
      offset = "0",
      order = "created_at:desc",
    } = (req.query || {}) as Record<string, string>;

    const filters: any = {};
    if (inventory_item_id) filters.inventory_item_id = inventory_item_id;
    if (location_id) filters.location_id = location_id;
    if (reason) filters.reason = reason;
    if (created_from || created_to) {
      filters.created_at = {} as any;
      if (created_from) filters.created_at.$gte = new Date(created_from);
      if (created_to) filters.created_at.$lte = new Date(created_to);
    }
    if (q) {
      filters.$or = [
        { note: { $like: `%${q}%` } },
        { reference: { $like: `%${q}%` } },
        { reason: { $like: `%${q}%` } },
      ];
    }

    const [orderField, orderDirRaw] = order.split(":");
    const orderBy = { [orderField]: orderDirRaw?.toLowerCase() === "asc" ? "ASC" : "DESC" } as any;

    const { data, metadata } = await query.graph({
      entity: "inventory_adjustment",
      fields: [
        "id",
        "inventory_item_id",
        "location_id",
        "reason",
        "note",
        "reference",
        "delta",
        "to_quantity",
        "prev_quantity",
        "new_quantity",
        "actor_id",
        "created_at",
      ],
      filters,
      pagination: { take: parseInt(limit), skip: parseInt(offset) },
      orderBy,
    });

    return res.json({ count: metadata?.count ?? data.length, items: data });
  } catch (e: any) {
    return res.status(500).json({ error: "Failed to list inventory adjustments", message: e?.message || String(e) });
  }
}

