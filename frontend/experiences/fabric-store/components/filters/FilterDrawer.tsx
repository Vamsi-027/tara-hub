'use client'

import React, { useState } from 'react'
import { X, Filter, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'
import { useFabricFilters } from '@/hooks/useFabricFilters'
import { SearchFilter } from './SearchFilter'
import { CategoryFilter } from './CategoryFilter'
import { ColorFilter } from './ColorFilter'
import { PatternFilter } from './PatternFilter'
import { UsageFilter } from './UsageFilter'
import { CompositionFilter } from './CompositionFilter'
import { StockFilter } from './StockFilter'
import { PriceFilter } from './PriceFilter'
import { SortFilter } from './SortFilter'

interface FilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const { activeFilterCount, clearAllFilters } = useFabricFilters()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    search: true,
    category: true,
    color: true,
    attributes: true,
    stock: true,
    price: true,
    sort: true
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const FilterSection: React.FC<{
    title: string
    sectionKey: string
    children: React.ReactNode
    defaultExpanded?: boolean
  }> = ({ title, sectionKey, children, defaultExpanded = true }) => {
    const isExpanded = expandedSections[sectionKey] ?? defaultExpanded

    return (
      <div className="border-b border-warm-200 last:border-b-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 hover:bg-warm-50 
                    transition-colors duration-200 text-left"
          aria-expanded={isExpanded}
          aria-controls={`filter-${sectionKey}`}
        >
          <span className="font-display text-lg font-medium text-navy-800">
            {title}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-warm-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-warm-500" />
          )}
        </button>
        
        {isExpanded && (
          <div id={`filter-${sectionKey}`} className="px-4 pb-4">
            {children}
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-white shadow-2xl 
                   transform transition-transform duration-300 ease-in-out
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                   lg:relative lg:translate-x-0 lg:shadow-none lg:max-w-none
                   ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-warm-200 bg-white">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-6 h-6 text-navy-800" />
            <h2 className="font-display text-xl font-semibold text-navy-800">
              Filters
            </h2>
            {activeFilterCount > 0 && (
              <span className="bg-gold-100 text-gold-800 text-xs font-medium px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-navy-600 hover:text-gold-800 font-medium 
                          transition-colors duration-200"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-warm-100 rounded-lg transition-colors duration-200 lg:hidden"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-warm-600" />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* Search & Sort - Always visible */}
          <div className="p-4 border-b border-warm-200 space-y-4">
            <SearchFilter />
            <SortFilter />
          </div>

          {/* Collapsible Sections */}
          <div className="divide-y divide-warm-200">
            <FilterSection title="Category & Collection" sectionKey="category">
              <div className="space-y-4">
                <CategoryFilter />
              </div>
            </FilterSection>

            <FilterSection title="Color" sectionKey="color">
              <ColorFilter />
            </FilterSection>

            <FilterSection title="Attributes" sectionKey="attributes">
              <div className="space-y-6">
                <div>
                  <h4 className="font-body font-medium text-navy-700 mb-3">Pattern</h4>
                  <PatternFilter />
                </div>
                <div>
                  <h4 className="font-body font-medium text-navy-700 mb-3">Usage</h4>
                  <UsageFilter />
                </div>
                <div>
                  <h4 className="font-body font-medium text-navy-700 mb-3">Material</h4>
                  <CompositionFilter />
                </div>
              </div>
            </FilterSection>

            <FilterSection title="Availability" sectionKey="stock">
              <StockFilter />
            </FilterSection>

            <FilterSection title="Price Range" sectionKey="price">
              <PriceFilter />
            </FilterSection>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <div className="lg:hidden p-4 border-t border-warm-200 bg-white">
          <button
            onClick={onClose}
            className="w-full bg-navy-800 text-white py-3 px-6 rounded-xl font-body 
                      font-semibold hover:bg-navy-700 transition-colors duration-300
                      flex items-center justify-center gap-2"
          >
            <Filter className="w-5 h-5" />
            Apply Filters
            {activeFilterCount > 0 && (
              <span className="bg-gold-600 text-white text-xs px-2 py-1 rounded-full ml-2">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

export default FilterDrawer