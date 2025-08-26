'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Filter, X, Plus, Check, ShoppingBag, Search, ArrowLeft } from 'lucide-react'
import { fabricSwatches, type SwatchFabric } from '@shared/data/fabric-data'

// Get color filters with counts
const getColorFilters = () => {
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
      ? fabricSwatches.length 
      : fabricSwatches.filter((f: SwatchFabric) => f.colorFamily === color.value).length
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
  onClose 
}: {
  filters: FabricFilters
  onFilterChange: (key: FilterCategory | 'clear', value: string) => void
  isOpen: boolean
  onClose: () => void
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
            {getColorFilters().map((color) => (
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
                  ({fabricSwatches.filter((f: SwatchFabric) => f.category === category).length})
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
                  ({fabricSwatches.filter((f: SwatchFabric) => f.pattern === pattern).length})
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

// Fabric Card Component
function FabricCard({ 
  fabric, 
  isSelected,
  onToggle 
}: {
  fabric: SwatchFabric
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="aspect-square relative overflow-hidden">
        <Image
          src={fabric.swatchImageUrl}
          alt={fabric.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Add/Remove Button */}
        <button
          onClick={onToggle}
          className={`
            absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-200 shadow-lg
            ${isSelected 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>

        {/* Properties badges */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
          {fabric.properties.slice(0, 2).map((prop: string, idx: number) => (
            <span key={idx} className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-medium rounded">
              {prop}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{fabric.name}</h3>
          <p className="text-sm text-gray-500">SKU: {fabric.sku}</p>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2">{fabric.description}</p>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Width:</span>
            <span className="ml-1 font-medium">{fabric.width}</span>
          </div>
          <div>
            <span className="text-gray-500">Weight:</span>
            <span className="ml-1 font-medium">{fabric.weight}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: fabric.colorHex }}
              title={fabric.colorFamily}
            />
            <span className="text-sm text-gray-600">{fabric.colorFamily}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">{fabric.category}</span>
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
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSwatches, setSelectedSwatches] = useState<string[]>([])
  const [filters, setFilters] = useState<FabricFilters>({
    colorFamily: [],
    category: [],
    pattern: [],
    usage: []
  })

  // Filter fabrics based on search and filters
  const filteredFabrics = fabricSwatches.filter((fabric: SwatchFabric) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesSearch = 
        fabric.name.toLowerCase().includes(search) ||
        fabric.description.toLowerCase().includes(search) ||
        fabric.sku.toLowerCase().includes(search) ||
        fabric.category.toLowerCase().includes(search)
      
      if (!matchesSearch) return false
    }

    // Color filter
    if (filters.colorFamily.length > 0 && !filters.colorFamily.includes(fabric.colorFamily)) {
      return false
    }

    // Category filter
    if (filters.category.length > 0 && !filters.category.includes(fabric.category)) {
      return false
    }

    // Pattern filter
    if (filters.pattern.length > 0 && !filters.pattern.includes(fabric.pattern)) {
      return false
    }

    // Usage filter
    if (filters.usage.length > 0 && !filters.usage.includes(fabric.usage)) {
      return false
    }

    return true
  })

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
          />

          {/* Results */}
          <div className="flex-1">
            {/* Results header */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredFabrics.length} of {fabricSwatches.length} fabrics
              </p>
            </div>

            {/* Fabric Grid */}
            {filteredFabrics.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFabrics.map((fabric: SwatchFabric) => (
                  <FabricCard
                    key={fabric.id}
                    fabric={fabric}
                    isSelected={selectedSwatches.includes(fabric.id)}
                    onToggle={() => toggleSwatch(fabric.id)}
                  />
                ))}
              </div>
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