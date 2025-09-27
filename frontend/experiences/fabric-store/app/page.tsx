'use client'

import React from 'react'
import Header from '@/components/header'
import HeroCarousel from '@/components/HeroCarousel'
import CategoriesSection from '@/components/CategoriesSection'
import FeaturedProducts from '@/components/FeaturedProducts'
import FeaturesSection from '@/components/homepage/features-section'
import NewsletterSection from '@/components/homepage/newsletter-section'
import CTASection from '@/components/homepage/cta-section'
import Footer from '@/components/footer'

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
      <Footer />
    </div>
  )
}