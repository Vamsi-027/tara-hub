'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import Image from 'next/image'

interface EtsyProduct {
  id: string
  title: string
  description?: string
  listingUrl: string
  imageUrl?: string
  price?: string
  tags?: string[]
}

export function BlogEtsyProducts() {
  const [products, setProducts] = useState<EtsyProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/etsy-products?featured=true')
      const data = await response.json()
      // Show max 2 products in blog posts
      setProducts(data.slice(0, 2))
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || products.length === 0) {
    return null
  }

  return (
    <div className="my-12 p-6 bg-amber-50 rounded-lg border border-amber-200">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="w-5 h-5 text-amber-600" />
        <h3 className="text-lg font-semibold text-gray-900">Featured Products from Our Etsy Store</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map((product) => (
          <a
            key={product.id}
            href={product.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <Card className="overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 relative">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="flex-1 p-4">
                  <h4 className="font-medium text-sm mb-1 group-hover:text-amber-600 transition-colors line-clamp-1">
                    {product.title}
                  </h4>
                  {product.price && (
                    <p className="text-amber-600 font-semibold text-sm mb-2">{product.price}</p>
                  )}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    Shop on Etsy
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </CardContent>
              </div>
            </Card>
          </a>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <a
          href="https://www.etsy.com/shop/TheHearthAndHomeStore"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-amber-700 hover:text-amber-800 font-medium inline-flex items-center gap-1"
        >
          Visit Our Full Etsy Store
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}