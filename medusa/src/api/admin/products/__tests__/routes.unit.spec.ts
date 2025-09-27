import { POST as createProduct } from "../../products/route"
import { POST as updateProduct } from "../../products/[id]/route"

const makeRes = () => {
  const res: any = {}
  res.statusCode = 200
  res.status = (c: number) => { res.statusCode = c; return res }
  res.json = (b: any) => { res.body = b; return res }
  return res
}

describe("Admin Products routes material_id handling", () => {
  it("creates product and sets material_id", async () => {
    const material_id = "mat_123"
    const createdProduct = { id: "prod_1", title: "Test" }

    const req: any = {
      body: { title: "Test", material_id },
      scope: {
        resolve: (key: string) => {
          if (key === "materialsModuleService") {
            return { retrieveMaterial: jest.fn(async () => ({ id: material_id })) }
          }
          if (key === "query") {
            return { graph: jest.fn(async () => ({ data: [{ id: createdProduct.id }] })) }
          }
          if (key === require("@medusajs/framework/utils").Modules.PRODUCT) {
            return { createProducts: jest.fn(async () => [createdProduct]) }
          }
          return undefined
        },
      },
      auth: { actor_type: "user" },
    }
    const res: any = makeRes()

    await createProduct(req, res)
    expect(res.statusCode).toBe(201)
    expect(res.body.product.id).toBe(createdProduct.id)
    expect(res.body.product.material_id).toBe(material_id)
  })

  it("updates product material_id via POST /admin/products/:id", async () => {
    const productId = "prod_2"
    const material_id = "mat_789"
    const updatedProduct = { id: productId, title: "X" }

    const req: any = {
      params: { id: productId },
      body: { material_id },
      scope: {
        resolve: (key: string) => {
          if (key === "materialsModuleService") {
            return { retrieveMaterial: jest.fn(async () => ({ id: material_id })) }
          }
          if (key === "query") {
            return { graph: jest.fn(async () => ({ data: [{ id: productId }] })) }
          }
          if (key === require("@medusajs/framework/utils").Modules.PRODUCT) {
            return { updateProducts: jest.fn(async () => [updatedProduct]) }
          }
          return undefined
        },
      },
      auth: { actor_type: "user" },
    }
    const res: any = makeRes()

    await updateProduct(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.product.id).toBe(productId)
    expect(res.body.product.material_id).toBe(material_id)
  })
})

