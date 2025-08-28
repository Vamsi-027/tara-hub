'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Filter, X, Plus, Check, ShoppingBag, Search, ArrowLeft } from 'lucide-react'
import { useFabrics } from '../../hooks/useFabrics'
import type { Fabric } from '../../lib/fabric-api'
import { Pagination } from '../../components/Pagination'

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
  const categories = ['Cotton', 'Linen', 'Velvet', 'Silk', 'Wool', 'Synthetic', 'Outdoor']
  const patterns = ['Solid', 'Striped', 'Floral', 'Geometric', 'Abstract', 'Textured', 'Plaid', 'Damask']
  const usage = ['Indoor', 'Outdoor', 'Both']

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
          <h2 className="text-xl font-bold">Filters</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </button>
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
            {categories.map((category) => (
              <label key={category} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.category.includes(category)}
                  onChange={() => onFilterChange('category', category)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{category}</span>
                <span className="text-sm text-gray-500">
                  ({fabrics.filter((f: Fabric) => f.category === category).length})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Pattern */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Pattern</h3>
          <div className="space-y-2">
            {patterns.map((pattern) => (
              <label key={pattern} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.pattern.includes(pattern)}
                  onChange={() => onFilterChange('pattern', pattern)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{pattern}</span>
                <span className="text-sm text-gray-500">
                  ({fabrics.filter((f: Fabric) => f.pattern === pattern).length})
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Use</h3>
          <div className="space-y-2">
            {usage.map((use) => (
              <label key={use} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.usage.includes(use)}
                  onChange={() => onFilterChange('usage', use)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{use}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => onFilterChange('clear', '')}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </>
  )
}

// Fabric Card Component with Professional Alignment
function FabricCard({ 
  fabric, 
  isSelected,
  onToggle 
}: {
  fabric: Fabric
  isSelected: boolean
  onToggle: () => void
}) {
  const router = useRouter()
  
  // Essential field extraction with defaults
  const essentialFields = {
    // Primary fields
    name: fabric.name || 'Untitled Fabric',
    price: fabric.price || 99.00,
    image: fabric.swatch_image_url || fabric.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    inStock: fabric.in_stock ?? true,
    
    // Secondary fields
    material: fabric.material || fabric.composition || null,
    width: fabric.width || null,
    brand: fabric.brand || null,
    color: fabric.color || fabric.color_family || null,
    colorHex: fabric.color_hex || '#94a3b8',
    usage: fabric.usage || null,
    
    // Tertiary fields
    weight: fabric.weight || null,
    pattern: fabric.pattern || null,
    unit: fabric.stock_unit || 'yard'
  }

  const handleCardClick = () => {
    // Navigate to fabric details page
    router.push(`/fabric/${fabric.id}`)
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
        
        {/* Overlay gradient for better badge visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Selection Button */}
        <button
          onClick={(e) => {
            e.stopPropagation() // Prevent card click when clicking button
            onToggle()
          }}
          className={`
            absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center
            transition-all duration-200 shadow-lg z-10
            ${isSelected 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-white/95 text-gray-700 hover:bg-white border border-gray-200'
            }
          `}
          aria-label={isSelected ? 'Remove from selection' : 'Add to selection'}
        >
          {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>

        {/* Stock Status Badge */}
        {essentialFields.inStock ? (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded uppercase tracking-wide">
              IN STOCK
            </span>
          </div>
        ) : (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-1 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded uppercase tracking-wide">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Content Container - Flex grow for equal height cards */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Header Section: Brand & Name */}
        <div className="mb-3">
          {essentialFields.brand && (
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {essentialFields.brand}
            </p>
          )}
          <h3 className="font-semibold text-gray-900 text-sm leading-5 line-clamp-2 min-h-[40px] group-hover:text-blue-600 transition-colors" title={essentialFields.name}>
            {essentialFields.name}
          </h3>
        </div>

        {/* Price Section */}
        <div className="mb-3">
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-900">
              ${essentialFields.price.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 ml-1">
              per {essentialFields.unit}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-3" />

        {/* Specifications Grid - Fixed height section */}
        <div className="flex-1">
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
      </div>
    </div>
  )
}

// Search component that uses useSearchParams
function SearchComponent({ onSearch }: { onSearch: (term: string) => void }) {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  
  useEffect(() => {
    onSearch(searchTerm)
  }, [searchTerm, onSearch])
  
  return (
    <>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder="Search fabrics by name, SKU, or category..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
      />
    </>
  )
}

// Main Browse Page
export default function BrowsePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSwatches, setSelectedSwatches] = useState<string[]>([])
  const [filters, setFilters] = useState<FabricFilters>({
    colorFamily: [],
    category: [],
    pattern: [],
    usage: []
  })
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12  // 4 cards x 3 rows
  const [totalPages, setTotalPages] = useState(0)

  // Use the API hook to fetch fabrics with pagination and search
  const { fabrics, loading, error, count } = useFabrics({
    limit: pageSize,
    page: currentPage,
    search: searchTerm,
    category: filters.category[0] || undefined,
    color_family: filters.colorFamily[0] || undefined,
    pattern: filters.pattern[0] || undefined
  })

  // Calculate total pages when count changes
  useEffect(() => {
    if (count > 0) {
      setTotalPages(Math.ceil(count / pageSize))
    }
  }, [count])

  // Reset page when filters or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

  // Filter fabrics for client-side filtering on usage (since not in API)
  const filteredFabrics = fabrics.filter((fabric: Fabric) => {
    // Usage filter (client-side only)
    if (filters.usage.length > 0 && !filters.usage.includes(fabric.usage)) {
      return false
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
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: prev[key].includes(value)
          ? prev[key].filter(v => v !== value)
          : [...prev[key], value]
      }))
    }
  }

  const toggleSwatch = (fabricId: string) => {
    setSelectedSwatches(prev => {
      if (prev.includes(fabricId)) {
        return prev.filter(id => id !== fabricId)
      }
      if (prev.length >= 5) {
        alert('You can select up to 5 swatches per order')
        return prev
      }
      return [...prev, fabricId]
    })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading fabrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900">Browse Fabric Swatches</h1>
            </div>

            <Link 
              href="/checkout"
              className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden sm:inline">Swatch Box</span>
              {selectedSwatches.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {selectedSwatches.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            
            <div className="flex-1 relative">
              <Suspense fallback={<div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse" />}>
                <SearchComponent onSearch={setSearchTerm} />
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
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                {loading ? 'Loading...' : (
                  <>
                    Page {currentPage} of {totalPages} • Showing {filteredFabrics.length} of {count || 0} fabrics
                    {searchTerm && ` matching "${searchTerm}"`}
                  </>
                )}
              </p>
              {/* Optional: Add sort dropdown here */}
            </div>

            {/* Fabric Grid */}
            {filteredFabrics.length > 0 ? (
              <>
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 ${loading ? 'opacity-50' : ''} transition-opacity duration-200`}>
                  {filteredFabrics.map((fabric: Fabric) => (
                    <FabricCard
                      key={fabric.id}
                      fabric={fabric}
                      isSelected={selectedSwatches.includes(fabric.id)}
                      onToggle={() => toggleSwatch(fabric.id)}
                    />
                  ))}
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