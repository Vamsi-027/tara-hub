/**
 * Product Detail Page
 * Server Component with dynamic routing
 */

import { notFound } from 'next/navigation'
import { getProduct, getProducts, transformMedusaToFabric } from '../../../lib/medusa-api'
import ProductDetails from '../../../components/ProductDetails'
import RelatedProducts from '../../../components/RelatedProducts'

// Generate static params for popular products
export async function generateStaticParams() {
  const { products } = await getProducts({ limit: 10 })
  
  return products.map((product) => ({
    id: product.id,
  }))
}

// Dynamic metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const { product } = await getProduct(params.id)
    
    return {
      title: `${product.title} - Tara Hub Fabrics`,
      description: product.description || `Premium ${product.title} fabric available at Tara Hub`,
      openGraph: {
        title: product.title,
        description: product.description,
        images: product.images?.map(img => img.url) || [],
      },
    }
  } catch {
    return {
      title: 'Product Not Found - Tara Hub',
    }
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  try {
    // Fetch product details
    const { product } = await getProduct(params.id)
    
    if (!product) {
      notFound()
    }

    // Transform to fabric format
    const fabricProduct = transformMedusaToFabric(product)

    // Fetch related products from same category
    let relatedProducts = []
    if (product.categories?.[0]) {
      const { products } = await getProducts({
        category_id: [product.categories[0].id],
        limit: 4,
      })
      relatedProducts = products.filter(p => p.id !== product.id)
    }

    return (
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm">
          <ol className="flex space-x-2 text-gray-600">
            <li><a href="/" className="hover:text-blue-500">Home</a></li>
            <li>/</li>
            <li><a href="/products" className="hover:text-blue-500">Products</a></li>
            <li>/</li>
            <li className="text-gray-900">{product.title}</li>
          </ol>
        </nav>

        {/* Product Details */}
        <ProductDetails product={fabricProduct} rawProduct={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <RelatedProducts products={relatedProducts} />
          </section>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error loading product:', error)
    notFound()
  }
}