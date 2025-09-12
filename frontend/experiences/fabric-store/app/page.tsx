'use client'

import React from 'react'
import Link from 'next/link'
import Header from '@/components/header'
import HeroCarousel from '@/components/HeroCarousel'
import CategoriesSection from '@/components/CategoriesSection'
import FeaturedProducts from '@/components/FeaturedProducts'
import { Truck, Shield, Clock, Palette, Sparkles } from 'lucide-react'

// Enhanced Features Section
function FeaturesSection() {
  const features = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Complimentary Shipping',
      description: 'White-glove delivery on orders over $150'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Artisan Quality',
      description: 'Authenticated luxury textiles'
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Express Service',
      description: 'Priority handling within 24 hours'
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: 'Curated Collection',
      description: '500+ exclusive fabric selections'
    }
  ]

  return (
    <section className="section-luxury bg-champagne-300/30">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-charcoal-800 mb-4 
                       animate-fade-in-up">
            The Custom Fabric Designs Experience
          </h2>
          <p className="text-xl text-charcoal-600 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Where luxury meets craftsmanship, every detail is designed to exceed expectations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group animate-fade-in-up" 
                 style={{ animationDelay: `${(index + 1) * 200}ms` }}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-pearl-50 
                           border-2 border-pearl-300 text-burgundy-600 rounded-2xl mb-6
                           shadow-luxury group-hover:shadow-luxury-lg 
                           transform group-hover:scale-105 transition-all duration-500">
                {feature.icon}
              </div>
              <h3 className="font-display text-xl font-semibold text-charcoal-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-charcoal-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Enhanced Newsletter Section
function NewsletterSection() {
  return (
    <section className="section-luxury bg-pearl-100">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <div className="animate-fade-in-up">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-charcoal-800 mb-6">
            Stay Connected with
            <span className="text-shimmer block">Exclusive Collections</span>
          </h2>
          <p className="text-xl text-charcoal-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Be the first to discover our latest arrivals and receive insider access to 
            limited-edition fabrics and designer collaborations
          </p>
        </div>
        
        <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto animate-fade-in-up animation-delay-200">
          <input
            type="email"
            placeholder="Enter your email address"
            className="input-luxury flex-1 text-center sm:text-left"
            required
          />
          <button
            type="submit"
            className="btn-accent px-8 py-4 whitespace-nowrap"
          >
            Join Collection
          </button>
        </form>
        
        <p className="text-xs text-charcoal-500 mt-6 animate-fade-in-up animation-delay-400">
          No spam, only curated content. Unsubscribe anytime.
        </p>
      </div>
    </section>
  )
}

// Enhanced CTA Section
function CTASection() {
  return (
    <section className="relative section-luxury bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-burgundy-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pearl-50/20 to-transparent 
                       transform -skew-y-6 scale-110"></div>
      </div>
      
      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <div className="animate-fade-in-up">
          <Sparkles className="w-16 h-16 text-champagne-300 mx-auto mb-8" />
          <h2 className="font-display text-5xl md:text-6xl font-semibold text-pearl-50 mb-6 leading-tight">
            Begin Your
            <span className="text-champagne-300 block">Luxury Journey</span>
          </h2>
          <p className="text-2xl text-pearl-100/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the finest textiles with complimentary samples and 
            white-glove service from day one
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up animation-delay-400">
          <Link
            href="/browse"
            className="btn-primary bg-pearl-50 text-charcoal-800 hover:bg-pearl-100 
                     px-12 py-5 text-lg font-medium shadow-luxury-lg"
          >
            Explore Collections
          </Link>
          <Link
            href="/auth/signin"
            className="bg-transparent text-pearl-50 border-2 border-pearl-50/30 
                     px-12 py-5 rounded-xl font-medium hover:bg-pearl-50/10 
                     transition-all duration-300 hover:border-pearl-50/60 
                     backdrop-blur-sm text-lg"
          >
            Start Account
          </Link>
        </div>
        
        <div className="mt-12 animate-fade-in-up animation-delay-600">
          <p className="text-sm text-pearl-300/80 uppercase tracking-wider">
            Trusted by Interior Designers Worldwide
          </p>
        </div>
      </div>
    </section>
  )
}

// Main Home Page Component
export default function HomePage() {
  return (
    <div className="min-h-screen bg-pearl-100">
      <Header />
      <main className="pt-20">
        <HeroCarousel />
        <FeaturesSection />
        <CategoriesSection />
        <FeaturedProducts />
        <NewsletterSection />
        <CTASection />
      </main>
      
      {/* Enhanced Footer */}
      <footer className="bg-charcoal-900 text-pearl-100 section-luxury">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-champagne-300 to-burgundy-600 
                               rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-charcoal-900" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-pearl-50">Custom Fabric Designs</h3>
                  <p className="text-sm text-pearl-300 uppercase tracking-wider">Premium Fabrics</p>
                </div>
              </div>
              <p className="text-pearl-300 leading-relaxed max-w-md mb-6">
                Curating the world's finest textiles for discerning designers and premium home projects. 
                Where heritage craftsmanship meets contemporary sophistication.
              </p>
            </div>
            
            <div>
              <h4 className="font-display text-lg font-semibold text-pearl-50 mb-6">Collections</h4>
              <ul className="space-y-3 text-pearl-300">
                <li><Link href="/browse" className="hover:text-champagne-300 transition-colors">Browse Fabrics</Link></li>
                <li><Link href="/wishlist" className="hover:text-champagne-300 transition-colors">Wishlist</Link></li>
                <li><Link href="/cart" className="hover:text-champagne-300 transition-colors">Cart</Link></li>
                <li><Link href="/contact" className="hover:text-champagne-300 transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-lg font-semibold text-pearl-50 mb-6">Service</h4>
              <ul className="space-y-3 text-pearl-300">
                <li><Link href="/contact" className="hover:text-champagne-300 transition-colors">Concierge</Link></li>
                <li><Link href="/shipping" className="hover:text-champagne-300 transition-colors">Delivery</Link></li>
                <li><Link href="/returns" className="hover:text-champagne-300 transition-colors">Returns</Link></li>
                <li><Link href="/faq" className="hover:text-champagne-300 transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-pearl-600/30 pt-8 flex flex-col md:flex-row 
                         justify-between items-center text-pearl-400">
            <p className="text-sm">
              &copy; 2024 Custom Fabric Designs. All rights reserved. 
              <span className="text-champagne-300 ml-2">Crafted with care</span>
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm hover:text-champagne-300 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm hover:text-champagne-300 transition-colors">
                Terms
              </Link>
              <Link href="/accessibility" className="text-sm hover:text-champagne-300 transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}