import { 
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ProductStatus } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest<any>,
  res: MedusaResponse
) => {
  try {
    // Log the product data for debugging
    console.log("Creating product with data:", JSON.stringify(req.body, null, 2))
    
    // Prepare product data with proper structure
    const productData = {
      title: req.body.title,
      handle: req.body.handle || req.body.title.toLowerCase().replace(/\s+/g, '-'),
      description: req.body.description,
      status: req.body.status === 'published' ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
      thumbnail: req.body.thumbnail || req.body.images?.[0],
      images: req.body.images?.map((url: string) => ({ url })) || [],
      categories: [],
      options: req.body.options || [
        {
          title: "Type",
          values: ["Swatch", "Fabric"]
        }
      ],
      variants: req.body.variants?.map((v: any) => ({
        title: v.title,
        sku: v.sku,
        manage_inventory: false,
        options: v.options,
        prices: v.prices
      })) || [],
      metadata: req.body.metadata || {}
    }

    console.log("Formatted product data:", JSON.stringify(productData, null, 2))
    
    // Create product using workflow
    const { result } = await createProductsWorkflow(req.scope).run({
      input: {
        products: [productData]
      }
    })

    console.log("Product created successfully:", result)

    res.json({ 
      product: result[0],
      message: "Product created successfully"
    })
  } catch (error) {
    console.error("Error creating product:", error)
    
    let errorMessage = "Unknown error"
    let errorType = "unknown_error"
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for specific error types
      if (errorMessage.includes("already exists")) {
        errorType = "duplicate_handle"
        errorMessage = "A product with this handle already exists. Please use a different handle or title."
      }
    }
    
    res.status(500).json({ 
      error: "Failed to create product",
      details: errorMessage,
      type: errorType
    })
  }
}