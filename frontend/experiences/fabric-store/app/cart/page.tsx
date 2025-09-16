'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Heart,
  Package,
  Truck,
  Shield,
  CreditCard,
  Info,
  Check,
  X,
  Tag
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: string
  variantId: string
  productId: string
  title: string
  variant: string
  price: number
  quantity: number
  thumbnail?: string
  type?: 'swatch' | 'fabric'
  yardage?: number
}

// Cart Item Card Component
const CartItemCard = React.memo(({
  item,
  onUpdateQuantity,
  onRemove,
  onMoveToWishlist
}: {
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onMoveToWishlist: (item: CartItem) => void
}) => {
  const [isRemoving, setIsRemoving] = useState(false)
  const [localQuantity, setLocalQuantity] = useState(item.quantity)

  const handleRemove = useCallback(async () => {
    setIsRemoving(true)
    await new Promise(resolve => setTimeout(resolve, 200))
    onRemove(item.id)
  }, [item.id, onRemove])

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1) return
    setLocalQuantity(newQuantity)
    onUpdateQuantity(item.id, newQuantity)
  }, [item.id, onUpdateQuantity])

  const itemTotal = useMemo(() => {
    return ((item.price * item.quantity) / 100).toFixed(2)
  }, [item.price, item.quantity])

  return (
    <div className={`group bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm
                    hover:shadow-md transition-all duration-300
                    ${isRemoving ? 'opacity-50 scale-95' : ''}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Product Image */}
        <div className="relative flex-shrink-0 w-full sm:w-32 h-32">
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, 128px"
              className="object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Type Badge */}
          {item.type && (
            <div className={`absolute -top-2 -right-2 px-2.5 py-1 rounded-full text-xs font-medium
                           ${item.type === 'swatch'
                             ? 'bg-green-100 text-green-700 border border-green-200'
                             : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
              {item.type === 'swatch' ? 'Sample' : 'Fabric'}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {item.variant}
                {item.yardage && ` • ${item.yardage} yard${item.yardage > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-xl font-bold text-gray-900">
              ${(item.price / 100).toFixed(2)}
            </span>
            {item.quantity > 1 && (
              <span className="text-sm text-gray-500">
                each × {item.quantity} = ${itemTotal}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quantity Selector */}
            {item.type === 'swatch' ? (
              <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm font-medium text-green-700">Sample</span>
              </div>
            ) : (
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(localQuantity - 1)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50
                            transition-colors duration-200 disabled:opacity-50"
                  disabled={localQuantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={localQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    handleQuantityChange(Math.max(1, val))
                  }}
                  className="w-16 text-center border-x border-gray-200 py-2 focus:outline-none"
                  min="1"
                />
                <button
                  onClick={() => handleQuantityChange(localQuantity + 1)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50
                            transition-colors duration-200"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => onMoveToWishlist(item)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg
                          transition-all duration-200"
                title="Move to wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg
                          transition-all duration-200"
                title="Remove from cart"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Cart Summary Component
const CartSummary = React.memo(({
  items,
  onCheckout
}: {
  items: CartItem[]
  onCheckout: () => void
}) => {
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)

  const { subtotal, shipping, tax, discount, total, savings } = useMemo(() => {
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0)
    const shipping = subtotal > 15000 ? 0 : 1500 // Free shipping over $150
    const discount = promoApplied ? Math.round(subtotal * 0.1) : 0 // 10% discount
    const taxableAmount = subtotal - discount
    const tax = Math.round(taxableAmount * 0.08) // 8% tax estimate
    const total = taxableAmount + shipping + tax
    const savings = discount + (subtotal > 15000 ? 1500 : 0)

    return { subtotal, shipping, tax, discount, total, savings }
  }, [items, promoApplied])

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (promoCode.toUpperCase() === 'FABRIC10') {
      setPromoApplied(true)
      setPromoDiscount(10)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm sticky top-24">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Order Summary
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {items.length} {items.length === 1 ? 'item' : 'items'} in cart
        </p>
      </div>

      {/* Cost Breakdown */}
      <div className="p-6 space-y-4">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
        </div>

        {promoApplied && (
          <div className="flex justify-between text-green-600">
            <span>Promo Discount ({promoDiscount}%)</span>
            <span className="font-medium">-${(discount / 100).toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-700">
          <span className="flex items-center gap-1">
            <Truck className="w-4 h-4" />
            Shipping
          </span>
          {shipping === 0 ? (
            <div className="flex items-center gap-2">
              <span className="line-through text-gray-400">$15.00</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
          ) : (
            <span className="font-medium">${(shipping / 100).toFixed(2)}</span>
          )}
        </div>

        <div className="flex justify-between text-gray-700">
          <span>Estimated Tax</span>
          <span className="font-medium">${(tax / 100).toFixed(2)}</span>
        </div>

        {/* Free Shipping Progress */}
        {subtotal < 15000 && (
          <div className="pt-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Add ${((15000 - subtotal) / 100).toFixed(2)} for free shipping
                </span>
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / 15000) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Promo Code */}
        {!promoApplied && (
          <form onSubmit={handlePromoSubmit} className="pt-3">
            <label htmlFor="promo" className="block text-sm font-medium text-gray-700 mb-2">
              Promo Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="promo"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter code"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Apply
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Try: FABRIC10</p>
          </form>
        )}

        {/* Total */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-gray-900">Total</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">
                ${(total / 100).toFixed(2)}
              </span>
              {savings > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  You saved ${(savings / 100).toFixed(2)}!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 space-y-3">
        <button
          onClick={onCheckout}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                    hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Proceed to Checkout
        </button>

        <Link
          href="/browse"
          className="w-full block text-center py-3 px-4 text-gray-700 bg-gray-50 rounded-lg
                    hover:bg-gray-100 transition-colors duration-200 font-medium"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="px-6 pb-6 space-y-3">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>Secure SSL encrypted checkout</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Package className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>30-day return policy</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>Premium quality guarantee</span>
        </div>
      </div>
    </div>
  )
})

CartItemCard.displayName = 'CartItemCard'
CartSummary.displayName = 'CartSummary'

// Empty Cart State Component
function EmptyCart() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Your cart is empty
        </h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Looks like you haven't added any fabrics to your cart yet.
          Explore our collection and find the perfect materials for your project.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3
                      bg-blue-600 text-white rounded-lg font-medium
                      hover:bg-blue-700 transition-colors duration-200"
          >
            <Package className="w-5 h-5" />
            Browse Fabrics
          </Link>

          <Link
            href="/wishlist"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3
                      bg-gray-100 text-gray-700 rounded-lg font-medium
                      hover:bg-gray-200 transition-colors duration-200"
          >
            <Heart className="w-5 h-5" />
            View Wishlist
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4">Popular categories</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['Silk', 'Cotton', 'Linen', 'Velvet', 'Wool'].map((category) => (
              <Link
                key={category}
                href={`/browse?category=${category.toLowerCase()}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full
                          text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600
                          transition-colors duration-200"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Cart Page Component
export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('fabric-cart')
        if (savedCart) {
          setCart(JSON.parse(savedCart))
        }
      } catch (error) {
        console.error('Error loading cart:', error)
        localStorage.removeItem('fabric-cart')
      } finally {
        setLoading(false)
      }
    }

    if (typeof window !== 'undefined') {
      loadCart()
    }
  }, [])

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Update cart in storage
  const updateCartInStorage = useCallback((updatedCart: CartItem[]) => {
    try {
      localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
      // Defer the event dispatch to avoid state updates during render
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: updatedCart }))
      }, 0)
    } catch (error) {
      console.error('Error saving cart:', error)
    }
  }, [])

  const updateQuantity = useCallback((id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }

    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
      updateCartInStorage(updatedCart)
      return updatedCart
    })
  }, [updateCartInStorage])

  const removeItem = useCallback((id: string) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== id)
      updateCartInStorage(updatedCart)
      setNotification({ message: 'Item removed from cart', type: 'success' })
      return updatedCart
    })
  }, [updateCartInStorage])

  const moveToWishlist = useCallback((item: CartItem) => {
    // Add to wishlist
    const wishlist = localStorage.getItem('fabric-wishlist')
    const wishlistItems = wishlist ? JSON.parse(wishlist) : []

    if (!wishlistItems.includes(item.productId)) {
      wishlistItems.push(item.productId)
      localStorage.setItem('fabric-wishlist', JSON.stringify(wishlistItems))
      window.dispatchEvent(new CustomEvent('wishlist-updated'))
    }

    // Remove from cart
    removeItem(item.id)
    setNotification({ message: 'Item moved to wishlist', type: 'success' })
  }, [removeItem])

  const handleCheckout = useCallback(() => {
    router.push('/checkout')
  }, [router])

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <EmptyCart />
      </div>
    )
  }

  // Cart with Items
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-7 h-7 text-blue-600" />
                Shopping Cart
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Review and edit your selections before checkout
              </p>
            </div>
            <Link
              href="/browse"
              className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 mb-8 lg:mb-0">
            {/* Items Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Cart Items ({cart.length})
              </h2>
              <button
                onClick={() => {
                  setCart([])
                  updateCartInStorage([])
                  setNotification({ message: 'Cart cleared', type: 'success' })
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear Cart
              </button>
            </div>

            {/* Items List */}
            {cart.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                onMoveToWishlist={moveToWishlist}
              />
            ))}

            {/* Info Banner */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium">Need fabric samples?</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Order swatches first to see and feel the fabric quality. All swatches are just $5 with free shipping.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary
              items={cart}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </main>
    </div>
  )
}