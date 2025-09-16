'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ShoppingCart, Heart, Menu, X, Home, Layers, Phone } from 'lucide-react'
import UserAccount from './user-account'

export default function Header() {
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartAnimated, setCartAnimated] = useState(false)

  // Enhanced scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
    
    const handleCartUpdate = () => {
      updateCartCount()
      // Trigger cart animation
      setCartAnimated(true)
      setTimeout(() => setCartAnimated(false), 600)
    }
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-md'
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Enhanced Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              {/* Luxury Logo Treatment */}
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-gray-900 to-gray-700
                               rounded-lg flex items-center justify-center shadow-sm
                               transform transition-transform duration-200 group-hover:scale-105">
                  <Layers className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
              {/* Enhanced Brand Typography */}
              <div className="hidden md:flex flex-col">
                <span className="text-xl font-semibold text-gray-900
                               tracking-tight leading-none group-hover:text-blue-600
                               transition-colors duration-200">
                  Custom Fabric Designs
                </span>
                <span className="text-xs text-gray-500 uppercase tracking-wider leading-none mt-0.5">
                  Premium Fabrics
                </span>
              </div>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="font-medium text-gray-700 hover:text-blue-600
                         transition-colors duration-200 relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600
                             transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="/browse"
              className="font-medium text-gray-700 hover:text-blue-600
                         transition-colors duration-200 relative group"
            >
              Browse Fabrics
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600
                             transition-all duration-200 group-hover:w-full"></span>
            </Link>
            <Link
              href="/contact"
              className="font-medium text-gray-700 hover:text-blue-600
                         transition-colors duration-200 relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600
                             transition-all duration-200 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Enhanced Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Enhanced Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-700 hover:text-blue-600
                         transition-all duration-200 hover:bg-gray-100 rounded-lg"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white
                               text-xs rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Enhanced Cart */}
            <Link
              href="/cart"
              className={`relative p-2 text-gray-700 hover:text-blue-600
                         transition-all duration-200 hover:bg-gray-100 rounded-lg
                         ${cartAnimated ? 'animate-bounce' : ''}`}
              title="Shopping Cart"
            >
              <ShoppingCart className={`w-5 h-5 transition-transform duration-200 ${cartAnimated ? 'scale-110' : ''}`} />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white
                               text-xs rounded-full flex items-center justify-center font-bold
                               transition-all duration-200 ${cartAnimated ? 'scale-125 bg-green-600' : ''}`}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Enhanced User Account */}
            <UserAccount />

            {/* Enhanced Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600
                         hover:bg-gray-100 rounded-lg transition-all duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-1">
            <Link
              href="/"
              className="flex items-center space-x-3 px-3 py-2.5 text-gray-700
                         hover:bg-gray-100 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </Link>
            <Link
              href="/browse"
              className="flex items-center space-x-3 px-3 py-2.5 text-gray-700
                         hover:bg-gray-100 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Layers className="w-5 h-5" />
              <span className="font-medium">Browse Fabrics</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center space-x-3 px-3 py-2.5 text-gray-700
                         hover:bg-gray-100 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Phone className="w-5 h-5" />
              <span className="font-medium">Contact</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}