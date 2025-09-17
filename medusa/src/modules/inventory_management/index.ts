import { Module } from "@medusajs/framework/utils"
import InventoryService from "./service"

export const INVENTORY_MANAGEMENT = "inventory-management"

export default Module(INVENTORY_MANAGEMENT, {
  service: InventoryService,
})