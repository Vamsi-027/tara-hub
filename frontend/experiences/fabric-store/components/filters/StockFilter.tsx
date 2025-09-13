'use client'

import React from 'react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

export const StockFilter: React.FC = () => {
  const { filters, updateFilter } = useFabricFilters()

  const handleInStockChange = (checked: boolean) => {
    updateFilter('in_stock', checked ? true : null)
  }

  const handleSwatchAvailableChange = (checked: boolean) => {
    updateFilter('swatch_available', checked ? true : null)
  }

  return (
    <div className="space-y-4">
      {/* In Stock Toggle */}
      <label className="flex items-center gap-3 p-3 hover:bg-warm-50 rounded-lg 
                        cursor-pointer transition-colors duration-200 group">
        <div className="relative">
          <input
            type="checkbox"
            checked={filters.in_stock === true}
            onChange={(e) => handleInStockChange(e.target.checked)}
            className="w-4 h-4 text-navy-800 border-2 border-warm-400 rounded
                      focus:ring-navy-800 focus:ring-2 focus:ring-offset-0
                      bg-white checked:bg-navy-800 checked:border-navy-800
                      transition-colors duration-200"
          />
          {filters.in_stock === true && (
            <svg
              className="absolute top-0 left-0 w-4 h-4 text-white pointer-events-none"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-sans text-sm transition-colors duration-200
                           ${filters.in_stock === true ? 'text-navy-800 font-medium' : 'text-navy-700'}`}>
              In Stock Only
            </span>
            <div className={`w-2 h-2 rounded-full transition-colors duration-200
                           ${filters.in_stock === true ? 'bg-green-500' : 'bg-warm-300'}`} />
          </div>
          <p className="text-xs text-warm-600 mt-1">
            Show only fabrics currently available
          </p>
        </div>
      </label>

      {/* Swatch Available Toggle */}
      <label className="flex items-center gap-3 p-3 hover:bg-warm-50 rounded-lg 
                        cursor-pointer transition-colors duration-200 group">
        <div className="relative">
          <input
            type="checkbox"
            checked={filters.swatch_available === true}
            onChange={(e) => handleSwatchAvailableChange(e.target.checked)}
            className="w-4 h-4 text-navy-800 border-2 border-warm-400 rounded
                      focus:ring-navy-800 focus:ring-2 focus:ring-offset-0
                      bg-white checked:bg-navy-800 checked:border-navy-800
                      transition-colors duration-200"
          />
          {filters.swatch_available === true && (
            <svg
              className="absolute top-0 left-0 w-4 h-4 text-white pointer-events-none"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-sans text-sm transition-colors duration-200
                           ${filters.swatch_available === true ? 'text-navy-800 font-medium' : 'text-navy-700'}`}>
              Swatch Available
            </span>
            <div className={`w-2 h-2 rounded-full transition-colors duration-200
                           ${filters.swatch_available === true ? 'bg-gold-600' : 'bg-warm-300'}`} />
          </div>
          <p className="text-xs text-warm-600 mt-1">
            Show only fabrics with physical samples available
          </p>
        </div>
      </label>

      {/* Status Summary */}
      {(filters.in_stock === true || filters.swatch_available === true) && (
        <div className="p-3 bg-navy-50 rounded-lg border border-navy-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-navy-800 rounded-full" />
            <span className="text-sm font-medium text-navy-800">Active Filters</span>
          </div>
          <div className="space-y-1">
            {filters.in_stock === true && (
              <p className="text-xs text-navy-600">• Showing in-stock items only</p>
            )}
            {filters.swatch_available === true && (
              <p className="text-xs text-navy-600">• Showing items with swatches only</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StockFilter