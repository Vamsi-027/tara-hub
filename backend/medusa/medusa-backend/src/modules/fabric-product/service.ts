import { MedusaService } from "@medusajs/framework/utils"
import FabricDetails from "./models/fabric-details"

class FabricProductModuleService extends MedusaService({
  FabricDetails,
}) {
  async createFabricDetails(data: any) {
    return await this.createFabricDetails(data)
  }

  async getFabricDetailsByProductId(productId: string) {
    const [fabricDetails] = await this.listFabricDetails({
      product_id: productId
    })
    return fabricDetails
  }

  async getFabricDetailsByTenant(tenantId: string, filters: any = {}) {
    return await this.listFabricDetails({
      tenant_id: tenantId,
      ...filters
    })
  }

  async updateFabricDetails(id: string, data: any) {
    return await this.updateFabricDetails(id, data)
  }

  async importFromFabricData(fabricData: any[], tenantId: string) {
    const imported = []
    
    for (const fabric of fabricData) {
      const fabricDetails = await this.createFabricDetails({
        product_id: fabric.productId, // This should be created first in Product service
        tenant_id: tenantId,
        fabric_type: fabric.category,
        composition: fabric.composition ? 
          Object.entries(fabric.composition).map(([material, percentage]) => ({
            material,
            percentage
          })) : [],
        weight: fabric.weight,
        width: fabric.width,
        color: fabric.color,
        pattern: fabric.pattern,
        sample_available: true,
        sample_price: 5.00,
        sample_size: '8x8 inches',
        care_instructions: fabric.careInstructions || [],
        certifications: fabric.certifications || [],
        performance_rating: fabric.performanceRating || {},
      })
      
      imported.push(fabricDetails)
    }
    
    return imported
  }
}

export default FabricProductModuleService