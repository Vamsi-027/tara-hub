import { 
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const productModuleService = req.scope.resolve("product")
  const pricingModuleService = req.scope.resolve("pricing")

  try {
    const { searchParams } = new URL(req.url || "", `http://${req.headers.host}`)
    
    // Extract query parameters
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const category = searchParams.get("category")
    const collection = searchParams.get("collection")
    const color_family = searchParams.get("color_family")
    const pattern = searchParams.get("pattern")

    // Build filter for products
    const filters: any = {
      status: "published"
    }

    // Get products with pagination
    const products = await productModuleService.listProducts(filters, {
      take: limit,
      skip: offset,
      relations: ["images", "variants", "collection", "categories", "options"]
    })

    // Transform products to fabric-store expected format with variant details
    const fabrics = await Promise.all(products.map(async (product: any) => {
      // Extract metadata fields
      const metadata = product.metadata || {}
      
      // Find swatch and fabric variants
      const swatchVariant = product.variants?.find((v: any) => 
        v.options?.Type === "Swatch" || v.title?.includes("Swatch")
      )
      const fabricVariant = product.variants?.find((v: any) => 
        v.options?.Type === "Fabric" || v.title?.includes("Yard")
      )

      // For now, use hardcoded prices based on variant type
      // In production, you'd need to load prices separately
      const swatchPrice = swatchVariant ? 500 : null // $5.00 default for swatches
      const fabricPrice = fabricVariant ? 10000 : null // $100.00 default for fabric

      return {
        id: product.id,
        name: product.title,
        sku: fabricVariant?.sku || product.variants?.[0]?.sku || '',
        category: product.categories?.[0]?.name || metadata.category || '',
        collection: product.collection?.title || '',
        
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
        
        // Product details
        description: product.description,
        images: product.images?.map((img: any) => img.url) || [],
        swatch_image_url: product.thumbnail || product.images?.[0]?.url || '',
        
        // Pricing for both variants
        price: fabricPrice ? fabricPrice / 100 : 100, // Default fabric price per yard
        swatch_price: swatchPrice ? swatchPrice / 100 : 5, // Default swatch price
        
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
        }) || [],
        
        // Stock status (check both variants)
        in_stock: (fabricVariant?.inventory_quantity || 0) > 0,
        swatch_in_stock: (swatchVariant?.inventory_quantity || 0) > 0,
        
        // Status
        status: product.status === 'published' ? 'Active' : 'Inactive'
      }
    }))

    // Apply additional filters if needed
    let filteredFabrics = fabrics

    if (category) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.category.toLowerCase() === category.toLowerCase()
      )
    }

    if (collection) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.collection.toLowerCase().includes(collection.toLowerCase())
      )
    }

    if (color_family) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.color_family.toLowerCase() === color_family.toLowerCase()
      )
    }

    if (pattern) {
      filteredFabrics = filteredFabrics.filter(f => 
        f.pattern.toLowerCase().includes(pattern.toLowerCase())
      )
    }

    res.json({
      fabrics: filteredFabrics,
      total: filteredFabrics.length,
      limit,
      offset
    })

  } catch (error) {
    console.error("Error fetching fabrics:", error)
    res.status(500).json({
      error: "Failed to fetch fabrics",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}