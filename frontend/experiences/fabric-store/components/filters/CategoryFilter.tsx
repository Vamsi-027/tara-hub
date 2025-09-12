'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

// Mock data - in a real app, this would come from API
const CATEGORIES = [
  'All Categories',
  'Upholstery',
  'Drapery', 
  'Outdoor',
  'Multipurpose',
  'Wallcovering',
  'Leather',
  'Vinyl'
]

const COLLECTIONS = [
  'All Collections',
  'Heritage',
  'Modern Classics',
  'Artisan Series',
  'Outdoor Living',
  'Eco Collection',
  'Designer Collaboration',
  'Limited Edition'
]

export const CategoryFilter: React.FC = () => {
  const { filters, updateFilter } = useFabricFilters()

  return (
    <div className="space-y-4">
      {/* Category Dropdown */}
      <div>
        <label className="block font-body font-medium text-navy-700 mb-2">
          Category
        </label>
        <div className="relative">
          <select
            value={filters.category || 'All Categories'}
            onChange={(e) => updateFilter('category', e.target.value === 'All Categories' ? '' : e.target.value)}
            className="w-full h-11 pl-4 pr-10 bg-white border-2 border-warm-300 rounded-xl
                      font-body text-navy-800 appearance-none cursor-pointer
                      focus:border-navy-800 focus:ring-0 focus:outline-none
                      hover:border-gold-800 transition-colors duration-200"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-500 pointer-events-none" />
        </div>
      </div>

      {/* Collection Dropdown */}
      <div>
        <label className="block font-body font-medium text-navy-700 mb-2">
          Collection
        </label>
        <div className="relative">
          <select
            value={filters.collection || 'All Collections'}
            onChange={(e) => updateFilter('collection', e.target.value === 'All Collections' ? '' : e.target.value)}
            className="w-full h-11 pl-4 pr-10 bg-white border-2 border-warm-300 rounded-xl
                      font-body text-navy-800 appearance-none cursor-pointer
                      focus:border-navy-800 focus:ring-0 focus:outline-none
                      hover:border-gold-800 transition-colors duration-200"
          >
            {COLLECTIONS.map((collection) => (
              <option key={collection} value={collection}>
                {collection}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-500 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

export default CategoryFilter