import { MedusaService } from "@medusajs/framework/utils"
import { Material } from "./models"

/**
 * Materials Service
 * Simple service for materials table
 */
class MaterialsService extends MedusaService({
  Material
}) {
  // That's it - MedusaService provides all CRUD operations
  // No custom methods needed for simple one-to-one sync
}

export default MaterialsService