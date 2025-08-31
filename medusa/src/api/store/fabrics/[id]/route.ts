import { 
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const productModuleService = req.scope.resolve("product")
  
  try {
    const fabricId = req.params.id

    // Get the product from Medusa with all relations
    const product = await productModuleService.retrieveProduct(fabricId, {
      relations: ["images", "variants", "collection", "categories", "options"]
    })

    if (!product) {
      return res.status(404).json({ 
        error: "Fabric not found",
        id: fabricId 
      })
    }

    // Extract metadata fields
    const metadata = product.metadata || {}
    
    // Find swatch and fabric variants
    const swatchVariant = product.variants?.find((v: any) => 
      v.options?.Type === "Swatch" || v.title?.includes("Swatch")
    )
    const fabricVariant = product.variants?.find((v: any) => 
      v.options?.Type === "Fabric" || v.title?.includes("Yard")
    )

    // Transform to fabric-store expected format
    const fabric = {
      id: product.id,
      name: product.title,
      sku: fabricVariant?.sku || product.variants?.[0]?.sku || '',
      category: product.categories?.[0]?.name || metadata.category || '',
      collection: product.collection?.title || '',
      
      // Pricing for both variants
      price: fabricVariant ? 100 : 100, // Default fabric price per yard
      swatch_price: swatchVariant ? 5 : 5, // Default swatch price
      
      // Images
      images: product.images?.map((img: any) => img.url) || [],
      swatch_image_url: product.thumbnail || product.images?.[0]?.url || '',
      
      // Status
      status: product.status === 'published' ? 'Active' : 'Inactive',
      
      // Description
      description: product.description,
      
      // From metadata
      color: metadata.color || '',
      color_family: metadata.color_family || '',
      color_hex: metadata.color_hex || '',
      pattern: metadata.pattern || '',
      usage: metadata.usage || 'Indoor',
      properties: metadata.properties || [],
      composition: metadata.composition || '',
      width: metadata.width || '',
      weight: metadata.weight || '',
      durability: metadata.durability || '',
      care_instructions: metadata.care_instructions || '',
      swatch_size: metadata.swatch_size || '4x4 inches',
      minimum_order_yards: metadata.minimum_order_yards || '1',
      
      // Stock status (check both variants)
      in_stock: (fabricVariant?.inventory_quantity || 0) > 0,
      swatch_in_stock: (swatchVariant?.inventory_quantity || 0) > 0,
      
      // Additional details
      brand: metadata.manufacturer || '',
      colors: [metadata.color_hex].filter(Boolean),
      stock_unit: 'yard',
      
      // Variant details
      variants: product.variants?.map((variant: any) => {
        const isSwatch = variant.options?.Type === "Swatch" || variant.title?.includes("Swatch")
        return {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          type: isSwatch ? "Swatch" : "Fabric",
          price: isSwatch ? 5 : 100, // Default prices
          inventory_quantity: variant.inventory_quantity || 0,
          in_stock: (variant.inventory_quantity || 0) > 0
        }
      }) || []
    }

    res.json({ fabric })

  } catch (error) {
    console.error("Error fetching fabric:", error)
    res.status(500).json({
      error: "Failed to fetch fabric details",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}