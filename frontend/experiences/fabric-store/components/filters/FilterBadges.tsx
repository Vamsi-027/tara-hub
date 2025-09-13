'use client'

import React from 'react'
import { X } from 'lucide-react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

export const FilterBadges: React.FC = () => {
  const { filters, updateFilter, toggleArrayFilter, clearAllFilters } = useFabricFilters()

  // Helper to create badges for active filters
  const badges: Array<{
    id: string
    label: string
    value: string
    onRemove: () => void
    type: 'single' | 'array' | 'boolean' | 'range' | 'sort'
  }> = []

  // Search filter
  if (filters.search) {
    badges.push({
      id: 'search',
      label: 'Search',
      value: `"${filters.search}"`,
      onRemove: () => updateFilter('search', ''),
      type: 'single'
    })
  }

  // Category filter
  if (filters.category) {
    badges.push({
      id: 'category',
      label: 'Category',
      value: filters.category,
      onRemove: () => updateFilter('category', ''),
      type: 'single'
    })
  }

  // Collection filter
  if (filters.collection) {
    badges.push({
      id: 'collection',
      label: 'Collection',
      value: filters.collection,
      onRemove: () => updateFilter('collection', ''),
      type: 'single'
    })
  }

  // Color family filters
  filters.color_family.forEach(color => {
    badges.push({
      id: `color_family_${color}`,
      label: 'Color',
      value: color,
      onRemove: () => toggleArrayFilter('color_family', color),
      type: 'array'
    })
  })

  // Hex color filters
  filters.color_hex.forEach(hex => {
    badges.push({
      id: `color_hex_${hex}`,
      label: 'Color',
      value: hex,
      onRemove: () => toggleArrayFilter('color_hex', hex),
      type: 'array'
    })
  })

  // Pattern filters
  filters.pattern.forEach(pattern => {
    badges.push({
      id: `pattern_${pattern}`,
      label: 'Pattern',
      value: pattern,
      onRemove: () => toggleArrayFilter('pattern', pattern),
      type: 'array'
    })
  })

  // Usage filters
  filters.usage.forEach(usage => {
    badges.push({
      id: `usage_${usage}`,
      label: 'Usage',
      value: usage,
      onRemove: () => toggleArrayFilter('usage', usage),
      type: 'array'
    })
  })

  // Composition filters
  filters.composition.forEach(composition => {
    badges.push({
      id: `composition_${composition}`,
      label: 'Material',
      value: composition,
      onRemove: () => toggleArrayFilter('composition', composition),
      type: 'array'
    })
  })

  // Stock filters
  if (filters.in_stock === true) {
    badges.push({
      id: 'in_stock',
      label: 'Availability',
      value: 'In Stock',
      onRemove: () => updateFilter('in_stock', null),
      type: 'boolean'
    })
  }

  if (filters.swatch_available === true) {
    badges.push({
      id: 'swatch_available',
      label: 'Swatch',
      value: 'Available',
      onRemove: () => updateFilter('swatch_available', null),
      type: 'boolean'
    })
  }

  // Price range filter
  const isCustomPriceRange = filters.swatch_price_min !== 5 || filters.swatch_price_max !== 50
  if (isCustomPriceRange) {
    badges.push({
      id: 'price_range',
      label: 'Price',
      value: `$${filters.swatch_price_min} - $${filters.swatch_price_max}`,
      onRemove: () => {
        updateFilter('swatch_price_min', 5)
        updateFilter('swatch_price_max', 50)
      },
      type: 'range'
    })
  }

  // Sort filter (only if not default)
  const isCustomSort = filters.sort_field !== 'name' || filters.sort_direction !== 'asc'
  if (isCustomSort) {
    const sortLabels: Record<string, string> = {
      'name_asc': 'Name A-Z',
      'name_desc': 'Name Z-A',
      'created_at_desc': 'Recently Added',
      'created_at_asc': 'Oldest First',
      'swatch_price_asc': 'Price Low to High',
      'swatch_price_desc': 'Price High to Low',
      'pattern_asc': 'Pattern A-Z',
      'usage_asc': 'Usage A-Z'
    }
    
    const sortKey = `${filters.sort_field}_${filters.sort_direction}`
    badges.push({
      id: 'sort',
      label: 'Sort',
      value: sortLabels[sortKey] || `${filters.sort_field} ${filters.sort_direction}`,
      onRemove: () => {
        updateFilter('sort_field', 'name')
        updateFilter('sort_direction', 'asc')
      },
      type: 'sort'
    })
  }

  // If no active filters, don't render
  if (badges.length === 0) return null

  return (
    <div className="space-y-3">
      {/* Header with clear all */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-sans font-medium text-navy-700">Active Filters</h3>
          <span className="px-2 py-0.5 bg-navy-800 text-white text-xs rounded-full font-medium">
            {badges.length}
          </span>
        </div>
        {badges.length > 1 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-warm-600 hover:text-navy-800 font-medium 
                      transition-colors duration-200"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter badges */}
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="inline-flex items-center gap-2 pl-3 pr-2 py-2 
                      bg-white border-2 border-navy-800 rounded-full
                      text-sm font-medium text-navy-800 
                      hover:bg-navy-800 hover:text-white
                      transition-all duration-200 group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium opacity-70">
                {badge.label}:
              </span>
              <span className="max-w-32 truncate" title={badge.value}>
                {badge.value}
              </span>
            </div>
            
            <button
              onClick={badge.onRemove}
              className="p-0.5 hover:bg-white/20 rounded-full transition-colors duration-200
                        group-hover:bg-white/20"
              aria-label={`Remove ${badge.label} filter: ${badge.value}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Filter summary */}
      <div className="p-3 bg-navy-50 rounded-lg border border-navy-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-navy-800 rounded-full" />
          <span className="text-sm font-medium text-navy-800">Filter Summary</span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs text-navy-600">
          <div>
            <span className="font-medium">Active Filters:</span> {badges.length}
          </div>
          <div>
            <span className="font-medium">Categories:</span> {
              badges.filter(b => ['category', 'collection', 'color_family', 'pattern', 'usage', 'composition'].some(type => b.id.startsWith(type))).length
            }
          </div>
        </div>
        
        {/* Quick stats */}
        {badges.length > 3 && (
          <div className="mt-2 pt-2 border-t border-navy-200">
            <p className="text-xs text-navy-500">
              Multiple filters active - results may be limited. Consider using fewer filters for broader results.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterBadges