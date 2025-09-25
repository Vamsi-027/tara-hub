import { POST } from "../route";

describe("POST /admin/inventory/adjust", () => {
  const makeReqRes = (scopes?: string[]) => {
    const level = {
      id: "lvl_1",
      inventory_item_id: "inv_1",
      location_id: "loc_1",
      stocked_quantity: 8, // base units
      inventory_item: { metadata: { min_increment: 0.25 } },
    };
    const query = {
      graph: jest.fn(async () => ({ data: [level] })),
    } as any;
    const inventory = {
      updateInventoryLevels: jest.fn(async (_: any) => ({})),
    } as any;
    const logger = { info: jest.fn() } as any;

    const req: any = {
      auth: { actor_type: "user", scopes: scopes || [] },
      scope: { resolve: (key: any) => (key === "@medusajs/framework/QUERY" ? query : key === "@medusajs/medusa/inventory" ? inventory : key === "logger" ? logger : {}) },
      body: {
        inventory_item_id: "inv_1",
        location_id: "loc_1",
        delta: 0.5,
        reason: "Cycle Count",
      },
    };
    const res: any = { json: jest.fn((b: any) => b), status: jest.fn(function (this: any, c: number) { this._status = c; return this; }) };
    return { req, res, inventory, query, level };
  };

  test("403 without inventory:write", async () => {
    const { req, res } = makeReqRes([]);
    await POST(req as any, res as any);
    expect(res._status).toBe(403);
  });

  test("applies delta and writes audit", async () => {
    const { req, res, inventory } = makeReqRes(["inventory:write"]);
    await POST(req as any, res as any);
    expect(inventory.updateInventoryLevels).toHaveBeenCalledWith([
      { inventory_item_id: "inv_1", location_id: "loc_1", stocked_quantity: 10 },
    ]); // 8 base units + delta 0.5 -> +2 units => 10
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload.prev_quantity).toBeCloseTo(2, 6);
    expect(payload.new_quantity).toBeCloseTo(2.5, 6);
  });

  test("400 when both delta and to_quantity provided", async () => {
    const { req, res } = makeReqRes(["inventory:write"]);
    req.body = { inventory_item_id: "inv_1", location_id: "loc_1", delta: 1, to_quantity: 10, reason: "Test" };
    await POST(req as any, res as any);
    expect(res._status).toBe(400);
  });

  test("404 when level not found", async () => {
    const { req, res } = makeReqRes(["inventory:write"]);
    (req.scope.resolve as any) = (key: any) => (key === "@medusajs/framework/QUERY" ? { graph: async () => ({ data: [] }) } : {});
    await POST(req as any, res as any);
    expect(res._status).toBe(404);
  });

  test("400 when resulting quantity negative", async () => {
    const { req, res } = makeReqRes(["inventory:write"]);
    req.body = { inventory_item_id: "inv_1", location_id: "loc_1", delta: -10, reason: "Test" };
    await POST(req as any, res as any);
    expect(res._status).toBe(400);
  });

  test("uses audit module when available", async () => {
    const { req, res } = makeReqRes(["inventory:write"]);
    const auditModule = { createInventoryAdjustments: jest.fn(async () => ({})) };
    const origResolve = req.scope.resolve;
    req.scope.resolve = (key: any) => {
      if (key === "inventory_audit") return auditModule;
      return origResolve(key);
    };
    await POST(req as any, res as any);
    expect(auditModule.createInventoryAdjustments).toHaveBeenCalled();
  });
});
