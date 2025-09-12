'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Grid3X3, List } from 'lucide-react'
import { FiltersSidebar, ActiveFiltersChips, useFilters, type FilterState } from './FiltersSidebar'
import { Button } from '@/components/ui/button'
import Header from '@/components/header'
import type { Fabric } from '../lib/fabric-api'

// Mock fabric data for demonstration
const MOCK_FABRICS: Fabric[] = [
  {
    id: '1',
    name: 'Palisade Fountain',
    sku: 'PAL-FTN-001',
    category: 'Upholstery',
    collection: 'Palisade',
    price: 125.00,
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    swatch_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    status: 'active',
    description: 'Beautiful fountain pattern upholstery fabric',
    color: 'Blue',
    color_family: 'Blue',
    color_hex: '#2563eb',
    pattern: 'Geometric',
    usage: 'Indoor',
    properties: ['Durable', 'Stain Resistant'],
    composition: '100% Cotton',
    width: '54 inches',
    weight: 'Medium',
    durability: '50000 double rubs',
    care_instructions: 'Professional cleaning recommended',
    in_stock: true,
    stock_quantity: 25,
    swatch_price: 8.00,
    swatch_in_stock: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-03-01T14:30:00Z'
  },
  {
    id: '2',
    name: 'Vintage Linen',
    sku: 'VTG-LIN-002',
    category: 'Drapery',
    collection: 'Heritage',
    price: 89.00,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
    swatch_image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    status: 'active',
    description: 'Classic vintage linen with natural texture',
    color: 'Cream',
    color_family: 'Neutral',
    color_hex: '#f5f5dc',
    pattern: 'Solid',
    usage: 'Indoor',
    properties: ['Natural', 'Breathable'],
    composition: '100% Linen',
    width: '60 inches',
    weight: 'Light',
    durability: '25000 double rubs',
    care_instructions: 'Machine wash cold',
    in_stock: true,
    stock_quantity: 18,
    swatch_price: 6.50,
    swatch_in_stock: true,
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-03-05T16:00:00Z'
  },
  {
    id: '3',
    name: 'Royal Velvet',
    sku: 'RYL-VLV-003',
    category: 'Upholstery',
    collection: 'Luxury',
    price: 245.00,
    images: ['https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400'],
    swatch_image_url: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400',
    status: 'active',
    description: 'Luxurious royal velvet for premium projects',
    color: 'Deep Purple',
    color_family: 'Purple',
    color_hex: '#6a0dad',
    pattern: 'Solid',
    usage: 'Indoor',
    properties: ['Luxurious', 'Soft Touch'],
    composition: '100% Cotton Velvet',
    width: '54 inches',
    weight: 'Heavy',
    durability: '40000 double rubs',
    care_instructions: 'Professional dry clean only',
    in_stock: false,
    stock_quantity: 0,
    swatch_price: 12.00,
    swatch_in_stock: true,
    created_at: '2024-01-20T11:00:00Z',
    updated_at: '2024-02-28T13:15:00Z'
  }
]

