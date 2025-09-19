'use client'

import React from 'react'
import Header from '@/components/header'
import { SimilarProductsCarousel } from '@/components/v2/SimilarProductsCarousel'
import { ArrowRight, Star, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CarouselDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-light mb-4">
              Similar Products Carousel Demo
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Interactive carousel component showcasing related fabric recommendations
            </p>
          </div>
        </div>
      </div>

      {/* Demo Product Context */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-semibold">Demo Product</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">Upholstery</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Premium Blue Velvet Upholstery
              </h2>
              <p className="text-gray-600 mb-4">
                Luxurious velvet fabric perfect for high-end furniture upholstery.
                Soft texture with excellent durability and stain resistance.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">$124.99</span>
                  <span className="text-gray-500">per yard</span>
                </div>
                <Button className="gap-2">
                  <Heart className="w-4 h-4" />
                  Add to Wishlist
                </Button>
                <Button variant="outline" className="gap-2">
                  Order Sample
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">🎯 Smart Recommendations</h3>
            <p className="text-gray-600 text-sm">
              Algorithm suggests products based on category, color, material, and price range
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">📱 Responsive Design</h3>
            <p className="text-gray-600 text-sm">
              Horizontal scroll on mobile, navigation buttons on desktop with smooth animations
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">🛒 Quick Actions</h3>
            <p className="text-gray-600 text-sm">
              Hover to reveal quick add to cart and wishlist buttons for faster shopping
            </p>
          </div>
        </div>
      </div>

      {/* Similar Products Carousel */}
      <SimilarProductsCarousel
        currentProductId="demo-product-1"
        category="Upholstery"
        color="Blue"
        material="Velvet"
        priceRange={[100, 150]}
        title="You Might Also Like"
        maxItems={6}
      />

      {/* Additional Carousel Examples */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Multiple Carousel Variations
          </h3>
          <p className="text-gray-600">
            The carousel component can be customized with different titles, filters, and product counts.
          </p>
        </div>
      </div>

      {/* Alternative Category Carousel */}
      <SimilarProductsCarousel
        currentProductId="demo-product-2"
        category="Drapery"
        title="Popular in Drapery"
        maxItems={4}
      />

      {/* Recently Viewed Style Carousel */}
      <div className="bg-gray-100 py-12">
        <SimilarProductsCarousel
          currentProductId="demo-product-3"
          title="Recently Viewed"
          maxItems={5}
        />
      </div>

      {/* Implementation Notes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Implementation Notes
          </h3>

          <div className="space-y-4 text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Component Features:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Smooth horizontal scrolling with navigation buttons</li>
                <li>Responsive design - scroll on mobile, buttons on desktop</li>
                <li>Product card hover effects with quick actions</li>
                <li>Visual badges for stock status and sample availability</li>
                <li>Color swatches and category indicators</li>
                <li>Gradient fade overlays for visual polish</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Usage:</h4>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
{`<SimilarProductsCarousel
  currentProductId="product-123"
  category="Upholstery"
  color="Blue"
  material="Velvet"
  priceRange={[100, 200]}
  title="Similar Products"
  maxItems={6}
/>`}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Integration Points:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Product Detail Pages - Show related products</li>
                <li>Cart/Checkout - Cross-sell complementary items</li>
                <li>Homepage - Featured or trending products</li>
                <li>Category Pages - Alternative options</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}