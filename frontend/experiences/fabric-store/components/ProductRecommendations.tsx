'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import type { Fabric } from '../lib/fabric-api'
import { addToCart } from '../lib/cart-utils'

interface ProductRecommendationsProps {
  currentFabric: Fabric
  allFabrics: Fabric[]
}

export function ProductRecommendations({ currentFabric, allFabrics }: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Fabric[]>([])

  useEffect(() => {
    // Smart recommendation algorithm
    const getRecommendations = () => {
      const scored = allFabrics
        .filter(fabric => fabric.id !== currentFabric.id)
        .map(fabric => {
          let score = 0
          
          // Same category gets high score
          if (fabric.category === currentFabric.category) score += 40
          
          // Same brand gets medium score  
          if ((fabric as any).brand === (currentFabric as any).brand) score += 30
          
          // Similar color family gets medium score
          if ((fabric as any).color_family === (currentFabric as any).color_family) score += 25
          
          // Same pattern gets medium score
          if ((fabric as any).pattern === (currentFabric as any).pattern) score += 20
          
          // Similar usage gets low score
          if ((fabric as any).usage === (currentFabric as any).usage) score += 15
          
          // Similar price range gets low score
          const currentPrice = currentFabric.price || 0
          const fabricPrice = fabric.price || 0
          const priceDiff = Math.abs(currentPrice - fabricPrice)
          if (priceDiff < currentPrice * 0.3) score += 10
          
          // Premium fabrics get slight boost
          if ((fabric as any).grade === 'Premium' || (fabric as any).is_featured) score += 5
          
          return { fabric, score }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(item => item.fabric)

      setRecommendations(scored)
    }

    if (allFabrics.length > 0) {
      getRecommendations()
    }
  }, [currentFabric, allFabrics])

  const handleAddToCart = (fabric: Fabric, type: 'swatch' | 'fabric' = 'swatch') => {
    // Find the appropriate variant based on type
    const variants = (fabric as any).variants || []
    let variantId = fabric.id // Default fallback

    if (type === 'swatch') {
      const swatchVariant = variants.find((v: any) =>
        v.title?.toLowerCase().includes('swatch')
      )
      variantId = swatchVariant?.id || fabric.id
    } else {
      const fabricVariant = variants.find((v: any) =>
        v.title?.toLowerCase().includes('fabric') || v.title?.toLowerCase().includes('yard')
      )
      variantId = fabricVariant?.id || fabric.id
    }

    addToCart({
      variantId: variantId,
      productId: fabric.id,
      title: fabric.name,
      variant: type === 'swatch' ? 'Swatch Sample' : '1 yard',
      price: type === 'swatch' ? ((fabric as any).swatch_price || 5) * 100 : (fabric.price || 99) * 100,
      quantity: 1,
      thumbnail: (fabric as any).swatch_image_url || (fabric as any).images?.[0],
      type
    })
  }

  const toggleWishlist = (fabricId: string) => {
    const wishlist = localStorage.getItem('fabric-wishlist')
    const wishlistItems = wishlist ? JSON.parse(wishlist) : []
    
    const isInWishlist = wishlistItems.includes(fabricId)
    let updatedWishlist
    
    if (isInWishlist) {
      updatedWishlist = wishlistItems.filter((id: string) => id !== fabricId)
    } else {
      updatedWishlist = [...wishlistItems, fabricId]
    }
    
    localStorage.setItem('fabric-wishlist', JSON.stringify(updatedWishlist))
    window.dispatchEvent(new CustomEvent('wishlist-updated'))
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <section className="mt-16 border-t border-gray-200 pt-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
          <p className="text-gray-600 mt-1">Handpicked recommendations based on this fabric</p>
        </div>
        <Link
          href="/browse"
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 text-sm"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recommendations.map((fabric) => (
          <div
            key={fabric.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all overflow-hidden group"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
              <Link href={`/fabric/${fabric.id}`}>
                <Image
                  src={(fabric as any).swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
                  alt={fabric.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </Link>
              
              {/* Wishlist Heart */}
              <button
                onClick={() => toggleWishlist(fabric.id)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-400 hover:text-red-500 transition-all"
              >
                <Heart className="w-4 h-4 mx-auto" />
              </button>

              {/* Premium Badge */}
              {(fabric as any).is_featured && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded uppercase tracking-wide">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </span>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-4">
              {(fabric as any).brand && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {(fabric as any).brand}
                </p>
              )}
              
              <Link href={`/fabric/${fabric.id}`}>
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors" title={fabric.name}>
                  {fabric.name}
                </h3>
              </Link>
              
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-lg font-bold text-gray-900">
                  ${(fabric.price || 99).toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  per {(fabric as any).stock_unit || 'yard'}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToCart(fabric, 'swatch')}
                  className="flex-1 bg-green-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Swatch ${((fabric as any).swatch_price || 5).toFixed(2)}
                </button>
                <button
                  onClick={() => handleAddToCart(fabric, 'fabric')}
                  className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  1 Yard
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}