'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Filter, X, Plus, Check, ShoppingBag, Search, Heart, ShoppingCart, Star, Zap, TrendingUp, DollarSign, ChevronDown, ArrowUpDown } from 'lucide-react'
import { useFabrics } from '../../hooks/useFabrics'
import type { Fabric } from '../../lib/fabric-api'
import { Pagination } from '../../components/Pagination'
import Header from '../../components/header'

// Quick Filters Component
function QuickFilters({ onFilterApply, fabrics }: { onFilterApply: (filter: any) => void, fabrics: Fabric[] }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onFilterApply({ type: 'quickFilter', filter: 'popular' })}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors text-sm"
      >
        <TrendingUp className="w-3 h-3" />
        Popular
      </button>
      <button
        onClick={() => onFilterApply({ type: 'quickFilter', filter: 'new' })}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200 hover:bg-green-100 transition-colors text-sm"
      >
        <Zap className="w-3 h-3" />
        New Arrivals
      </button>
      <button
        onClick={() => onFilterApply({ type: 'quickFilter', filter: 'premium' })}
        className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full border border-purple-200 hover:bg-purple-100 transition-colors text-sm"
      >
        <Star className="w-3 h-3" />
        Premium
      </button>
      <button
        onClick={() => onFilterApply({ type: 'quickFilter', filter: 'budget' })}
        className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors text-sm"
      >
        <DollarSign className="w-3 h-3" />
        Budget Friendly
      </button>
      <button
        onClick={() => onFilterApply({ type: 'priceRange', min: 0, max: 50 })}
        className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors text-sm"
      >
        Under $50
      </button>
      <button
        onClick={() => onFilterApply({ type: 'priceRange', min: 50, max: 100 })}
        className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors text-sm"
      >
        $50 - $100
      </button>
    </div>
  )
}

// Get color filters with counts
const getColorFilters = (fabrics: Fabric[] = []) => {
  const colors = [
    { name: 'All', value: 'all', hex: '#f3f4f6' },
    { name: 'Blue', value: 'Blue', hex: '#3b82f6' },
    { name: 'Green', value: 'Green', hex: '#22c55e' },
    { name: 'Neutral', value: 'Neutral', hex: '#d4d4d8' },
    { name: 'Pink', value: 'Pink', hex: '#ec4899' },
    { name: 'Orange', value: 'Orange', hex: '#fb923c' },
    { name: 'Gray', value: 'Gray', hex: '#6b7280' }
  ]
  
  return colors.map(color => ({
    ...color,
    count: color.value === 'all' 
      ? fabrics.length 
      : fabrics.filter((f: Fabric) => (f.color_family || f.color) === color.value).length
  }))
}


interface FabricFilters {
  colorFamily: string[]
  category: string[]
  pattern: string[]
  usage: string[]
}

type FilterCategory = 'colorFamily' | 'category' | 'pattern' | 'usage'

