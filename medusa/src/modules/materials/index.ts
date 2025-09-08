import { Module } from "@medusajs/framework/utils"
import MaterialsService from "./service"

/**
 * Materials Module
 * 
 * Simple module for tracking materials and fabric compositions.
 * No over-engineering, just the essentials.
 */
export const MATERIALS_MODULE = "materialsModuleService"

export default Module(MATERIALS_MODULE, {
  service: MaterialsService,
})