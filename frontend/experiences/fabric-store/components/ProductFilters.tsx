/**
 * Product Filters Component
 * Filter products by collection, category, and search
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Filter, X } from 'lucide-react'
import type { MedusaCollection } from '../lib/medusa-api'
type MedusaCategory = any // Temporary type placeholder

interface ProductFiltersProps {
  collections: MedusaCollection[]
  categories: MedusaCategory[]
  currentFilters: {
    collection?: string
    category?: string
    search?: string
  }
}

export default function ProductFilters({ 
  collections, 
  categories, 
  currentFilters 
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || '')
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    router.push(`/products?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('q', searchQuery || null)
  }

  const clearFilters = () => {
    router.push('/products')
    setSearchQuery('')
  }

  const activeFiltersCount = 
    (currentFilters.collection ? 1 : 0) + 
    (currentFilters.category ? 1 : 0) + 
    (currentFilters.search ? 1 : 0)

  return (
    <>
      {/* Mobile Filter Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden mb-4 flex items-center justify-between w-full p-3 bg-white rounded-lg shadow"
      >
        <span className="flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </span>
        <X className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
      </button>

      {/* Filter Panel */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block bg-white rounded-lg shadow p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Filters</h2>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <label className="block text-sm font-medium mb-2">Search</label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fabrics..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </form>

        {/* Collections */}
        {collections.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Collections</h3>
            <div className="space-y-2">
              {collections.map((collection) => (
                <label key={collection.id} className="flex items-center">
                  <input
                    type="radio"
                    name="collection"
                    value={collection.id}
                    checked={currentFilters.collection === collection.id}
                    onChange={(e) => updateFilter('collection', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{collection.title}</span>
                </label>
              ))}
              {currentFilters.collection && (
                <button
                  onClick={() => updateFilter('collection', null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear collection
                </button>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    checked={currentFilters.category === category.id}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{category.name}</span>
                </label>
              ))}
              {currentFilters.category && (
                <button
                  onClick={() => updateFilter('category', null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear category
                </button>
              )}
            </div>
          </div>
        )}

        {/* Price Range (Future Enhancement) */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Price Range</h3>
          <p className="text-xs text-gray-500">Coming soon...</p>
        </div>
      </div>
    </>
  )
}