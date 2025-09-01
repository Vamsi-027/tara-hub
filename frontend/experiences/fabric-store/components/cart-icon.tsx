'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

export default function CartIcon() {
  const [cartCount, setCartCount] = useState(0)

  const updateCartCount = () => {
    const cart = localStorage.getItem('fabric-cart')
    if (cart) {
      const items = JSON.parse(cart)
      // Count the number of distinct items/orders, not total quantity
      setCartCount(items.length)
    } else {
      setCartCount(0)
    }
  }

  useEffect(() => {
    // Initial count
    updateCartCount()

    // Listen for cart updates
    const handleCartUpdate = () => updateCartCount()
    window.addEventListener('cart-updated', handleCartUpdate)
    window.addEventListener('storage', handleCartUpdate)

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
      window.removeEventListener('storage', handleCartUpdate)
    }
  }, [])

  return (
    <Link 
      href="/cart" 
      className="relative p-2 hover:bg-gray-100 rounded-full transition"
    >
      <ShoppingCart className="h-6 w-6" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  )
}