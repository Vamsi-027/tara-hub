'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { useFabrics } from '../../hooks/useFabrics'
import type { Fabric } from '../../lib/fabric-api'

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // Load wishlist from localStorage
  useEffect(() => {
    const wishlist = localStorage.getItem('fabric-wishlist')
    if (wishlist) {
      try {
        setWishlistItems(JSON.parse(wishlist))
      } catch (e) {
        console.error('Failed to load wishlist', e)
      }
    }
    setLoading(false)
  }, [])

  // Fetch fabric details for wishlist items
  const { fabrics } = useFabrics({ limit: 100 })
  const wishlistFabrics = fabrics.filter(fabric => wishlistItems.includes(fabric.id))

  const removeFromWishlist = (fabricId: string) => {
    const updatedWishlist = wishlistItems.filter(id => id !== fabricId)
    setWishlistItems(updatedWishlist)
    localStorage.setItem('fabric-wishlist', JSON.stringify(updatedWishlist))
    window.dispatchEvent(new CustomEvent('wishlist-updated'))
  }

  const addToCart = (fabric: Fabric, type: 'swatch' | 'fabric' = 'swatch') => {
    const cartItem = {
      id: `${type}-${fabric.id}-${Date.now()}`,
      variantId: fabric.id,
      productId: fabric.id,
      title: fabric.name,
      variant: type === 'swatch' ? 'Swatch Sample' : '1 yard',
      price: type === 'swatch' ? ((fabric as any).swatch_price || 5) * 100 : (fabric.price || 99) * 100,
      quantity: 1,
      thumbnail: (fabric as any).swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      type
    }

    const existingCart = localStorage.getItem('fabric-cart')
    const cart = existingCart ? JSON.parse(existingCart) : []
    const updatedCart = [...cart, cartItem]
    
    localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }))
    
    alert(`Added ${fabric.name} ${type} to cart!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/browse"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[40px] px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Browse</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                My Wishlist
              </h1>
            </div>
            <Link
              href="/cart"
              className="w-10 h-10 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlistFabrics.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Save your favorite fabrics to compare and purchase later</p>
            <Link
              href="/browse"
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Browse Fabrics
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-gray-600">
                {wishlistFabrics.length} item{wishlistFabrics.length !== 1 ? 's' : ''} in your wishlist
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistFabrics.map((fabric) => (
                <div key={fabric.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <Link href={`/fabric/${fabric.id}`}>
                      <Image
                        src={(fabric as any).swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
                        alt={fabric.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </Link>
                    
                    {/* Remove from wishlist */}
                    <button
                      onClick={() => removeFromWishlist(fabric.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <Link href={`/fabric/${fabric.id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                        {fabric.name}
                      </h3>
                    </Link>
                    
                    {(fabric as any).brand && (
                      <p className="text-sm text-gray-500 mb-2">{(fabric as any).brand}</p>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-lg font-bold text-gray-900">
                          ${(fabric.price || 99).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">per yard</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => addToCart(fabric, 'swatch')}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Add Swatch to Cart - ${(fabric.swatch_price || 5).toFixed(2)}
                      </button>
                      <button
                        onClick={() => addToCart(fabric, 'fabric')}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Add 1 Yard to Cart - ${(fabric.price || 99).toFixed(2)}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}