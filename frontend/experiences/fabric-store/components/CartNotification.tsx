'use client'

import { useEffect, useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'

interface CartNotification {
  id: string
  message: string
  timestamp: number
}

export function CartNotificationProvider() {
  const [notifications, setNotifications] = useState<CartNotification[]>([])

  useEffect(() => {
    const handleCartUpdated = (event: CustomEvent) => {
      // Add a notification when cart is updated
      const notification: CartNotification = {
        id: `notification-${Date.now()}`,
        message: 'Added to cart',
        timestamp: Date.now()
      }

      setNotifications(prev => [...prev, notification])

      // Remove notification after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, 3000)
    }

    // Listen for cart updates
    window.addEventListener('cart-updated', handleCartUpdated as EventListener)

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated as EventListener)
    }
  }, [])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-right"
        >
          <div className="bg-white/20 rounded-full p-1">
            <Check className="w-4 h-4" />
          </div>
          <span className="font-medium">{notification.message}</span>
          <ShoppingCart className="w-4 h-4" />
        </div>
      ))}

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