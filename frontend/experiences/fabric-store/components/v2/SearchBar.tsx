'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, TrendingUp, Clock } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Mock suggestions - in production, fetch from API
const popularSearches = [
  'Velvet upholstery',
  'Linen drapery',
  'Outdoor fabric',
  'Silk dupioni',
  'Cotton canvas'
]

const recentSearches = [
  'Blue velvet',
  'Striped cotton',
  'Floral print'
]

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fuzzy search with typo tolerance
  const fuzzySearch = (query: string, target: string): boolean => {
    const queryLower = query.toLowerCase()
    const targetLower = target.toLowerCase()

    // Direct substring match
    if (targetLower.includes(queryLower)) return true

    // Typo tolerance using Levenshtein distance
    const distance = levenshteinDistance(queryLower, targetLower.substring(0, queryLower.length))
    return distance <= Math.floor(queryLower.length / 3) // Allow ~33% typos
  }

  // Simple Levenshtein distance implementation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  // Generate suggestions based on input
  useEffect(() => {
    if (value.length > 1) {
      // Combine all potential suggestions
      const allSuggestions = [...popularSearches, ...recentSearches]

      // Filter with fuzzy matching
      const filtered = allSuggestions.filter(s => fuzzySearch(value, s))

      // Remove duplicates and limit to 5
      const unique = Array.from(new Set(filtered)).slice(0, 5)

      setSuggestions(unique)
      setShowSuggestions(true)
    } else if (value.length === 0 && isFocused) {
      // Show popular/recent when focused with empty input
      setSuggestions([...recentSearches.slice(0, 3)])
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [value, isFocused])

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true)
            if (value.length === 0) setShowSuggestions(true)
          }}
          placeholder={placeholder || 'Search fabrics...'}
          className="w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-md border border-white/20
                     rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2
                     focus:ring-white/30 focus:border-white/30 transition-all"
        />

        {value && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-300
                       hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || (value.length === 0 && isFocused)) && (
        <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden">
          {/* Recent/Popular Searches Header */}
          {value.length === 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Recent Searches
              </p>
            </div>
          )}

          {/* Autocomplete Results */}
          {value.length > 1 && suggestions.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b">
              <p className="text-xs font-medium text-gray-500">Suggestions</p>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                           flex items-center justify-between group"
              >
                <span className="text-gray-700 group-hover:text-gray-900">
                  {/* Highlight matching parts */}
                  {value.length > 0 ? (
                    suggestion.split(new RegExp(`(${value})`, 'gi')).map((part, i) => (
                      <span
                        key={i}
                        className={
                          part.toLowerCase() === value.toLowerCase()
                            ? 'font-semibold text-gray-900'
                            : ''
                        }
                      >
                        {part}
                      </span>
                    ))
                  ) : (
                    suggestion
                  )}
                </span>
                <Search className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}

            {/* Popular Searches */}
            {value.length === 0 && isFocused && (
              <div className="border-t">
                <div className="px-4 py-2 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Popular Searches
                  </p>
                </div>
                {popularSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                               flex items-center justify-between group"
                  >
                    <span className="text-gray-700 group-hover:text-gray-900">{search}</span>
                    <TrendingUp className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* No results message */}
          {value.length > 1 && suggestions.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-gray-500">No results found for "{value}"</p>
              <p className="text-xs text-gray-400 mt-1">Try checking your spelling or using different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}