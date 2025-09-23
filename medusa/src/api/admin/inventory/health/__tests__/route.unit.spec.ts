import { GET } from "../route";

describe("GET /admin/inventory/health", () => {
  const makeReqRes = (scopes?: string[]) => {
    const levels = [
      {
        id: "lvl_1",
        location_id: "loc_1",
        inventory_item_id: "inv_1",
        stocked_quantity: 8, // base units
        reserved_quantity: 4,
        incoming_quantity: 0,
        location: { id: "loc_1", name: "Main" },
        inventory_item: { id: "inv_1", metadata: { min_increment: 0.25, low_stock_threshold: 1 } },
      },
    ];
    const variants = [
      { id: "var_1", sku: "SKU-1", title: "Fabric A", product: { title: "Prod A" }, metadata: { inventory_item_id: "inv_1" } },
    ];
    const query = {
      graph: jest.fn(async ({ entity }: any) => {
        if (entity === "inventory_level") return { data: levels } as any;
        if (entity === "product_variant") return { data: variants } as any;
        return { data: [] } as any;
      }),
    } as any;

    const req: any = {
      auth: { actor_type: "user", scopes: scopes || [] },
      scope: { resolve: (key: any) => (key === "@medusajs/framework/QUERY" ? query : {}) },
      query: {},
    };
    const res: any = { json: jest.fn((b: any) => b), status: jest.fn(function (this: any, c: number) { this._status = c; return this; }) };
    return { req, res };
  };

  test("403 without inventory:read scope", async () => {
    const { req, res } = makeReqRes([]);
    await GET(req as any, res as any);
    expect(res._status).toBe(403);
  });

  test("responds with health items and ATS when scope present", async () => {
    const { req, res } = makeReqRes(["inventory:read"]);
    const out: any = await GET(req as any, res as any);
    expect(res.json).toHaveBeenCalled();
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload.items[0].sku).toBe("SKU-1");
    expect(payload.items[0].ats).toBeCloseTo(1, 6); // (8-4)/4 = 1 yd
    expect(payload.items[0].status).toBe("in_stock" || "low_stock");
  });
});
