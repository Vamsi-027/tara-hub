import { GET as getVariant, POST as updateVariant } from "../../products/[id]/variants/[variant_id]/route"

type MockResponse = {
  statusCode: number
  body: any
  status: (code: number) => MockResponse
  json: (payload: any) => MockResponse
}

const makeRes = (): MockResponse => {
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

describe("Admin Product Variant material link routes", () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it("retrieves a variant with material array", async () => {
    const productId = "prod_123"
    const variantId = "variant_123"
    const variant = {
      id: variantId,
      product: { id: productId },
      materials: [{ id: "mat_a", name: "Cotton" }, { id: "mat_b", name: "Linen" }],
    }

    const queryGraph = jest.fn(async () => ({ data: [variant] }))

    const req: any = {
      params: { id: productId, variant_id: variantId },
      scope: { resolve: (key: string) => (key === "query" ? { graph: queryGraph } : undefined) },
      auth: { actor_type: "user" },
    }
    const res = makeRes()

    await getVariant(req, res)

    expect(queryGraph).toHaveBeenCalledWith({
      entity: "product_variant",
      fields: ["*", "product.id", "materials.id", "materials.name", "materials.code"],
      filters: { id: variantId, product: { id: productId } },
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.variant.materials).toEqual(variant.materials)
  })

  it("creates links for newly added materials and skips existing ones", async () => {
    const productId = "prod_234"
    const variantId = "variant_234"
    const existingMaterial = "mat_existing"
    const newMaterial = "mat_new"

    const dismiss = jest.fn(async () => undefined)
    const createLink = jest.fn(async () => undefined)
    const loggerInfo = jest.fn()
    const loggerWarn = jest.fn()

    const queryGraph = jest
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            id: variantId,
            product: { id: productId },
            materials: [{ id: existingMaterial }],
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: variantId,
            product: { id: productId },
            materials: [
              { id: existingMaterial, name: "Existing" },
              { id: newMaterial, name: "New" },
            ],
          },
        ],
      })

    const req: any = {
      params: { id: productId, variant_id: variantId },
      body: { material_ids: [existingMaterial, newMaterial, newMaterial] },
      headers: { "x-request-id": "req_multi" },
      user: { id: "admin_multi" },
      scope: {
        resolve: (key: string) => {
          if (key === "query") return { graph: queryGraph }
          if (key === "linkModuleService") return { dismiss, create: createLink }
          if (key === "logger") return { info: loggerInfo, warn: loggerWarn }
          return undefined
        },
      },
      auth: { actor_type: "user" },
    }

    const res = makeRes()

    await updateVariant(req, res)

    expect(dismiss).not.toHaveBeenCalled()
    expect(createLink).toHaveBeenCalledWith([[variantId, newMaterial]])
    expect(loggerInfo).toHaveBeenCalledWith("product_variant.material.links.created", {
      product_variant_id: variantId,
      product_id: productId,
      material_ids: [newMaterial],
      request_id: "req_multi",
      user_id: "admin_multi",
    })
    expect(loggerWarn).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res.body.variant.materials).toEqual([
      { id: existingMaterial, name: "Existing" },
      { id: newMaterial, name: "New" },
    ])
  })

  it("dismisses removed materials and leaves others intact", async () => {
    const productId = "prod_345"
    const variantId = "variant_345"
    const keepMaterial = "mat_keep"
    const removeMaterial = "mat_remove"

    const dismiss = jest.fn(async () => undefined)
    const createLink = jest.fn(async () => undefined)
    const loggerInfo = jest.fn()
    const loggerWarn = jest.fn()

    const queryGraph = jest
      .fn()
      .mockResolvedValueOnce({
        data: [
          {
            id: variantId,
            product: { id: productId },
            materials: [{ id: keepMaterial }, { id: removeMaterial }],
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: variantId,
            product: { id: productId },
            materials: [{ id: keepMaterial, name: "Keep" }],
          },
        ],
      })

    const req: any = {
      params: { id: productId, variant_id: variantId },
      body: { material_ids: [keepMaterial] },
      headers: { "x-request-id": "req_rem" },
      user: { id: "admin_rem" },
      scope: {
        resolve: (key: string) => {
          if (key === "query") return { graph: queryGraph }
          if (key === "linkModuleService") return { dismiss, create: createLink }
          if (key === "logger") return { info: loggerInfo, warn: loggerWarn }
          return undefined
        },
      },
      auth: { actor_type: "user" },
    }

    const res = makeRes()

    await updateVariant(req, res)

    expect(dismiss).toHaveBeenCalledWith([[variantId, removeMaterial]])
    expect(createLink).not.toHaveBeenCalled()
    expect(loggerInfo).toHaveBeenCalledWith("product_variant.material.links.dismissed", {
      product_variant_id: variantId,
      product_id: productId,
      material_ids: [removeMaterial],
      request_id: "req_rem",
      user_id: "admin_rem",
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.variant.materials).toEqual([
      { id: keepMaterial, name: "Keep" },
    ])
  })

  it("rejects payloads with invalid material identifiers", async () => {
    const req: any = {
      params: { id: "prod_invalid", variant_id: "variant_invalid" },
      body: { material_ids: ["mat_good", 123] },
      scope: { resolve: () => undefined },
      auth: { actor_type: "user" },
    }

    const res = makeRes()

    await updateVariant(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      code: "INVALID_MATERIAL_IDS",
      error: "material_ids must contain only non-empty strings",
    })
  })
})
