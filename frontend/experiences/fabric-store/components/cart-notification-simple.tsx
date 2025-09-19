'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import Link from 'next/link'

interface SimpleCartNotificationProps {
  item: {
    title: string
    variant: string
    quantity: number
    type?: 'swatch' | 'fabric'
    yardage?: number
  }
  onClose: () => void
}

export default function SimpleCartNotification({ item, onClose }: SimpleCartNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10)

    // Auto close after 3 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const displayQuantity = item.type === 'fabric' && item.yardage
    ? `${item.yardage} yard${item.yardage !== 1 ? 's' : ''}`
    : item.type === 'swatch'
    ? 'Sample'
    : `${item.quantity} item${item.quantity > 1 ? 's' : ''}`

  return (
    <div className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Success Icon */}
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Added to cart</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {item.title} • {displayQuantity}
              </p>

              {/* View Cart Link */}
              <Link
                href="/cart"
                className="inline-flex items-center text-sm font-medium text-gray-900 hover:text-gray-700 mt-2 underline underline-offset-2"
                onClick={handleClose}
              >
                View cart
              </Link>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}