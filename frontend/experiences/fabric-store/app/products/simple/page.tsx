'use client'

import { useState } from 'react'
import Link from 'next/link'
import CartIcon from '../../../components/cart-icon'
import AddToCart from '../../../components/add-to-cart'
import Image from 'next/image'

// Sample products data (in a real app, this would come from Medusa)
const sampleProducts = [
  {
    id: 'prod-1',
    title: 'Luxury Velvet - Midnight Blue',
    description: 'Premium velvet fabric with deep midnight blue color. Perfect for upholstery and curtains.',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    variants: [
      {
        id: 'var-1-swatch',
        title: 'Swatch Sample (4x4 inches)',
        prices: [{ amount: 500, currency_code: 'usd' }]
      },
      {
        id: 'var-1-yard',
        title: 'Per Yard',
        prices: [{ amount: 8900, currency_code: 'usd' }]
      }
    ]
  },
  {
    id: 'prod-2',
    title: 'Italian Linen - Natural',
    description: 'Finest Italian linen in natural color. Breathable and perfect for summer.',
    thumbnail: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400',
    variants: [
      {
        id: 'var-2-swatch',
        title: 'Swatch Sample (4x4 inches)',
        prices: [{ amount: 500, currency_code: 'usd' }]
      },
      {
        id: 'var-2-yard',
        title: 'Per Yard',
        prices: [{ amount: 6900, currency_code: 'usd' }]
      }
    ]
  },
  {
    id: 'prod-3',
    title: 'Silk Dupioni - Ivory',
    description: 'Luxurious silk dupioni with subtle texture. Ideal for formal wear and home decor.',
    thumbnail: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=400',
    variants: [
      {
        id: 'var-3-swatch',
        title: 'Swatch Sample (4x4 inches)',
        prices: [{ amount: 800, currency_code: 'usd' }]
      },
      {
        id: 'var-3-yard',
        title: 'Per Yard',
        prices: [{ amount: 12900, currency_code: 'usd' }]
      }
    ]
  },
  {
    id: 'prod-4',
    title: 'Cotton Canvas - Charcoal',
    description: 'Durable cotton canvas in charcoal gray. Great for heavy-duty upholstery.',
    thumbnail: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400',
    variants: [
      {
        id: 'var-4-swatch',
        title: 'Swatch Sample (4x4 inches)',
        prices: [{ amount: 300, currency_code: 'usd' }]
      },
      {
        id: 'var-4-yard',
        title: 'Per Yard',
        prices: [{ amount: 4900, currency_code: 'usd' }]
      }
    ]
  },
  {
    id: 'prod-5',
    title: 'Wool Tweed - Forest Green',
    description: 'Classic wool tweed in rich forest green. Perfect for autumn and winter projects.',
    thumbnail: 'https://images.unsplash.com/photo-1528301721190-186c3bd85418?w=400',
    variants: [
      {
        id: 'var-5-swatch',
        title: 'Swatch Sample (4x4 inches)',
        prices: [{ amount: 700, currency_code: 'usd' }]
      },
      {
        id: 'var-5-yard',
        title: 'Per Yard',
        prices: [{ amount: 10900, currency_code: 'usd' }]
      }
    ]
  },
  {
    id: 'prod-6',
    title: 'Chenille - Blush Pink',
    description: 'Soft chenille fabric in delicate blush pink. Cozy and perfect for throws and pillows.',
    thumbnail: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400',
    variants: [
      {
        id: 'var-6-swatch',
        title: 'Swatch Sample (4x4 inches)',
        prices: [{ amount: 600, currency_code: 'usd' }]
      },
      {
        id: 'var-6-yard',
        title: 'Per Yard',
        prices: [{ amount: 7900, currency_code: 'usd' }]
      }
    ]
  }
]

export default function SimpleProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Fabric Store
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/products/simple" className="text-gray-600 hover:text-gray-900">
                Products
              </Link>
              <CartIcon />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Premium Fabric Collection</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse our curated selection of high-quality fabrics. Order samples to feel the texture before making your final purchase.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={product.thumbnail}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {product.title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {product.description}
                </p>
                <AddToCart product={product} />
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Order</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Choose Your Fabrics</h3>
              <p className="text-gray-600">
                Browse our collection and select the fabrics you're interested in. Choose between samples or full yardage.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Add to Cart</h3>
              <p className="text-gray-600">
                Add your selections to the cart. Samples are perfect for testing before committing to larger orders.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Checkout Securely</h3>
              <p className="text-gray-600">
                Complete your order with our secure checkout. We accept all major credit cards through Stripe.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}