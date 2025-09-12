'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Search, 
  Filter,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react'

// shadcn/ui components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

// Mock data - replace with your actual filter data
const FILTER_DATA = {
  colors: [
    { id: 'red', label: 'Red', count: 24 },
    { id: 'blue', label: 'Blue', count: 32 },
    { id: 'green', label: 'Green', count: 18 },
    { id: 'yellow', label: 'Yellow', count: 15 },
    { id: 'purple', label: 'Purple', count: 12 },
    { id: 'orange', label: 'Orange', count: 9 },
    { id: 'pink', label: 'Pink', count: 7 },
    { id: 'brown', label: 'Brown', count: 21 }
  ],
  materials: [
    { id: 'cotton', label: 'Cotton', count: 45 },
    { id: 'linen', label: 'Linen', count: 38 },
    { id: 'silk', label: 'Silk', count: 29 },
    { id: 'wool', label: 'Wool', count: 33 },
    { id: 'polyester', label: 'Polyester', count: 27 },
    { id: 'cashmere', label: 'Cashmere', count: 12 },
    { id: 'velvet', label: 'Velvet', count: 16 }
  ],
  patterns: [
    { id: 'solid', label: 'Solid', count: 89 },
    { id: 'stripe', label: 'Stripe', count: 34 },
    { id: 'floral', label: 'Floral', count: 28 },
    { id: 'geometric', label: 'Geometric', count: 22 },
    { id: 'abstract', label: 'Abstract', count: 18 },
    { id: 'paisley', label: 'Paisley', count: 15 },
    { id: 'plaid', label: 'Plaid', count: 12 }
  ],
  categories: [
    { id: 'upholstery', label: 'Upholstery', count: 67 },
    { id: 'drapery', label: 'Drapery', count: 45 },
    { id: 'outdoor', label: 'Outdoor', count: 32 },
    { id: 'wallcovering', label: 'Wallcovering', count: 28 },
    { id: 'trim', label: 'Trim', count: 15 }
  ]
}

interface FilterState {
  search: string
  colors: string[]
  materials: string[]
  patterns: string[]
  categories: string[]
  priceRange: [number, number]
  availability: string[]
}

const initialFilters: FilterState = {
  search: '',
  colors: [],
  materials: [],
  patterns: [],
  categories: [],
  priceRange: [0, 500],
  availability: []
}

