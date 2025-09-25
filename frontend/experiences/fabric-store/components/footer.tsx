'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function Footer() {
  return (
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
  )
}