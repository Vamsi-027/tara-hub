'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ZoomIn, 
  ZoomOut,
  X,
  Minus, 
  Plus, 
  ShoppingCart, 
  Star,
  Info,
  Package,
  Award,
  HelpCircle,
  Sparkles,
  Eye,
  ChevronDown,
  ChevronUp,
  Truck,
  Shield,
  Clock,
  Phone
} from 'lucide-react'
import { useFabric, useFabrics } from '../../../hooks/useFabrics'
import type { Fabric } from '../../../lib/fabric-api'
import Header from '../../../components/header'

// Luxury Image Gallery Component
function LuxuryImageGallery({ images, productName }: { images: string[], productName: string }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxZoomed, setLightboxZoomed] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const imageUrls = images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800']

  const openLightbox = (index: number) => {
    setSelectedImage(index)
    setIsLightboxOpen(true)
    setLightboxZoomed(false)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    setLightboxZoomed(false)
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % imageUrls.length)
    setLightboxZoomed(false)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)
    setLightboxZoomed(false)
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === ' ') {
        e.preventDefault()
        setLightboxZoomed(!lightboxZoomed)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, lightboxZoomed])

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-warm-50 group shadow-lg">
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-warm-100 to-warm-200 animate-pulse" />
          )}
          <Image
            src={imageUrls[selectedImage]}
            alt={productName}
            fill
            className={`object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            sizes="(max-width: 768px) 100vw, 50vw"
            onLoad={() => setImageLoading(false)}
            priority
          />
          
          {/* Zoom Button */}
          <button
            onClick={() => openLightbox(selectedImage)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm border border-warm-300
                     rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 
                     transition-all duration-300 hover:bg-white hover:shadow-lg"
          >
            <ZoomIn className="w-5 h-5 text-navy-800" />
          </button>

          {/* Premium Badge */}
          <div className="absolute top-4 left-4">
            <div className="bg-gold-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full 
                           text-sm font-sans font-medium flex items-center gap-1 shadow-lg">
              <Sparkles className="w-3 h-3 fill-current" />
              Premium Quality
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {imageUrls.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {imageUrls.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300
                           hover:shadow-md ${
                  selectedImage === index 
                    ? 'border-navy-800 ring-2 ring-navy-800/20 shadow-md' 
                    : 'border-warm-300 hover:border-gold-800'
                }`}
              >
                <Image
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  width={120}
                  height={120}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Luxury Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20
                     rounded-xl flex items-center justify-center text-white hover:bg-white/20 
                     transition-all duration-300 z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Zoom Toggle */}
          <button
            onClick={() => setLightboxZoomed(!lightboxZoomed)}
            className="absolute top-6 right-20 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20
                     rounded-xl flex items-center justify-center text-white hover:bg-white/20 
                     transition-all duration-300 z-10"
          >
            {lightboxZoomed ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
          </button>

          {/* Navigation */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm 
                         border border-white/20 rounded-xl flex items-center justify-center text-white 
                         hover:bg-white/20 transition-all duration-300"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm 
                         border border-white/20 rounded-xl flex items-center justify-center text-white 
                         hover:bg-white/20 transition-all duration-300"
              >
                <ArrowLeft className="w-6 h-6 rotate-180" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="relative max-w-6xl max-h-[90vh] aspect-square">
            <Image
              src={imageUrls[selectedImage]}
              alt={productName}
              fill
              className={`object-contain transition-transform duration-300 ${
                lightboxZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
              }`}
              sizes="90vw"
              onClick={() => setLightboxZoomed(!lightboxZoomed)}
            />
          </div>

          {/* Image Counter */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm 
                           border border-white/20 rounded-full px-4 py-2 text-white text-sm">
              {selectedImage + 1} of {imageUrls.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// Luxury Product Info Component
function LuxuryProductInfo({ fabric }: { fabric: Fabric }) {
  const [quantity, setQuantity] = useState(0.5)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedVariantType, setSelectedVariantType] = useState<'Swatch' | 'Fabric'>('Swatch')
  const [addedToCart, setAddedToCart] = useState(false)

  // Essential field extraction
  const essentialFields = {
    name: fabric.name || 'Untitled Fabric',
    price: fabric.price || 99.00,
    swatchPrice: fabric.swatch_price || 5.00,
    brand: (fabric as any).brand || 'Custom Fabric Designs',
    material: (fabric as any).material || (fabric as any).composition || 'Premium Fabric',
    width: (fabric as any).width || null,
    category: fabric.category || 'Premium Fabric',
    colorHex: fabric.color_hex || '#E5E5E5',
    color: (fabric as any).color || (fabric as any).color_family || null,
    grade: (fabric as any).grade || null,
    inStock: fabric.in_stock ?? true,
    swatchInStock: fabric.swatch_in_stock ?? true
  }

  // Check wishlist status
  useEffect(() => {
    const wishlist = localStorage.getItem('fabric-wishlist')
    if (wishlist) {
      const wishlistItems = JSON.parse(wishlist)
      setIsWishlisted(wishlistItems.includes(fabric.id))
    }
  }, [fabric.id])

  // Reset quantity when switching variants
  useEffect(() => {
    setQuantity(selectedVariantType === 'Swatch' ? 1 : 0.5)
  }, [selectedVariantType])

  const handleAddToCart = () => {
    const cartItem = {
      id: `${selectedVariantType.toLowerCase()}-${fabric.id}-${Date.now()}`,
      variantId: fabric.id,
      productId: fabric.id,
      title: essentialFields.name,
      variant: selectedVariantType === 'Swatch' ? 'Swatch Sample' : `${quantity} yard${quantity !== 1 ? 's' : ''}`,
      price: (selectedVariantType === 'Swatch' 
        ? essentialFields.swatchPrice * 100 * quantity
        : essentialFields.price * 100 * quantity),
      quantity: quantity,
      thumbnail: (fabric as any).swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      type: selectedVariantType === 'Swatch' ? 'swatch' : 'fabric'
    }

    const existingCart = localStorage.getItem('fabric-cart')
    const cart = existingCart ? JSON.parse(existingCart) : []
    const updatedCart = [...cart, cartItem]
    
    localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }))
    
    // Show success feedback
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleWishlistToggle = () => {
    const wishlist = localStorage.getItem('fabric-wishlist')
    const wishlistItems = wishlist ? JSON.parse(wishlist) : []
    
    if (isWishlisted) {
      const updatedWishlist = wishlistItems.filter((id: string) => id !== fabric.id)
      localStorage.setItem('fabric-wishlist', JSON.stringify(updatedWishlist))
      setIsWishlisted(false)
    } else {
      const updatedWishlist = [...wishlistItems, fabric.id]
      localStorage.setItem('fabric-wishlist', JSON.stringify(updatedWishlist))
      setIsWishlisted(true)
    }
    
    window.dispatchEvent(new CustomEvent('wishlist-updated'))
  }

  const handleQuantityChange = (delta: number) => {
    if (selectedVariantType === 'Swatch') {
      setQuantity(Math.max(1, Math.min(10, quantity + delta)))
    } else {
      setQuantity(Math.max(0.5, Math.min(100, Math.round((quantity + delta * 0.5) * 2) / 2)))
    }
  }

  return (
    <div className="space-y-8">
      {/* Brand & Category */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-sans font-medium text-gold-800 bg-gold-50 px-3 py-1 rounded-full border border-gold-200">
            {essentialFields.brand}
          </span>
          <span className="text-sm font-sans text-warm-600">
            {essentialFields.category}
          </span>
        </div>
      </div>

      {/* Product Title & Rating */}
      <div className="space-y-4">
        <h1 className="font-display text-3xl lg:text-4xl font-semibold text-navy-800 leading-tight">
          {essentialFields.name}
        </h1>
        
        {/* Rating */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 fill-gold-800 text-gold-800" />
            ))}
            <span className="font-sans font-medium text-navy-800 ml-2">4.9</span>
            <span className="font-sans text-warm-600 text-sm">(247 reviews)</span>
          </div>
          {fabric.sku && (
            <span className="font-sans text-sm text-warm-600 font-mono bg-warm-100 px-2 py-1 rounded">
              {fabric.sku}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {fabric.description && (
        <div className="bg-warm-50 border border-warm-200 rounded-xl p-6">
          <p className="font-sans text-navy-800 leading-relaxed">
            {fabric.description}
          </p>
        </div>
      )}

      {/* Key Features */}
      <div className="grid grid-cols-2 gap-4">
        {essentialFields.material && (
          <div className="flex items-center gap-3 p-4 bg-white border border-warm-200 rounded-lg">
            <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-navy-800" />
            </div>
            <div>
              <div className="font-sans text-sm text-warm-600">Material</div>
              <div className="font-sans font-medium text-navy-800">{essentialFields.material}</div>
            </div>
          </div>
        )}
        {essentialFields.width && (
          <div className="flex items-center gap-3 p-4 bg-white border border-warm-200 rounded-lg">
            <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-navy-800" />
            </div>
            <div>
              <div className="font-sans text-sm text-warm-600">Width</div>
              <div className="font-sans font-medium text-navy-800">{essentialFields.width}</div>
            </div>
          </div>
        )}
        {essentialFields.color && (
          <div className="flex items-center gap-3 p-4 bg-white border border-warm-200 rounded-lg">
            <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center">
              <div 
                className="w-5 h-5 rounded-full border-2 border-warm-300" 
                style={{ backgroundColor: essentialFields.colorHex }}
              />
            </div>
            <div>
              <div className="font-sans text-sm text-warm-600">Color</div>
              <div className="font-sans font-medium text-navy-800">{essentialFields.color}</div>
            </div>
          </div>
        )}
        {essentialFields.grade && (
          <div className="flex items-center gap-3 p-4 bg-white border border-warm-200 rounded-lg">
            <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-navy-800" />
            </div>
            <div>
              <div className="font-sans text-sm text-warm-600">Grade</div>
              <div className="font-sans font-medium text-navy-800">Grade {essentialFields.grade}</div>
            </div>
          </div>
        )}
      </div>

      {/* Variant Selection */}
      <div className="bg-white border border-warm-200 rounded-xl p-6 space-y-6">
        <h3 className="font-display text-lg font-medium text-navy-800">Select Option</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Swatch Option */}
          <button
            onClick={() => setSelectedVariantType('Swatch')}
            className={`p-4 border-2 rounded-xl transition-all duration-300 text-left ${
              selectedVariantType === 'Swatch'
                ? 'border-navy-800 bg-navy-50 shadow-md'
                : 'border-warm-300 hover:border-gold-800 hover:shadow-sm'
            }`}
          >
            <div className="space-y-2">
              <div className="font-sans font-medium text-navy-800">Swatch Sample</div>
              <div className="font-sans text-sm text-warm-600">4" × 4" sample</div>
              <div className="font-display text-xl font-semibold text-navy-800">
                ${essentialFields.swatchPrice.toFixed(2)}
              </div>
              <div className={`text-sm font-sans font-medium ${
                essentialFields.swatchInStock ? 'text-green-600' : 'text-red-600'
              }`}>
                {essentialFields.swatchInStock ? '✓ In Stock' : '✗ Out of Stock'}
              </div>
            </div>
          </button>

          {/* Fabric Option */}
          <button
            onClick={() => setSelectedVariantType('Fabric')}
            className={`p-4 border-2 rounded-xl transition-all duration-300 text-left ${
              selectedVariantType === 'Fabric'
                ? 'border-navy-800 bg-navy-50 shadow-md'
                : 'border-warm-300 hover:border-gold-800 hover:shadow-sm'
            }`}
          >
            <div className="space-y-2">
              <div className="font-sans font-medium text-navy-800">Full Fabric</div>
              <div className="font-sans text-sm text-warm-600">Minimum 0.5 yards</div>
              <div className="font-display text-xl font-semibold text-navy-800">
                ${essentialFields.price.toFixed(2)}
                <span className="text-sm font-sans text-warm-600 font-normal">/yard</span>
              </div>
              <div className={`text-sm font-sans font-medium ${
                essentialFields.inStock ? 'text-green-600' : 'text-red-600'
              }`}>
                {essentialFields.inStock ? '✓ In Stock' : '✗ Out of Stock'}
              </div>
            </div>
          </button>
        </div>

        {/* Quantity & Total */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <label className="font-sans font-medium text-navy-800">
                {selectedVariantType === 'Swatch' ? 'Quantity' : 'Yards'}
              </label>
              <div className="flex items-center border-2 border-warm-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="p-3 hover:bg-warm-50 transition-colors border-r border-warm-300
                           disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedVariantType === 'Swatch' ? quantity <= 1 : quantity <= 0.5}
                >
                  <Minus className="w-4 h-4 text-navy-800" />
                </button>
                <input
                  type="number"
                  min={selectedVariantType === 'Swatch' ? "1" : "0.5"}
                  max={selectedVariantType === 'Swatch' ? "10" : "100"}
                  step={selectedVariantType === 'Swatch' ? "1" : "0.5"}
                  value={quantity}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || (selectedVariantType === 'Swatch' ? 1 : 0.5)
                    const minValue = selectedVariantType === 'Swatch' ? 1 : 0.5
                    const maxValue = selectedVariantType === 'Swatch' ? 10 : 100
                    setQuantity(Math.max(minValue, Math.min(maxValue, value)))
                  }}
                  className="px-4 py-3 font-sans font-medium text-navy-800 text-center border-0 outline-none 
                           focus:bg-warm-50 transition-colors min-w-[80px]"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="p-3 hover:bg-warm-50 transition-colors border-l border-warm-300"
                >
                  <Plus className="w-4 h-4 text-navy-800" />
                </button>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-sans text-sm text-warm-600 mb-1">Total Price</div>
              <div className="font-display text-3xl font-semibold text-navy-800">
                ${(selectedVariantType === 'Swatch' 
                  ? essentialFields.swatchPrice * quantity
                  : essentialFields.price * quantity
                ).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={handleAddToCart}
          disabled={selectedVariantType === 'Swatch' ? !essentialFields.swatchInStock : !essentialFields.inStock}
          className={`w-full py-4 px-6 rounded-xl font-sans font-semibold text-lg transition-all duration-300
                     flex items-center justify-center gap-3 shadow-lg hover:shadow-xl 
                     disabled:opacity-50 disabled:cursor-not-allowed ${
            addedToCart
              ? 'bg-green-600 text-white'
              : 'bg-navy-800 text-white hover:bg-navy-700 hover:-translate-y-0.5'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {addedToCart ? 'Added to Cart!' : `Add ${selectedVariantType} to Cart`}
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleWishlistToggle}
            className={`py-3 px-4 rounded-xl font-sans font-medium transition-all duration-300
                       flex items-center justify-center gap-2 border-2 ${
              isWishlisted
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-warm-300 text-navy-800 hover:border-gold-800 hover:bg-gold-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
          </button>

          <button className="py-3 px-4 rounded-xl font-sans font-medium transition-all duration-300
                           flex items-center justify-center gap-2 border-2 border-warm-300 text-navy-800 
                           hover:border-gold-800 hover:bg-gold-50">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-warm-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="font-sans text-xs text-warm-600">Quality Guaranteed</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="font-sans text-xs text-warm-600">Free Shipping $150+</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <div className="font-sans text-xs text-warm-600">Expert Support</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Luxury Product Tabs Component
function LuxuryProductTabs({ fabric }: { fabric: Fabric }) {
  const [activeTab, setActiveTab] = useState('details')

  // Get relevant specifications
  const getSpecifications = () => {
    const specs = [
      { label: 'Material', value: (fabric as any).material || (fabric as any).composition },
      { label: 'Width', value: (fabric as any).width },
      { label: 'Weight', value: (fabric as any).weight },
      { label: 'Pattern', value: (fabric as any).pattern },
      { label: 'Style', value: (fabric as any).style },
      { label: 'Grade', value: (fabric as any).grade },
      { label: 'Usage', value: fabric.usage },
      { label: 'Color Family', value: fabric.color_family },
      { label: 'Durability', value: (fabric as any).durability },
      { label: 'Care Instructions', value: (fabric as any).care_instructions || (fabric as any).cleaning }
    ].filter(spec => spec.value && spec.value !== '' && spec.value !== 'Standard')

    return specs
  }

  const specifications = getSpecifications()

  const tabs = [
    { id: 'details', label: 'Details', icon: Info },
    { id: 'specifications', label: 'Specifications', icon: Package },
    { id: 'care', label: 'Care & Maintenance', icon: Sparkles },
    { id: 'reviews', label: 'Reviews (247)', icon: Star }
  ]

  return (
    <div className="bg-white border border-warm-200 rounded-2xl overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-warm-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-sans font-medium 
                         transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-navy-800 text-white'
                  : 'text-navy-800 hover:bg-warm-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="p-8">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <h3 className="font-display text-2xl font-semibold text-navy-800">Product Details</h3>
            
            {fabric.description && (
              <div className="prose prose-navy max-w-none">
                <p className="font-sans text-navy-800 leading-relaxed text-lg">
                  {fabric.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-sans font-semibold text-navy-800">Key Features</h4>
                <ul className="space-y-2">
                  {specifications.slice(0, 5).map((spec, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gold-800 rounded-full" />
                      <span className="font-sans text-navy-800">
                        <strong>{spec.label}:</strong> {spec.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-warm-50 rounded-xl p-6">
                <h4 className="font-sans font-semibold text-navy-800 mb-4">Why Choose This Fabric?</h4>
                <ul className="space-y-2 font-sans text-navy-800">
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-800" />
                    Premium quality materials
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Quality guaranteed
                  </li>
                  <li className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    Industry-leading durability
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Tab */}
        {activeTab === 'specifications' && (
          <div className="space-y-6">
            <h3 className="font-display text-2xl font-semibold text-navy-800">Technical Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-warm-200 last:border-b-0">
                  <span className="font-sans font-medium text-warm-600">{spec.label}</span>
                  <span className="font-sans font-semibold text-navy-800">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Care Tab */}
        {activeTab === 'care' && (
          <div className="space-y-6">
            <h3 className="font-display text-2xl font-semibold text-navy-800">Care & Maintenance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-sans font-semibold text-navy-800">Care Instructions</h4>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <p className="font-sans text-green-800 leading-relaxed">
                    {(fabric as any).care_instructions || (fabric as any).cleaning || 
                     'Professional cleaning recommended. Avoid direct sunlight for extended periods. Handle with care to maintain fabric integrity.'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-sans font-semibold text-navy-800">Maintenance Tips</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">1</span>
                    </div>
                    <span className="font-sans text-navy-800">Regular vacuuming to remove dust and debris</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">2</span>
                    </div>
                    <span className="font-sans text-navy-800">Rotate cushions regularly for even wear</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-xs font-bold">3</span>
                    </div>
                    <span className="font-sans text-navy-800">Address spills immediately with appropriate methods</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-navy-800">Customer Reviews</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-gold-800 text-gold-800" />
                  ))}
                </div>
                <span className="font-sans font-semibold text-navy-800">4.9 out of 5</span>
              </div>
            </div>

            {/* Sample Reviews */}
            <div className="space-y-6">
              {[
                {
                  name: 'Sarah M.',
                  rating: 5,
                  date: 'March 2024',
                  review: 'Absolutely beautiful fabric! The quality exceeded my expectations and the color is exactly as shown. Perfect for my living room renovation.'
                },
                {
                  name: 'Michael R.',
                  rating: 5,
                  date: 'February 2024',
                  review: 'Outstanding durability and texture. We\'ve had it for 6 months now and it still looks brand new despite daily use.'
                },
                {
                  name: 'Jennifer L.',
                  rating: 4,
                  date: 'January 2024',
                  review: 'Great fabric, though delivery took a bit longer than expected. The quality makes up for it though!'
                }
              ].map((review, index) => (
                <div key={index} className="bg-warm-50 border border-warm-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-white font-sans font-bold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-sans font-medium text-navy-800">{review.name}</div>
                        <div className="font-sans text-sm text-warm-600">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${
                          star <= review.rating ? 'fill-gold-800 text-gold-800' : 'text-warm-300'
                        }`} />
                      ))}
                    </div>
                  </div>
                  <p className="font-sans text-navy-800 leading-relaxed">{review.review}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button className="bg-navy-800 text-white px-8 py-3 rounded-xl font-sans font-medium 
                               hover:bg-navy-700 transition-colors">
                Load More Reviews
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Luxury Recommendations Component
function LuxuryRecommendations({ currentFabric }: { currentFabric: Fabric }) {
  const router = useRouter()
  const { fabrics: relatedFabrics, loading } = useFabrics({
    limit: 8,
    page: 1,
    category: currentFabric.category || undefined
  })

  const filteredRelated = relatedFabrics
    .filter(fabric => fabric.id !== currentFabric.id)
    .slice(0, 4)

  if (loading || filteredRelated.length === 0) return null

  return (
    <div className="mt-16 pt-16 border-t border-warm-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-3xl font-semibold text-navy-800">You May Also Like</h2>
        <Link
          href="/browse"
          className="font-sans font-medium text-navy-800 hover:text-gold-800 transition-colors 
                   flex items-center gap-2"
        >
          View All
          <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredRelated.map((fabric) => {
          const essentialFields = {
            name: fabric.name || 'Untitled Fabric',
            price: fabric.price || 99.00,
            image: (fabric as any).swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
            brand: (fabric as any).brand || 'Custom Fabric Designs'
          }

          return (
            <div
              key={fabric.id}
              onClick={() => router.push(`/fabric/${fabric.id}`)}
              className="group bg-white rounded-xl border border-warm-200 shadow-sm hover:shadow-xl 
                       hover:border-gold-800/30 transition-all duration-500 cursor-pointer overflow-hidden
                       hover:-translate-y-1"
            >
              <div className="relative aspect-square overflow-hidden bg-warm-50">
                <Image
                  src={essentialFields.image}
                  alt={essentialFields.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {fabric.in_stock && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-green-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full 
                                   text-xs font-sans font-medium">
                      In Stock
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-5">
                <p className="font-sans text-xs font-medium text-warm-600 uppercase tracking-wide mb-2">
                  {essentialFields.brand}
                </p>
                <h3 className="font-display font-medium text-navy-800 mb-3 line-clamp-2 group-hover:text-navy-900">
                  {essentialFields.name}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="font-display text-xl font-semibold text-navy-800">
                    ${essentialFields.price.toFixed(2)}
                  </div>
                  <div className="font-sans text-sm text-warm-600">per yard</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Main Product Detail Page Component
export default function LuxuryProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fabricId = params.id as string

  const { fabric, loading, error } = useFabric(fabricId)

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-3 border-navy-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-sans text-navy-800">Loading fabric details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !fabric) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-navy-800">Fabric Not Found</h2>
            <p className="font-sans text-warm-600">The fabric you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/browse')}
              className="bg-navy-800 text-white px-6 py-3 rounded-xl font-sans font-medium 
                       hover:bg-navy-700 transition-colors"
            >
              Browse All Fabrics
            </button>
          </div>
        </div>
      </div>
    )
  }

  const images = (fabric as any).images?.length > 0 
    ? (fabric as any).images 
    : (fabric as any).swatch_image_url 
      ? [(fabric as any).swatch_image_url]
      : []

  return (
    <div className="min-h-screen bg-warm-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b border-warm-200 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 font-sans text-sm text-warm-600">
            <Link href="/" className="hover:text-navy-800 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-navy-800 transition-colors">Browse</Link>
            <span>/</span>
            <span className="text-navy-800 font-medium">{fabric.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-6">
            <LuxuryImageGallery images={images} productName={fabric.name} />
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <LuxuryProductInfo fabric={fabric} />
          </div>
        </div>

        {/* Product Tabs */}
        <LuxuryProductTabs fabric={fabric} />

        {/* Recommendations */}
        <LuxuryRecommendations currentFabric={fabric} />
      </main>

      {/* Sticky Mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-warm-200 p-4 shadow-xl z-30">
        <div className="flex items-center gap-4">
          <div className="flex-1 text-center">
            <div className="font-sans text-sm text-warm-600">Starting at</div>
            <div className="font-display text-lg font-semibold text-navy-800">
              ${(fabric.swatch_price || 5).toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => {
              // Add swatch to cart logic
              const cartItem = {
                id: `swatch-${fabric.id}-${Date.now()}`,
                variantId: fabric.id,
                productId: fabric.id,
                title: fabric.name,
                variant: 'Swatch Sample',
                price: (fabric.swatch_price || 5) * 100,
                quantity: 1,
                thumbnail: (fabric as any).swatch_image_url || (fabric as any).images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
                type: 'swatch'
              }

              const existingCart = localStorage.getItem('fabric-cart')
              const cart = existingCart ? JSON.parse(existingCart) : []
              const updatedCart = [...cart, cartItem]
              
              localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
              window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }))
            }}
            className="flex-1 bg-navy-800 text-white py-3 px-6 rounded-xl font-sans font-semibold
                     hover:bg-navy-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add Swatch
          </button>
        </div>
      </div>
    </div>
  )
}