// Filter Content Component
const FilterContent: React.FC<{
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}> = ({ filters, onFiltersChange }) => {
  
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleMultiSelectFilter = (key: keyof FilterState, value: string) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateFilter(key, newArray)
  }

  const clearAllFilters = () => {
    onFiltersChange(initialFilters)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    count += filters.colors.length
    count += filters.materials.length
    count += filters.patterns.length
    count += filters.categories.length
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++
    count += filters.availability.length
    return count
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {getActiveFilterCount()} active
            </Badge>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search fabrics..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>

        {getActiveFilterCount() > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="w-full mt-3 text-gray-600 hover:text-gray-900"
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" className="w-full px-6">
          {/* Categories */}
          <AccordionItem value="categories" className="border-b-0">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Category</span>
                {filters.categories.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                    {filters.categories.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pb-4"
              >
                {FILTER_DATA.categories.map((category) => (
                  <motion.div
                    key={category.id}
                    whileHover={{ x: 2 }}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={filters.categories.includes(category.id)}
                      onCheckedChange={() => toggleMultiSelectFilter('categories', category.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`category-${category.id}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-gray-700">{category.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </label>
                  </motion.div>
                ))}
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          <Separator className="my-2" />

          {/* Colors */}
          <AccordionItem value="colors" className="border-b-0">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Color</span>
                {filters.colors.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                    {filters.colors.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pb-4"
              >
                {FILTER_DATA.colors.map((color) => (
                  <motion.div
                    key={color.id}
                    whileHover={{ x: 2 }}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={`color-${color.id}`}
                      checked={filters.colors.includes(color.id)}
                      onCheckedChange={() => toggleMultiSelectFilter('colors', color.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`color-${color.id}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: color.id }}
                        />
                        <span className="text-gray-700">{color.label}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {color.count}
                      </span>
                    </label>
                  </motion.div>
                ))}
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          <Separator className="my-2" />

          {/* Materials */}
          <AccordionItem value="materials" className="border-b-0">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Material</span>
                {filters.materials.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                    {filters.materials.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pb-4"
              >
                {FILTER_DATA.materials.map((material) => (
                  <motion.div
                    key={material.id}
                    whileHover={{ x: 2 }}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={`material-${material.id}`}
                      checked={filters.materials.includes(material.id)}
                      onCheckedChange={() => toggleMultiSelectFilter('materials', material.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`material-${material.id}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-gray-700">{material.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {material.count}
                      </span>
                    </label>
                  </motion.div>
                ))}
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          <Separator className="my-2" />

          {/* Patterns */}
          <AccordionItem value="patterns" className="border-b-0">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Pattern</span>
                {filters.patterns.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                    {filters.patterns.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pb-4"
              >
                {FILTER_DATA.patterns.map((pattern) => (
                  <motion.div
                    key={pattern.id}
                    whileHover={{ x: 2 }}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={`pattern-${pattern.id}`}
                      checked={filters.patterns.includes(pattern.id)}
                      onCheckedChange={() => toggleMultiSelectFilter('patterns', pattern.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`pattern-${pattern.id}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-gray-700">{pattern.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {pattern.count}
                      </span>
                    </label>
                  </motion.div>
                ))}
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          <Separator className="my-2" />

          {/* Price Range */}
          <AccordionItem value="price" className="border-b-0">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Price Range</span>
                {(filters.priceRange[0] > 0 || filters.priceRange[1] < 500) && (
                  <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                    ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pb-4 space-y-4"
              >
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value)}
                    max={500}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>${filters.priceRange[0]}</span>
                  <span>${filters.priceRange[1]}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min</label>
                    <Input
                      type="number"
                      value={filters.priceRange[0]}
                      onChange={(e) => updateFilter('priceRange', [parseInt(e.target.value) || 0, filters.priceRange[1]])}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max</label>
                    <Input
                      type="number"
                      value={filters.priceRange[1]}
                      onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], parseInt(e.target.value) || 500])}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>

          <Separator className="my-2" />

          {/* Availability */}
          <AccordionItem value="availability" className="border-b-0">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <span className="font-medium text-gray-900">Availability</span>
                {filters.availability.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 text-xs">
                    {filters.availability.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pb-4"
              >
                {[
                  { id: 'in-stock', label: 'In Stock', count: 156 },
                  { id: 'low-stock', label: 'Low Stock', count: 23 },
                  { id: 'made-to-order', label: 'Made to Order', count: 89 },
                  { id: 'swatch-available', label: 'Swatch Available', count: 201 }
                ].map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: 2 }}
                    className="flex items-center space-x-3"
                  >
                    <Checkbox
                      id={`availability-${item.id}`}
                      checked={filters.availability.includes(item.id)}
                      onCheckedChange={() => toggleMultiSelectFilter('availability', item.id)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={`availability-${item.id}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center justify-between"
                    >
                      <span className="text-gray-700">{item.label}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    </label>
                  </motion.div>
                ))}
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

// Active Filters Chips Component
export const ActiveFiltersChips: React.FC<{
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}> = ({ filters, onFiltersChange }) => {
  
  const removeFilter = (type: keyof FilterState, value?: string) => {
    if (type === 'search') {
      onFiltersChange({ ...filters, search: '' })
    } else if (type === 'priceRange') {
      onFiltersChange({ ...filters, priceRange: [0, 500] })
    } else if (value && Array.isArray(filters[type])) {
      const newArray = (filters[type] as string[]).filter(item => item !== value)
      onFiltersChange({ ...filters, [type]: newArray })
    }
  }

  const clearAllFilters = () => {
    onFiltersChange(initialFilters)
  }

  const getActiveFilters = () => {
    const activeFilters: Array<{ type: keyof FilterState; label: string; value?: string }> = []
    
    if (filters.search) {
      activeFilters.push({ type: 'search', label: `Search: "${filters.search}"` })
    }
    
    filters.colors.forEach(color => {
      const colorData = FILTER_DATA.colors.find(c => c.id === color)
      activeFilters.push({ type: 'colors', label: `Color: ${colorData?.label || color}`, value: color })
    })
    
    filters.materials.forEach(material => {
      const materialData = FILTER_DATA.materials.find(m => m.id === material)
      activeFilters.push({ type: 'materials', label: `Material: ${materialData?.label || material}`, value: material })
    })
    
    filters.patterns.forEach(pattern => {
      const patternData = FILTER_DATA.patterns.find(p => p.id === pattern)
      activeFilters.push({ type: 'patterns', label: `Pattern: ${patternData?.label || pattern}`, value: pattern })
    })
    
    filters.categories.forEach(category => {
      const categoryData = FILTER_DATA.categories.find(c => c.id === category)
      activeFilters.push({ type: 'categories', label: `Category: ${categoryData?.label || category}`, value: category })
    })
    
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) {
      activeFilters.push({ 
        type: 'priceRange', 
        label: `Price: $${filters.priceRange[0]} - $${filters.priceRange[1]}` 
      })
    }
    
    filters.availability.forEach(avail => {
      const availData = [
        { id: 'in-stock', label: 'In Stock' },
        { id: 'low-stock', label: 'Low Stock' },
        { id: 'made-to-order', label: 'Made to Order' },
        { id: 'swatch-available', label: 'Swatch Available' }
      ].find(a => a.id === avail)
      activeFilters.push({ type: 'availability', label: `${availData?.label || avail}`, value: avail })
    })
    
    return activeFilters
  }

  const activeFilters = getActiveFilters()
  
  if (activeFilters.length === 0) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          Active Filters ({activeFilters.length})
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearAllFilters}
          className="text-xs text-gray-500 hover:text-gray-700 h-auto p-1"
        >
          Clear all
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter, index) => (
          <motion.div
            key={`${filter.type}-${filter.value || index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
          >
            <Badge 
              variant="secondary" 
              className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer pr-1 pl-3 py-1.5 rounded-full"
              onClick={() => removeFilter(filter.type, filter.value)}
            >
              <span className="mr-1 text-xs">{filter.label}</span>
              <X className="w-3 h-3 ml-1 hover:bg-blue-200 rounded-full p-0.5" />
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Main FiltersSidebar Component
export const FiltersSidebar: React.FC<{
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
}> = ({ filters, onFiltersChange }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="w-80 h-full bg-white border-r border-gray-200 sticky top-0">
          <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="inline-flex items-center gap-2 border-gray-300"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {(() => {
                let count = 0
                if (filters.search) count++
                count += filters.colors.length
                count += filters.materials.length
                count += filters.patterns.length
                count += filters.categories.length
                if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++
                count += filters.availability.length
                return count > 0 ? (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs ml-1">
                    {count}
                  </Badge>
                ) : null
              })()}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 p-0">
            <FilterContent filters={filters} onFiltersChange={onFiltersChange} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

// Example usage hook
export const useFilters = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  
  return {
    filters,
    setFilters,
    resetFilters: () => setFilters(initialFilters)
  }
}

export default FiltersSidebar
export type { FilterState }