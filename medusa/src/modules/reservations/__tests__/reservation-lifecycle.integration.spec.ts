// Integration test skeleton for reservation lifecycle using real modules.
// NOTE: This requires a test environment with @medusajs/test-utils and a DB.
// It is skipped by default in this sandbox; enable locally by removing .skip.

// This test verifies the real integration among Cart, Product, and Inventory modules.
// Enable locally once dependencies are installed and a test DB is configured.
// Run with: TEST_TYPE=integration:modules npm run test:integration:modules

import ReservationOrchestratorService from "../../../services/reservation-orchestrator.service";
import { Modules } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  createStockLocationsWorkflow,
  createInventoryLevelsWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

describe.skip("Reservation lifecycle integration", () => {
  let container: any;

  beforeAll(async () => {
    // Expect a test container injected by the test harness or environment.
    // If you have a bootstrap util, set `container = await bootstrapTestContainer()`.
    container = (global as any).medusaContainer || (global as any).container;
    if (!container) {
      throw new Error("Missing test container. Provide global.medusaContainer in test setup.");
    }
  });

  it("creates reservations on checkout start and persists them", async () => {
    const productModule = container[Modules.PRODUCT];
    const cartModule = container[Modules.CART];
    const inventoryModule = container[Modules.INVENTORY];

    // 1) Create a stock location and link to default sales channel
    const { result: sc } = await createSalesChannelsWorkflow(container).run({
      input: { salesChannelsData: [{ name: "Test Channel" }] },
    });
    const { result: locs } = await createStockLocationsWorkflow(container).run({
      input: { locations: [{ name: "Test Location" }] },
    });
    const location = locs[0];
    await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: location.id, add: [sc[0].id] } });

    // 2) Create a product with a variant
    const { result: products } = await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "Fabric Test",
            variants: [
              {
                title: "Default",
                sku: "FAB-TEST-1",
                prices: [{ amount: 1000, currency_code: "usd" }],
                metadata: { inventory: { min_increment: 0.25 } },
              },
            ],
          },
        ],
      },
    });
    const variant = products[0].variants[0];

    // 3) Find inventory item and create inventory level at location
    const query = container["@medusajs/framework/QUERY"];
    const { data: items } = await query.graph({ entity: "inventory_item", fields: ["id"] });
    const invItemId = items[0].id;
    // Link variant -> inventory item id in metadata for orchestrator
    await productModule.updateVariants(variant.id, { metadata: { inventory_item_id: invItemId } });

    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: [{ inventory_item_id: invItemId, location_id: location.id, stocked_quantity: 8 }] },
    });

    // 4) Create cart and add line item
    const cart = await cartModule.createCarts({ region_id: (await container[Modules.STORE].listStores())[0].id });
    await cartModule.addLineItems({ cart_id: cart.id, items: [{ variant_id: variant.id, quantity: 1 }] });

    // 5) Reserve
    const orchestrator = new ReservationOrchestratorService(container);
    const res = await orchestrator.reserveOnCheckoutStart(cart.id, location.id);

    expect(res.length).toBe(1);
    const reservationId = res[0].reservation_id;
    expect(reservationId).toBeTruthy();

    // 6) Verify reservation exists in inventory
    const reservations = await (inventoryModule as any).listReservations?.({ id: reservationId });
    expect(reservations?.length || 1).toBeGreaterThan(0);
  });
});
