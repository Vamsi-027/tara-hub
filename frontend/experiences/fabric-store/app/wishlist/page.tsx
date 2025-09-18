'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  X,
  Sparkles,
  Info,
  Package,
  Clock,
  Check,
  Plus,
  Layers
} from 'lucide-react'
import { useFabrics } from '../../hooks/useFabrics'
import { addToCart as addToCartUtil } from '../../lib/cart-utils'
import type { Fabric } from '../../lib/fabric-api'

interface WishlistItem {
  id: string
  addedAt: Date
  notes?: string
}

export default function WishlistPage() {
  const [wishlistData, setWishlistData] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Load wishlist from localStorage with metadata
  useEffect(() => {
    const wishlist = localStorage.getItem('fabric-wishlist')
    const wishlistMeta = localStorage.getItem('fabric-wishlist-meta')

    if (wishlist) {
      try {
        const ids = JSON.parse(wishlist)
        let metadata: WishlistItem[] = []

        if (wishlistMeta) {
          metadata = JSON.parse(wishlistMeta)
        } else {
          // Create metadata for existing items
          metadata = ids.map((id: string) => ({
            id,
            addedAt: new Date(),
            notes: ''
          }))
          localStorage.setItem('fabric-wishlist-meta', JSON.stringify(metadata))
        }

        setWishlistData(metadata)
      } catch (e) {
        console.error('Failed to load wishlist', e)
      }
    }
    setLoading(false)
  }, [])

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Fetch fabric details for wishlist items
  const { fabrics } = useFabrics({ limit: 100 })
  const wishlistFabrics = fabrics.filter(fabric =>
    wishlistData.some(item => item.id === fabric.id)
  )

  const removeFromWishlist = async (fabricId: string) => {
    setRemovingId(fabricId)

    // Animate removal
    await new Promise(resolve => setTimeout(resolve, 300))

    const updatedWishlist = wishlistData.filter(item => item.id !== fabricId)
    const updatedIds = updatedWishlist.map(item => item.id)

    setWishlistData(updatedWishlist)
    localStorage.setItem('fabric-wishlist', JSON.stringify(updatedIds))
    localStorage.setItem('fabric-wishlist-meta', JSON.stringify(updatedWishlist))

    // Defer event dispatch to avoid state updates during render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('wishlist-updated'))
    }, 0)
    setNotification({ message: 'Removed from wishlist', type: 'success' })
    setRemovingId(null)

    // Remove from selected items if present
    setSelectedItems(prev => prev.filter(id => id !== fabricId))
  }

  const addToCart = async (fabric: Fabric, type: 'swatch' | 'fabric' = 'swatch', quantity: number = 1) => {
    setAddingToCart(`${fabric.id}-${type}`)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

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

    addToCartUtil({
      variantId: variantId,
      productId: fabric.id,
      title: fabric.name,
      variant: type === 'swatch' ? 'Swatch Sample' : `${quantity} yard${quantity > 1 ? 's' : ''}`,
      price: type === 'swatch'
        ? ((fabric as any).swatch_price || 5) * 100
        : (fabric.price || 99) * 100 * quantity,
      quantity: 1,
      thumbnail: (fabric as any).swatch_image_url || (fabric as any).images?.[0] || '/placeholder.jpg',
      type,
      yardage: type === 'fabric' ? quantity : undefined
    })

    setNotification({
      message: `Added ${fabric.name} ${type === 'swatch' ? 'swatch' : `(${quantity} yard${quantity > 1 ? 's' : ''})`} to cart`,
      type: 'success'
    })
    setAddingToCart(null)
  }

  const moveSelectedToCart = async () => {
    if (selectedItems.length === 0) return

    const selectedFabrics = wishlistFabrics.filter(fabric => selectedItems.includes(fabric.id))

    for (const fabric of selectedFabrics) {
      await addToCart(fabric, 'swatch')
    }

    // Remove from wishlist after adding to cart
    const updatedWishlist = wishlistData.filter(item => !selectedItems.includes(item.id))
    const updatedIds = updatedWishlist.map(item => item.id)

    setWishlistData(updatedWishlist)
    localStorage.setItem('fabric-wishlist', JSON.stringify(updatedIds))
    localStorage.setItem('fabric-wishlist-meta', JSON.stringify(updatedWishlist))

    // Defer event dispatch to avoid state updates during render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('wishlist-updated'))
    }, 0)
    setSelectedItems([])
  }

  const toggleSelectItem = (fabricId: string) => {
    setSelectedItems(prev =>
      prev.includes(fabricId)
        ? prev.filter(id => id !== fabricId)
        : [...prev, fabricId]
    )
  }

  const selectAll = () => {
    if (selectedItems.length === wishlistFabrics.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(wishlistFabrics.map(f => f.id))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading wishlist...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/browse"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Browse</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart className="w-7 h-7 text-red-500 fill-red-500" />
                  My Wishlist
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {wishlistFabrics.length} item{wishlistFabrics.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </div>

            {wishlistFabrics.length > 0 && (
              <div className="flex items-center gap-2">
                {selectedItems.length > 0 && (
                  <>
                    <span className="text-sm text-gray-600">
                      {selectedItems.length} selected
                    </span>
                    <button
                      onClick={moveSelectedToCart}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </>
                )}
                <button
                  onClick={selectAll}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  {selectedItems.length === wishlistFabrics.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlistFabrics.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Save your favorite fabrics to compare and purchase later. Click the heart icon on any fabric to add it to your wishlist.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Layers className="w-5 h-5" />
              Browse Fabrics
            </Link>

            {/* Suggestions */}
            <div className="mt-12 p-6 bg-blue-50 rounded-xl">
              <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-3">Why use a wishlist?</h3>
              <ul className="text-sm text-gray-700 space-y-2 text-left max-w-xs mx-auto">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Save fabrics for future projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Compare multiple options side by side</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Get notified about price drops</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Share collections with clients</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium">Tip: Order fabric swatches first</p>
                  <p className="text-sm text-blue-700 mt-1">
                    We recommend ordering swatch samples to see and feel the fabric quality before purchasing yards.
                    Swatches are only $5 each with free shipping.
                  </p>
                </div>
              </div>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistFabrics.map((fabric) => {
                const wishlistItem = wishlistData.find(item => item.id === fabric.id)
                const isSelected = selectedItems.includes(fabric.id)
                const isRemoving = removingId === fabric.id

                return (
                  <div
                    key={fabric.id}
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 ${
                      isRemoving ? 'opacity-50 scale-95' : ''
                    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-3 left-3 z-10">
                      <label className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(fabric.id)}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </label>
                    </div>

                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <Link href={`/fabric/${fabric.id}`}>
                        <Image
                          src={(fabric as any).swatch_image_url || (fabric as any).images?.[0] || '/placeholder.jpg'}
                          alt={fabric.name}
                          fill
                          className="object-cover hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                      </Link>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromWishlist(fabric.id)}
                        disabled={isRemoving}
                        className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                        title="Remove from wishlist"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      {/* Stock Badge */}
                      {(fabric as any).in_stock && (
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                          In Stock
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <Link href={`/fabric/${fabric.id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 min-h-[3rem]">
                          {fabric.name}
                        </h3>
                      </Link>

                      {(fabric as any).brand && (
                        <p className="text-sm text-gray-500 mt-1">{(fabric as any).brand}</p>
                      )}

                      {/* Price */}
                      <div className="mt-3 flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">
                            ${(fabric.price || 99).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">/yard</span>
                        </div>
                        {(fabric as any).swatch_price && (
                          <span className="text-xs text-green-600 font-medium">
                            Swatch ${(fabric as any).swatch_price}
                          </span>
                        )}
                      </div>

                      {/* Added Date */}
                      {wishlistItem && (
                        <p className="text-xs text-gray-500 mt-2">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Added {new Date(wishlistItem.addedAt).toLocaleDateString()}
                        </p>
                      )}

                      {/* Action Buttons */}
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => addToCart(fabric, 'swatch')}
                          disabled={addingToCart === `${fabric.id}-swatch`}
                          className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {addingToCart === `${fabric.id}-swatch` ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Package className="w-4 h-4" />
                              Add Swatch - ${((fabric as any).swatch_price || 5).toFixed(2)}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => addToCart(fabric, 'fabric')}
                          disabled={addingToCart === `${fabric.id}-fabric`}
                          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {addingToCart === `${fabric.id}-fabric` ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add 1 Yard - ${(fabric.price || 99).toFixed(2)}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-12 p-6 bg-gray-100 rounded-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ready to order?</h3>
                  <p className="text-sm text-gray-600">
                    Add swatches to cart to feel the fabric quality before ordering yards
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/browse"
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border border-gray-300"
                  >
                    Continue Shopping
                  </Link>
                  <Link
                    href="/cart"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    View Cart
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}