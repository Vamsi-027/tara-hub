/**
 * Product Grid Component
 * Displays products in a responsive grid layout
 */

'use client'

import { transformMedusaToFabric, type MedusaProduct } from '../lib/medusa-api'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: MedusaProduct[]
  columns?: 3 | 4
}

export default function ProductGrid({ products, columns = 3 }: ProductGridProps) {
  const gridCols = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
  
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
        <p className="text-gray-400 mt-2">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6`}>
      {products.map((product) => {
        const fabricProduct = transformMedusaToFabric(product)
        return <ProductCard key={product.id} product={fabricProduct as any} />
      })}
    </div>
  )
}