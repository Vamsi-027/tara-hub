'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Truck,
  Shield,
  RefreshCw
} from 'lucide-react'
import type { Fabric } from '../lib/fabric-api'

interface OptimizedFabricDetailsProps {
  fabric: Fabric
}

// Clean field filtering function
const getRelevantFields = (fabric: Fabric) => {
  // Helper to check if field has meaningful value
  const hasValue = (value: any): boolean => {
    return value !== null && 
           value !== undefined && 
           value !== '' && 
           value !== 'Standard' && 
           value !== 'Standard durability' &&
           !(Array.isArray(value) && value.length === 0) &&
           !(typeof value === 'object' && Object.keys(value).length === 0)
  }

  return {
    // Core Details (Always Show)
    core: {
      name: (fabric as any).name,
      sku: (fabric as any).sku,
      brand: (fabric as any).brand,
      category: (fabric as any).category || (fabric as any).types,
      description: (fabric as any).description,
      price: (fabric as any).price || 99,
      stock_unit: (fabric as any).stock_unit || 'yards',
      in_stock: (fabric as any).in_stock,
      availability: (fabric as any).availability,
      last_updated: (fabric as any).last_updated
    },

    // Visual Elements
    visual: {
      images: (fabric as any).images?.length ? (fabric as any).images : [(fabric as any).swatch_image_url],
      swatch_image_url: (fabric as any).swatch_image_url,
      lifestyle_image: (fabric as any).lifestyle_image,
      color: (fabric as any).color || (fabric as any).color_family,
      color_hex: (fabric as any).color_hex || '#94a3b8'
    },

    // Material & Physical Properties (Only if present)
    material: Object.fromEntries(
      Object.entries({
        'Material': (fabric as any).material || (fabric as any).composition || (fabric as any).fiber_content,
        'Width': (fabric as any).width,
        'Weight': (fabric as any).weight,
        'Pattern': (fabric as any).pattern,
        'Style': (fabric as any).style
      }).filter(([_, value]) => hasValue(value))
    ),

    // Performance & Usage (Only if present)  
    performance: Object.fromEntries(
      Object.entries({
        'Durability': (fabric as any).durability && (fabric as any).durability !== 'Standard durability' ? (fabric as any).durability : null,
        'Martindale Rating': (fabric as any).martindale ? `${(fabric as any).martindale} cycles` : null,
        'Grade': (fabric as any).grade,
        'Usage': (fabric as any).usage,
        'Application': (fabric as any).types
      }).filter(([_, value]) => hasValue(value))
    ),

    // Care Instructions (Only if present)
    care: Object.fromEntries(
      Object.entries({
        'Care Instructions': (fabric as any).care_instructions,
        'Cleaning Code': (fabric as any).cleaning_code,
        'Washable': (fabric as any).washable ? 'Yes' : null,
        'Bleach Safe': (fabric as any).bleach_cleanable ? 'Yes' : null
      }).filter(([_, value]) => hasValue(value))
    ),

    // Feature Badges (Only true values)
    badges: [
      ...((fabric as any).stain_resistant ? ['Stain Resistant'] : []),
      ...((fabric as any).fade_resistant ? ['Fade Resistant'] : []),
      ...((fabric as any).washable ? ['Machine Washable'] : []),
      ...((fabric as any).bleach_cleanable ? ['Bleach Safe'] : []),
      ...((fabric as any).ca_117 ? ['CA 117 Compliant'] : []),
      ...((fabric as any).quick_ship ? ['Quick Ship'] : []),
      ...((fabric as any).closeout ? ['Closeout'] : [])
    ],

    // Pricing Details
    pricing: {
      main_price: (fabric as any).price || 99,
      swatch_price: (fabric as any).swatch_price,
      closeout: (fabric as any).closeout,
      quick_ship: (fabric as any).quick_ship
    }
  }
}

