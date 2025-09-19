'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Category {
  name: string
  subcategories?: string[]
  count?: number
  icon?: string
}

const categories: Category[] = [
  {
    name: 'Upholstery',
    subcategories: ['Velvet', 'Leather', 'Canvas', 'Chenille', 'Microfiber'],
    count: 245,
    icon: '🛋️'
  },
  {
    name: 'Drapery',
    subcategories: ['Sheer', 'Blackout', 'Linen', 'Silk', 'Cotton Blend'],
    count: 189,
    icon: '🪟'
  },
  {
    name: 'Apparel',
    subcategories: ['Cotton', 'Silk', 'Wool', 'Denim', 'Jersey'],
    count: 312,
    icon: '👗'
  },
  {
    name: 'Outdoor',
    subcategories: ['Sunbrella', 'Marine Vinyl', 'Waterproof', 'UV Resistant'],
    count: 87,
    icon: '☂️'
  },
  {
    name: 'Specialty',
    subcategories: ['Fire Retardant', 'Antimicrobial', 'Stain Resistant', 'Eco-Friendly'],
    count: 56,
    icon: '✨'
  }
]

interface CategoryHierarchyProps {
  selectedCategories: string[]
  selectedSubcategories: string[]
  onCategoryChange: (categories: string[], subcategories: string[]) => void
}

export function CategoryHierarchy({
  selectedCategories,
  selectedSubcategories,
  onCategoryChange
}: CategoryHierarchyProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      // Deselect category and its subcategories
      onCategoryChange([], [])
      setExpandedCategory(null)
    } else {
      // Select category
      onCategoryChange([categoryName], [])
      setExpandedCategory(categoryName)
    }
  }

  const handleSubcategoryClick = (categoryName: string, subcategoryName: string) => {
    if (selectedSubcategories.includes(subcategoryName)) {
      // Deselect subcategory
      const newSubcategories = selectedSubcategories.filter(s => s !== subcategoryName)
      onCategoryChange(selectedCategories, newSubcategories)
    } else {
      // Select subcategory (ensure parent category is selected)
      if (!selectedCategories.includes(categoryName)) {
        onCategoryChange([categoryName], [subcategoryName])
      } else {
        onCategoryChange(selectedCategories, [...selectedSubcategories, subcategoryName])
      }
    }
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Main Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.name)
            const isExpanded = expandedCategory === category.name

            return (
              <div key={category.name} className="flex-shrink-0">
                <button
                  onClick={() => handleCategoryClick(category.name)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                    ${isSelected
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                  {category.count && (
                    <span className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      ({category.count})
                    </span>
                  )}
                  {category.subcategories && (
                    isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Subcategories Dropdown */}
                {isExpanded && category.subcategories && (
                  <div className="absolute z-10 mt-2 bg-white rounded-lg shadow-xl border p-2 min-w-[200px]">
                    {category.subcategories.map((subcategory) => {
                      const isSubSelected = selectedSubcategories.includes(subcategory)

                      return (
                        <button
                          key={subcategory}
                          onClick={() => handleSubcategoryClick(category.name, subcategory)}
                          className={`
                            w-full text-left px-3 py-2 rounded-md transition-all text-sm
                            ${isSubSelected
                              ? 'bg-gray-900 text-white'
                              : 'hover:bg-gray-100 text-gray-700'
                            }
                          `}
                        >
                          {subcategory}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected Subcategories Pills */}
        {selectedSubcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-gray-500">Subcategories:</span>
            {selectedSubcategories.map((subcategory) => (
              <span
                key={subcategory}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-900 text-white rounded-full text-xs"
              >
                {subcategory}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}