import { MedusaService } from "@medusajs/framework/utils"
import FabricProperties from "./models/fabric-properties"

class FabricPropertiesService extends MedusaService({
  FabricProperties,
}) {
  
  async createFabricProperties(data: {
    product_id: string
    composition?: string
    width?: string  
    weight?: string
    pattern?: string
    color?: string
    color_family?: string
    color_hex?: string
    usage?: "Indoor" | "Outdoor" | "Both"
    care_instructions?: string
    durability?: string
    durability_rating?: number
    manufacturer?: string
    collection?: string
    is_pet_friendly?: boolean
    is_stain_resistant?: boolean
    is_outdoor_safe?: boolean
    properties?: string[]
  }) {
    return await this.fabricPropertiesRepository_.create(data)
  }

  async getFabricPropertiesByProductId(productId: string) {
    return await this.fabricPropertiesRepository_.findOne({
      where: { product_id: productId }
    })
  }

  async updateFabricProperties(id: string, data: Partial<typeof data>) {
    return await this.fabricPropertiesRepository_.update(id, data)
  }

  async deleteFabricProperties(id: string) {
    return await this.fabricPropertiesRepository_.delete(id)
  }

  async getFabricPropertiesByCollection(collection: string) {
    return await this.fabricPropertiesRepository_.find({
      where: { collection }
    })
  }

  async getFabricPropertiesByColorFamily(colorFamily: string) {
    return await this.fabricPropertiesRepository_.find({
      where: { color_family: colorFamily }
    })
  }

  async getFabricPropertiesByUsage(usage: "Indoor" | "Outdoor" | "Both") {
    return await this.fabricPropertiesRepository_.find({
      where: { usage }
    })
  }
}

export default FabricPropertiesService