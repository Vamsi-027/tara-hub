'use client'

import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

// Color families and popular hex colors
const COLOR_FAMILIES = [
  { name: 'Neutral', count: 45 },
  { name: 'Blue', count: 32 },
  { name: 'Green', count: 28 },
  { name: 'Red', count: 24 },
  { name: 'Brown', count: 22 },
  { name: 'Gold', count: 18 },
  { name: 'Purple', count: 15 },
  { name: 'Orange', count: 12 },
  { name: 'Pink', count: 10 },
  { name: 'Black', count: 8 }
]

const HEX_COLORS = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#F5F5F5', name: 'Off White' },
  { hex: '#E5E5E5', name: 'Light Gray' },
  { hex: '#9E9E9E', name: 'Gray' },
  { hex: '#4A4A4A', name: 'Dark Gray' },
  { hex: '#2C2C2C', name: 'Charcoal' },
  { hex: '#000000', name: 'Black' },
  { hex: '#8B2635', name: 'Burgundy' },
  { hex: '#C9A646', name: 'Gold' },
  { hex: '#0B2545', name: 'Navy' },
  { hex: '#1F3A63', name: 'Deep Blue' },
  { hex: '#2D5738', name: 'Forest Green' },
  { hex: '#4A7C59', name: 'Sage Green' },
  { hex: '#D4A5A5', name: 'Dusty Rose' },
  { hex: '#8B4513', name: 'Saddle Brown' },
  { hex: '#6B4423', name: 'Dark Brown' }
]

export const ColorFilter: React.FC = () => {
  const { filters, toggleArrayFilter } = useFabricFilters()
  const [activeTab, setActiveTab] = useState<'family' | 'hex'>('family')

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border border-warm-300 rounded-lg overflow-hidden">
        <button
          onClick={() => setActiveTab('family')}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200
                     ${activeTab === 'family'
                       ? 'bg-navy-800 text-white'
                       : 'bg-white text-navy-700 hover:bg-warm-50'
                     }`}
        >
          Color Family
        </button>
        <button
          onClick={() => setActiveTab('hex')}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors duration-200
                     ${activeTab === 'hex'
                       ? 'bg-navy-800 text-white'
                       : 'bg-white text-navy-700 hover:bg-warm-50'
                     }`}
        >
          Specific Colors
        </button>
      </div>

      {/* Color Family Chips */}
      {activeTab === 'family' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {COLOR_FAMILIES.map((colorFamily) => {
              const isSelected = filters.color_family.includes(colorFamily.name)
              
              return (
                <button
                  key={colorFamily.name}
                  onClick={() => toggleArrayFilter('color_family', colorFamily.name)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border
                             font-sans text-sm transition-all duration-200 hover:scale-105
                             ${isSelected
                               ? 'bg-navy-800 text-white border-navy-800'
                               : 'bg-white text-navy-700 border-warm-300 hover:border-gold-800'
                             }`}
                >
                  {colorFamily.name}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full
                                   ${isSelected
                                     ? 'bg-white/20 text-white'
                                     : 'bg-warm-100 text-warm-600'
                                   }`}>
                    {colorFamily.count}
                  </span>
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Hex Color Swatches */}
      {activeTab === 'hex' && (
        <div className="space-y-3">
          <div className="grid grid-cols-8 gap-2">
            {HEX_COLORS.map((color) => {
              const isSelected = filters.color_hex.includes(color.hex)
              
              return (
                <button
                  key={color.hex}
                  onClick={() => toggleArrayFilter('color_hex', color.hex)}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all duration-200
                             hover:scale-110 hover:shadow-md
                             ${isSelected
                               ? 'border-navy-800 shadow-lg scale-110'
                               : 'border-warm-300 hover:border-gold-800'
                             }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={`${color.name} (${color.hex})`}
                >
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check 
                        className={`w-4 h-4 ${
                          color.hex === '#FFFFFF' || color.hex === '#F5F5F5' || color.hex === '#E5E5E5'
                            ? 'text-navy-800' 
                            : 'text-white'
                        }`} 
                      />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* Selected Colors List */}
          {filters.color_hex.length > 0 && (
            <div className="pt-3 border-t border-warm-200">
              <p className="text-sm font-medium text-navy-700 mb-2">Selected Colors:</p>
              <div className="flex flex-wrap gap-2">
                {filters.color_hex.map((hex) => {
                  const colorInfo = HEX_COLORS.find(c => c.hex === hex)
                  return (
                    <div
                      key={hex}
                      className="inline-flex items-center gap-2 px-2 py-1 bg-warm-100 
                               rounded-lg text-xs font-medium text-navy-700"
                    >
                      <div
                        className="w-3 h-3 rounded-full border border-warm-400"
                        style={{ backgroundColor: hex }}
                      />
                      {colorInfo?.name || hex}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ColorFilter