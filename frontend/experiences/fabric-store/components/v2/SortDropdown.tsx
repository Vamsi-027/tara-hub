'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, TrendingUp, DollarSign, Calendar, Star } from 'lucide-react'

interface SortOption {
  value: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'popular'
  label: string
  icon: React.ReactNode
}

const sortOptions: SortOption[] = [
  { value: 'newest', label: 'Newest First', icon: <Calendar className="w-4 h-4" /> },
  { value: 'popular', label: 'Most Popular', icon: <Star className="w-4 h-4" /> },
  { value: 'price_asc', label: 'Price: Low to High', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'price_desc', label: 'Price: High to Low', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'name', label: 'Alphabetical', icon: <span className="text-sm font-bold">AZ</span> }
]

interface SortDropdownProps {
  value: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'popular'
  onChange: (value: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'popular') => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = sortOptions.find(opt => opt.value === value) || sortOptions[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg
                   hover:border-gray-300 transition-all focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:border-transparent"
        aria-label="Sort products"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-sm font-medium text-gray-700">Sort:</span>
        <span className="flex items-center gap-1 text-sm text-gray-900">
          {selectedOption.icon}
          <span>{selectedOption.label}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 right-0 w-56 bg-white rounded-lg shadow-xl border overflow-hidden">
          <div className="py-1" role="listbox">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`
                  w-full px-4 py-3 text-left flex items-center justify-between
                  hover:bg-gray-50 transition-colors
                  ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                `}
                role="option"
                aria-selected={value === option.value}
              >
                <span className="flex items-center gap-2">
                  {option.icon}
                  <span className="text-sm">{option.label}</span>
                </span>
                {value === option.value && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}