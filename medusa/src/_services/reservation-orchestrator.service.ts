import { Modules } from "@medusajs/framework/utils";
import {
  IInventoryService,
  IProductModuleService,
  ICartModuleService,
} from "@medusajs/framework/types";
import CartService from "./cart.service.fixed";

export interface ReserveResult {
  line_item_id: string;
  variant_id: string;
  quantity: number;
  location_id?: string;
  reservation_id: string;
}

export default class ReservationOrchestratorService {
  private inventoryService_: IInventoryService;
  private productModuleService_: IProductModuleService;
  private cartModuleService_: ICartModuleService;
  private cartService_: CartService;

  constructor(container: any) {
    this.inventoryService_ = container[Modules.INVENTORY];
    this.productModuleService_ = container[Modules.PRODUCT];
    this.cartModuleService_ = container.cartModuleService;
    this.cartService_ = new CartService(container);
  }

  /**
   * Reserves inventory for all items in a cart at checkout start.
   * Atomic behavior: if reservation creation fails for any item, no metadata updates are persisted.
   */
  async reserveOnCheckoutStart(cartId: string, locationId?: string): Promise<ReserveResult[]> {
    const cart = await this.cartService_.getCart(cartId);
    if (!cart?.items?.length) return [];

    type ReservationCreate = {
      inventory_item_id: string;
      location_id?: string;
      quantity: number;
      line_item_id: string;
      cart_id: string;
      variant_id: string;
    };

    const requests: ReservationCreate[] = [];

    // Build reservation requests first; validate inventory item mapping
    for (const item of cart.items) {
      const variantId: string = item.variant_id || item.variant?.id;
      if (!variantId) continue;

      const variant = await this.productModuleService_.retrieveVariant(variantId).catch((e) => {
        throw new Error(`Failed to load variant ${variantId}: ${e?.message || e}`);
      });

      const managed = (variant as any)?.manage_inventory !== false; // default to managed
      const inventoryItemId: string | undefined = (variant as any)?.metadata?.inventory_item_id;

      if (!inventoryItemId && managed) {
        throw new Error(
          `Missing inventory_item_id for managed variant ${variantId}. Ensure inventory item linking is in place.`
        );
      }

      if (!managed) {
        // Skip reservation for non-managed variants
        continue;
      }

      requests.push({
        inventory_item_id: inventoryItemId as string,
        location_id: locationId,
        quantity: item.quantity,
        line_item_id: item.id,
        cart_id: cartId,
        variant_id: variantId,
      });
    }

    if (!requests.length) return [];

    // Bulk create reservations
    let created: Array<{ id: string; line_item_id?: string }> = [];
    try {
      const res = (this.inventoryService_ as unknown as {
        createReservations: (
          input: Array<{
            inventory_item_id: string;
            location_id?: string;
            quantity: number;
            line_item_id?: string;
            cart_id?: string;
          }>
        ) => Promise<Array<{ id: string; line_item_id?: string }>>;
      }).createReservations;

      created = await res(requests.map(({ variant_id, ...r }) => r));

      if (!Array.isArray(created) || created.length !== requests.length) {
        // Attempt rollback if partial
        const ids = created.filter(Boolean).map((r) => r.id);
        if (ids.length) {
          await (this.inventoryService_ as unknown as {
            deleteReservations: (ids: string[]) => Promise<void>;
          }).deleteReservations(ids);
        }
        throw new Error(
          `Reservation mismatch: requested ${requests.length}, created ${created?.length || 0}`
        );
      }
    } catch (e: any) {
      throw new Error(`Failed to reserve inventory: ${e?.message || e}`);
    }

    // Persist reservation ids on line items
    const byIndex = (i: number) => created[i]?.id;
    const results: ReserveResult[] = [];
    for (let i = 0; i < requests.length; i++) {
      const req = requests[i];
      const reservationId = byIndex(i)!;
      const existingMeta = (cart.items.find((it: any) => it.id === req.line_item_id)?.metadata) || {};
      await this.cartModuleService_.updateLineItems(req.line_item_id, {
        metadata: { ...existingMeta, reservation_id: reservationId },
      });
      results.push({
        line_item_id: req.line_item_id,
        variant_id: req.variant_id,
        quantity: req.quantity,
        location_id: req.location_id,
        reservation_id: reservationId,
      });
    }

    return results;
  }

  /**
   * Releases reservations for a given cart's items.
   */
  async releaseReservations(cartId: string): Promise<void> {
    const cart = await this.cartService_.getCart(cartId);
    if (!cart?.items?.length) return;
    for (const item of cart.items) {
      const reservationId = item.metadata?.reservation_id;
      if (!reservationId) continue;
      await (this.inventoryService_ as unknown as {
        deleteReservations: (ids: string[]) => Promise<void>;
      }).deleteReservations([reservationId]);
      // Remove the reservation id from metadata
      const meta = { ...(item.metadata || {}) };
      delete (meta as any).reservation_id;
      await this.cartModuleService_.updateLineItems(item.id, { metadata: meta });
    }
  }
}
