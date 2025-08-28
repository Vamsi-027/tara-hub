/**
 * Product Card Component
 * Individual product display card
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Eye } from 'lucide-react'

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    category: string
    pricePerYard: number
    imageUrl: string
    inStock: boolean
    availableQuantity: number
    sampleAvailable: boolean
    samplePrice: number
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    // TODO: Implement cart functionality
    console.log('Add to cart:', product.id)
  }

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          <Image
            src={product.imageUrl || '/placeholder.jpg'}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Quick Actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
            <button
              onClick={handleAddToCart}
              className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <span className="p-3 bg-white rounded-full">
              <Eye className="w-5 h-5" />
            </span>
          </div>

          {/* Stock Badge */}
          {!product.inStock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Out of Stock
            </div>
          )}
          
          {product.sampleAvailable && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Sample Available
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <p className="text-sm text-gray-500 mb-1">{product.category}</p>
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xl font-bold text-blue-600">
                ${product.pricePerYard.toFixed(2)}
                <span className="text-sm text-gray-500 font-normal">/yard</span>
              </p>
              {product.sampleAvailable && (
                <p className="text-xs text-gray-500">
                  Sample: ${product.samplePrice.toFixed(2)}
                </p>
              )}
            </div>
            
            {product.inStock && (
              <p className="text-xs text-green-600">
                {product.availableQuantity} yards available
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}