'use client'

import React from 'react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

const USAGES = [
  { value: 'Indoor', label: 'Indoor', count: 234 },
  { value: 'Outdoor', label: 'Outdoor', count: 89 },
  { value: 'Marine', label: 'Marine', count: 45 },
  { value: 'Healthcare', label: 'Healthcare', count: 67 },
  { value: 'Hospitality', label: 'Hospitality', count: 123 },
  { value: 'Residential', label: 'Residential', count: 198 },
  { value: 'Commercial', label: 'Commercial', count: 156 },
  { value: 'Automotive', label: 'Automotive', count: 32 },
  { value: 'Aviation', label: 'Aviation', count: 18 }
]

export const UsageFilter: React.FC = () => {
  const { filters, toggleArrayFilter } = useFabricFilters()

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {USAGES.map((usage) => {
        const isChecked = filters.usage.includes(usage.value)
        
        return (
          <label
            key={usage.value}
            className="flex items-center gap-3 p-2 hover:bg-warm-50 rounded-lg 
                      cursor-pointer transition-colors duration-200 group"
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleArrayFilter('usage', usage.value)}
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
                {usage.label}
              </span>
              <span className="text-xs text-warm-500 font-medium">
                {usage.count}
              </span>
            </div>
          </label>
        )
      })}
    </div>
  )
}

export default UsageFilter