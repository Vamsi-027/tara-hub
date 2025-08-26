'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Star, ShoppingBag, Filter } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  rating: number
  inStock: boolean
}

// Sample product data
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Custom Throw Pillow',
    description: 'Handcrafted throw pillow with your choice of fabric',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    category: 'Pillows',
    rating: 4.5,
    inStock: true
  },
  {
    id: '2',
    name: 'Decorative Cushion Set',
    description: 'Set of 2 matching cushions with premium filling',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
    category: 'Cushions',
    rating: 5.0,
    inStock: true
  },
  {
    id: '3',
    name: 'Outdoor Seat Cushion',
    description: 'Weather-resistant cushion for outdoor furniture',
    price: 59.99,
    image: 'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=400&h=400&fit=crop',
    category: 'Outdoor',
    rating: 4.0,
    inStock: true
  },
  {
    id: '4',
    name: 'Lumbar Support Pillow',
    description: 'Ergonomic lumbar pillow for comfort and support',
    price: 45.99,
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&h=400&fit=crop',
    category: 'Pillows',
    rating: 4.8,
    inStock: false
  },
  {
    id: '5',
    name: 'Floor Cushion',
    description: 'Large floor cushion for casual seating',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&h=400&fit=crop',
    category: 'Cushions',
    rating: 4.3,
    inStock: true
  },
  {
    id: '6',
    name: 'Bolster Pillow',
    description: 'Cylindrical bolster pillow with removable cover',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop',
    category: 'Pillows',
    rating: 4.6,
    inStock: true
  }
]

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
        <div className="flex items-center gap-1 mb-2">
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
          <span className="text-sm text-gray-500 ml-1">({product.rating})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">${product.price}</span>
          <button
            className={`px-4 py-2 rounded-lg font-medium ${
              product.inStock
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!product.inStock}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProductsView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const categories = ['All', 'Pillows', 'Cushions', 'Outdoor']
  
  const filteredProducts = selectedCategory === 'All' 
    ? sampleProducts 
    : sampleProducts.filter(p => p.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
              <p className="text-gray-600 mt-2">
                Handcrafted pillows and cushions made with premium fabrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">{filteredProducts.length} products</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filter by Category:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              No products available in the {selectedCategory} category.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}