import { GET as LIST_GET } from "../route"
import { GET as ID_GET } from "../[id]/route"

describe("Admin Materials API", () => {
  const makeReqRes = (isAdmin: boolean, query: any = {}) => {
    const service = {
      listWithMeta: jest.fn(async ({ limit, offset, q }: any) => ({
        materials: [
          { id: "mat_1", name: "cotton", properties: {}, created_at: new Date(), updated_at: new Date() },
          { id: "mat_2", name: "linen", properties: {}, created_at: new Date(), updated_at: new Date() },
        ],
        count: 2,
        pagination: { limit: limit ?? 20, offset: offset ?? 0, total: 2, totalPages: 1, currentPage: 1, hasNext: false, hasPrevious: false },
      })),
      retrieveMaterial: jest.fn(async (id: string) => {
        if (id === "mat_404") throw new Error("not found")
        return { id, name: "cotton", properties: {}, created_at: new Date(), updated_at: new Date() }
      }),
    }
    const scope = { resolve: (k: string) => (k === "materialsModuleService" ? service : {}) }
    const req: any = {
      query,
      params: { id: query.id },
      scope,
      auth: isAdmin ? { actor_type: "user" } : undefined,
      user: isAdmin ? { type: "admin" } : undefined,
    }
    const res: any = { json: jest.fn((b: any) => b), status: jest.fn(function (this: any, c: number) { this._status = c; return this; }) }
    return { req, res, service }
  }

  describe("GET /admin/materials", () => {
    it("returns 401 when unauthenticated", async () => {
      const { req, res } = makeReqRes(false)
      await LIST_GET(req as any, res as any)
      expect(res._status).toBe(401)
    })

    it("lists materials with pagination and search", async () => {
      const { req, res, service } = makeReqRes(true, { limit: "10", offset: "0", q: "cot" })
      await LIST_GET(req as any, res as any)
      expect(service.listWithMeta).toHaveBeenCalledWith({ limit: 10, offset: 0, q: "cot" })
      const payload = (res.json as any).mock.calls[0][0]
      expect(payload).toHaveProperty("materials")
      expect(payload).toHaveProperty("count", 2)
      expect(payload).toHaveProperty("pagination")
    })

    it("validates parameters: invalid limit", async () => {
      const { req, res } = makeReqRes(true, { limit: "-1" })
      await LIST_GET(req as any, res as any)
      expect(res._status).toBe(400)
    })
  })

  describe("GET /admin/materials/:id", () => {
    it("returns 401 when unauthenticated", async () => {
      const { req, res } = makeReqRes(false, { id: "mat_1" })
      await ID_GET(req as any, res as any)
      expect(res._status).toBe(401)
    })

    it("retrieves a single material", async () => {
      const { req, res, service } = makeReqRes(true, { id: "mat_1" })
      await ID_GET(req as any, res as any)
      expect(service.retrieveMaterial).toHaveBeenCalledWith("mat_1")
      const payload = (res.json as any).mock.calls[0][0]
      expect(payload).toHaveProperty("material")
      expect(payload.material.id).toBe("mat_1")
    })

    it("returns 404 when not found", async () => {
      const { req, res } = makeReqRes(true, { id: "mat_404" })
      await ID_GET(req as any, res as any)
      expect(res._status).toBe(404)
    })
  })
})

