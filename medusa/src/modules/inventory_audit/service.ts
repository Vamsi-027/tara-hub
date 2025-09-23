import { MedusaService } from "@medusajs/framework/utils";
import InventoryAdjustment from "./models/inventory-adjustment";

class InventoryAuditService extends MedusaService({
  InventoryAdjustment,
}) {}

export default InventoryAuditService

