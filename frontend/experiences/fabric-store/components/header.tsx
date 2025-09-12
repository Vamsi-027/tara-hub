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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-pearl-50/95 backdrop-blur-md border-b border-pearl-300 shadow-luxury' 
        : 'bg-pearl-50 border-b border-pearl-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Enhanced Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              {/* Luxury Logo Treatment */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-charcoal-800 via-charcoal-700 to-burgundy-600 
                               rounded-xl flex items-center justify-center shadow-luxury 
                               transform transition-transform duration-300 group-hover:scale-105">
                  <Layers className="w-7 h-7 text-pearl-50" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-charcoal-800 to-burgundy-600 
                               rounded-xl blur opacity-20 transform scale-110"></div>
              </div>
              {/* Enhanced Brand Typography */}
              <div className="flex flex-col">
                <span className="font-display text-2xl font-semibold text-charcoal-800 
                               tracking-tight leading-none group-hover:text-burgundy-600 
                               transition-colors duration-300">
                  Custom Fabric Designs
                </span>
                <span className="font-body text-xs text-charcoal-500 uppercase tracking-wider leading-none">
                  Premium Fabrics
                </span>
              </div>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="font-body font-medium text-charcoal-700 hover:text-burgundy-600 
                         transition-colors duration-300 relative group"
            >
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-burgundy-600 
                             transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/browse" 
              className="font-body font-medium text-charcoal-700 hover:text-burgundy-600 
                         transition-colors duration-300 relative group"
            >
              Browse Fabrics
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-burgundy-600 
                             transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/contact" 
              className="font-body font-medium text-charcoal-700 hover:text-burgundy-600 
                         transition-colors duration-300 relative group"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-burgundy-600 
                             transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Enhanced Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Enhanced Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-3 text-charcoal-700 hover:text-burgundy-600 
                         transition-all duration-300 hover:bg-champagne-300/50 rounded-lg
                         transform hover:scale-105"
              title="Wishlist"
            >
              <Heart className="w-6 h-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-burgundy-600 text-pearl-50 
                               text-xs rounded-full flex items-center justify-center font-bold
                               animate-fade-in-scale">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Enhanced Cart */}
            <Link
              href="/cart"
              className="relative p-3 text-charcoal-700 hover:text-burgundy-600 
                         transition-all duration-300 hover:bg-champagne-300/50 rounded-lg
                         transform hover:scale-105"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-charcoal-800 text-pearl-50 
                               text-xs rounded-full flex items-center justify-center font-bold
                               animate-fade-in-scale">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Enhanced User Account */}
            <UserAccount />

            {/* Enhanced Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-3 text-charcoal-700 hover:text-burgundy-600 
                         hover:bg-champagne-300/50 rounded-lg transition-all duration-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-pearl-300 bg-pearl-50/95 backdrop-blur-md">
          <nav className="px-4 py-6 space-y-3">
            <Link
              href="/"
              className="flex items-center space-x-3 px-4 py-3 text-charcoal-700 
                         hover:bg-champagne-300/50 rounded-lg transition-all duration-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </Link>
            <Link
              href="/browse"
              className="flex items-center space-x-3 px-4 py-3 text-charcoal-700 
                         hover:bg-champagne-300/50 rounded-lg transition-all duration-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Layers className="w-5 h-5" />
              <span className="font-medium">Browse Fabrics</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center space-x-3 px-4 py-3 text-charcoal-700 
                         hover:bg-champagne-300/50 rounded-lg transition-all duration-300"
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