import CartService from "../cart.service.fixed";

describe("Cart quantity normalization", () => {
  const makeContainer = (policy?: any) => {
    const productModuleService = {
      retrieveVariant: jest.fn(async (_id: string) => ({ id: _id, product_id: "prod_1" })),
      retrieveProduct: jest.fn(async (_pid: string) => ({ id: _pid, metadata: { inventory: policy } })),
    } as any;

    const added: any[] = [];
    const cartModuleService = {
      addLineItems: jest.fn(async ({ items }: any) => {
        added.push(items[0]);
      }),
      updateLineItems: jest.fn(async (_itemId: string, _update: any) => {}),
      retrieveCart: jest.fn(async (_id: string) => ({ id: _id, items: added })),
    } as any;

    return {
      cartModuleService,
      [require("@medusajs/framework/utils").Modules.PRODUCT]: productModuleService,
    } as any;
  };

  test("rounds to nearest increment when policy present", async () => {
    const container = makeContainer({ min_increment: 0.25, min_cut: 1 });
    const svc = new CartService(container);
    await svc.addLineItem("cart_1", { variant_id: "var_1", quantity: 2.3 });
    const cart = await svc.getCart("cart_1");
    expect(cart.items[0].quantity).toBeCloseTo(2.25, 6);
  });

  test("throws for below min_cut", async () => {
    const container = makeContainer({ min_increment: 0.25, min_cut: 1 });
    const svc = new CartService(container);
    await expect(svc.addLineItem("cart_2", { variant_id: "var_1", quantity: 0.75 })).rejects.toThrow(/min_cut/);
  });

  test("passes through when no policy", async () => {
    const container = makeContainer(undefined);
    const svc = new CartService(container);
    await svc.addLineItem("cart_3", { variant_id: "var_1", quantity: 2.3 });
    const cart = await svc.getCart("cart_3");
    expect(cart.items[0].quantity).toBeCloseTo(2.3, 6);
  });
});

