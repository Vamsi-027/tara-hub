import { POST } from "../route"

const makeRes = () => {
  const res: any = {}
  res.statusCode = 200
  res.body = undefined
  res.status = (code: number) => {
    res.statusCode = code
    return res
  }
  res.json = (payload: any) => {
    res.body = payload
    return res
  }
  return res
}

describe("/admin/sync-materials route", () => {
  it("rejects unauthenticated requests", async () => {
    const req: any = {
      headers: {},
      scope: { resolve: () => ({ sync: jest.fn() }) },
    }
    const res = makeRes()

    await POST(req, res)

    expect(res.statusCode).toBe(401)
    expect(res.body?.type).toBe("NOT_ALLOWED")
  })

  it("returns dry-run status without executing sync", async () => {
    const sync = jest.fn(async () => ({ dry_run: true, in_progress: false }))

    const req: any = {
      headers: { "x-request-id": "sync-test" },
      body: { dry_run: true },
      auth: { actor_type: "user", actor_id: "admin_1" },
      user: { id: "admin_1", type: "admin" },
      scope: {
        resolve: (key: string) => {
          if (key === "materialsSyncService") {
            return { sync }
          }
          return undefined
        },
      },
    }

    const res = makeRes()

    await POST(req, res)

    expect(sync).toHaveBeenCalledWith({
      actorId: "admin_1",
      requestId: "sync-test",
      dryRun: true,
      force: undefined,
    })
    expect(res.statusCode).toBe(200)
    expect(res.body?.result?.dry_run).toBe(true)
  })

  it("starts sync and returns 202 response", async () => {
    const sync = jest.fn(async () => ({ success: true, duration_ms: 1200 }))

    const req: any = {
      headers: {},
      body: {},
      auth: { actor_type: "admin", actor_id: "admin_2" },
      user: { id: "admin_2", type: "admin" },
      scope: {
        resolve: (key: string) => {
          if (key === "materialsSyncService") {
            return { sync }
          }
          return undefined
        },
      },
    }

    const res = makeRes()

    await POST(req, res)

    expect(sync).toHaveBeenCalledWith({
      actorId: "admin_2",
      requestId: null,
      dryRun: undefined,
      force: undefined,
    })
    expect(res.statusCode).toBe(202)
    expect(res.body?.result?.success).toBe(true)
  })

  it("returns 500 when sync service missing", async () => {
    const req: any = {
      headers: {},
      auth: { actor_type: "user", actor_id: "admin_3" },
      user: { id: "admin_3", role: "admin" },
      scope: {
        resolve: () => undefined,
      },
    }

    const res = makeRes()

    await POST(req, res)

    expect(res.statusCode).toBe(500)
    expect(res.body?.type).toBe("UNEXPECTED_STATE")
  })
})
