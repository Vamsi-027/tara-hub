'use client'

import React from 'react'
import { Truck, Shield, Clock, Palette } from 'lucide-react'

export default function FeaturesSection() {
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
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Custom Fabric Designs Experience
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Where luxury meets craftsmanship, every detail is designed to exceed expectations
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group animate-fade-in-up" 
                 style={{ animationDelay: `${(index + 1) * 200}ms` }}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white
                           border border-gray-200 text-blue-500 rounded-xl mb-4
                           shadow-sm group-hover:shadow-md
                           transform group-hover:scale-105 transition-all duration-200">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}