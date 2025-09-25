'use client'

import React from 'react'

export default function NewsletterSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Stay Connected with
            <span className="text-blue-500 block">Exclusive Collections</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
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