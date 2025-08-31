import { Module } from "@medusajs/framework/utils"
import FabricPropertiesService from "./service"

export const FABRIC_MODULE = "fabric-details"

export default Module(FABRIC_MODULE, {
  service: FabricPropertiesService,
})

export * from "./models/fabric-properties"