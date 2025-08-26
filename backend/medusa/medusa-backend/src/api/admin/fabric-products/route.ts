import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { TENANT_MODULE } from "../../../modules/tenant"
import { FABRIC_PRODUCT_MODULE } from "../../../modules/fabric-product"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const tenantService = req.scope.resolve(TENANT_MODULE)
    const fabricProductService = req.scope.resolve(FABRIC_PRODUCT_MODULE)
    const productService = req.scope.resolve("productModuleService")
    
    // Get tenant ID from headers or resolve from hostname
    let tenantId = req.headers["x-tenant-id"] as string
    
    if (!tenantId) {
      const hostname = req.headers.host || 'localhost:3000'
      const tenant = await tenantService.resolveTenant(hostname)
      tenantId = tenant?.id || 'tenant_default'
    }
    
    const body = req.body as any
    
    // Create the base product first
    const product = await productService.createProducts({
      title: body.title || body.name,
      handle: body.handle || body.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: body.description,
      thumbnail: body.imageUrl || body.thumbnail,
      images: body.images || (body.imageUrl ? [body.imageUrl] : []),
      tags: body.tags || [],
      type: body.category || body.fabric_type,
      variants: [
        {
          title: "Default Variant",
          sku: body.sku,
          inventory_quantity: body.availableQuantity || 0,
          prices: [
            {
              amount: Math.round((body.pricePerYard || body.price || 0) * 100), // Convert to cents
              currency_code: "USD",
            }
          ],
        }
      ],
    })

    // Create fabric-specific details
    const fabricDetails = await fabricProductService.createFabricDetails({
      product_id: product.id,
      tenant_id: tenantId,
      fabric_type: body.category || body.fabric_type,
      composition: body.composition || [],
      weight: body.weight,
      width: body.width,
      color: body.color,
      pattern: body.pattern,
      sample_available: body.sampleAvailable !== false,
      sample_price: body.samplePrice || 5,
      sample_size: body.sampleSize || "8x8 inches",
      care_instructions: body.careInstructions || [],
      certifications: body.certifications || [],
      performance_rating: body.performanceRating || {},
    })
    
    res.status(201).json({
      product: {
        ...product,
        fabricDetails,
      }
    })
  } catch (error) {
    console.error("Error creating fabric product:", error)
    res.status(500).json({
      error: "Failed to create fabric product",
    })
  }
}