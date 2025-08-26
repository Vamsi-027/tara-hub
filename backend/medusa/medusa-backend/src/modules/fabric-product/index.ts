import FabricProductModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const FABRIC_PRODUCT_MODULE = "fabricProductModuleService"

export default Module(FABRIC_PRODUCT_MODULE, {
  service: FabricProductModuleService,
})