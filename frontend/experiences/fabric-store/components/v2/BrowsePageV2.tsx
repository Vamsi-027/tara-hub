'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import { Breadcrumb } from './ui/Breadcrumb'
import { ProductCardV2 } from './ProductCardV2'
import { FiltersV2 } from './FiltersV2'
import { SearchBar } from './SearchBar'
import { SortDropdown } from './SortDropdown'
import { LoadMoreButton } from './LoadMoreButton'
import { CategoryHierarchy } from './CategoryHierarchy'
import { ShopByStyle } from './ShopByStyle'
import { ShopByCollection } from './ShopByCollection'
import { Grid3X3, List, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Fabric } from '../../lib/fabric-api'

// Filter State Type
export interface FilterStateV2 {
  search: string
  categories: string[]
  subcategories: string[]
  colors: string[]
  materials: string[]
  patterns: string[]
  styles: string[]
  collections: string[]
  priceRange: [number, number]
  availability: string[]
  sortBy: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'popular'
}

const BrowsePageV2: React.FC = () => {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(true)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [filters, setFilters] = useState<FilterStateV2>({
    search: '',
    categories: [],
    subcategories: [],
    colors: [],
    materials: [],
    patterns: [],
    styles: [],
    collections: [],
    priceRange: [0, 1000],
    availability: [],
    sortBy: 'newest'
  })

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Shop', href: '/browse-v2' },
    ...(filters.categories.length > 0
      ? [{ label: filters.categories[0], href: `/browse-v2?category=${filters.categories[0]}` }]
      : []),
    ...(filters.subcategories.length > 0
      ? [{ label: filters.subcategories[0] }]
      : [])
  ]

  // Build API query
  const buildApiQuery = (pageNum: number) => {
    const params = new URLSearchParams()

    params.set('limit', '12')
    params.set('page', pageNum.toString())

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        params.set('sort_field', 'price')
        params.set('sort_direction', 'asc')
        break
      case 'price_desc':
        params.set('sort_field', 'price')
        params.set('sort_direction', 'desc')
        break
      case 'newest':
        params.set('sort_field', 'created_at')
        params.set('sort_direction', 'desc')
        break
      case 'popular':
        params.set('sort_field', 'popularity')
        params.set('sort_direction', 'desc')
        break
      default:
        params.set('sort_field', 'name')
        params.set('sort_direction', 'asc')
    }

    // Filters
    if (filters.search.trim()) {
      params.set('search', filters.search.trim())
    }
    if (filters.categories.length > 0) {
      params.set('category', filters.categories.join(','))
    }
    if (filters.colors.length > 0) {
      params.set('color_family', filters.colors.join(','))
    }
    if (filters.materials.length > 0) {
      params.set('composition', filters.materials.join(','))
    }
    if (filters.patterns.length > 0) {
      params.set('pattern', filters.patterns.join(','))
    }
    if (filters.priceRange[0] > 0) {
      params.set('swatch_price_min', filters.priceRange[0].toString())
    }
    if (filters.priceRange[1] < 1000) {
      params.set('swatch_price_max', filters.priceRange[1].toString())
    }
    if (filters.availability.includes('in-stock')) {
      params.set('in_stock', 'true')
    }
    if (filters.availability.includes('swatch-available')) {
      params.set('swatch_available', 'true')
    }

    return params.toString()
  }

  // Fetch fabrics
  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        setLoading(true)
        const apiQuery = buildApiQuery(1)
        const response = await fetch(`/api/fabrics?${apiQuery}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        setFabrics(data.fabrics || [])
        setTotalCount(data.pagination?.totalCount || data.fabrics?.length || 0)
        setHasMore((data.pagination?.totalPages || 1) > 1)
        setPage(1)
        setError(null)
      } catch (err) {
        console.error('Error fetching fabrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch fabrics')
      } finally {
        setLoading(false)
      }
    }

    fetchFabrics()
  }, [filters])

  // Load more fabrics
  const loadMore = async () => {
    if (!hasMore || loading) return

    try {
      setLoading(true)
      const nextPage = page + 1
      const apiQuery = buildApiQuery(nextPage)
      const response = await fetch(`/api/fabrics?${apiQuery}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setFabrics(prev => [...prev, ...(data.fabrics || [])])
      setPage(nextPage)
      setHasMore(nextPage < (data.pagination?.totalPages || 1))
    } catch (err) {
      console.error('Error loading more fabrics:', err)
    } finally {
      setLoading(false)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      subcategories: [],
      colors: [],
      materials: [],
      patterns: [],
      styles: [],
      collections: [],
      priceRange: [0, 1000],
      availability: [],
      sortBy: 'newest'
    })
  }

  // Count active filters
  const activeFilterCount = [
    filters.categories,
    filters.subcategories,
    filters.colors,
    filters.materials,
    filters.patterns,
    filters.styles,
    filters.collections,
    filters.availability
  ].reduce((acc, arr) => acc + arr.length, 0) +
  (filters.search ? 1 : 0) +
  (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000 ? 1 : 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Enhanced Hero Section with Breadcrumb */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 text-white pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} className="mb-6 opacity-80" />

          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-light mb-4 tracking-tight">
              Premium Fabric Collection
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover our curated selection of luxury textiles, perfect for your next project
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              value={filters.search}
              onChange={(search) => setFilters(prev => ({ ...prev, search }))}
              placeholder="Search fabrics by name, color, or material..."
            />
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <CategoryHierarchy
        selectedCategories={filters.categories}
        selectedSubcategories={filters.subcategories}
        onCategoryChange={(categories, subcategories) =>
          setFilters(prev => ({ ...prev, categories, subcategories }))
        }
      />

      {/* Shop By Style & Collection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ShopByStyle
            selectedStyles={filters.styles}
            onStyleChange={(styles) => setFilters(prev => ({ ...prev, styles }))}
          />
          <ShopByCollection
            selectedCollections={filters.collections}
            onCollectionChange={(collections) => setFilters(prev => ({ ...prev, collections }))}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">{totalCount}</span> products
            </span>

            {/* Desktop Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden lg:flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>

            {/* Mobile Filter Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <SortDropdown
              value={filters.sortBy}
              onChange={(sortBy) => setFilters(prev => ({ ...prev, sortBy }))}
            />

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          {showFilters && (
            <div className="hidden lg:block w-80">
              <FiltersV2
                filters={filters}
                onFiltersChange={setFilters}
                onClear={clearFilters}
              />
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1">
            {/* Active Filter Pills */}
            {activeFilterCount > 0 && (
              <div className="mb-6 p-4 bg-white rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      Search: {filters.search}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      />
                    </span>
                  )}
                  {filters.categories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full text-sm">
                      {cat}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          categories: prev.categories.filter(c => c !== cat)
                        }))}
                      />
                    </span>
                  ))}
                  {filters.colors.map(color => (
                    <span key={color} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-full text-sm">
                      {color}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          colors: prev.colors.filter(c => c !== color)
                        }))}
                      />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {loading && fabrics.length === 0 ? (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-8 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : fabrics.length > 0 ? (
              <>
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                  {fabrics.map((fabric, index) => (
                    <div key={fabric.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in-up">
                      <ProductCardV2 fabric={fabric} viewMode={viewMode} />
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <LoadMoreButton
                    onClick={loadMore}
                    loading={loading}
                    className="mt-12"
                  />
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <p className="text-gray-600 mb-4">No fabrics found matching your criteria</p>
                <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileFilters(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100vh-65px)]">
              <FiltersV2
                filters={filters}
                onFiltersChange={setFilters}
                onClear={clearFilters}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrowsePageV2