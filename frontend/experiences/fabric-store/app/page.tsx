'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fabricCollections, fabricSwatches } from '@shared/data/fabric-data'
import { useHeroCarousel } from '../hooks/useHeroCarousel'
import {
  MenuIcon,
  XIcon,
  SearchIcon,
  TruckIcon,
  PackageIcon,
  ClockIcon,
  ArrowRightIcon,
  StarIcon,
  ShoppingBagIcon
} from '../components/client-icon'

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
              <MenuIcon className="w-5 h-5 text-gray-600" />
            </button>
            
            <span className="font-medium text-gray-700">Premium Fabric Samples</span>
            
            <Link 
              href="/browse"
              className="relative p-2"
            >
              <ShoppingBagIcon className="w-6 h-6 text-gray-600" />
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
                <XIcon className="w-5 h-5" />
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

// Hero Carousel Component
function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const { slides: sanitySlides, loading, error } = useHeroCarousel()
  
  console.log('HeroCarousel render:', { loading, slidesLength: sanitySlides.length, error })

  // Use Sanity data if available, otherwise use fallback
  const slides = sanitySlides.length > 0 ? sanitySlides.map(slide => ({
    id: slide._id,
    title: slide.title || 'Untitled Slide',
    subtitle: slide.subtitle || 'No subtitle',
    description: slide.description || 'No description available',
    features: slide.features || [],
    searchPlaceholder: slide.searchPlaceholder || 'Search fabrics...',
    background: getGradientClass(slide.backgroundGradient || 'blue'),
    textColor: slide.textColor === 'white' ? 'text-white' : 'text-gray-900',
    image: slide.image?.asset?.url || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    cta: slide.ctaText || null,
    ctaLink: slide.ctaLink || null,
    alt: slide.image?.alt || slide.title
  })) : []

  // Gradient mapping function
  function getGradientClass(gradient: string) {
    const gradients = {
      blue: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      purple: 'bg-gradient-to-br from-purple-50 to-pink-100', 
      green: 'bg-gradient-to-br from-green-50 to-teal-100',
      orange: 'bg-gradient-to-br from-orange-50 to-amber-100'
    }
    return gradients[gradient as keyof typeof gradients] || gradients.blue
  }

  // Color mapping function for feature icons
  function getFeatureColorClass(color: string) {
    const colors = {
      amber: 'bg-amber-100 text-amber-600',
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (slides.length > 0) {
      const interval = setInterval(nextSlide, 5000)
      return () => clearInterval(interval)
    }
  }, [slides.length])

  // Loading state
  if (loading) {
    return (
      <section className="relative pt-32 md:pt-20 pb-12 md:pb-20 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[500px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </section>
    )
  }

  // Error state - show fallback
  if (error || slides.length === 0) {
    console.log('Using fallback slides due to error:', error)
  }

  return (
    <section className="relative pt-32 md:pt-20 pb-12 md:pb-20 overflow-hidden">
      {/* Carousel Container */}
      <div className="relative h-[600px] md:h-[500px]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide 
                ? 'opacity-100 translate-x-0' 
                : index < currentSlide 
                  ? 'opacity-0 -translate-x-full' 
                  : 'opacity-0 translate-x-full'
            } ${slide.background}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
              <div className="grid lg:grid-cols-2 gap-12 items-center h-full">
                {/* Content - Left Side */}
                <div className="space-y-6 md:space-y-8 lg:pr-8">
                  {/* Headers */}
                  <div className="space-y-3 md:space-y-4">
                    <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${slide.textColor} leading-tight`}>
                      {slide.title}
                    </h1>
                    <h2 className="text-lg md:text-xl lg:text-2xl text-gray-600 font-medium">
                      {slide.subtitle}
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 max-w-xl">
                      {slide.description}
                    </p>
                  </div>

                  {/* Features - Dynamic from Sanity */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Features</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {slide.features?.filter(feature => feature && feature.text)?.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${getFeatureColorClass(feature.color || 'blue')}`}>
                            <span className="text-xs font-bold">✓</span>
                          </span>
                          <span>{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search Box */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Find Your Perfect Fabric</h3>
                    <div className="relative">
                      <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder={slide.searchPlaceholder || 'Search fabrics by designer, style, color...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-28 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <Link
                        href={`/browse${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        Search
                      </Link>
                    </div>
                  </div>

                  {/* CTA */}
                  {slide.ctaLink && slide.cta && (
                    <div className="pt-2">
                      <Link
                        href={slide.ctaLink}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors"
                      >
                        {slide.cta}
                        <ArrowRightIcon className="w-5 h-5" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Image - Right Side */}
                <div className="relative lg:order-last order-first">
                  <div className="aspect-[4/3] relative overflow-hidden rounded-2xl shadow-2xl">
                    <Image
                      src={slide.image}
                      alt={slide.alt || slide.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={index === 0}
                    />
                    {/* Optional overlay for better text contrast if needed */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 hover:bg-white transition-colors shadow-lg z-10"
      >
        <ArrowRightIcon className="w-5 h-5 rotate-180" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 hover:bg-white transition-colors shadow-lg z-10"
      >
        <ArrowRightIcon className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-blue-600' : 'bg-white/60'
            }`}
          />
        ))}
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
            <ArrowRightIcon className="w-4 h-4" />
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
      title: 'Add to Cart',
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
      <HeroCarousel />
      <FeaturedCollections />
      <PopularSwatches />
      <HowItWorks />
    </div>
  )
}