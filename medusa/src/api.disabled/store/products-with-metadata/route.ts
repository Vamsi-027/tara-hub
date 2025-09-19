import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Custom Store API route to expose products with metadata
 * Path: /store/products-with-metadata
 *
 * This follows Medusa v2 best practices for exposing metadata to the storefront
 */

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)

  try {
    // Get query parameters
    const { id, limit = 100, offset = 0, region_id } = req.query

    if (id) {
      // Single product request
      const product = await productService.retrieveProduct(id as string, {
        relations: [
          "images",
          "options",
          "options.values",
          "variants",
          "variants.options",
          "variants.options.option",
          "type",
          "collection",
          "tags"
        ],
      })

      if (!product) {
        return res.status(404).json({
          error: "Product not found"
        })
      }

      // Include metadata in the response
      const productWithMetadata = {
        ...product,
        metadata: product.metadata || {},
      }

      return res.json({
        product: productWithMetadata
      })
    } else {
      // List products request
      const [products, count] = await productService.listAndCountProducts(
        {},
        {
          take: parseInt(limit as string),
          skip: parseInt(offset as string),
          relations: [
            "images",
            "options",
            "options.values",
            "variants",
            "variants.options",
            "type",
            "collection",
            "tags"
          ],
        }
      )

      // Include metadata for all products
      const productsWithMetadata = products.map(product => ({
        ...product,
        metadata: product.metadata || {},
      }))

      return res.json({
        products: productsWithMetadata,
        count,
        offset: parseInt(offset as string),
        limit: parseInt(limit as string),
      })
    }
  } catch (error) {
    console.error("Error fetching products with metadata:", error)
    return res.status(500).json({
      error: "Failed to fetch products",
      message: error.message
    })
  }
}