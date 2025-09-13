'use client'

import React from 'react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

const PATTERNS = [
  { value: 'Solid', label: 'Solid', count: 156 },
  { value: 'Stripe', label: 'Stripe', count: 89 },
  { value: 'Geometric', label: 'Geometric', count: 67 },
  { value: 'Floral', label: 'Floral', count: 54 },
  { value: 'Abstract', label: 'Abstract', count: 43 },
  { value: 'Damask', label: 'Damask', count: 32 },
  { value: 'Plaid', label: 'Plaid', count: 28 },
  { value: 'Paisley', label: 'Paisley', count: 21 },
  { value: 'Animal Print', label: 'Animal Print', count: 15 },
  { value: 'Toile', label: 'Toile', count: 12 }
]

export const PatternFilter: React.FC = () => {
  const { filters, toggleArrayFilter } = useFabricFilters()

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {PATTERNS.map((pattern) => {
        const isChecked = filters.pattern.includes(pattern.value)
        
        return (
          <label
            key={pattern.value}
            className="flex items-center gap-3 p-2 hover:bg-warm-50 rounded-lg 
                      cursor-pointer transition-colors duration-200 group"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleArrayFilter('pattern', pattern.value)}
                className="w-4 h-4 text-navy-800 border-2 border-warm-400 rounded
                          focus:ring-navy-800 focus:ring-2 focus:ring-offset-0
                          bg-white checked:bg-navy-800 checked:border-navy-800
                          transition-colors duration-200"
              />
              {isChecked && (
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
            
            <div className="flex-1 flex items-center justify-between">
              <span className={`font-sans text-sm transition-colors duration-200
                             ${isChecked ? 'text-navy-800 font-medium' : 'text-navy-700'}`}>
                {pattern.label}
              </span>
              <span className="text-xs text-warm-500 font-medium">
                {pattern.count}
              </span>
            </div>
          </label>
        )
      })}
    </div>
  )
}

export default PatternFilter