'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

const SORT_OPTIONS = [
  { field: 'name', direction: 'asc' as const, label: 'Name A-Z' },
  { field: 'name', direction: 'desc' as const, label: 'Name Z-A' },
  { field: 'created_at', direction: 'desc' as const, label: 'Recently Added' },
  { field: 'created_at', direction: 'asc' as const, label: 'Oldest First' },
  { field: 'swatch_price', direction: 'asc' as const, label: 'Price Low to High' },
  { field: 'swatch_price', direction: 'desc' as const, label: 'Price High to Low' },
  { field: 'pattern', direction: 'asc' as const, label: 'Pattern A-Z' },
  { field: 'usage', direction: 'asc' as const, label: 'Usage A-Z' }
]

export const SortFilter: React.FC = () => {
  const { filters, updateFilter } = useFabricFilters()

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const option = SORT_OPTIONS.find(opt => 
      `${opt.field}_${opt.direction}` === value
    )
    
    if (option) {
      updateFilter('sort_field', option.field)
      updateFilter('sort_direction', option.direction)
    }
  }

  const currentSortValue = `${filters.sort_field}_${filters.sort_direction}`

  return (
    <div className="space-y-3">
      {/* Sort Label */}
      <div className="flex items-center justify-between">
        <label className="block font-sans font-medium text-navy-700">
          Sort By
        </label>
        {currentSortValue !== 'name_asc' && (
          <button
            onClick={() => {
              updateFilter('sort_field', 'name')
              updateFilter('sort_direction', 'asc')
            }}
            className="text-xs text-warm-600 hover:text-navy-800 transition-colors duration-200"
          >
            Reset to Default
          </button>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <select
          value={currentSortValue}
          onChange={handleSortChange}
          className="w-full h-11 pl-4 pr-10 bg-white border-2 border-warm-300 rounded-xl
                    font-sans text-navy-800 appearance-none cursor-pointer
                    focus:border-navy-800 focus:ring-0 focus:outline-none
                    hover:border-gold-800 transition-colors duration-200"
        >
          {SORT_OPTIONS.map((option) => {
            const value = `${option.field}_${option.direction}`
            return (
              <option key={value} value={value}>
                {option.label}
              </option>
            )
          })}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-500 pointer-events-none" />
      </div>

      {/* Sort Description */}
      <div className="p-3 bg-warm-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${
            currentSortValue !== 'name_asc' ? 'bg-navy-800' : 'bg-warm-400'
          }`} />
          <span className="text-sm font-medium text-navy-700">Current Sort</span>
        </div>
        <p className="text-xs text-warm-600">
          {SORT_OPTIONS.find(opt => `${opt.field}_${opt.direction}` === currentSortValue)?.label || 'Name A-Z'}
        </p>
        {filters.sort_direction === 'desc' && (
          <p className="text-xs text-warm-500 mt-1">
            Showing results in descending order
          </p>
        )}
      </div>

      {/* Quick Sort Buttons */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-warm-600">Quick Sort Options</p>
        <div className="flex flex-wrap gap-2">
          {[
            { field: 'name', direction: 'asc' as const, label: 'A-Z' },
            { field: 'created_at', direction: 'desc' as const, label: 'Newest' },
            { field: 'swatch_price', direction: 'asc' as const, label: 'Price ↑' }
          ].map((option) => {
            const value = `${option.field}_${option.direction}`
            const isActive = currentSortValue === value
            
            return (
              <button
                key={value}
                onClick={() => {
                  updateFilter('sort_field', option.field)
                  updateFilter('sort_direction', option.direction)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                           hover:scale-105 ${
                  isActive
                    ? 'bg-navy-800 text-white'
                    : 'bg-white text-navy-700 border border-warm-300 hover:border-gold-800'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SortFilter