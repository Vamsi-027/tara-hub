'use client'

import { useState } from 'react'
import { FabricFilters as FilterType } from '@/lib/api-client'

interface FabricFiltersProps {
  onFilterChange: (filters: FilterType) => void
}

export function FabricFilters({ onFilterChange }: FabricFiltersProps) {
  const [filters, setFilters] = useState<FilterType>({})

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    setFilters({})
    onFilterChange({})
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search fabrics..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Velvet">Velvet</option>
            <option value="Linen">Linen</option>
            <option value="Cotton">Cotton</option>
            <option value="Cotton Blend">Cotton Blend</option>
            <option value="Silk">Silk</option>
            <option value="Performance">Performance</option>
            <option value="Outdoor">Outdoor</option>
            <option value="Chenille">Chenille</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Features
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={filters.petFriendly || false}
                onChange={(e) => handleFilterChange('petFriendly', e.target.checked)}
              />
              <span className="text-sm">Pet Friendly</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={filters.stainResistant || false}
                onChange={(e) => handleFilterChange('stainResistant', e.target.checked)}
              />
              <span className="text-sm">Stain Resistant</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                checked={filters.outdoorSafe || false}
                onChange={(e) => handleFilterChange('outdoorSafe', e.target.checked)}
              />
              <span className="text-sm">Outdoor Safe</span>
            </label>
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}