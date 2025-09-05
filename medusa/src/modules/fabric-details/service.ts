import { MedusaService } from "@medusajs/framework/utils"
import FabricProperties from "./models/fabric-properties"

class FabricPropertiesService extends MedusaService({
  FabricProperties,
}) {

  async getFabricPropertiesByProductId(productId: string) {
    return await this.listFabricProperties({
      product_id: productId
    })
  }

  async getFabricPropertiesByCollection(collection: string) {
    return await this.listFabricProperties({
      collection
    })
  }

  async getFabricPropertiesByColorFamily(colorFamily: string) {
    return await this.listFabricProperties({
      color_family: colorFamily
    })
  }

  async getFabricPropertiesByUsage(usage: "Indoor" | "Outdoor" | "Both") {
    return await this.listFabricProperties({
      usage
    })
  }
}

export default FabricPropertiesService