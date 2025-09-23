import { Module } from "@medusajs/framework/utils";
import InventoryAuditService from "./service";

export const INVENTORY_AUDIT_MODULE = "inventory_audit";

export default Module(INVENTORY_AUDIT_MODULE, {
  service: InventoryAuditService,
});

export * from "./models/inventory-adjustment";

