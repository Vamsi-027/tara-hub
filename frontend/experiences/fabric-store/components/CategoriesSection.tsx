'use client'

import Link from 'next/link'
import { 
  Sofa, 
  Home, 
  Square, 
  Trees, 
  Palette, 
  Leaf 
} from 'lucide-react'

const categories = [
  {
    id: 'upholstery',
    name: 'Upholstery',
    tagline: 'Premium fabrics for sofas, chairs & furniture',
    icon: Sofa,
    color: 'from-blue-500 to-blue-600',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop'
  },
  {
    id: 'curtains',
    name: 'Curtains & Drapes',
    tagline: 'Elegant window treatments for every room',
    icon: Home,
    color: 'from-purple-500 to-purple-600',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop'
  },
  {
    id: 'cushions',
    name: 'Cushion Covers',
    tagline: 'Decorative accents to complete your space',
    icon: Square,
    color: 'from-pink-500 to-pink-600',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&h=300&fit=crop'
  },
  {
    id: 'outdoor',
    name: 'Outdoor Fabrics',
    tagline: 'Weather-resistant materials for patio & garden',
    icon: Trees,
    color: 'from-green-500 to-green-600',
    image: 'https://images.unsplash.com/photo-1519947486511-46149fa0a254?w=400&h=300&fit=crop'
  },
  {
    id: 'designer',
    name: 'Designer Patterns',
    tagline: 'Exclusive prints & luxury textile designs',
    icon: Palette,
    color: 'from-indigo-500 to-indigo-600',
    image: 'https://images.unsplash.com/photo-1561053720-76cd73ff22c3?w=400&h=300&fit=crop'
  },
  {
    id: 'eco-friendly',
    name: 'Eco-Friendly Fabrics',
    tagline: 'Sustainable choices for conscious living',
    icon: Leaf,
    color: 'from-emerald-500 to-emerald-600',
    image: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400&h=300&fit=crop'
  }
]

export default function CategoriesSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our curated collection of premium home fabrics, each category specially selected for quality and style
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.id}
                href={`/browse?category=${category.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Background Image */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative p-8">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${category.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-white transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 group-hover:text-gray-100 transition-colors duration-300">
                    {category.tagline}
                  </p>

                  {/* Hover Arrow */}
                  <div className="mt-4 flex items-center text-gray-900 group-hover:text-white transition-colors duration-300">
                    <span className="text-sm font-semibold">Browse Collection</span>
                    <svg
                      className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Decorative Corner */}
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${category.color} opacity-10 transform rotate-45 translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500`} />
              </Link>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <Link
            href="/browse"
            className="inline-flex items-center px-6 py-3 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition-colors duration-300"
          >
            View All Fabrics
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}