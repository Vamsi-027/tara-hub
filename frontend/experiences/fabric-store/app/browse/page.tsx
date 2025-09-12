'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Grid3X3, List } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FiltersSidebar, ActiveFiltersChips, useFilters, type FilterState } from '@/components/FiltersSidebar'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'
import type { Fabric } from '../../lib/fabric-api'
import { Pagination } from '../../components/Pagination'

// Enhanced API Hook - integrated with existing enhanced API
const useEnhancedFabrics = (filters: FilterState) => {
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [filterMetadata, setFilterMetadata] = useState<any>(null)

  // Build API query from FilterState
  const buildApiQuery = () => {
    const params = new URLSearchParams()
    
    // Basic pagination and sorting
    params.set('limit', '12')
    params.set('page', '1')
    params.set('sort_field', 'name')
    params.set('sort_direction', 'asc')
    
    // Search
    if (filters.search.trim()) {
      params.set('search', filters.search.trim())
    }
    
    // Categories -> category (single value for API)
    if (filters.categories.length > 0) {
      params.set('category', filters.categories[0]) // Take first category
    }
    
    // Colors -> color_family
    if (filters.colors.length > 0) {
      params.set('color_family', filters.colors.join(','))
    }
    
    // Materials -> composition
    if (filters.materials.length > 0) {
      params.set('composition', filters.materials.join(','))
    }
    
    // Patterns -> pattern
    if (filters.patterns.length > 0) {
      params.set('pattern', filters.patterns.join(','))
    }
    
    // Price range
    if (filters.priceRange[0] > 0) {
      params.set('swatch_price_min', filters.priceRange[0].toString())
    }
    if (filters.priceRange[1] < 500) {
      params.set('swatch_price_max', filters.priceRange[1].toString())
    }
    
    // Availability
    if (filters.availability.includes('in-stock')) {
      params.set('in_stock', 'true')
    }
    if (filters.availability.includes('swatch-available')) {
      params.set('swatch_available', 'true')
    }
    
    return params.toString()
  }

  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        setLoading(true)
        const apiQuery = buildApiQuery()
        const response = await fetch(`/api/fabrics?${apiQuery}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || `HTTP ${response.status}`)
        }
        
        const data = await response.json()
        
        // Enhanced API structure: { fabrics: [], pagination: {}, filterMetadata: {}, meta: {} }
        setFabrics(data.fabrics || [])
        setPagination(data.pagination || {})
        setFilterMetadata(data.filterMetadata || {})
        setError(null)
      } catch (err) {
        console.error('Error fetching fabrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch fabrics')
      } finally {
        setLoading(false)
      }
    }

    fetchFabrics()
  }, [filters]) // Re-fetch when filters change

  return { fabrics, loading, error, pagination, filterMetadata }
}

// Updated Fabric Card Component
const FabricCard: React.FC<{ fabric: Fabric; viewMode: 'grid' | 'list' }> = ({ fabric, viewMode }) => {
  const router = useRouter()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Essential field extraction with defaults
  const essentialFields = {
    name: fabric.name || 'Untitled Fabric',
    price: fabric.price || 99.00,
    image: fabric.swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    inStock: fabric.in_stock ?? true,
    material: (fabric as any).material || (fabric as any).composition || null,
    width: (fabric as any).width || null,
    brand: (fabric as any).brand || null,
    color: (fabric as any).color || (fabric as any).color_family || null,
    colorHex: fabric.color_hex || '#E5E5E5',
    category: fabric.category || 'Fabric',
    swatchPrice: fabric.swatch_price || 5.00
  }

  // Check wishlist status
  useEffect(() => {
    const wishlist = localStorage.getItem('fabric-wishlist')
    if (wishlist) {
      const wishlistItems = JSON.parse(wishlist)
      setIsWishlisted(wishlistItems.includes(fabric.id))
    }
  }, [fabric.id])

  const handleCardClick = () => {
    router.push(`/fabric/${fabric.id}`)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const wishlist = localStorage.getItem('fabric-wishlist')
    const wishlistItems = wishlist ? JSON.parse(wishlist) : []
    
    if (isWishlisted) {
      const updatedWishlist = wishlistItems.filter((id: string) => id !== fabric.id)
      localStorage.setItem('fabric-wishlist', JSON.stringify(updatedWishlist))
      setIsWishlisted(false)
    } else {
      const updatedWishlist = [...wishlistItems, fabric.id]
      localStorage.setItem('fabric-wishlist', JSON.stringify(updatedWishlist))
      setIsWishlisted(true)
    }
    
    window.dispatchEvent(new CustomEvent('wishlist-updated'))
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    const cartItem = {
      id: `swatch-${fabric.id}-${Date.now()}`,
      variantId: fabric.id,
      productId: fabric.id,
      title: fabric.name,
      variant: 'Swatch Sample',
      price: essentialFields.swatchPrice * 100,
      quantity: 1,
      thumbnail: essentialFields.image,
      type: 'swatch'
    }

    const existingCart = localStorage.getItem('fabric-cart')
    const cart = existingCart ? JSON.parse(existingCart) : []
    const updatedCart = [...cart, cartItem]
    
    localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }))
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleCardClick}
        className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 p-6 cursor-pointer"
      >
        <div className="flex gap-6">
          <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
            {imageLoading && (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
            )}
            <img
              src={essentialFields.image}
              alt={essentialFields.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">{essentialFields.name}</h3>
                <p className="text-sm text-gray-500">{fabric.sku}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${essentialFields.price.toFixed(2)}</div>
                <div className="text-sm text-gray-500">per yard</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: essentialFields.colorHex }}
                />
                {essentialFields.color}
              </span>
              <span>{essentialFields.material}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                essentialFields.inStock 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {essentialFields.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{fabric.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Swatch: ${essentialFields.swatchPrice.toFixed(2)}
              </div>
              <Button size="sm" className="rounded-full" onClick={handleQuickAdd}>
                Add Swatch
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className="aspect-square overflow-hidden bg-gray-100 relative">
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}
        <img
          src={essentialFields.image}
          alt={essentialFields.name}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
        />
        
        {essentialFields.price > 150 && (
          <div className="absolute top-3 left-3">
            <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Premium
            </div>
          </div>
        )}
        
        <div className="absolute top-3 right-3">
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: essentialFields.colorHex }}
            title={essentialFields.color}
          />
        </div>
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Button size="sm" className="w-full rounded-full" onClick={handleQuickAdd}>
              Add Swatch
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
            {essentialFields.name}
          </h3>
          <p className="text-sm text-gray-500">{fabric.sku}</p>
        </div>
        
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          {essentialFields.material && (
            <div className="flex items-center justify-between">
              <span>Material:</span>
              <span className="font-medium">{essentialFields.material}</span>
            </div>
          )}
          {essentialFields.width && (
            <div className="flex items-center justify-between">
              <span>Width:</span>
              <span className="font-medium">{essentialFields.width}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <span className={`font-medium ${
              essentialFields.inStock ? 'text-green-600' : 'text-red-600'
            }`}>
              {essentialFields.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              ${essentialFields.price.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">per yard</div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Swatch</div>
            <div className="text-lg font-semibold text-gray-900">
              ${essentialFields.swatchPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main Browse Page Component
const BrowsePage: React.FC = () => {
  const { filters, setFilters } = useFilters()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { fabrics, loading, error, pagination } = useEnhancedFabrics(filters)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-yellow-400 font-medium uppercase tracking-wide text-sm">
                Curated Collection
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              Discover Premium Fabrics
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Explore our meticulously curated selection of premium textiles, 
              each piece chosen for its exceptional quality and timeless elegance.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Modern Filters Sidebar */}
          <FiltersSidebar filters={filters} onFiltersChange={setFilters} />

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Active Filters Chips */}
            <ActiveFiltersChips filters={filters} onFiltersChange={setFilters} />

            {/* Results Header */}
            <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-2xl border border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  <span className="font-semibold text-gray-900">{pagination?.totalCount || fabrics.length}</span> 
                  {' '}fabrics found
                </span>
                {loading && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'shadow-sm' : ''}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'shadow-sm' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Mobile Filter Button - handled by FiltersSidebar */}
                <div className="lg:hidden">
                  <FiltersSidebar filters={filters} onFiltersChange={setFilters} />
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'space-y-6'
              }`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="aspect-square bg-gray-100 animate-pulse" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-2xl border border-gray-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Grid3X3 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Error loading fabrics
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Retry
                </Button>
              </motion.div>
            ) : fabrics.length > 0 ? (
              <>
                <div className={`${
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'
                    : 'space-y-6'
                }`}>
                  {fabrics.map((fabric: Fabric, index) => (
                    <motion.div
                      key={fabric.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <FabricCard fabric={fabric} viewMode={viewMode} />
                    </motion.div>
                  ))}
                </div>
                
                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={(page) => {
                        // Handle pagination - would need to integrate with filters
                      }}
                      isLoading={loading}
                    />
                  </div>
                )}
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-2xl border border-gray-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Grid3X3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No fabrics found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button 
                  onClick={() => setFilters({ 
                    search: '', colors: [], materials: [], patterns: [], categories: [], 
                    priceRange: [0, 500], availability: [] 
                  })}
                  variant="outline"
                >
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap with Suspense for better loading
const BrowsePageWithSuspense: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-400 border-t-blue-600 
                        rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading fabrics...</p>
        </div>
      </div>
    }>
      <BrowsePage />
    </Suspense>
  )
}

export default BrowsePageWithSuspense