// Image Gallery Component
function ImageGallery({ images, productName }: { images: string[], productName: string }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  const imageUrls = images.filter(img => img) // Remove null/empty images
  
  if (imageUrls.length === 0) {
    imageUrls.push('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800')
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 group">
        <Image
          src={imageUrls[selectedImage]}
          alt={productName}
          fill
          className={`object-cover transition-transform duration-500 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
          sizes="(max-width: 768px) 100vw, 50vw"
          onClick={() => setIsZoomed(!isZoomed)}
        />
        
        {/* Zoom Icon */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-4 right-4 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Thumbnail Navigation */}
      {imageUrls.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {imageUrls.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                selectedImage === index 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 scale-105' 
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image
                src={image}
                alt={`${productName} view ${index + 1}`}
                width={120}
                height={120}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Tabbed Content Component
function TabbedContent({ fabric, relevantFields }: { fabric: Fabric, relevantFields: any }) {
  const [activeTab, setActiveTab] = useState('description')

  const tabs = [
    { id: 'description', label: 'Description', show: !!(fabric as any).description },
    { id: 'specifications', label: 'Specifications', show: Object.keys(relevantFields.material).length > 0 || Object.keys(relevantFields.performance).length > 0 },
    { id: 'care', label: 'Care Instructions', show: Object.keys(relevantFields.care).length > 0 },
    { id: 'reviews', label: 'Reviews', show: true }
  ].filter(tab => tab.show)

  return (
    <div className="mt-12 border-t border-gray-200 pt-12">
      {/* Tab Navigation */}
      <div className="flex space-x-8 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {activeTab === 'description' && (fabric as any).description && (
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed">{(fabric as any).description}</p>
          </div>
        )}

        {activeTab === 'specifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.keys(relevantFields.material).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Material Properties</h4>
                <dl className="space-y-3">
                  {Object.entries(relevantFields.material).map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-600">{label}</dt>
                      <dd className="text-sm font-medium text-gray-900">{value as string}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {Object.keys(relevantFields.performance).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Performance & Usage</h4>
                <dl className="space-y-3">
                  {Object.entries(relevantFields.performance).map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-sm text-gray-600">{label}</dt>
                      <dd className="text-sm font-medium text-gray-900">{value as string}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}

        {activeTab === 'care' && (
          <div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(relevantFields.care).map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <dt className="font-medium text-gray-900 mb-2">{label}</dt>
                  <dd className="text-gray-700">{value as string}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-12">
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">4.8 out of 5 stars</h4>
            <p className="text-gray-600 mb-8">Based on 124 customer reviews</p>
            <div className="bg-gray-50 rounded-xl p-8">
              <p className="text-gray-500">Customer reviews will be available soon.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Product Details Component
export function OptimizedFabricDetails({ fabric }: OptimizedFabricDetailsProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  
  const relevantFields = getRelevantFields(fabric)

  const handleAddToCart = () => {
    console.log('Adding to cart:', { fabric: (fabric as any).id, quantity })
    // Add to cart logic here
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: (fabric as any).name,
        text: (fabric as any).description,
        url: window.location.href,
      })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-lg border transition-colors ${
                  isFavorite 
                    ? 'border-red-300 bg-red-50 text-red-600' 
                    : 'border-gray-300 hover:border-gray-400 text-gray-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-600 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Images */}
          <div>
            <ImageGallery 
              images={relevantFields.visual.images} 
              productName={relevantFields.core.name} 
            />
          </div>

          {/* Right Column: Product Details */}
          <div className="space-y-8">
            {/* Product Header */}
            <div>
              {relevantFields.core.brand && (
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
                  {relevantFields.core.brand}
                </p>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {relevantFields.core.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>SKU: {relevantFields.core.sku}</span>
                {relevantFields.core.category && (
                  <>
                    <span>•</span>
                    <span>{relevantFields.core.category}</span>
                  </>
                )}
              </div>
              
              {/* Ratings */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.8 • 124 reviews)</span>
              </div>
            </div>

            {/* Price & Stock */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-baseline gap-4 flex-wrap mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  ${relevantFields.pricing.main_price.toFixed(2)}
                </span>
                <span className="text-lg text-gray-500">
                  per {relevantFields.core.stock_unit}
                </span>
                {relevantFields.pricing.swatch_price && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    Swatch: ${relevantFields.pricing.swatch_price}
                  </span>
                )}
              </div>

              {/* Stock Status & Badges */}
              <div className="flex items-center gap-3 flex-wrap mb-6">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${relevantFields.core.in_stock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-sm font-medium ${relevantFields.core.in_stock ? 'text-green-700' : 'text-red-700'}`}>
                    {relevantFields.core.in_stock ? (relevantFields.core.availability || 'In Stock') : 'Out of Stock'}
                  </span>
                </div>
                
                {/* Feature Badges */}
                {relevantFields.badges.map((badge, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    {badge}
                  </span>
                ))}
              </div>

              {/* Color Swatch */}
              {relevantFields.visual.color && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: relevantFields.visual.color_hex }}
                    ></div>
                    <span className="text-sm text-gray-700">{relevantFields.visual.color}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity & Actions */}
            <div className="border-t border-gray-200 pt-6 space-y-6">
              {/* Quantity Selector */}
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-3">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-16 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    Total: ${(relevantFields.pricing.main_price * quantity).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!relevantFields.core.in_stock}
                  className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {relevantFields.core.in_stock ? 'Add to Cart' : 'Out of Stock'}
                </button>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900">Fast Shipping</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-2">
                      <Shield className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900">Authentic</p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-2">
                      <RefreshCw className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-900">Easy Returns</p>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              {relevantFields.core.last_updated && (
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-4">
                  Last updated: {relevantFields.core.last_updated}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <TabbedContent fabric={fabric} relevantFields={relevantFields} />
      </main>
    </div>
  )
}