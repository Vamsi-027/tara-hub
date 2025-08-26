import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { TENANT_MODULE } from "../../../modules/tenant"
import { FABRIC_PRODUCT_MODULE } from "../../../modules/fabric-product"

export async function GET(
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
      const hostname = req.headers.host || 'localhost:3006'
      const tenant = await tenantService.resolveTenant(hostname)
      tenantId = tenant?.id || 'tenant_default'
    }
    
    // Get query parameters
    const { 
      limit = 20, 
      offset = 0, 
      fabric_type, 
      color, 
      pattern,
      search,
      min_price,
      max_price 
    } = req.query
    
    // Get fabric details with filters
    const fabricFilters: any = { tenant_id: tenantId }
    if (fabric_type) fabricFilters.fabric_type = fabric_type
    if (color) fabricFilters.color = color
    if (pattern) fabricFilters.pattern = pattern
    
    const fabricDetails = await fabricProductService.listFabricDetails(fabricFilters)
    
    // Get corresponding products
    const productIds = fabricDetails.map((f: any) => f.product_id)
    const products = productIds.length > 0 ? 
      await productService.listProducts({ 
        id: productIds,
        limit: Number(limit),
        offset: Number(offset)
      }) : []
    
    // Combine product data with fabric details
    const combinedProducts = products.map((product: any) => {
      const fabricDetail = fabricDetails.find((f: any) => f.product_id === product.id)
      
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        handle: product.handle,
        thumbnail: product.thumbnail,
        images: product.images,
        tags: product.tags,
        
        // Transform to match expected API format
        name: product.title,
        category: fabricDetail?.fabric_type || product.type,
        pricePerYard: product.variants?.[0]?.prices?.[0]?.amount / 100 || 0,
        color: fabricDetail?.color,
        pattern: fabricDetail?.pattern,
        width: fabricDetail?.width,
        weight: fabricDetail?.weight,
        composition: fabricDetail?.composition || [],
        imageUrl: product.thumbnail,
        inStock: (product.variants?.[0]?.inventory_quantity || 0) > 0,
        availableQuantity: product.variants?.[0]?.inventory_quantity || 0,
        sku: product.variants?.[0]?.sku,
        sampleAvailable: fabricDetail?.sample_available ?? true,
        samplePrice: fabricDetail?.sample_price || 5,
        sampleSize: fabricDetail?.sample_size || "8x8 inches",
        careInstructions: fabricDetail?.care_instructions || [],
        certifications: fabricDetail?.certifications || [],
        performanceRating: fabricDetail?.performance_rating || {},
      }
    })
    
    res.json({
      products: combinedProducts,
      count: combinedProducts.length,
      limit: Number(limit),
      offset: Number(offset),
    })
  } catch (error) {
    console.error("Error fetching fabric products:", error)
    res.status(500).json({
      error: "Failed to fetch fabric products",
    })
  }
}