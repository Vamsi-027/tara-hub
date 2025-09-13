/**
 * Enhanced Product Card Component - Luxury Edition
 * Individual product display card with premium styling
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Eye, Heart } from 'lucide-react'

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
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Add to cart:', product.id)
    // Dispatch cart update event
    window.dispatchEvent(new CustomEvent('cart-updated'))
  }

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Add to wishlist:', product.id)
    // Dispatch wishlist update event
    window.dispatchEvent(new CustomEvent('wishlist-updated'))
  }

  return (
    <div 
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.id}`}>
        <article className="card-luxury overflow-hidden h-full flex flex-col">
          {/* Enhanced Image Container */}
          <div className="relative aspect-[4/5] overflow-hidden bg-pearl-100">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-r from-pearl-200 via-pearl-100 to-pearl-200 
                             animate-shimmer bg-[length:200%_100%]"></div>
            )}
            <Image
              src={product.imageUrl || '/placeholder.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-all duration-700 ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
            
            {/* Enhanced Overlay Actions */}
            <div className={`absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent
                           transition-all duration-500 ${
                             isHovered ? 'opacity-100' : 'opacity-0'
                           }`}>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddToCart}
                    className="p-3 bg-pearl-50/90 backdrop-blur-sm rounded-xl hover:bg-pearl-50 
                             transition-all duration-300 transform hover:scale-105 
                             shadow-luxury hover:shadow-luxury-lg"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="w-5 h-5 text-charcoal-800" />
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    className="p-3 bg-pearl-50/90 backdrop-blur-sm rounded-xl hover:bg-pearl-50 
                             transition-all duration-300 transform hover:scale-105 
                             shadow-luxury hover:shadow-luxury-lg"
                    aria-label="Add to wishlist"
                  >
                    <Heart className="w-5 h-5 text-charcoal-800" />
                  </button>
                </div>
                <div className="p-3 bg-pearl-50/90 backdrop-blur-sm rounded-xl">
                  <Eye className="w-5 h-5 text-charcoal-800" />
                </div>
              </div>
            </div>

            {/* Enhanced Badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <div className="flex flex-col space-y-2">
                {product.sampleAvailable && (
                  <span className="bg-forest-500 text-pearl-50 px-3 py-1.5 rounded-full 
                                 text-xs font-medium shadow-luxury">
                    Sample Available
                  </span>
                )}
              </div>
              {!product.inStock && (
                <span className="bg-burgundy-600 text-pearl-50 px-3 py-1.5 rounded-full 
                               text-xs font-medium shadow-luxury">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Enhanced Product Info */}
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex-1">
              <p className="text-sm text-charcoal-500 mb-2 font-medium uppercase tracking-wider">
                {product.category}
              </p>
              <h3 className="font-display text-xl font-semibold text-charcoal-800 mb-3 line-clamp-2 
                           group-hover:text-burgundy-600 transition-colors duration-300">
                {product.name}
              </h3>
              <p className="text-charcoal-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                {product.description}
              </p>
            </div>
            
            <div className="space-y-3 mt-auto">
              {/* Enhanced Pricing */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-display font-semibold text-charcoal-800">
                    ${product.pricePerYard.toFixed(2)}
                    <span className="text-sm text-charcoal-500 font-sans font-normal ml-1">
                      /yard
                    </span>
                  </p>
                  {product.sampleAvailable && (
                    <p className="text-xs text-charcoal-500 mt-1">
                      Sample: ${product.samplePrice.toFixed(2)}
                    </p>
                  )}
                </div>
                
                {product.inStock && (
                  <div className="text-right">
                    <p className="text-xs text-forest-500 font-medium">
                      In Stock
                    </p>
                    <p className="text-xs text-charcoal-500">
                      {product.availableQuantity} yards
                    </p>
                  </div>
                )}
              </div>

              {/* Enhanced CTA */}
              <div className="pt-2 border-t border-pearl-300">
                <button 
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed 
                           disabled:transform-none text-sm py-3"
                >
                  {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </div>
  )
}