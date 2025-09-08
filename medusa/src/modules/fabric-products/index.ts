import { Module } from "@medusajs/framework/utils"
import FabricProductModuleService from "./service"

/**
 * Fabric Products Module
 * 
 * Handles configurable fabric products that require user selection:
 * 1. Configurable Fabric Products (user selects single fabric)
 * 2. Configurable Swatch Sets (user selects multiple fabrics)
 * 
 * Note: Fixed fabric products are handled as standard Medusa products
 * with the fabric-details module for storing fabric information.
 */
export const FABRIC_PRODUCTS_MODULE = "fabricProductModuleService"

export default Module(FABRIC_PRODUCTS_MODULE, {
  service: FabricProductModuleService,
})