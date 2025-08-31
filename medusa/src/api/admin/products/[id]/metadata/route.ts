import { 
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { 
  UpdateProductDTO
} from "@medusajs/framework/types"

export const POST = async (
  req: MedusaRequest<{ metadata: Record<string, any> }>,
  res: MedusaResponse
) => {
  try {
    const productService = req.scope.resolve("product")
    const productId = req.params.id
    
    // Update product metadata
    const updatedProduct = await productService.updateProducts(productId, {
      metadata: req.body.metadata
    })

    res.json({ 
      product: updatedProduct,
      message: "Fabric specifications updated successfully"
    })
  } catch (error) {
    console.error("Error updating product metadata:", error)
    res.status(500).json({ 
      error: "Failed to update fabric specifications",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}