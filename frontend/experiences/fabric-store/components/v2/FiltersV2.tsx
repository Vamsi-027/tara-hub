'use client'

import { FilterStateV2 } from './BrowsePageV2'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Palette, Sparkles, Tag, DollarSign, Package } from 'lucide-react'

// Color swatches with hex values
const colorOptions = [
  { name: 'Red', hex: '#DC2626', family: 'red' },
  { name: 'Blue', hex: '#2563EB', family: 'blue' },
  { name: 'Green', hex: '#16A34A', family: 'green' },
  { name: 'Yellow', hex: '#EAB308', family: 'yellow' },
  { name: 'Purple', hex: '#9333EA', family: 'purple' },
  { name: 'Pink', hex: '#EC4899', family: 'pink' },
  { name: 'Gray', hex: '#6B7280', family: 'gray' },
  { name: 'Black', hex: '#000000', family: 'black' },
  { name: 'White', hex: '#FFFFFF', family: 'white' },
  { name: 'Brown', hex: '#92400E', family: 'brown' },
  { name: 'Navy', hex: '#1E3A8A', family: 'navy' },
  { name: 'Beige', hex: '#D4B896', family: 'beige' }
]

// Pattern thumbnails
const patternOptions = [
  { name: 'Solid', preview: '▪' },
  { name: 'Striped', preview: '|||' },
  { name: 'Plaid', preview: '⊞' },
  { name: 'Floral', preview: '✿' },
  { name: 'Geometric', preview: '◈' },
  { name: 'Abstract', preview: '∿' },
  { name: 'Paisley', preview: '❦' },
  { name: 'Dots', preview: '•••' }
]

// Material options with icons
const materialOptions = [
  { name: 'Cotton', icon: '🌿' },
  { name: 'Silk', icon: '🦋' },
  { name: 'Wool', icon: '🐑' },
  { name: 'Linen', icon: '🌾' },
  { name: 'Velvet', icon: '✨' },
  { name: 'Leather', icon: '🪶' },
  { name: 'Polyester', icon: '🧵' },
  { name: 'Rayon', icon: '🪡' }
]

interface FiltersV2Props {
  filters: FilterStateV2
  onFiltersChange: (filters: FilterStateV2) => void
  onClear: () => void
}

export function FiltersV2({ filters, onFiltersChange, onClear }: FiltersV2Props) {
  const updateFilter = <K extends keyof FilterStateV2>(key: K, value: FilterStateV2[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleArrayItem = <T extends string>(array: T[], item: T): T[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-red-600 hover:text-red-700">
          Clear all
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['colors', 'materials', 'patterns', 'price']} className="space-y-4">
        {/* Colors with Visual Swatches */}
        <AccordionItem value="colors">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Colors
              {filters.colors.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {filters.colors.length}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-4 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateFilter('colors', toggleArrayItem(filters.colors, color.family))}
                  className={`
                    group relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all
                    ${filters.colors.includes(color.family)
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                    }
                  `}
                  aria-label={`Filter by ${color.name} color`}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all
                      ${filters.colors.includes(color.family)
                        ? 'border-blue-500 scale-110'
                        : 'border-gray-300 group-hover:border-gray-400'
                      }
                    `}
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs text-gray-600">{color.name}</span>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Materials with Icons */}
        <AccordionItem value="materials">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Materials
              {filters.materials.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {filters.materials.length}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {materialOptions.map((material) => (
                <label
                  key={material.name}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.materials.includes(material.name)}
                    onCheckedChange={() =>
                      updateFilter('materials', toggleArrayItem(filters.materials, material.name))
                    }
                  />
                  <span className="text-lg">{material.icon}</span>
                  <span className="text-sm text-gray-700">{material.name}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Patterns with Visual Previews */}
        <AccordionItem value="patterns">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Patterns
              {filters.patterns.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {filters.patterns.length}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {patternOptions.map((pattern) => (
                <button
                  key={pattern.name}
                  onClick={() => updateFilter('patterns', toggleArrayItem(filters.patterns, pattern.name))}
                  className={`
                    flex items-center gap-2 p-2 rounded-lg border transition-all
                    ${filters.patterns.includes(pattern.name)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="text-lg font-mono">{pattern.preview}</span>
                  <span className="text-sm">{pattern.name}</span>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Price Range
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                min={0}
                max={1000}
                step={10}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="px-3 py-1 bg-gray-100 rounded-md font-medium">
                  ${filters.priceRange[0]}
                </span>
                <span className="text-gray-400">to</span>
                <span className="px-3 py-1 bg-gray-100 rounded-md font-medium">
                  ${filters.priceRange[1]}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability */}
        <AccordionItem value="availability">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Availability
              {filters.availability.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {filters.availability.length}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Checkbox
                  checked={filters.availability.includes('in-stock')}
                  onCheckedChange={() =>
                    updateFilter('availability', toggleArrayItem(filters.availability, 'in-stock'))
                  }
                />
                <span className="text-sm text-gray-700">In Stock</span>
              </label>
              <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <Checkbox
                  checked={filters.availability.includes('swatch-available')}
                  onCheckedChange={() =>
                    updateFilter('availability', toggleArrayItem(filters.availability, 'swatch-available'))
                  }
                />
                <span className="text-sm text-gray-700">Swatch Available</span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}