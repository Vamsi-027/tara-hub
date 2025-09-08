'use client'

import Link from 'next/link'
import { ShoppingBag, Heart, Eye, Star } from 'lucide-react'
import { useState } from 'react'

const featuredProducts = [
  {
    id: 'velvet-emerald-sofa',
    name: 'Emerald Velvet Upholstery',
    description: 'Luxurious deep-pile velvet perfect for statement sofas and elegant chairs',
    price: 89.99,
    originalPrice: 119.99,
    pricePerUnit: 'per yard',
    fabricType: 'Premium Velvet',
    category: 'Upholstery',
    image: 'https://images.unsplash.com/photo-1631049035326-57414e1739d7?w=600&h=600&fit=crop',
    colors: ['#065f46', '#1e40af', '#7c2d12', '#581c87'],
    rating: 4.8,
    reviews: 127,
    badge: 'Best Seller',
    features: ['Stain Resistant', 'Pet Friendly', 'Fire Retardant']
  },
  {
    id: 'linen-curtain-natural',
    name: 'Natural Linen Curtain Fabric',
    description: 'Breathable, light-filtering linen ideal for modern window treatments',
    price: 54.99,
    pricePerUnit: 'per yard',
    fabricType: '100% Linen',
    category: 'Curtains & Drapes',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=600&fit=crop',
    colors: ['#f5f5f4', '#d4d4d8', '#fef3c7', '#ddd6fe'],
    rating: 4.9,
    reviews: 89,
    badge: 'New Arrival',
    features: ['Natural Fiber', 'Easy Care', 'Light Filtering']
  },
  {
    id: 'geometric-cushion-fabric',
    name: 'Modern Geometric Print',
    description: 'Bold contemporary patterns for accent cushions and throw pillows',
    price: 39.99,
    originalPrice: 49.99,
    pricePerUnit: 'per yard',
    fabricType: 'Cotton Blend',
    category: 'Cushion Covers',
    image: 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=600&h=600&fit=crop',
    colors: ['#f97316', '#0891b2', '#dc2626', '#16a34a'],
    rating: 4.7,
    reviews: 65,
    badge: 'Sale',
    features: ['Machine Washable', 'Colorfast', 'Soft Touch']
  },
  {
    id: 'outdoor-waterproof-stripe',
    name: 'Waterproof Striped Canvas',
    description: 'Durable outdoor fabric perfect for patio furniture and garden cushions',
    price: 64.99,
    pricePerUnit: 'per yard',
    fabricType: 'Outdoor Canvas',
    category: 'Outdoor Fabrics',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=600&fit=crop',
    colors: ['#1e3a8a', '#dc2626', '#059669', '#7c3aed'],
    rating: 4.6,
    reviews: 42,
    badge: 'Weather Resistant',
    features: ['UV Protected', 'Mold Resistant', 'Waterproof']
  }
]

export default function FeaturedProducts() {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [selectedColors, setSelectedColors] = useState<{[key: string]: number}>({})

  const handleColorSelect = (productId: string, colorIndex: number) => {
    setSelectedColors(prev => ({ ...prev, [productId]: colorIndex }))
  }

  const handleAddToCart = (product: any) => {
    // Get existing cart or initialize
    const existingCart = localStorage.getItem('fabric-cart')
    const cart = existingCart ? JSON.parse(existingCart) : []
    
    // Add product to cart
    cart.push({
      ...product,
      quantity: 1,
      selectedColor: product.colors[selectedColors[product.id] || 0]
    })
    
    localStorage.setItem('fabric-cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    
    // Show toast or notification (you can implement this)
    alert(`${product.name} added to cart!`)
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Handpicked premium fabrics for your home, offering the perfect blend of style, quality, and comfort
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Badge */}
              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    product.badge === 'Best Seller' ? 'bg-red-500 text-white' :
                    product.badge === 'New Arrival' ? 'bg-green-500 text-white' :
                    product.badge === 'Sale' ? 'bg-orange-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Image Container */}
              <div className="relative overflow-hidden rounded-t-xl">
                <Link href={`/fabric/${product.id}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </Link>

                {/* Quick Actions Overlay */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                  hoveredProduct === product.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                  <button className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors">
                    <Heart className="w-5 h-5 text-gray-700" />
                  </button>
                  <Link href={`/fabric/${product.id}`} className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors">
                    <Eye className="w-5 h-5 text-gray-700" />
                  </Link>
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Category & Type */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">{product.category}</span>
                  <span className="text-xs text-gray-500">{product.fabricType}</span>
                </div>

                {/* Name */}
                <Link href={`/fabric/${product.id}`}>
                  <h3 className="font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                    {product.name}
                  </h3>
                </Link>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                  <span className="text-sm text-gray-500">({product.reviews})</span>
                </div>

                {/* Color Options */}
                <div className="flex gap-2 mb-3">
                  {product.colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => handleColorSelect(product.id, index)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        selectedColors[product.id] === index || (!selectedColors[product.id] && index === 0)
                          ? 'border-gray-900 scale-110' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {product.features.map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                    {product.originalPrice && (
                      <span className="ml-2 text-sm text-gray-500 line-through">${product.originalPrice}</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">{product.pricePerUnit}</span>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full mt-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Products CTA */}
        <div className="text-center mt-12">
          <Link
            href="/browse"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 hover:scale-105"
          >
            Browse All Fabrics
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