// Filter Sidebar Component
function FilterSidebar({ 
  filters, 
  onFilterChange,
  isOpen,
  onClose,
  fabrics 
}: {
  filters: FabricFilters
  onFilterChange: (key: FilterCategory | 'clear', value: string) => void
  isOpen: boolean
  onClose: () => void
  fabrics: Fabric[]
}) {
  // Generate dynamic filter options with counts from actual data
  const getCategoryOptions = () => {
    const categoryCount = new Map<string, number>()
    fabrics.forEach(fabric => {
      const category = fabric.category || 'Uncategorized'
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1)
    })
    return Array.from(categoryCount.entries())
      .sort(([, a], [, b]) => b - a) // Sort by count descending
      .map(([category, count]) => ({ name: category, count }))
  }

  const getPatternOptions = () => {
    const patternCount = new Map<string, number>()
    fabrics.forEach(fabric => {
      const pattern = fabric.pattern || 'Unknown'
      patternCount.set(pattern, (patternCount.get(pattern) || 0) + 1)
    })
    return Array.from(patternCount.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([pattern, count]) => ({ name: pattern, count }))
  }

  const getUsageOptions = () => {
    const usageCount = new Map<string, number>()
    fabrics.forEach(fabric => {
      const usage = fabric.usage || 'Unknown'
      usageCount.set(usage, (usageCount.get(usage) || 0) + 1)
    })
    return Array.from(usageCount.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([usage, count]) => ({ name: usage, count }))
  }

  const categoryOptions = getCategoryOptions()
  const patternOptions = getPatternOptions()
  const usageOptions = getUsageOptions()
  
  // Count active filters
  const activeFilterCount = Object.values(filters).reduce((count, filterArray) => 
    count + (Array.isArray(filterArray) ? filterArray.length : 0), 0
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static top-0 left-0 h-full lg:h-auto w-80 lg:w-64 bg-white z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r border-gray-200 p-6 overflow-y-auto
      `}>
        {/* Mobile Header */}
        <div className="flex justify-between items-center mb-6 lg:hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Filters</h2>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>

        {/* Color Families */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Color Family</h3>
          <div className="grid grid-cols-4 gap-3">
            {getColorFilters(fabrics).map((color) => (
              <button
                key={color.name}
                onClick={() => onFilterChange('colorFamily', color.name)}
                className={`
                  w-12 h-12 rounded-full border-2 transition-all relative
                  ${filters.colorFamily.includes(color.name) 
                    ? 'border-gray-800 scale-110' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
                style={{ backgroundColor: color.hex }}
                title={`${color.name} (${color.count})`}
              >
                {filters.colorFamily.includes(color.name) && (
                  <Check className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Fabric Type */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Fabric Type</h3>
          <div className="space-y-2">
            {categoryOptions.map(({ name: category, count }) => (
              <label key={category} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={filters.category.includes(category)}
                  onChange={() => onFilterChange('category', category)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700 flex-1">{category}</span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Pattern */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Pattern</h3>
          <div className="space-y-2">
            {patternOptions.map(({ name: pattern, count }) => (
              <label key={pattern} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={filters.pattern.includes(pattern)}
                  onChange={() => onFilterChange('pattern', pattern)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700 flex-1">{pattern}</span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Use</h3>
          <div className="space-y-2">
            {usageOptions.map(({ name: use, count }) => (
              <label key={use} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={filters.usage.includes(use)}
                  onChange={() => onFilterChange('usage', use)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700 flex-1">{use}</span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => onFilterChange('clear', '')}
            className="w-full py-3 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Clear All Filters ({activeFilterCount})
          </button>
        )}
      </div>
    </>
  )
}

// Fabric Card Component with Professional Alignment
function FabricCard({ 
  fabric
}: {
  fabric: Fabric
}) {
  const router = useRouter()
  const [yards, setYards] = useState(0.5)
  const [orderType, setOrderType] = useState<'swatch' | 'fabric'>('swatch')
  const [isWishlisted, setIsWishlisted] = useState(false)
  
  // Check if item is wishlisted on mount
  useEffect(() => {
    const wishlist = localStorage.getItem('fabric-wishlist')
    if (wishlist) {
      const wishlistItems = JSON.parse(wishlist)
      setIsWishlisted(wishlistItems.includes(fabric.id))
    }
  }, [])
  
  // Essential field extraction with defaults
  const essentialFields = {
    // Primary fields
    name: fabric.name || 'Untitled Fabric',
    price: fabric.price || 99.00,
    image: fabric.swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    inStock: fabric.in_stock ?? true,
    
    // Secondary fields
    material: (fabric as any).material || (fabric as any).composition || null,
    width: (fabric as any).width || null,
    brand: (fabric as any).brand || null,
    color: (fabric as any).color || (fabric as any).color_family || null,
    colorHex: fabric.color_hex || '#94a3b8',
    usage: fabric.usage || null,
    
    // Tertiary fields
    weight: (fabric as any).weight || null,
    pattern: (fabric as any).pattern || null,
    unit: (fabric as any).stock_unit || 'yard'
  }

  const handleCardClick = () => {
    // Navigate to fabric details page
    router.push(`/fabric/${fabric.id}`)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wishlist = localStorage.getItem('fabric-wishlist')
    const wishlistItems = wishlist ? JSON.parse(wishlist) : []
    
    if (isWishlisted) {
      // Remove from wishlist
      const updatedWishlist = wishlistItems.filter((id: string) => id !== fabric.id)
      localStorage.setItem('fabric-wishlist', JSON.stringify(updatedWishlist))
      setIsWishlisted(false)
    } else {
      // Add to wishlist
      const updatedWishlist = [...wishlistItems, fabric.id]
      localStorage.setItem('fabric-wishlist', JSON.stringify(updatedWishlist))
      setIsWishlisted(true)
    }
    
    // Dispatch event for wishlist updates
    window.dispatchEvent(new CustomEvent('wishlist-updated'))
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Create cart item based on order type
    const cartItem = orderType === 'swatch' ? {
      id: `swatch-${fabric.id}-${Date.now()}`,
      variantId: fabric.id,
      productId: fabric.id,
      title: fabric.name,
      variant: 'Swatch Sample',
      price: (fabric.swatch_price || 5) * 100, // Convert to cents
      quantity: 1,
      thumbnail: essentialFields.image,
      type: 'swatch'
    } : {
      id: `fabric-${fabric.id}-${Date.now()}`,
      variantId: fabric.id,
      productId: fabric.id,
      title: fabric.name,
      variant: `${yards} yard${yards !== 1 ? 's' : ''}`,
      price: essentialFields.price * 100 * yards, // Convert to cents
      quantity: yards,
      thumbnail: essentialFields.image,
      type: 'fabric'
    }

    // Get existing cart from localStorage
    const existingCart = localStorage.getItem('fabric-cart')
    const cart = existingCart ? JSON.parse(existingCart) : []
    
    // Check for duplicates
    const existingItem = cart.find((item: any) => 
      item.productId === fabric.id && item.type === orderType
    )
    if (existingItem) {
      // Item already exists in cart, skip adding duplicate
      return
    }
    
    // Add new item to cart
    const updatedCart = [...cart, cartItem]
    
    // Save to localStorage
    localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
    
    // Dispatch custom event for cart update
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }))
    
    // Success - item added to cart (no popup needed)
  }
  
  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-2xl hover:scale-[1.03] hover:border-gray-300 transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col h-full"
    >
      {/* Image Container with Fixed Aspect Ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Image
          src={essentialFields.image}
          alt={essentialFields.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        

        {/* Wishlist Heart - Top Right */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full backdrop-blur-sm border transition-all ${
            isWishlisted 
              ? 'bg-red-50 border-red-300 text-red-600' 
              : 'bg-white/80 border-gray-300 text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 mx-auto ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Stock Status Badge - Show both swatch and fabric availability */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {fabric.swatch_in_stock && (
            <span className="inline-flex items-center px-2 py-1 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded uppercase tracking-wide">
              SWATCH
            </span>
          )}
          {essentialFields.inStock ? (
            <span className="inline-flex items-center px-2 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded uppercase tracking-wide">
              FABRIC
            </span>
          ) : !fabric.swatch_in_stock && (
            <span className="inline-flex items-center px-2 py-1 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded uppercase tracking-wide">
              OUT OF STOCK
            </span>
          )}
        </div>
      </div>

      {/* Content Container - Flex grow for equal height cards */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Header Section: Brand & Name */}
        <div className="mb-4">
          {essentialFields.brand && (
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {essentialFields.brand}
            </p>
          )}
          <h3 className="font-semibold text-gray-900 text-sm leading-5 line-clamp-2 min-h-[40px] group-hover:text-blue-600 transition-colors" title={essentialFields.name}>
            {essentialFields.name}
          </h3>
        </div>

        {/* Price Section - Show both swatch and fabric prices */}
        <div className="mb-3">
          <div className="flex flex-col gap-1">
            {/* Fabric Price */}
            <div className="flex items-end">
              <span className="text-2xl font-bold text-gray-900">
                ${essentialFields.price.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                per {essentialFields.unit}
              </span>
            </div>
            {/* Swatch Price if available */}
            {fabric.swatch_price && (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                  Swatch Available
                </span>
                <span className="text-sm text-gray-600">
                  ${fabric.swatch_price.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-3" />

        {/* Specifications Grid */}
        <div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {essentialFields.material && (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Material</span>
                <span className="text-xs text-gray-900 font-medium truncate" title={essentialFields.material}>
                  {essentialFields.material}
                </span>
              </div>
            )}
            {essentialFields.width && (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Width</span>
                <span className="text-xs text-gray-900 font-medium">
                  {essentialFields.width}
                </span>
              </div>
            )}
            {essentialFields.color && (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Color</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span 
                    className="w-3 h-3 rounded-full border border-gray-300 shadow-sm" 
                    style={{ backgroundColor: essentialFields.colorHex }}
                  />
                  <span className="text-xs text-gray-900 font-medium truncate">
                    {essentialFields.color}
                  </span>
                </div>
              </div>
            )}
            {essentialFields.usage && (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Usage</span>
                <span className="text-xs text-gray-900 font-medium">
                  {essentialFields.usage}
                </span>
              </div>
            )}
            {essentialFields.weight && (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Weight</span>
                <span className="text-xs text-gray-900 font-medium">
                  {essentialFields.weight}
                </span>
              </div>
            )}
            {essentialFields.pattern && (
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Pattern</span>
                <span className="text-xs text-gray-900 font-medium">
                  {essentialFields.pattern}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
          {/* Order Type Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Order Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOrderType('swatch')
                }}
                className={`px-3 py-3 text-sm font-medium rounded-lg border transition-all ${
                  orderType === 'swatch'
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <div className="text-center leading-tight">
                  <div className="font-semibold">Swatch</div>
                  <div className="text-xs opacity-75 mt-1">${(fabric.swatch_price || 5).toFixed(2)}</div>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setOrderType('fabric')
                }}
                className={`px-3 py-3 text-sm font-medium rounded-lg border transition-all ${
                  orderType === 'fabric'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <div className="text-center leading-tight">
                  <div className="font-semibold">Fabric</div>
                  <div className="text-xs opacity-75 mt-1">${essentialFields.price.toFixed(2)}/yard</div>
                </div>
              </button>
            </div>
          </div>
          
          {/* Yards Input - Only show for fabric orders */}
          {orderType === 'fabric' && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">Quantity (Yards)</label>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setYards(Math.max(0.5, Math.round((yards - 0.5) * 2) / 2))
                  }}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors border border-gray-300"
                >
                  −
                </button>
                <div className="flex-1 max-w-16">
                  <input
                    type="number"
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={yards}
                    onChange={(e) => {
                      e.stopPropagation()
                      const value = parseFloat(e.target.value) || 0.5
                      setYards(Math.max(0.5, Math.min(100, value)))
                    }}
                    className="w-full h-8 text-center text-sm font-semibold border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setYards(Math.min(100, Math.round((yards + 0.5) * 2) / 2))
                  }}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors border border-gray-300"
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          {/* Single Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className={`w-full px-4 py-3 text-white font-semibold rounded-lg shadow-sm transition-all hover:shadow-md ${
              orderType === 'swatch'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
              <span className="font-bold">
                ${orderType === 'swatch' 
                  ? (fabric.swatch_price || 5).toFixed(2)
                  : (essentialFields.price * yards).toFixed(2)
                }
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// Sort Dropdown Component
function SortDropdown({ 
  sortField, 
  sortDirection, 
  onSortChange 
}: {
  sortField: 'name' | 'price' | 'created_at' | 'category'
  sortDirection: 'asc' | 'desc'
  onSortChange: (field: 'name' | 'price' | 'created_at' | 'category', direction: 'asc' | 'desc') => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const sortOptions = [
    { field: 'name' as const, direction: 'asc' as const, label: 'Name A-Z' },
    { field: 'name' as const, direction: 'desc' as const, label: 'Name Z-A' },
    { field: 'price' as const, direction: 'asc' as const, label: 'Price Low to High' },
    { field: 'price' as const, direction: 'desc' as const, label: 'Price High to Low' },
    { field: 'created_at' as const, direction: 'desc' as const, label: 'Newest First' },
    { field: 'created_at' as const, direction: 'asc' as const, label: 'Oldest First' },
    { field: 'category' as const, direction: 'asc' as const, label: 'Category A-Z' }
  ]
  
  const currentOption = sortOptions.find(option => 
    option.field === sortField && option.direction === sortDirection
  ) || sortOptions[0]
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>Sort: {currentOption.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {sortOptions.map((option, index) => (
              <button
                key={`${option.field}-${option.direction}`}
                onClick={() => {
                  onSortChange(option.field, option.direction)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm first:rounded-t-lg last:rounded-b-lg ${
                  option.field === sortField && option.direction === sortDirection
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Enhanced Search component with autocomplete
function SearchComponent({ onSearch, fabrics, value, isSearching }: { onSearch: (term: string) => void, fabrics: Fabric[], value: string, isSearching?: boolean }) {
  const [suggestions, setSuggestions] = useState<{ text: string, type: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  // Generate search suggestions with categories
  useEffect(() => {
    if (value.length > 1 && fabrics.length > 0) {
      const suggestionMap = new Map<string, { text: string, type: string }>()
      const searchLower = value.toLowerCase()
      
      fabrics.forEach(fabric => {
        // Add fabric names
        if (fabric.name.toLowerCase().includes(searchLower) && !suggestionMap.has(fabric.name)) {
          suggestionMap.set(fabric.name, { text: fabric.name, type: 'Product' })
        }
        
        // Add categories
        if (fabric.category?.toLowerCase().includes(searchLower) && !suggestionMap.has(fabric.category)) {
          suggestionMap.set(fabric.category, { text: fabric.category, type: 'Category' })
        }
        
        // Add colors
        if (fabric.color?.toLowerCase().includes(searchLower) && !suggestionMap.has(fabric.color)) {
          suggestionMap.set(fabric.color, { text: fabric.color, type: 'Color' })
        }
        
        // Add collections
        if ((fabric as any).collection?.toLowerCase().includes(searchLower) && !suggestionMap.has((fabric as any).collection)) {
          suggestionMap.set((fabric as any).collection, { text: (fabric as any).collection, type: 'Collection' })
        }
        
        // Add patterns
        if (fabric.pattern?.toLowerCase().includes(searchLower) && !suggestionMap.has(fabric.pattern)) {
          suggestionMap.set(fabric.pattern, { text: fabric.pattern, type: 'Pattern' })
        }
        
        // Add composition keywords
        if (fabric.composition?.toLowerCase().includes(searchLower)) {
          const compositions = fabric.composition.split(/[,\s]+/).filter(c => c.toLowerCase().includes(searchLower))
          compositions.forEach(comp => {
            if (!suggestionMap.has(comp)) {
              suggestionMap.set(comp, { text: comp, type: 'Material' })
            }
          })
        }
      })
      
      setSuggestions(Array.from(suggestionMap.values()).slice(0, 8))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [value, fabrics])
  
  return (
    <div className="relative">
      {isSearching ? (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      )}
      <input
        type="text"
        placeholder="Search fabrics by name, brand, material, or category..."
        value={value}
        onChange={handleSearchChange}
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="w-full h-[42px] pl-10 pr-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
      />
      
      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
              onMouseDown={() => {
                onSearch(suggestion.text)
                setShowSuggestions(false)
              }}
            >
              <span className="text-gray-900">{suggestion.text}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {suggestion.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Main Browse Page
export default function BrowsePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FabricFilters>({
    colorFamily: [],
    category: [],
    pattern: [],
    usage: []
  })
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState<{ min: number, max: number } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12  // 4 cards x 3 rows
  const [totalPages, setTotalPages] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'price' | 'created_at' | 'category'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true) // Show searching indicator
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false) // Hide searching indicator
    }, 700) // Wait 700ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Use the API hook to fetch fabrics with pagination and search
  const { fabrics, loading, error, count } = useFabrics({
    limit: pageSize,
    page: currentPage,
    search: debouncedSearchTerm, // Use debounced term here
    category: filters.category[0] || undefined,
    color_family: filters.colorFamily[0] || undefined,
    pattern: filters.pattern[0] || undefined,
    usage: filters.usage[0] || undefined,
    sort_field: sortField,
    sort_direction: sortDirection
  })

  // Calculate total pages when count changes
  useEffect(() => {
    if (count > 0) {
      setTotalPages(Math.ceil(count / pageSize))
    }
  }, [count])

  // Reset page when filters, search, or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, filters, sortField, sortDirection])

  // Handle sort changes
  const handleSortChange = (field: 'name' | 'price' | 'created_at' | 'category', direction: 'asc' | 'desc') => {
    setSortField(field)
    setSortDirection(direction)
  }

  // Handle quick filters
  const handleQuickFilter = (filterData: any) => {
    if (filterData.type === 'quickFilter') {
      setActiveQuickFilter(filterData.filter)
      setPriceRange(null)
    } else if (filterData.type === 'priceRange') {
      setPriceRange({ min: filterData.min, max: filterData.max })
      setActiveQuickFilter(null)
    }
  }

  // Filter fabrics for client-side filtering
  const filteredFabrics = fabrics.filter((fabric: Fabric) => {
    // Usage filter (client-side only)
    if (filters.usage.length > 0 && !filters.usage.includes(fabric.usage)) {
      return false
    }
    
    // Quick filters
    if (activeQuickFilter) {
      switch (activeQuickFilter) {
        case 'popular':
          return (fabric as any).is_featured || false
        case 'new':
          return fabric.created_at && new Date(fabric.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        case 'premium':
          return (fabric.price || 0) > 100
        case 'budget':
          return (fabric.price || 0) <= 50
        default:
          break
      }
    }
    
    // Price range filter
    if (priceRange) {
      const price = fabric.price || 0
      if (price < priceRange.min || price > priceRange.max) {
        return false
      }
    }
    
    return true
  })

  // Handle page change with scroll to top
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of results
    const resultsElement = document.getElementById('fabric-results')
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFilterChange = (key: FilterCategory | 'clear', value: string) => {
    if (key === 'clear') {
      setFilters({
        colorFamily: [],
        category: [],
        pattern: [],
        usage: []
      })
      setActiveQuickFilter(null)
      setPriceRange(null)
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: prev[key].includes(value)
          ? prev[key].filter(v => v !== value)
          : [...prev[key], value]
      }))
    }
  }

  // Count active filters for mobile button
  const activeFilterCount = Object.values(filters).reduce((count, filterArray) => 
    count + (Array.isArray(filterArray) ? filterArray.length : 0), 0
  ) + (activeQuickFilter ? 1 : 0) + (priceRange ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[42px] relative"
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            <div className="flex-1 max-w-2xl">
              <Suspense fallback={<div className="w-full h-[42px] bg-gray-100 rounded-lg animate-pulse" />}>
                <SearchComponent 
                  onSearch={setSearchTerm} 
                  fabrics={fabrics} 
                  value={searchTerm}
                  isSearching={isSearching}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            fabrics={fabrics}
          />

          {/* Results */}
          <div id="fabric-results" className="flex-1">
            {/* Results header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <p className="text-gray-600">
                <>
                  Page {currentPage} of {totalPages} • Showing {filteredFabrics.length} of {count || 0} fabrics
                  {searchTerm && ` matching "${searchTerm}"`}
                </>
              </p>
              
              {/* Sort Dropdown */}
              <SortDropdown
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
              />
            </div>

            {/* Quick Filters */}
            <QuickFilters onFilterApply={handleQuickFilter} fabrics={fabrics} />

            {/* Fabric Grid */}
            {filteredFabrics.length > 0 ? (
              <>
                <div className="relative">
                  {/* Loading overlay - shows on top of existing content */}
                  {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                      <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-700 font-medium">Updating results...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFabrics.map((fabric: Fabric) => (
                      <FabricCard key={fabric.id} fabric={fabric} />
                    ))}
                  </div>
                </div>
                
                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  isLoading={loading}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No fabrics match your search criteria.</p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    handleFilterChange('clear', '')
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters and search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}