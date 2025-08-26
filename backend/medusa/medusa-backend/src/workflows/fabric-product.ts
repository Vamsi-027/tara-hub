import { 
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createProductStep } from "@medusajs/medusa/core-flows"
import { FABRIC_PRODUCT_MODULE } from "../modules/fabric-product"

// Define input type
type CreateFabricProductInput = {
  tenantId: string
  title: string
  handle?: string
  description?: string
  
  // Fabric-specific fields
  fabric_type?: string
  composition?: any[]
  weight?: number
  width?: number
  color?: string
  pattern?: string
  
  // Pricing
  price: number
  sample_price?: number
  sample_size?: string
  
  // Inventory
  sku?: string
  inventory_quantity?: number
  
  // Media
  thumbnail?: string
  images?: string[]
  
  // Additional metadata
  care_instructions?: string[]
  certifications?: string[]
  performance_rating?: any
  tags?: string[]
}

const createFabricProductWorkflow = createWorkflow(
  "create-fabric-product",
  (input: CreateFabricProductInput) => {
    // Step 1: Create the base product
    const product = createProductStep({
      title: input.title,
      handle: input.handle,
      description: input.description,
      thumbnail: input.thumbnail,
      images: input.images || [],
      tags: input.tags || [],
      variants: [
        {
          title: "Default Variant",
          sku: input.sku,
          inventory_quantity: input.inventory_quantity || 0,
          prices: [
            {
              amount: input.price * 100, // Convert to cents
              currency_code: "USD",
            }
          ],
          options: [],
        }
      ],
    })

    // Step 2: Create fabric-specific details
    const fabricDetails = createStep(
      "create-fabric-details",
      async (input: any, { container }) => {
        const fabricProductService = container.resolve(FABRIC_PRODUCT_MODULE)
        
        return await fabricProductService.createFabricDetails({
          product_id: input.productId,
          tenant_id: input.tenantId,
          fabric_type: input.fabric_type,
          composition: input.composition || [],
          weight: input.weight,
          width: input.width,
          color: input.color,
          pattern: input.pattern,
          sample_available: true,
          sample_price: input.sample_price || 5.00,
          sample_size: input.sample_size || "8x8 inches",
          care_instructions: input.care_instructions || [],
          certifications: input.certifications || [],
          performance_rating: input.performance_rating || {},
        })
      }
    )({
      productId: product.id,
      tenantId: input.tenantId,
      fabric_type: input.fabric_type,
      composition: input.composition,
      weight: input.weight,
      width: input.width,
      color: input.color,
      pattern: input.pattern,
      sample_price: input.sample_price,
      sample_size: input.sample_size,
      care_instructions: input.care_instructions,
      certifications: input.certifications,
      performance_rating: input.performance_rating,
    })

    return new WorkflowResponse({
      product,
      fabricDetails,
    })
  }
)

export default createFabricProductWorkflow

// Helper function to create step
function createStep(name: string, fn: Function) {
  return (input: any) => fn(input)
}