// Fabric Card Component
const FabricCard: React.FC<{ fabric: Fabric; viewMode: 'grid' | 'list' }> = ({ fabric, viewMode }) => {
  const [imageLoading, setImageLoading] = useState(true)
  
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 p-6"
      >
        <div className="flex gap-6">
          <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
            {imageLoading && (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
            )}
            <img
              src={fabric.swatch_image_url}
              alt={fabric.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">{fabric.name}</h3>
                <p className="text-sm text-gray-500">{fabric.sku}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${fabric.price.toFixed(2)}</div>
                <div className="text-sm text-gray-500">per yard</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: fabric.color_hex }}
                />
                {fabric.color}
              </span>
              <span>{fabric.composition}</span>
              <span>{fabric.pattern}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                fabric.in_stock 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {fabric.in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{fabric.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Swatch: ${fabric.swatch_price.toFixed(2)}
              </div>
              <Button size="sm" className="rounded-full">
                Add Swatch
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="aspect-square overflow-hidden bg-gray-100 relative">
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}
        <img
          src={fabric.swatch_image_url}
          alt={fabric.name}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
        />
        
        {fabric.price > 150 && (
          <div className="absolute top-3 left-3">
            <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Premium
            </div>
          </div>
        )}
        
        <div className="absolute top-3 right-3">
          <div 
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: fabric.color_hex }}
            title={fabric.color}
          />
        </div>
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Button size="sm" className="w-full rounded-full">
              Add Swatch
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
            {fabric.name}
          </h3>
          <p className="text-sm text-gray-500">{fabric.sku}</p>
        </div>
        
        <div className="space-y-2 mb-4 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Material:</span>
            <span className="font-medium">{fabric.composition}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Pattern:</span>
            <span className="font-medium">{fabric.pattern}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <span className={`font-medium ${
              fabric.in_stock ? 'text-green-600' : 'text-red-600'
            }`}>
              {fabric.in_stock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              ${fabric.price.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">per yard</div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Swatch</div>
            <div className="text-lg font-semibold text-gray-900">
              ${fabric.swatch_price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main Modern Browse Page Component
export const ModernBrowsePage: React.FC = () => {
  const { filters, setFilters } = useFilters()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [fabrics, setFabrics] = useState<Fabric[]>(MOCK_FABRICS)
  
  // Filter fabrics based on current filters (simplified for demo)
  const filteredFabrics = React.useMemo(() => {
    return MOCK_FABRICS.filter(fabric => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (!fabric.name.toLowerCase().includes(searchLower) &&
            !fabric.sku.toLowerCase().includes(searchLower) &&
            !fabric.description.toLowerCase().includes(searchLower)) {
          return false
        }
      }
      
      // Category filter
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(fabric.category.toLowerCase())) {
          return false
        }
      }
      
      // Color filter
      if (filters.colors.length > 0) {
        if (!filters.colors.includes(fabric.color_family.toLowerCase())) {
          return false
        }
      }
      
      // Material filter
      if (filters.materials.length > 0) {
        const fabricMaterial = fabric.composition.toLowerCase()
        if (!filters.materials.some(material => fabricMaterial.includes(material))) {
          return false
        }
      }
      
      // Pattern filter
      if (filters.patterns.length > 0) {
        if (!filters.patterns.includes(fabric.pattern.toLowerCase())) {
          return false
        }
      }
      
      // Price filter
      if (fabric.price < filters.priceRange[0] || fabric.price > filters.priceRange[1]) {
        return false
      }
      
      // Availability filter
      if (filters.availability.includes('in-stock') && !fabric.in_stock) {
        return false
      }
      if (filters.availability.includes('swatch-available') && !fabric.swatch_in_stock) {
        return false
      }
      
      return true
    })
  }, [filters])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-yellow-400 font-medium uppercase tracking-wide text-sm">
                Curated Collection
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              Discover Premium Fabrics
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Explore our meticulously curated selection of premium textiles, 
              each piece chosen for its exceptional quality and timeless elegance.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <FiltersSidebar filters={filters} onFiltersChange={setFilters} />

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Active Filters Chips */}
            <ActiveFiltersChips filters={filters} onFiltersChange={setFilters} />

            {/* Results Header */}
            <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-2xl border border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  <span className="font-semibold text-gray-900">{filteredFabrics.length}</span> 
                  {' '}fabrics found
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'shadow-sm' : ''}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'shadow-sm' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Mobile Filter Button */}
                <div className="lg:hidden">
                  <FiltersSidebar filters={filters} onFiltersChange={setFilters} />
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {filteredFabrics.length > 0 ? (
              <div className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'space-y-6'
              }`}>
                {filteredFabrics.map((fabric, index) => (
                  <motion.div
                    key={fabric.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <FabricCard fabric={fabric} viewMode={viewMode} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-2xl border border-gray-200"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Grid3X3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No fabrics found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button 
                  onClick={() => setFilters({ 
                    search: '', colors: [], materials: [], patterns: [], categories: [], 
                    priceRange: [0, 500], availability: [] 
                  })}
                  variant="outline"
                >
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernBrowsePage