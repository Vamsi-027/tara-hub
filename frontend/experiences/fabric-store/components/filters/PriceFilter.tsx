'use client'

import React, { useState, useEffect } from 'react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

export const PriceFilter: React.FC = () => {
  const { filters, updateFilter } = useFabricFilters()
  const [localMin, setLocalMin] = useState(filters.swatch_price_min)
  const [localMax, setLocalMax] = useState(filters.swatch_price_max)
  const [isDragging, setIsDragging] = useState(false)

  const MIN_PRICE = 5
  const MAX_PRICE = 50

  // Update local state when filters change externally
  useEffect(() => {
    if (!isDragging) {
      setLocalMin(filters.swatch_price_min)
      setLocalMax(filters.swatch_price_max)
    }
  }, [filters.swatch_price_min, filters.swatch_price_max, isDragging])

  // Debounced update to filters
  useEffect(() => {
    if (!isDragging) return

    const timer = setTimeout(() => {
      updateFilter('swatch_price_min', localMin)
      updateFilter('swatch_price_max', localMax)
      setIsDragging(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [localMin, localMax, isDragging, updateFilter])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), localMax - 1)
    setLocalMin(value)
    setIsDragging(true)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), localMin + 1)
    setLocalMax(value)
    setIsDragging(true)
  }

  const resetToDefaults = () => {
    setLocalMin(MIN_PRICE)
    setLocalMax(MAX_PRICE)
    updateFilter('swatch_price_min', MIN_PRICE)
    updateFilter('swatch_price_max', MAX_PRICE)
  }

  const isFiltered = localMin !== MIN_PRICE || localMax !== MAX_PRICE

  return (
    <div className="space-y-4">
      {/* Price Range Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-sans font-medium text-navy-700">Swatch Price Range</span>
          {isFiltered && (
            <div className="w-2 h-2 bg-navy-800 rounded-full" />
          )}
        </div>
        {isFiltered && (
          <button
            onClick={resetToDefaults}
            className="text-xs text-warm-600 hover:text-navy-800 transition-colors duration-200"
          >
            Reset
          </button>
        )}
      </div>

      {/* Price Display */}
      <div className="flex items-center justify-between px-3 py-2 bg-warm-50 rounded-lg">
        <div className="text-center">
          <p className="text-xs text-warm-600 font-medium">Min</p>
          <p className="text-lg font-semibold text-navy-800">${localMin}</p>
        </div>
        <div className="w-8 h-px bg-warm-300" />
        <div className="text-center">
          <p className="text-xs text-warm-600 font-medium">Max</p>
          <p className="text-lg font-semibold text-navy-800">${localMax}</p>
        </div>
      </div>

      {/* Dual Range Slider */}
      <div className="relative px-2">
        <div className="relative">
          {/* Track */}
          <div className="h-2 bg-warm-300 rounded-full relative">
            {/* Active track */}
            <div
              className="absolute h-2 bg-navy-800 rounded-full"
              style={{
                left: `${((localMin - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`,
                right: `${100 - ((localMax - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`
              }}
            />
          </div>

          {/* Min Range Input */}
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={localMin}
            onChange={handleMinChange}
            className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none 
                      [&::-webkit-slider-thumb]:w-5 
                      [&::-webkit-slider-thumb]:h-5 
                      [&::-webkit-slider-thumb]:bg-navy-800 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:border-2 
                      [&::-webkit-slider-thumb]:border-white 
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:duration-200"
            style={{ zIndex: 1 }}
          />

          {/* Max Range Input */}
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            value={localMax}
            onChange={handleMaxChange}
            className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer 
                      [&::-webkit-slider-thumb]:appearance-none 
                      [&::-webkit-slider-thumb]:w-5 
                      [&::-webkit-slider-thumb]:h-5 
                      [&::-webkit-slider-thumb]:bg-navy-800 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:border-2 
                      [&::-webkit-slider-thumb]:border-white 
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:duration-200"
            style={{ zIndex: 2 }}
          />
        </div>

        {/* Price Markers */}
        <div className="flex justify-between mt-2 px-1">
          <span className="text-xs text-warm-500">${MIN_PRICE}</span>
          <span className="text-xs text-warm-500">${Math.round((MIN_PRICE + MAX_PRICE) / 2)}</span>
          <span className="text-xs text-warm-500">${MAX_PRICE}</span>
        </div>
      </div>

      {/* Price Input Fields */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-warm-600 mb-1">
            Min Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-500">$</span>
            <input
              type="number"
              min={MIN_PRICE}
              max={localMax - 1}
              value={localMin}
              onChange={(e) => {
                const value = Math.max(MIN_PRICE, Math.min(Number(e.target.value), localMax - 1))
                setLocalMin(value)
                updateFilter('swatch_price_min', value)
              }}
              className="w-full h-9 pl-6 pr-3 bg-white border border-warm-300 rounded-lg
                        font-sans text-sm text-navy-800
                        focus:border-navy-800 focus:ring-0 focus:outline-none
                        hover:border-gold-800 transition-colors duration-200"
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-medium text-warm-600 mb-1">
            Max Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-warm-500">$</span>
            <input
              type="number"
              min={localMin + 1}
              max={MAX_PRICE}
              value={localMax}
              onChange={(e) => {
                const value = Math.min(MAX_PRICE, Math.max(Number(e.target.value), localMin + 1))
                setLocalMax(value)
                updateFilter('swatch_price_max', value)
              }}
              className="w-full h-9 pl-6 pr-3 bg-white border border-warm-300 rounded-lg
                        font-sans text-sm text-navy-800
                        focus:border-navy-800 focus:ring-0 focus:outline-none
                        hover:border-gold-800 transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {/* Price Summary */}
      {isFiltered && (
        <div className="p-3 bg-gold-50 rounded-lg border border-gold-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-gold-600 rounded-full" />
            <span className="text-sm font-medium text-gold-800">Price Filter Active</span>
          </div>
          <p className="text-xs text-gold-700">
            Showing swatches between ${localMin} - ${localMax}
          </p>
        </div>
      )}
    </div>
  )
}

export default PriceFilter