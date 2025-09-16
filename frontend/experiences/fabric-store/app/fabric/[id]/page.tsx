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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Truck,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Palette,
  Ruler,
  Droplets,
  Grid3x3,
  Check
} from 'lucide-react'
import { useFabric, useFabrics } from '../../../hooks/useFabrics'
import type { Fabric } from '../../../lib/fabric-api'
import Header from '../../../components/header'

// Modern Image Gallery Component
function ModernImageGallery({ images, productName }: { images: string[], productName: string }) {
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
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group shadow-sm">
          {imageLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
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
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm
                     rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100
                     transition-all duration-200 hover:bg-white shadow-md"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>

          {/* Premium Badge */}
          <div className="absolute top-4 left-4">
            <div className="bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full
                           text-xs font-medium flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Premium Quality
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {imageUrls.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {imageUrls.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200
                           hover:shadow-md ${
                  selectedImage === index
                    ? 'border-blue-600 ring-2 ring-blue-600/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={image}
                  alt={`${productName} view ${index + 1}`}
                  width={120}
                  height={120}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modern Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm
                     rounded-lg flex items-center justify-center text-white hover:bg-white/20
                     transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Zoom Toggle */}
          <button
            onClick={() => setLightboxZoomed(!lightboxZoomed)}
            className="absolute top-4 right-16 w-10 h-10 bg-white/10 backdrop-blur-sm
                     rounded-lg flex items-center justify-center text-white hover:bg-white/20
                     transition-all duration-200"
          >
            {lightboxZoomed ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
          </button>

          {/* Navigation */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm
                         rounded-lg flex items-center justify-center text-white
                         hover:bg-white/20 transition-all duration-200"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm
                         rounded-lg flex items-center justify-center text-white
                         hover:bg-white/20 transition-all duration-200"
              >
                <ChevronRight className="w-6 h-6" />
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm
                           rounded-full px-3 py-1 text-white text-sm">
              {selectedImage + 1} / {imageUrls.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}

// Modern Product Info Component
function ModernProductInfo({ fabric }: { fabric: Fabric }) {
  const [quantity, setQuantity] = useState(0.5)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedVariantType, setSelectedVariantType] = useState<'Swatch' | 'Fabric'>('Swatch')
  const [addedToCart, setAddedToCart] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

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
    setShowNotification(true)
    setTimeout(() => {
      setAddedToCart(false)
      setShowNotification(false)
    }, 3000)
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
      setQuantity(Math.max(1, Math.min(5, quantity + delta)))
    } else {
      setQuantity(Math.max(0.5, Math.min(100, Math.round((quantity + delta * 0.5) * 2) / 2)))
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Added to cart!</p>
              <p className="text-sm text-green-600">
                {selectedVariantType === 'Swatch' ? `${quantity} swatch${quantity > 1 ? 'es' : ''}` : `${quantity} yard${quantity !== 1 ? 's' : ''}`} added
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Brand & Category */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
          {essentialFields.brand}
        </span>
        <span className="text-sm text-gray-500">
          {essentialFields.category}
        </span>
      </div>

      {/* Product Title & Rating */}
      <div className="space-y-3">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
          {essentialFields.name}
        </h1>

        {/* Rating */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="font-medium text-gray-700 ml-1">4.9</span>
            <span className="text-gray-500 text-sm">(247 reviews)</span>
          </div>
          {fabric.sku && (
            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">
              SKU: {fabric.sku}
            </span>
          )}
        </div>
      </div>

      {/* Price Display */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-sm text-gray-500">Starting at</p>
          <p className="text-3xl font-bold text-gray-900">
            ${selectedVariantType === 'Swatch'
              ? essentialFields.swatchPrice.toFixed(2)
              : essentialFields.price.toFixed(2)}
            {selectedVariantType === 'Fabric' && (
              <span className="text-lg font-normal text-gray-500">/yard</span>
            )}
          </p>
        </div>
        {selectedVariantType === 'Fabric' && essentialFields.inStock && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>In Stock</span>
          </div>
        )}
      </div>

      {/* Description */}
      {fabric.description && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 leading-relaxed">
            {fabric.description}
          </p>
        </div>
      )}

      {/* Key Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        {essentialFields.material && (
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Material</div>
              <div className="font-medium text-gray-900 text-sm">{essentialFields.material}</div>
            </div>
          </div>
        )}
        {essentialFields.width && (
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Ruler className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Width</div>
              <div className="font-medium text-gray-900 text-sm">{essentialFields.width}</div>
            </div>
          </div>
        )}
        {essentialFields.color && (
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Color</div>
              <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: essentialFields.colorHex }}
                />
                {essentialFields.color}
              </div>
            </div>
          </div>
        )}
        {essentialFields.grade && (
          <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Grade</div>
              <div className="font-medium text-gray-900 text-sm">Grade {essentialFields.grade}</div>
            </div>
          </div>
        )}
      </div>

      {/* Variant Selection */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Option</h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Swatch Option */}
          <button
            onClick={() => setSelectedVariantType('Swatch')}
            className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
              selectedVariantType === 'Swatch'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="space-y-1">
              <div className="font-medium text-gray-900">Swatch Sample</div>
              <div className="text-xs text-gray-500">4" × 4" sample</div>
              <div className="text-xl font-bold text-gray-900 mt-2">
                ${essentialFields.swatchPrice.toFixed(2)}
              </div>
              <div className={`text-xs font-medium flex items-center gap-1 ${
                essentialFields.swatchInStock ? 'text-green-600' : 'text-red-600'
              }`}>
                {essentialFields.swatchInStock ? (
                  <>
                    <Check className="w-3 h-3" />
                    In Stock
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" />
                    Out of Stock
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Fabric Option */}
          <button
            onClick={() => setSelectedVariantType('Fabric')}
            className={`p-4 border-2 rounded-lg transition-all duration-200 text-left ${
              selectedVariantType === 'Fabric'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="space-y-1">
              <div className="font-medium text-gray-900">Full Fabric</div>
              <div className="text-xs text-gray-500">Min 0.5 yards</div>
              <div className="text-xl font-bold text-gray-900 mt-2">
                ${essentialFields.price.toFixed(2)}
                <span className="text-sm font-normal text-gray-500">/yd</span>
              </div>
              <div className={`text-xs font-medium flex items-center gap-1 ${
                essentialFields.inStock ? 'text-green-600' : 'text-red-600'
              }`}>
                {essentialFields.inStock ? (
                  <>
                    <Check className="w-3 h-3" />
                    In Stock
                  </>
                ) : (
                  <>
                    <X className="w-3 h-3" />
                    Out of Stock
                  </>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Quantity Selector */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-900">
              {selectedVariantType === 'Swatch' ? 'Quantity' : 'Yards'}
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="p-2 hover:bg-gray-100 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedVariantType === 'Swatch' ? quantity <= 1 : quantity <= 0.5}
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <input
                type="number"
                min={selectedVariantType === 'Swatch' ? "1" : "0.5"}
                max={selectedVariantType === 'Swatch' ? "5" : "100"}
                step={selectedVariantType === 'Swatch' ? "1" : "0.5"}
                value={quantity}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || (selectedVariantType === 'Swatch' ? 1 : 0.5)
                  const minValue = selectedVariantType === 'Swatch' ? 1 : 0.5
                  const maxValue = selectedVariantType === 'Swatch' ? 5 : 100
                  setQuantity(Math.max(minValue, Math.min(maxValue, value)))
                }}
                className="px-4 py-2 font-medium text-gray-900 text-center border-0 outline-none
                         focus:bg-gray-50 transition-colors w-20"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Total Price */}
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">Total Price</span>
            <span className="text-2xl font-bold text-gray-900">
              ${(selectedVariantType === 'Swatch'
                ? essentialFields.swatchPrice * quantity
                : essentialFields.price * quantity
              ).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <button
          onClick={handleAddToCart}
          disabled={selectedVariantType === 'Swatch' ? !essentialFields.swatchInStock : !essentialFields.inStock}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200
                     flex items-center justify-center gap-2 shadow-sm
                     disabled:opacity-50 disabled:cursor-not-allowed ${
            addedToCart
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {addedToCart ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleWishlistToggle}
            className={`py-2.5 px-4 rounded-lg font-medium transition-all duration-200
                       flex items-center justify-center gap-2 border ${
              isWishlisted
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            {isWishlisted ? 'Saved' : 'Save'}
          </button>

          <button className="py-2.5 px-4 rounded-lg font-medium transition-all duration-200
                           flex items-center justify-center gap-2 border border-gray-300
                           text-gray-700 hover:bg-gray-50">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
          <div className="text-center">
            <Shield className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Quality Guaranteed</div>
          </div>
          <div className="text-center">
            <Truck className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Free Ship $150+</div>
          </div>
          <div className="text-center">
            <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-xs text-gray-600">Fast Delivery</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Modern Product Tabs Component
function ModernProductTabs({ fabric }: { fabric: Fabric }) {
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
      { label: 'Care', value: (fabric as any).care_instructions || (fabric as any).cleaning }
    ].filter(spec => spec.value && spec.value !== '' && spec.value !== 'Standard')

    return specs
  }

  const specifications = getSpecifications()

  const tabs = [
    { id: 'details', label: 'Details', icon: Info },
    { id: 'specifications', label: 'Specs', icon: Package },
    { id: 'care', label: 'Care', icon: Sparkles },
    { id: 'reviews', label: 'Reviews', icon: Star }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                         transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600 bg-white'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>

            {fabric.description && (
              <p className="text-gray-700 leading-relaxed">
                {fabric.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Key Features</h4>
                <ul className="space-y-2">
                  {specifications.slice(0, 5).map((spec, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      <span className="text-gray-700">
                        <span className="font-medium">{spec.label}:</span> {spec.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Why Choose This?</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Premium quality materials
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Extensively tested durability
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Industry-leading standards
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Tab */}
        {activeTab === 'specifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Technical Specifications</h3>

            <div className="divide-y divide-gray-200">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">{spec.label}</span>
                  <span className="text-sm font-medium text-gray-900">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Care Tab */}
        {activeTab === 'care' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Care & Maintenance</h3>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                {(fabric as any).care_instructions || (fabric as any).cleaning ||
                 'Professional cleaning recommended. Avoid direct sunlight and handle with care.'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Maintenance Tips</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <span className="text-sm text-gray-700">Regular vacuuming to remove dust</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <span className="text-sm text-gray-700">Rotate cushions for even wear</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <span className="text-sm text-gray-700">Address spills immediately</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">4.9 out of 5</span>
              </div>
            </div>

            {/* Sample Reviews */}
            <div className="space-y-3">
              {[
                {
                  name: 'Sarah M.',
                  rating: 5,
                  date: '2 weeks ago',
                  review: 'Absolutely beautiful fabric! The quality exceeded my expectations.'
                },
                {
                  name: 'Michael R.',
                  rating: 5,
                  date: '1 month ago',
                  review: 'Outstanding durability and texture. Still looks brand new!'
                },
                {
                  name: 'Jennifer L.',
                  rating: 4,
                  date: '2 months ago',
                  review: 'Great fabric, though delivery took a bit longer than expected.'
                }
              ].map((review, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{review.name}</div>
                        <div className="text-xs text-gray-500">{review.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${
                          star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{review.review}</p>
                </div>
              ))}
            </div>

            <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium
                             hover:bg-gray-200 transition-colors text-sm">
              Load More Reviews
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Modern Recommendations Component
function ModernRecommendations({ currentFabric }: { currentFabric: Fabric }) {
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
    <div className="mt-12 pt-12 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
        <Link
          href="/browse"
          className="text-sm font-medium text-blue-600 hover:text-blue-700
                   flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="group bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md
                       transition-all duration-200 cursor-pointer overflow-hidden"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={essentialFields.image}
                  alt={essentialFields.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                {fabric.in_stock && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-medium">
                      In Stock
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="text-xs text-gray-500 mb-1">
                  {essentialFields.brand}
                </p>
                <h3 className="font-medium text-gray-900 text-sm line-clamp-1 mb-2">
                  {essentialFields.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    ${essentialFields.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">/yard</span>
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
export default function ModernProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fabricId = params.id as string

  const { fabric, loading, error } = useFabric(fabricId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-gray-600">Loading fabric details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !fabric) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Fabric Not Found</h2>
            <p className="text-gray-600">The fabric you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/browse')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium
                       hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/browse" className="hover:text-gray-700">Browse</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{fabric.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <ModernImageGallery images={images} productName={fabric.name} />

          {/* Product Info */}
          <ModernProductInfo fabric={fabric} />
        </div>

        {/* Product Tabs */}
        <ModernProductTabs fabric={fabric} />

        {/* Recommendations */}
        <ModernRecommendations currentFabric={fabric} />
      </main>

      {/* Sticky Mobile CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-30">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-500">Starting at</div>
            <div className="text-lg font-bold text-gray-900">
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
            className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Add Swatch
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}