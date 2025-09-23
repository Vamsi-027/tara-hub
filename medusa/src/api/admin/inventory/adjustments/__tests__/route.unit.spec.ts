import { GET } from "../route";

describe("GET /admin/inventory/adjustments", () => {
  const makeReqRes = (scopes?: string[]) => {
    const data = [
      {
        id: "adj_1",
        inventory_item_id: "inv_1",
        location_id: "loc_1",
        reason: "Cycle Count",
        note: "Adjusted",
        reference: "REF-1",
        delta: 0.5,
        to_quantity: null,
        prev_quantity: 2.0,
        new_quantity: 2.5,
        actor_id: "user_1",
        created_at: new Date().toISOString(),
      },
    ];
    const query = { graph: jest.fn(async () => ({ data, metadata: { count: 1 } })) } as any;

    const req: any = {
      auth: { actor_type: "user", scopes: scopes || [] },
      scope: { resolve: (key: any) => (key === "@medusajs/framework/QUERY" ? query : {}) },
      query: {},
    };
    const res: any = {
      json: jest.fn((b: any) => b),
      status: jest.fn(function (this: any, c: number) {
        this._status = c;
        return this;
      }),
    };
    return { req, res, query };
  };

  test("403 without inventory:read", async () => {
    const { req, res } = makeReqRes([]);
    await GET(req as any, res as any);
    expect(res._status).toBe(403);
  });

  test("returns adjustments when scope present", async () => {
    const { req, res } = makeReqRes(["inventory:read"]);
    await GET(req as any, res as any);
    const payload = (res.json as any).mock.calls[0][0];
    expect(payload.count).toBe(1);
    expect(payload.items[0].reason).toBe("Cycle Count");
  });
});

