'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function CTASection() {
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