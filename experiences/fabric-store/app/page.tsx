'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Truck, Package, Clock, ArrowRight, Star, ShoppingBag, Menu, X } from 'lucide-react'
import { fabricCollections, fabricSwatches } from '@tara-hub/lib/fabric-data'

// Mobile Header Component
function MobileHeader({ swatchCount }: { swatchCount: number }) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 10)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      {/* Mobile Header Bar */}
      <header className={`
        fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm
        transform transition-transform duration-300 md:hidden
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}>
        <div className="px-4 py-2">
          {/* Logo and Domain */}
          <div className="flex items-center justify-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div>
                <h1 className="font-bold text-sm text-gray-900">Custom Design Fabrics</h1>
                <p className="text-xs text-gray-500">www.customdesignfabrics.com</p>
              </div>
            </div>
          </div>

          {/* Menu and Cart */}
          <div className="flex items-center justify-between">
            <button 
              className="p-2"
              onClick={() => setShowMenu(!showMenu)}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <span className="font-medium text-gray-700">Premium Fabric Samples</span>
            
            <Link 
              href="/browse"
              className="relative p-2"
            >
              <ShoppingBag className="w-6 h-6 text-gray-600" />
              {swatchCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {swatchCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Mobile Menu */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out md:hidden
        ${showMenu ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-gray-900">Custom Design Fabrics</span>
            </div>
            <button onClick={() => setShowMenu(false)} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-4">
            <Link href="/" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link href="/browse" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Browse Fabrics
            </Link>
            <Link href="#collections" className="block py-2 text-gray-700 hover:text-blue-600 font-medium" onClick={() => setShowMenu(false)}>
              Collections
            </Link>
            <Link href="#how-it-works" className="block py-2 text-gray-700 hover:text-blue-600 font-medium" onClick={() => setShowMenu(false)}>
              How It Works
            </Link>
          </nav>

          <div className="mt-8">
            <Link
              href="/browse"
              className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={() => setShowMenu(false)}
            >
              Browse Premium Samples
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

// Hero Section
function SwatchesHero() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 pt-32 md:pt-20 pb-12 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 md:space-y-8">
          <div className="space-y-3 md:space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Experience Luxury Fabrics First-Hand
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 font-medium">
              Touch the Difference Quality Makes
            </p>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              Discover our curated collection of premium fabric samples from world-renowned mills. 
              Each professionally mounted sample includes complete specifications, origin details, and exclusive designer notes.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">✓</span>
              <span>Trusted by 500+ Interior Designers</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-amber-600">✓</span>
              <span>Access to trade-only collections</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-amber-600">✓</span>
              <span>Samples include full pattern repeat</span>
            </div>
          </div>

          {/* Value Props */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Premium Presentation</div>
                <div className="text-sm text-gray-600">8×8 samples on archival board</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Designer Sets Available</div>
                <div className="text-sm text-gray-600">Curated 5-piece collections</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">White Glove Service</div>
                <div className="text-sm text-gray-600">Tracked delivery in 3-5 days</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search luxury fabrics by designer, collection, or style..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-32 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
              <Link
                href={`/browse${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse
              </Link>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <div className="text-center">
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Explore Fabric Collections
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-gray-600 mt-3">Investment pieces from $18</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Featured Collections
function FeaturedCollections() {
  return (
    <section id="collections" className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            Featured Fabric Collections
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Explore exclusive fabric collections from heritage mills and contemporary designers. 
            Each sample is a gateway to extraordinary interiors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {fabricCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/browse?collection=${collection.id}`}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
                    <p className="text-sm opacity-90">{collection.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Popular Swatches Preview
function PopularSwatches() {
  const popularFabrics = fabricSwatches.slice(0, 8)

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 md:space-y-6 mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            Most Popular Swatches
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            See what other customers are ordering. These are our most requested fabric samples.
          </p>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {popularFabrics.map((fabric) => (
            <div key={fabric.id} className="group cursor-pointer">
              <div className="aspect-square relative overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <Image
                  src={fabric.swatchImageUrl}
                  alt={fabric.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="150px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-medium truncate">{fabric.name}</p>
                  <p className="text-xs opacity-80">{fabric.sku}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-base font-semibold hover:bg-gray-800 transition-colors"
          >
            View All Fabrics
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// How It Works
function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: 'Browse & Select',
      description: 'Choose up to 5 fabric swatches from our extensive collection',
      icon: '🔍'
    },
    {
      step: 2,
      title: 'Add to Swatch Box',
      description: 'Build your swatch collection with our easy-to-use interface',
      icon: '📦'
    },
    {
      step: 3,
      title: 'Enter Shipping Info',
      description: 'Provide your address - no payment required for samples',
      icon: '📋'
    },
    {
      step: 4,
      title: 'Receive & Decide',
      description: 'Get your swatches in 3-5 days and make your final choice',
      icon: '✨'
    }
  ]

  return (
    <section id="how-it-works" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Getting fabric swatches is simple and completely free. Here's how our process works.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.step} className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{step.icon}</span>
              </div>
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto font-bold">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Site Header Component
function SiteHeader() {
  return (
    <header className="bg-white border-b border-gray-200 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo and Site Name */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              {/* Site Name and Domain */}
              <div>
                <h1 className="text-xl font-bold text-gray-900">Custom Design Fabrics</h1>
                <p className="text-xs text-gray-500">www.customdesignfabrics.com</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
              Home
            </Link>
            <Link href="/browse" className="text-gray-600 hover:text-gray-900 font-medium">
              Browse Fabrics
            </Link>
            <Link href="#collections" className="text-gray-600 hover:text-gray-900 font-medium">
              Collections
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium">
              How It Works
            </Link>
          </nav>

          {/* CTA Button */}
          <Link
            href="/browse"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Browse Collections
          </Link>
        </div>
      </div>
    </header>
  )
}

// Main Page
export default function FabricSwatchesHomepage() {
  const [swatchCount] = useState(0)

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <MobileHeader swatchCount={swatchCount} />
      <SwatchesHero />
      <FeaturedCollections />
      <PopularSwatches />
      <HowItWorks />
    </div>
  )
}