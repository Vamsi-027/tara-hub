'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ZoomIn, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Star,
  Info,
  Package,
  Award,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { useFabric, useFabrics } from '../../../hooks/useFabrics'
import type { Fabric } from '../../../lib/fabric-api'

// Tooltip Component
function Tooltip({ children, content }: { children: React.ReactNode, content: string }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}


// Image Gallery Component
function ImageGallery({ images, productName }: { images: string[], productName: string }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const imageUrls = images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800']

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
        <Image
          src={imageUrls[selectedImage]}
          alt={productName}
          fill
          className={`object-cover transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        
        {/* Zoom Toggle */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Thumbnail Gallery */}
      {imageUrls.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {imageUrls.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index 
                  ? 'border-blue-500 ring-2 ring-blue-500/20' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} view ${index + 1}`}
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Product Details Component
function ProductDetails({ fabric }: { fabric: Fabric }) {
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedVariantType, setSelectedVariantType] = useState<'Swatch' | 'Fabric'>('Fabric')
  const [activeTab, setActiveTab] = useState('details')

  const handleAddToCart = () => {
    // Find the selected variant from fabric.variants if available
    const selectedVariant = fabric.variants?.find(v => v.type === selectedVariantType)
    
    console.log('Adding to cart:', { 
      fabricId: fabric.id,
      fabricName: fabric.name,
      variantType: selectedVariantType,
      variantId: selectedVariant?.id,
      sku: selectedVariant?.sku || fabric.sku,
      quantity,
      unitPrice: selectedVariantType === 'Swatch' ? (fabric.swatch_price || 5) : (fabric.price || 99),
      total: (selectedVariantType === 'Swatch' 
        ? (fabric.swatch_price || 5) * quantity
        : (fabric.price || 99) * quantity)
    })
    // Show success feedback
    alert(`Added ${quantity} ${selectedVariantType.toLowerCase()}${quantity > 1 ? 's' : ''} to cart!`)
  }

  const handleAddToWishlist = () => {
    setIsFavorite(!isFavorite)
    console.log('Toggle wishlist:', fabric.id, !isFavorite)
  }

  // Dynamic field filtering function
  const getRelevantFields = (fabric: Fabric) => {
    const hasValue = (value: any): boolean => {
      return value !== null && 
             value !== undefined && 
             value !== '' && 
             value !== 'Standard' &&
             value !== 'No' &&
             !(Array.isArray(value) && value.length === 0)
    }

    const fields = [
      // Basic Properties
      { label: 'Material', value: fabric.material || fabric.fiber_content || fabric.composition, category: 'basic' },
      { label: 'Width', value: fabric.width, category: 'basic' },
      { label: 'Weight', value: fabric.weight, category: 'basic' },
      { label: 'Pattern', value: fabric.pattern, category: 'basic' },
      { label: 'Style', value: fabric.style, category: 'basic' },
      { label: 'Grade', value: fabric.grade, category: 'basic' },
      { label: 'Brand', value: fabric.brand, category: 'basic' },
      { label: 'Collection', value: fabric.collection, category: 'basic' },
      { label: 'Category', value: fabric.category, category: 'basic' },
      
      // Color & Design
      { label: 'Color Family', value: fabric.color_family, category: 'color' },
      { label: 'Primary Color', value: fabric.primary_color, category: 'color' },
      { label: 'Secondary Colors', value: fabric.secondary_colors?.join(', '), category: 'color' },
      { label: 'Color Hex', value: fabric.color_hex, category: 'color' },
      
      // Dimensions & Repeats
      { label: 'Horizontal Repeat', value: fabric.h_repeat, category: 'dimensions' },
      { label: 'Vertical Repeat', value: fabric.v_repeat, category: 'dimensions' },
      
      // Performance
      { label: 'Durability', value: fabric.durability, category: 'performance' },
      { label: 'Martindale Rating', value: fabric.martindale ? `${fabric.martindale} cycles` : null, category: 'performance' },
      { label: 'Usage', value: fabric.usage || fabric.usage_suitability, category: 'performance' },
      { label: 'Application Type', value: fabric.types, category: 'performance' },
      { label: 'Performance Metrics', value: fabric.performance_metrics, category: 'performance' },
      
      // Care & Maintenance
      { label: 'Care Instructions', value: fabric.care_instructions || fabric.cleaning, category: 'care' },
      { label: 'Cleaning Code', value: fabric.cleaning_code, category: 'care' },
      { label: 'Machine Washable', value: fabric.washable ? 'Yes' : null, category: 'care' },
      { label: 'Bleach Safe', value: fabric.bleach_cleanable ? 'Yes' : null, category: 'care' },
      
      // Resistance Properties
      { label: 'Stain Resistant', value: fabric.stain_resistant ? 'Yes' : null, category: 'features' },
      { label: 'Fade Resistant', value: fabric.fade_resistant ? 'Yes' : null, category: 'features' },
      
      // Compliance & Safety
      { label: 'CA 117 Compliant', value: fabric.ca_117 ? 'Yes' : null, category: 'features' },
      
      // Additional Features
      { label: 'Quick Ship', value: fabric.quick_ship ? 'Available' : null, category: 'features' },
      { label: 'Closeout', value: fabric.closeout ? 'Yes' : null, category: 'features' },
      
      // Business Info
      { label: 'Supplier', value: fabric.supplier_name, category: 'business' },
      { label: 'Availability', value: fabric.availability, category: 'business' },
      { label: 'Stock Unit', value: fabric.stock_unit, category: 'business' },
      { label: 'Low Stock Threshold', value: fabric.low_stock_threshold, category: 'business' },
      
      // Technical Documents
      { label: 'Technical Documents', value: fabric.technical_documents, category: 'technical' },
      { label: 'Cleaning PDF', value: fabric.cleaning_pdf, category: 'technical' },
      
      // Pricing
      { label: 'Swatch Price', value: fabric.swatch_price ? `$${fabric.swatch_price}` : null, category: 'pricing' },
      { label: 'Procurement Cost', value: fabric.procurement_cost ? `$${fabric.procurement_cost}` : null, category: 'pricing' },
      
      // Metadata
      { label: 'SKU', value: fabric.sku, category: 'meta' },
      { label: 'Is Featured', value: fabric.is_featured ? 'Yes' : null, category: 'meta' },
      { label: 'Keywords', value: fabric.keywords, category: 'meta' },
      { label: 'Version', value: fabric.version, category: 'meta' }
    ]

    return fields.filter(field => hasValue(field.value))
  }

  const relevantFields = getRelevantFields(fabric)
  
  // Group specifications by category
  const groupedSpecs = relevantFields.reduce((acc, spec) => {
    if (!acc[spec.category]) acc[spec.category] = []
    acc[spec.category].push(spec)
    return acc
  }, {} as Record<string, typeof relevantFields>)

  const tabs = [
    { id: 'details', label: 'Details & Care', icon: '📋' },
    { id: 'specifications', label: 'Specifications', icon: '📊' }
  ]

  return (
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="space-y-4">
        {/* Brand & Category Badge */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {fabric.brand && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {fabric.brand}
              </span>
            )}
            {fabric.collection && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {fabric.collection}
              </span>
            )}
            {fabric.category && (
              <span className="text-gray-500 text-sm">• {fabric.category}</span>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToWishlist}
              className={`p-2 rounded-lg border transition-all ${
                isFavorite 
                  ? 'border-red-300 bg-red-50 text-red-600' 
                  : 'border-gray-300 hover:border-gray-400 text-gray-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-600 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Title */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            {fabric.name}
          </h1>
          
          {/* Rating & Reviews */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm font-medium text-gray-700 ml-2">4.8</span>
              <span className="text-sm text-gray-500">(124 reviews)</span>
            </div>
            {fabric.sku && (
              <span className="text-sm text-gray-500 font-mono">SKU: {fabric.sku}</span>
            )}
          </div>
        </div>

        {/* Product Description */}
        {fabric.description && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">
              {fabric.description}
            </p>
          </div>
        )}
      </div>

      {/* Variant Selection and Price Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* Variant Selector */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Select Option:</label>
          <div className="grid grid-cols-2 gap-2">
            {/* Swatch Option */}
            <button
              onClick={() => setSelectedVariantType('Swatch')}
              className={`border-2 rounded-lg p-3 transition-all ${
                selectedVariantType === 'Swatch'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-sm mb-1">Swatch Sample</div>
                <div className="text-xs text-gray-600 mb-2">{fabric.swatch_size || '4x4 inches'}</div>
                <div className="text-lg font-bold text-gray-900">
                  ${(fabric.swatch_price || 5).toFixed(2)}
                </div>
                {fabric.swatch_in_stock ? (
                  <span className="text-xs text-green-600">✓ In Stock</span>
                ) : (
                  <span className="text-xs text-red-600">Out of Stock</span>
                )}
              </div>
            </button>

            {/* Fabric Option */}
            <button
              onClick={() => setSelectedVariantType('Fabric')}
              className={`border-2 rounded-lg p-3 transition-all ${
                selectedVariantType === 'Fabric'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-sm mb-1">Full Fabric</div>
                <div className="text-xs text-gray-600 mb-2">Min: {fabric.minimum_order_yards || '1'} yard</div>
                <div className="text-lg font-bold text-gray-900">
                  ${(fabric.price || 99).toFixed(2)}<span className="text-xs text-gray-600">/yard</span>
                </div>
                {fabric.in_stock ? (
                  <span className="text-xs text-green-600">✓ In Stock</span>
                ) : (
                  <span className="text-xs text-red-600">Out of Stock</span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Selected Price Display */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-gray-100">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              ${selectedVariantType === 'Swatch' 
                ? (fabric.swatch_price || 5).toFixed(2)
                : (fabric.price || 99).toFixed(2)}
            </span>
            <span className="text-sm text-gray-600">
              {selectedVariantType === 'Swatch' ? 'per swatch' : `per ${fabric.stock_unit || 'yard'}`}
            </span>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {(selectedVariantType === 'Swatch' ? fabric.swatch_in_stock : fabric.in_stock) ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">In Stock</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700">Out of Stock</span>
              </>
            )}
          </div>
        </div>

        {/* Key Features - Compact */}
        <div className="flex flex-wrap gap-1 mt-3">
          {fabric.width && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
              📏 {fabric.width}
            </span>
          )}
          {fabric.usage && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
              🏠 {fabric.usage}
            </span>
          )}
          {fabric.grade && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
              Grade: {fabric.grade}
            </span>
          )}
          {fabric.quick_ship && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              ⚡ Quick Ship
            </span>
          )}
        </div>
      </div>


      {/* Purchase Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {/* Quantity & Total */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedVariantType === 'Swatch' ? 'Quantity:' : 'Yards:'}
            </span>
            <div className="flex items-center border border-gray-300 rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-1 hover:bg-gray-100 disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-3 py-1 font-medium text-sm min-w-[30px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-1 hover:bg-gray-100"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Total:</div>
            <div className="text-lg font-bold text-gray-900">
              ${(selectedVariantType === 'Swatch' 
                ? (fabric.swatch_price || 5) * quantity
                : (fabric.price || 99) * quantity
              ).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Variant Info */}
        {selectedVariantType === 'Fabric' && fabric.minimum_order_yards && parseInt(fabric.minimum_order_yards) > 1 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3">
            <p className="text-xs text-yellow-800">
              Minimum order: {fabric.minimum_order_yards} yards
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add {selectedVariantType} to Cart
          </button>

          <div className="flex gap-2">
            {selectedVariantType === 'Fabric' && (
              <button 
                onClick={() => setSelectedVariantType('Swatch')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Package className="w-3 h-3" />
                Order Swatch
              </button>
            )}
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm font-medium transition-colors flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              Request Quote
            </button>
          </div>
        </div>
      </div>


      {/* Tabbed Content */}
      <div className="space-y-6 border-t border-gray-200 pt-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* Details & Care Tab */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Essential Details */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Essential Details
                </h3>
                
                <div className="space-y-4">
                  {/* Key Specifications */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {relevantFields.slice(0, 6).map((field, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">{field.label}</span>
                        <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          {field.label === 'Color Hex' && field.value ? (
                            <>
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: field.value }}
                              ></div>
                              <span className="font-mono">{field.value}</span>
                            </>
                          ) : (
                            field.value
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Product Description */}
                  {fabric.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700 leading-relaxed">{fabric.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Care Instructions */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Care & Maintenance
                </h3>
                
                <div className="space-y-4">
                  {/* Care Instructions */}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Care Instructions</h4>
                    <p className="text-green-700 text-sm">
                      {fabric.care_instructions || fabric.cleaning || 'Professional cleaning recommended for best results.'}
                    </p>
                  </div>

                  {/* Care Properties */}
                  {groupedSpecs.care && groupedSpecs.care.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Care Properties</h4>
                      {groupedSpecs.care
                        .filter(spec => spec.label !== 'Care Instructions') // Filter out duplicate care instructions
                        .map((spec, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm font-medium text-gray-600">{spec.label}</span>
                          <span className="text-sm font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Performance Features */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Performance Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {fabric.properties?.map((prop, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {prop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Specifications Tab - Clean Professional Design */}
          {activeTab === 'specifications' && Object.keys(groupedSpecs).length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Technical Specifications</h3>
              
              {/* Essential Specifications - Clean List Format */}
              <div className="space-y-6">
                {Object.entries(groupedSpecs).map(([category, specs]) => {
                  if (category === 'care' || category === 'meta' || category === 'technical') return null
                  
                  const categoryNames = {
                    basic: 'Material & Construction',
                    color: 'Color & Design',
                    dimensions: 'Dimensions',
                    performance: 'Performance',
                    features: 'Features',
                    business: 'Availability',
                    pricing: 'Pricing'
                  }
                  
                  return (
                    <div key={category} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-900">{categoryNames[category as keyof typeof categoryNames] || category}</h4>
                      </div>
                      <div className="px-6 py-4">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                          {specs.map((spec, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <dt className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                {spec.label}
                                {spec.label === 'Grade' && (
                                  <Tooltip content="Quality grade indicating suitability for different applications">
                                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                  </Tooltip>
                                )}
                              </dt>
                              <dd className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                {spec.label === 'Color Hex' && spec.value ? (
                                  <>
                                    <div 
                                      className="w-4 h-4 rounded-full border border-gray-300"
                                      style={{ backgroundColor: spec.value }}
                                    ></div>
                                    <span className="font-mono">{spec.value}</span>
                                  </>
                                ) : (
                                  spec.value
                                )}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Key Features Summary */}
              {(fabric.width || fabric.usage || fabric.category) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {fabric.width && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300">
                        📏 {fabric.width}
                      </span>
                    )}
                    {fabric.usage && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300">
                        🏠 {fabric.usage}
                      </span>
                    )}
                    {fabric.category && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300">
                        🏷️ {fabric.category}
                      </span>
                    )}
                    {fabric.pattern && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300">
                        🎨 {fabric.pattern}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// Related Products Component
function RelatedProducts({ currentFabric }: { currentFabric: Fabric }) {
  const router = useRouter()
  
  // Fetch related fabrics from the same category or collection
  const { fabrics: relatedFabrics, loading } = useFabrics({
    limit: 8,
    page: 1,
    category: currentFabric.category || undefined,
    collection: currentFabric.collection || undefined
  })

  // Filter out the current fabric and limit to 4 items
  const filteredRelated = relatedFabrics
    .filter(fabric => fabric.id !== currentFabric.id)
    .slice(0, 4)

  if (loading || filteredRelated.length === 0) {
    return null
  }

  return (
    <div className="mt-16 border-t border-gray-200 pt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Related Fabrics</h2>
        <Link
          href="/browse"
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View All
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredRelated.map((fabric) => (
          <div
            key={fabric.id}
            onClick={() => router.push(`/fabric/${fabric.id}`)}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer overflow-hidden group"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
              <Image
                src={fabric.swatch_image_url || fabric.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
                alt={fabric.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              
              {/* Stock Badge */}
              {fabric.in_stock && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-green-600/90 backdrop-blur-sm text-white text-[10px] font-semibold rounded uppercase tracking-wide">
                    In Stock
                  </span>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="p-4">
              {fabric.brand && (
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {fabric.brand}
                </p>
              )}
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                {fabric.name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  ${(fabric.price || 99).toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  per {fabric.stock_unit || 'yard'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Fabric Details Page
export default function FabricDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const fabricId = params.id as string

  const { fabric, loading, error } = useFabric(fabricId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading fabric details...</p>
        </div>
      </div>
    )
  }

  if (error || !fabric) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load fabric details</p>
          <button
            onClick={() => router.push('/browse')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Browse
          </button>
        </div>
      </div>
    )
  }

  const images = fabric.images?.length > 0 
    ? fabric.images 
    : fabric.swatch_image_url 
      ? [fabric.swatch_image_url]
      : []

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Mobile Optimized */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <Link
              href="/browse"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Browse</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/checkout"
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Improved Visual Hierarchy */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Primary Product Section */}
        <section className="mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Product Images - 2 columns */}
            <div className="lg:col-span-2">
              <ImageGallery images={images} productName={fabric.name} />
            </div>

            {/* Product Details - 3 columns */}
            <div className="lg:col-span-3">
              <ProductDetails fabric={fabric} />
            </div>
          </div>
        </section>

        {/* Related Products Section */}
        <section className="border-t border-gray-200 pt-12">
          <RelatedProducts currentFabric={fabric} />
        </section>
      </main>
    </div>
  )
}