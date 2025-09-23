import ReservationOrchestratorService from "../reservation-orchestrator.service";

describe("Reservation Orchestrator", () => {
  const makeContainer = () => {
    const items: any[] = [
      { id: "li_1", variant_id: "var_1", quantity: 2, metadata: {} },
      { id: "li_2", variant_id: "var_2", quantity: 1.5, metadata: {} },
    ];

    const cartModuleService = {
      updateLineItems: jest.fn(async (_itemId: string, _patch: any) => {}),
      retrieveCart: jest.fn(async (_id: string) => ({ id: _id, items })),
    } as any;

    const productModuleService = {
      retrieveVariant: jest.fn(async (id: string) => ({ id, metadata: { inventory_item_id: `inv_${id}` } })),
    } as any;

    const inventoryService = {
      createReservations: jest.fn(async (payload: any[]) => [{ id: `res_${payload[0].line_item_id}` }]),
      deleteReservations: jest.fn(async (_ids: string[]) => {}),
    } as any;

    const { Modules } = require("@medusajs/framework/utils");
    return {
      cartModuleService,
      [Modules.PRODUCT]: productModuleService,
      [Modules.INVENTORY]: inventoryService,
    } as any;
  };

  test("creates reservations in bulk and stores ids on line items", async () => {
    const container = makeContainer();
    const svc = new ReservationOrchestratorService(container);
    const out = await svc.reserveOnCheckoutStart("cart_1", "loc_1");

    expect(out).toHaveLength(2);
    expect(out[0].reservation_id).toBe("res_li_1");
    expect(container.cartModuleService.updateLineItems).toHaveBeenCalledWith(
      "li_1",
      expect.objectContaining({ metadata: expect.objectContaining({ reservation_id: "res_li_1" }) })
    );
  });

  test("throws if variant load fails", async () => {
    const container = makeContainer();
    container[require("@medusajs/framework/utils").Modules.PRODUCT].retrieveVariant = jest.fn(async () => {
      throw new Error("boom");
    });
    const svc = new ReservationOrchestratorService(container);
    await expect(svc.reserveOnCheckoutStart("cart_1"))
      .rejects.toThrow(/Failed to load variant/);
    expect(container[require("@medusajs/framework/utils").Modules.INVENTORY].createReservations).not.toHaveBeenCalled();
  });

  test("rolls back on partial creation mismatch", async () => {
    const container = makeContainer();
    // Return fewer reservations than requested
    container[require("@medusajs/framework/utils").Modules.INVENTORY].createReservations = jest.fn(async () => ([{ id: "res_li_1" }]));
    const svc = new ReservationOrchestratorService(container);
    await expect(svc.reserveOnCheckoutStart("cart_1"))
      .rejects.toThrow(/Reservation mismatch/);
    expect(container[require("@medusajs/framework/utils").Modules.INVENTORY].deleteReservations).toHaveBeenCalledWith(["res_li_1"]);
    expect(container.cartModuleService.updateLineItems).not.toHaveBeenCalled();
  });

  test("skips non-managed variants", async () => {
    const container = makeContainer();
    container[require("@medusajs/framework/utils").Modules.PRODUCT].retrieveVariant = jest.fn(async (id: string) => ({ id, manage_inventory: false }));
    const svc = new ReservationOrchestratorService(container);
    const out = await svc.reserveOnCheckoutStart("cart_1");
    expect(out).toHaveLength(0);
    expect(container[require("@medusajs/framework/utils").Modules.INVENTORY].createReservations).not.toHaveBeenCalled();
  });

  test("releases reservations and clears metadata", async () => {
    const container = makeContainer();
    // Seed metadata as if reserved
    (await container.cartModuleService.retrieveCart("cart_2")).items.forEach((it: any) => (it.metadata = { reservation_id: `res_${it.id}` }));

    const svc = new ReservationOrchestratorService(container);
    await svc.releaseReservations("cart_2");

    expect(container[require("@medusajs/framework/utils").Modules.INVENTORY].deleteReservations).toHaveBeenCalled();
    expect(container.cartModuleService.updateLineItems).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ metadata: {} })
    );
  });
});
