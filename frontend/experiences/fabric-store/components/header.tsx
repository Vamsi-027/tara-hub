'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingCart, Heart, Menu, X, Home, Layers, Phone } from 'lucide-react'
import UserAccount from './user-account'

export default function Header() {
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Update cart count
  const updateCartCount = () => {
    const cart = localStorage.getItem('fabric-cart')
    if (cart) {
      const items = JSON.parse(cart)
      setCartCount(items.length)
    } else {
      setCartCount(0)
    }
  }

  // Update wishlist count
  const updateWishlistCount = () => {
    const wishlist = localStorage.getItem('fabric-wishlist')
    if (wishlist) {
      const items = JSON.parse(wishlist)
      setWishlistCount(items.length)
    } else {
      setWishlistCount(0)
    }
  }

  // Listen for cart and wishlist updates
  useEffect(() => {
    updateCartCount()
    updateWishlistCount()
    
    const handleCartUpdate = () => updateCartCount()
    const handleWishlistUpdate = () => updateWishlistCount()
    
    window.addEventListener('cart-updated', handleCartUpdate)
    window.addEventListener('storage', handleCartUpdate)
    window.addEventListener('wishlist-updated', handleWishlistUpdate)

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate)
      window.removeEventListener('storage', handleCartUpdate)
      window.removeEventListener('wishlist-updated', handleWishlistUpdate)
    }
  }, [])

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Tara Hub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Home
            </Link>
            <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Browse Fabrics
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
              title="Wishlist"
            >
              <Heart className="w-6 h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account */}
            <UserAccount />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <nav className="px-4 py-4 space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5" />
                <span>Home</span>
              </div>
            </Link>
            <Link
              href="/browse"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center space-x-3">
                <Layers className="w-5 h-5" />
                <span>Browse Fabrics</span>
              </div>
            </Link>
            <Link
              href="/contact"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5" />
                <span>Contact</span>
              </div>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}