'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag, X, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CartNotificationProps {
  item: {
    title: string
    variant: string
    quantity: number
    price: number
    thumbnail?: string
    type?: 'swatch' | 'fabric'
    yardage?: number
  }
  onClose: () => void
}

export default function CartNotification({ item, onClose }: CartNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [cartTotal, setCartTotal] = useState(0)
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10)

    // Calculate cart totals
    const cartData = localStorage.getItem('fabric-cart')
    if (cartData) {
      const cart = JSON.parse(cartData)
      const total = cart.reduce((sum: number, cartItem: any) => {
        const itemPrice = cartItem.type === 'fabric' && cartItem.yardage
          ? cartItem.price * cartItem.yardage
          : cartItem.price * cartItem.quantity
        return sum + itemPrice
      }, 0)
      setCartTotal(total)
      setCartItemCount(cart.length)
    }

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const displayQuantity = item.type === 'fabric' && item.yardage
    ? `${item.yardage} yard${item.yardage !== 1 ? 's' : ''}`
    : item.type === 'swatch'
    ? `${item.quantity} swatch${item.quantity > 1 ? 'es' : ''}`
    : `${item.quantity} item${item.quantity > 1 ? 's' : ''}`

  const itemTotal = item.type === 'fabric' && item.yardage
    ? item.price * item.yardage
    : item.price * item.quantity

  return (
    <div className={`fixed top-24 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white rounded-xl shadow-2xl border border-pearl-200 overflow-hidden max-w-md">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-forest-500 to-forest-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full p-1">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-medium">Added to Cart</span>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Details */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Product Image */}
            {item.thumbnail && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-pearl-50 flex-shrink-0">
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Product Info */}
            <div className="flex-1">
              <h4 className="font-medium text-charcoal-800 line-clamp-1">
                {item.title}
              </h4>
              <p className="text-sm text-charcoal-500 mt-1">
                {item.variant}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-charcoal-600">
                  {displayQuantity}
                </span>
                <span className="font-semibold text-charcoal-800">
                  ${(itemTotal / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="mt-4 pt-4 border-t border-pearl-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-charcoal-600">
                Cart ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
              </span>
              <span className="font-semibold text-charcoal-800">
                Subtotal: ${(cartTotal / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-pearl-300 text-charcoal-700 rounded-lg
                         hover:bg-pearl-50 transition-colors duration-200 font-medium text-sm"
            >
              Continue Shopping
            </button>
            <Link
              href="/cart"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-charcoal-800 text-white rounded-lg
                         hover:bg-charcoal-900 transition-colors duration-200 font-medium text-sm
                         flex items-center justify-center gap-2"
            >
              View Cart
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-pearl-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-forest-500 to-forest-600
                          animate-progress-bar origin-left" />
        </div>
      </div>
    </div>
  )
}

// Add global styles for the progress bar animation
export const cartNotificationStyles = `
  @keyframes progress-bar {
    0% { transform: scaleX(1); }
    100% { transform: scaleX(0); }
  }

  .animate-progress-bar {
    animation: progress-bar 5s linear forwards;
  }
`