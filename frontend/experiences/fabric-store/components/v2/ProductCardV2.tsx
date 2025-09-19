'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingBag, Eye, Ruler, Sparkles, Package, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Fabric } from '../../lib/fabric-api'
import { addToCart } from '../../lib/cart-utils'

interface ProductCardV2Props {
  fabric: Fabric
  viewMode: 'grid' | 'list'
}

export function ProductCardV2({ fabric, viewMode }: ProductCardV2Props) {
  const router = useRouter()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Extract essential fields
  const essentialFields = {
    name: fabric.name || 'Premium Fabric',
    price: fabric.price || 99.00,
    image: fabric.swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    inStock: fabric.in_stock ?? true,
    material: (fabric as any).material || (fabric as any).composition || 'Premium Blend',
    width: (fabric as any).width || '54 inches',
    brand: (fabric as any).brand || 'Designer Collection',
    color: (fabric as any).color || (fabric as any).color_family || 'Natural',
    colorHex: fabric.color_hex || '#E5E5E5',
    category: fabric.category || 'Fabric',
    swatchPrice: fabric.swatch_price || 5.00,
    pattern: (fabric as any).pattern || 'Solid'
  }

  const handleCardClick = () => {
    router.push(`/fabric/${fabric.id}`)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    window.dispatchEvent(new CustomEvent('wishlist-updated'))
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      variantId: fabric.id,
      productId: fabric.id,
      title: fabric.name,
      variant: 'Swatch Sample',
      price: essentialFields.swatchPrice * 100,
      quantity: 1,
      thumbnail: essentialFields.image,
      type: 'swatch' as 'swatch'
    })
  }

  // List View
  if (viewMode === 'list') {
    return (
      <div
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100
                   hover:border-gray-200 transition-all duration-300 cursor-pointer overflow-hidden"
      >
        <div className="flex">
          {/* Image Section */}
          <div className="w-48 h-48 relative overflow-hidden bg-gray-100">
            {imageLoading && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
            )}
            <Image
              src={essentialFields.image}
              alt={essentialFields.name}
              fill
              sizes="192px"
              className={`object-cover transition-all duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImageLoading(false)}
              loading="lazy"
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {essentialFields.price > 150 && (
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-1
                               rounded-full text-xs font-medium shadow-sm">
                  Premium
                </span>
              )}
              {fabric.swatch_available && (
                <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                  Sample
                </span>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                  {essentialFields.category}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                  {essentialFields.name}
                </h3>
                <p className="text-sm text-gray-500">SKU: {fabric.sku}</p>
              </div>

              <button
                onClick={handleWishlistToggle}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300"
                     style={{ backgroundColor: essentialFields.colorHex }} />
                <span className="text-xs text-gray-600">{essentialFields.color}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{essentialFields.material}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Ruler className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{essentialFields.width}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">{essentialFields.pattern}</span>
              </div>
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">${essentialFields.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">per yard</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sample: ${essentialFields.swatchPrice.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCardClick()
                  }}
                  className="gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  onClick={handleQuickAdd}
                  disabled={!essentialFields.inStock}
                  className="gap-1"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add Sample
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid View (Enhanced)
  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100
                 hover:border-gray-200 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Image Container */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}

        <Image
          src={essentialFields.image}
          alt={essentialFields.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-all duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setImageLoading(false)}
          loading="lazy"
        />

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent
                        transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Quick Actions */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            <Button
              size="sm"
              onClick={handleQuickAdd}
              className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
            >
              <ShoppingBag className="w-4 h-4 mr-1" />
              Add Sample
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleCardClick()
              }}
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          <div className="flex flex-col gap-1">
            {essentialFields.price > 150 && (
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 py-1
                             rounded-full text-xs font-medium shadow-sm">
                Premium
              </span>
            )}
            {fabric.swatch_available && (
              <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                Sample Available
              </span>
            )}
          </div>

          <button
            onClick={handleWishlistToggle}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center
                       hover:bg-white transition-all shadow-sm"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Color Indicator */}
        <div className="absolute top-3 right-12">
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
            style={{ backgroundColor: essentialFields.colorHex }}
            title={essentialFields.color}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category & Name */}
        <div className="mb-3">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
            {essentialFields.category}
          </p>
          <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
            {essentialFields.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">SKU: {fabric.sku}</p>
        </div>

        {/* Key Attributes */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {essentialFields.material}
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            {essentialFields.width}
          </span>
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                         ${essentialFields.inStock
                           ? 'bg-green-100 text-green-700'
                           : 'bg-red-100 text-red-700'}`}>
            <Package className="w-3 h-3" />
            {essentialFields.inStock ? 'In Stock' : 'Out of Stock'}
          </span>
          {essentialFields.price > 100 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700
                           rounded-full text-xs font-medium">
              <TrendingUp className="w-3 h-3" />
              Popular
            </span>
          )}
        </div>

        {/* Price */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">${essentialFields.price.toFixed(2)}</span>
                <span className="text-xs text-gray-500">/yard</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Sample</p>
              <p className="text-sm font-semibold text-gray-700">${essentialFields.swatchPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}