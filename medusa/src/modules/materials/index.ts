import { Module } from "@medusajs/framework/utils"
import { Material } from "./models"
import MaterialsService from "./service"

/**
 * Materials Module
 *
 * Registers the materials service and exposes linkable metadata so other modules
 * can associate materials via framework-native links.
 */
export const MATERIALS_MODULE = "materialsModuleService"

const MaterialsModule = Module(MATERIALS_MODULE, {
  service: MaterialsService,
}) as any

MaterialsModule.models = [Material]
MaterialsModule.migrations = MaterialsModule.migrations ?? []
MaterialsModule.linkable = {
  material: {
    primaryKey: "id",
    field: "material",
    alias: "materials",
    schema: Material,
  },
}

export default MaterialsModule
