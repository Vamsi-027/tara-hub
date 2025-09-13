'use client'

import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

export const SearchFilter: React.FC = () => {
  const { filters, updateFilter } = useFabricFilters()
  const [searchValue, setSearchValue] = useState(filters.search)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        updateFilter('search', searchValue)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, filters.search, updateFilter])

  // Update local state when filters change externally
  useEffect(() => {
    if (filters.search !== searchValue) {
      setSearchValue(filters.search)
    }
  }, [filters.search])

  const clearSearch = () => {
    setSearchValue('')
    updateFilter('search', '')
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-500" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search fabrics by name, SKU, or description..."
          className="w-full h-12 pl-10 pr-10 bg-white border-2 border-warm-300 rounded-xl
                    font-sans placeholder:text-warm-500 text-navy-800
                    focus:border-navy-800 focus:ring-0 focus:outline-none
                    hover:border-gold-800 transition-colors duration-200"
        />
        {searchValue && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-warm-100 
                      rounded-full transition-colors duration-200"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-warm-500" />
          </button>
        )}
      </div>
      
      {searchValue && (
        <p className="mt-2 text-sm text-warm-600">
          Searching for: <span className="font-medium text-navy-700">"{searchValue}"</span>
        </p>
      )}
    </div>
  )
}

export default SearchFilter