'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Heart, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Fabric } from '../../lib/fabric-api'
import { addToCart } from '../../lib/cart-utils'

interface SimilarProductsCarouselProps {
  currentProductId: string
  category?: string
  color?: string
  material?: string
  priceRange?: [number, number]
  title?: string
  maxItems?: number
}

// Mock similar products - in production, this would come from API
const generateSimilarProducts = (currentId: string, filters: any): Fabric[] => {
  const mockProducts: Fabric[] = [
    {
      id: 'sim-1',
      name: 'Premium Velvet Upholstery',
      price: 89.99,
      swatch_price: 5.99,
      swatch_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      in_stock: true,
      swatch_available: true,
      sku: 'VEL-001',
      category: 'Upholstery',
      color_hex: '#8B4513'
    },
    {
      id: 'sim-2',
      name: 'Luxury Silk Drapery',
      price: 124.50,
      swatch_price: 7.99,
      swatch_image_url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400',
      in_stock: true,
      swatch_available: true,
      sku: 'SLK-002',
      category: 'Drapery',
      color_hex: '#4169E1'
    },
    {
      id: 'sim-3',
      name: 'Coastal Linen Blend',
      price: 67.25,
      swatch_price: 4.99,
      swatch_image_url: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=400',
      in_stock: true,
      swatch_available: true,
      sku: 'LIN-003',
      category: 'Upholstery',
      color_hex: '#F5F5DC'
    },
    {
      id: 'sim-4',
      name: 'Modern Geometric Print',
      price: 95.75,
      swatch_price: 6.50,
      swatch_image_url: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400',
      in_stock: false,
      swatch_available: true,
      sku: 'GEO-004',
      category: 'Upholstery',
      color_hex: '#2F4F4F'
    },
    {
      id: 'sim-5',
      name: 'Artisan Wool Tapestry',
      price: 156.00,
      swatch_price: 8.99,
      swatch_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      in_stock: true,
      swatch_available: true,
      sku: 'WOL-005',
      category: 'Specialty',
      color_hex: '#8B0000'
    },
    {
      id: 'sim-6',
      name: 'Classic Damask Pattern',
      price: 112.30,
      swatch_price: 7.25,
      swatch_image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
      in_stock: true,
      swatch_available: false,
      sku: 'DAM-006',
      category: 'Drapery',
      color_hex: '#DAA520'
    }
  ]

  return mockProducts.filter(p => p.id !== currentId)
}

interface ProductCardProps {
  product: Fabric
  isCompact?: boolean
}

const SimilarProductCard: React.FC<ProductCardProps> = ({ product, isCompact = false }) => {
  const router = useRouter()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleCardClick = () => {
    router.push(`/fabric/${product.id}`)
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart({
      variantId: product.id,
      productId: product.id,
      title: product.name,
      variant: 'Swatch Sample',
      price: (product.swatch_price || 5.99) * 100,
      quantity: 1,
      thumbnail: product.swatch_image_url || '',
      type: 'swatch' as 'swatch'
    })
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    window.dispatchEvent(new CustomEvent('wishlist-updated'))
  }

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg
                 border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-gray-100 ${isCompact ? 'aspect-square' : 'aspect-[4/5]'}`}>
        {imageLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
        )}
        <Image
          src={product.swatch_image_url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className={`object-cover transition-all duration-500 group-hover:scale-110 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setImageLoading(false)}
        />

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100
                          transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <div className="flex gap-1">
              <Button size="sm" onClick={handleQuickAdd} className="flex-1 text-xs py-1.5">
                <ShoppingBag className="w-3 h-3 mr-1" />
                Sample
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleWishlistToggle}
                className="bg-white/90 backdrop-blur-sm hover:bg-white p-1.5"
              >
                <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </Button>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <div className="flex flex-col gap-1">
            {!product.in_stock && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                Out of Stock
              </span>
            )}
            {product.swatch_available && (
              <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                Sample
              </span>
            )}
          </div>

          {/* Color Swatch */}
          <div
            className="w-4 h-4 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: product.color_hex || '#E5E5E5' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className={`p-3 ${isCompact ? 'space-y-1' : 'space-y-2'}`}>
        <div>
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
            {product.category}
          </p>
          <h4 className={`font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors ${
            isCompact ? 'text-sm' : 'text-base'
          }`}>
            {product.name}
          </h4>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <span className={`font-bold text-gray-900 ${isCompact ? 'text-lg' : 'text-xl'}`}>
              ${product.price?.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 ml-1">/yard</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Sample</p>
            <p className="text-sm font-semibold text-gray-700">
              ${(product.swatch_price || 5.99).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SimilarProductsCarousel({
  currentProductId,
  category,
  color,
  material,
  priceRange,
  title = "Similar Products",
  maxItems = 6
}: SimilarProductsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [products, setProducts] = useState<Fabric[]>([])

  // Load similar products
  useEffect(() => {
    const similarProducts = generateSimilarProducts(currentProductId, {
      category,
      color,
      material,
      priceRange
    }).slice(0, maxItems)

    setProducts(similarProducts)
  }, [currentProductId, category, color, material, priceRange, maxItems])

  // Check scroll position
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScrollPosition()
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 320 // Approximately 1.5 cards
    const newScrollLeft = scrollContainerRef.current.scrollLeft +
      (direction === 'right' ? scrollAmount : -scrollAmount)

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-1">Discover fabrics that complement your selection</p>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="p-2"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="p-2"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="flex-none w-72"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <SimilarProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Mobile Navigation Dots */}
          <div className="flex justify-center gap-2 mt-4 sm:hidden">
            {Array.from({ length: Math.ceil(products.length / 2) }).map((_, index) => (
              <button
                key={index}
                className="w-2 h-2 rounded-full bg-gray-300 transition-colors"
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Gradient Overlays for Desktop */}
          <div className="hidden sm:block">
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
            )}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            )}
          </div>
        </div>

        {/* View All Link */}
        <div className="text-center mt-8">
          <Button variant="outline" className="px-8">
            View All {category} Fabrics
          </Button>
        </div>
      </div>
    </section>
  )
}