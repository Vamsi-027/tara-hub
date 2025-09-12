'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/header'
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight,
  Sparkles,
  Heart,
  Eye,
  ShoppingCart,
  CheckCircle,
  Star
} from 'lucide-react'

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
}

// Cart Item Card Component
function CartItemCard({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: { 
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}) {
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    setIsRemoving(true)
    // Add slight delay for smooth animation
    setTimeout(() => {
      onRemove(item.id)
    }, 200)
  }

  return (
    <div className={`group bg-white border border-warm-200 rounded-2xl p-6 shadow-sm
                    hover:shadow-lg hover:border-gold-800/30 transition-all duration-300
                    ${isRemoving ? 'opacity-50 scale-95' : 'hover:-translate-y-0.5'}`}>
      <div className="flex items-start gap-6">
        {/* Product Image */}
        <div className="relative flex-shrink-0">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 bg-warm-100 rounded-xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-warm-400" />
            </div>
          )}
          
          {/* Type Badge */}
          {item.type && (
            <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-lg text-xs font-medium
                           ${item.type === 'swatch' 
                             ? 'bg-gold-100 text-gold-800 border border-gold-200' 
                             : 'bg-navy-100 text-navy-800 border border-navy-200'}`}>
              {item.type === 'swatch' ? 'Sample' : 'Order'}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl font-medium text-navy-800 mb-1 truncate">
            {item.title}
          </h3>
          <p className="font-body text-warm-600 mb-3">
            {item.variant}
          </p>
          
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-display text-2xl font-semibold text-navy-800">
              ${(item.price / 100).toFixed(2)}
            </span>
            {item.quantity > 1 && (
              <span className="font-body text-warm-500">
                × {item.quantity} = ${((item.price * item.quantity) / 100).toFixed(2)}
              </span>
            )}
          </div>

          {/* Quality Indicators */}
          <div className="flex items-center gap-4 text-sm text-warm-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Premium Quality</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-gold-800 fill-gold-800" />
              <span>Designer Collection</span>
            </div>
          </div>
        </div>

        {/* Quantity & Actions */}
        <div className="flex flex-col items-end gap-4">
          {/* Quantity Selector */}
          {item.type === 'swatch' ? (
            <div className="bg-gold-50 border border-gold-200 rounded-xl px-4 py-2">
              <span className="font-body text-gold-800 font-medium">Sample</span>
            </div>
          ) : (
            <div className="flex items-center bg-warm-50 border border-warm-200 rounded-xl">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="p-2 text-navy-600 hover:text-navy-800 hover:bg-warm-100 rounded-l-xl
                          transition-colors duration-200 disabled:opacity-50"
                disabled={item.quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-body font-medium text-navy-800">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="p-2 text-navy-600 hover:text-navy-800 hover:bg-warm-100 rounded-r-xl
                          transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="p-2 text-warm-400 hover:text-red-500 hover:bg-red-50 rounded-xl
                      transition-all duration-200 group-hover:scale-110"
            aria-label="Remove item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Cart Summary Component
function CartSummary({ 
  items, 
  onCheckout 
}: { 
  items: CartItem[]
  onCheckout: () => void
}) {
  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const subtotal = calculateSubtotal()
  const shipping = subtotal > 10000 ? 0 : 1500 // Free shipping over $100
  const tax = Math.round(subtotal * 0.08) // 8% tax estimate
  const total = subtotal + shipping + tax

  return (
    <div className="bg-white border border-warm-200 rounded-2xl p-8 shadow-sm sticky top-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6 text-navy-800" />
        <h2 className="font-display text-2xl font-semibold text-navy-800">
          Order Summary
        </h2>
      </div>

      {/* Items Count */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-warm-200">
        <span className="font-body text-warm-700">
          {items.length} {items.length === 1 ? 'item' : 'items'} in cart
        </span>
        <div className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>All items available</span>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between font-body text-navy-700">
          <span>Subtotal</span>
          <span className="font-medium">${(subtotal / 100).toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between font-body text-navy-700">
          <span>Shipping</span>
          {shipping === 0 ? (
            <div className="flex items-center gap-2">
              <span className="line-through text-warm-400">$15.00</span>
              <span className="font-medium text-green-600">FREE</span>
            </div>
          ) : (
            <span className="font-medium">${(shipping / 100).toFixed(2)}</span>
          )}
        </div>
        
        <div className="flex justify-between font-body text-navy-700">
          <span>Est. Tax</span>
          <span className="font-medium">${(tax / 100).toFixed(2)}</span>
        </div>

        {subtotal < 10000 && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-4">
            <p className="text-sm text-gold-800 font-medium">
              Add ${((10000 - subtotal) / 100).toFixed(2)} more for free shipping
            </p>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="border-t border-warm-200 pt-6 mb-8">
        <div className="flex justify-between items-center">
          <span className="font-display text-xl font-medium text-navy-800">Total</span>
          <span className="font-display text-2xl font-semibold text-navy-800">
            ${(total / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={onCheckout}
        className="w-full h-14 bg-navy-800 text-white font-body font-semibold text-lg
                  rounded-xl hover:bg-navy-700 hover:-translate-y-0.5 hover:shadow-lg
                  transition-all duration-300 flex items-center justify-center gap-3
                  mb-4 group"
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Continue Shopping */}
      <Link
        href="/browse"
        className="block w-full text-center py-3 font-body text-navy-600 
                  hover:text-gold-800 transition-colors duration-200"
      >
        Continue Shopping
      </Link>

      {/* Trust Indicators */}
      <div className="mt-8 pt-6 border-t border-warm-200 space-y-3">
        <div className="flex items-center gap-3 text-sm text-warm-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>30-day return policy</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-warm-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Secure SSL encryption</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-warm-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Expert design support</span>
        </div>
      </div>
    </div>
  )
}

// Empty Cart State Component
function EmptyCart() {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Elegant Empty Cart Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-16 h-16 text-navy-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold-600" />
          </div>
        </div>

        <h2 className="font-display text-3xl font-semibold text-navy-800 mb-4">
          Your Cart is Empty
        </h2>
        <p className="font-body text-warm-600 text-lg leading-relaxed mb-8">
          Discover our exquisite collection of premium fabrics and start creating 
          something extraordinary for your next design project.
        </p>

        {/* Call to Action */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-3 bg-navy-800 text-white px-8 py-4 
                    rounded-xl font-body font-semibold text-lg hover:bg-navy-700 
                    hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
        >
          <Eye className="w-5 h-5" />
          <span>Browse Fabrics</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Popular Categories */}
        <div className="mt-12 pt-8 border-t border-warm-200">
          <p className="font-body text-warm-600 text-sm mb-4">Popular Categories</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['Silk', 'Velvet', 'Cotton', 'Linen'].map((category) => (
              <Link
                key={category}
                href={`/browse?category=${category.toLowerCase()}`}
                className="px-4 py-2 bg-white border border-warm-200 rounded-full
                          font-body text-sm text-navy-700 hover:border-gold-800
                          hover:text-gold-800 transition-colors duration-200"
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

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('fabric-cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart:', error)
        localStorage.removeItem('fabric-cart')
      }
    }
    setLoading(false)
  }, [])

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }
    const updatedCart = cart.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    )
    setCart(updatedCart)
    localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
  }

  const removeItem = (id: string) => {
    const updatedCart = cart.filter(item => item.id !== id)
    setCart(updatedCart)
    localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
  }

  const handleCheckout = () => {
    window.location.href = '/checkout'
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-navy-200 border-t-navy-800 rounded-full animate-spin" />
          <p className="font-body text-warm-600">Loading your cart...</p>
        </div>
      </div>
    )
  }

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <>
        <Header />
        <EmptyCart />
      </>
    )
  }

  // Cart with Items
  return (
    <div className="min-h-screen bg-warm-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ShoppingCart className="w-6 h-6 text-gold-800" />
              <span className="text-gold-800 font-body font-medium uppercase tracking-wide text-sm">
                Shopping Cart
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
              Your Cart
            </h1>
            <p className="text-xl text-navy-100 max-w-2xl mx-auto font-body leading-relaxed">
              Review your selections before checkout. Each fabric has been carefully 
              curated for exceptional quality and design excellence.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-semibold text-navy-800">
                Cart Items ({cart.length})
              </h2>
              <Link
                href="/browse"
                className="font-body text-navy-600 hover:text-gold-800 transition-colors
                          flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add More Items
              </Link>
            </div>

            {cart.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
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