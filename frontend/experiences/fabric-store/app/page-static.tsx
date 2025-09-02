'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { ArrowRight, Star, Truck, Shield, Clock, Palette, Sparkles, Heart } from 'lucide-react'

// Hero Section Component
function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600',
      title: 'Premium Fabric Collection',
      subtitle: 'Discover luxury fabrics for your next project',
      cta: 'Browse Collection'
    },
    {
      image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1600',
      title: 'Designer Textiles',
      subtitle: 'Handpicked materials from around the world',
      cta: 'Explore Now'
    },
    {
      image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1600',
      title: 'Sustainable Fabrics',
      subtitle: 'Eco-friendly options for conscious creators',
      cta: 'Shop Green'
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative h-[600px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 animate-fade-in-up">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 animate-fade-in-up animation-delay-200">
                {slide.subtitle}
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 animate-fade-in-up animation-delay-400"
              >
                {slide.cta}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      ))}
      
      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Free Shipping',
      description: 'On orders over $100'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Quality Guarantee',
      description: '100% authentic fabrics'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Fast Delivery',
      description: '2-5 business days'
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: 'Wide Selection',
      description: '1000+ fabric options'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Categories Section
function CategoriesSection() {
  const categories = [
    {
      name: 'Cotton',
      image: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400',
      count: 150
    },
    {
      name: 'Silk',
      image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=400',
      count: 85
    },
    {
      name: 'Linen',
      image: 'https://images.unsplash.com/photo-1525562723836-dca67a71d5f1?w=400',
      count: 120
    },
    {
      name: 'Velvet',
      image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400',
      count: 95
    },
    {
      name: 'Wool',
      image: 'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?w=400',
      count: 75
    },
    {
      name: 'Outdoor',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      count: 60
    }
  ]

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-xl text-gray-600">Find the perfect fabric for your project</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/browse?category=${category.name}`}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg mb-3">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white">
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-sm opacity-90">{category.count} items</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// Featured Products Section
function FeaturedProducts() {
  const [wishlist, setWishlist] = useState<string[]>([])

  const products = [
    {
      id: '1',
      name: 'Luxury Velvet - Royal Blue',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600',
      rating: 4.8,
      reviews: 124
    },
    {
      id: '2',
      name: 'Premium Silk - Ivory White',
      price: 129.99,
      image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=600',
      rating: 4.9,
      reviews: 89
    },
    {
      id: '3',
      name: 'Organic Cotton - Natural',
      price: 45.99,
      image: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=600',
      rating: 4.7,
      reviews: 156
    },
    {
      id: '4',
      name: 'Designer Linen - Sage Green',
      price: 75.99,
      image: 'https://images.unsplash.com/photo-1525562723836-dca67a71d5f1?w=600',
      rating: 4.6,
      reviews: 93
    }
  ]

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Featured Products</h2>
            <p className="text-xl text-gray-600">Our most popular fabrics</p>
          </div>
          <Link
            href="/browse"
            className="hidden md:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow">
              <div className="relative aspect-square overflow-hidden rounded-t-lg">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <Heart 
                    className={`w-5 h-5 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                  />
                </button>
                <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold">
                  NEW
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                  <Link
                    href={`/fabric/${product.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            View All Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-6" />
        <h2 className="text-4xl font-bold text-white mb-4">
          Start Your Next Project Today
        </h2>
        <p className="text-xl text-white/90 mb-8">
          Order fabric samples and get free shipping on your first order
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/browse"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Browse Fabrics
          </Link>
          <Link
            href="/auth/signin"
            className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </section>
  )
}

// Main Home Page Component
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CategoriesSection />
        <FeaturedProducts />
        <CTASection />
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <p className="text-gray-400">
                Premium fabric marketplace offering the finest textiles from around the world.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/browse" className="hover:text-white">Browse Fabrics</Link></li>
                <li><Link href="/products" className="hover:text-white">Products</Link></li>
                <li><Link href="/wishlist" className="hover:text-white">Wishlist</Link></li>
                <li><Link href="/cart" className="hover:text-white">Cart</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/shipping" className="hover:text-white">Shipping Info</Link></li>
                <li><Link href="/returns" className="hover:text-white">Returns</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <p className="text-gray-400 mb-4">
                Subscribe to our newsletter for exclusive offers
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-2 bg-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Tara Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}