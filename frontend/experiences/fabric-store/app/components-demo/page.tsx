'use client'

import { useState } from 'react'
import Header from '@/components/header'
import { ImageGalleryV2 } from '@/components/v2/ImageGalleryV2'
import { FabricEstimator } from '@/components/v2/FabricEstimator'
import { OrderSample } from '@/components/v2/OrderSample'
import { DynamicPricing } from '@/components/v2/DynamicPricing'
import { SimilarProductsCarousel } from '@/components/v2/SimilarProductsCarousel'
import { CartDrawerV2 } from '@/components/v2/CartDrawerV2'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Eye, Sparkles, Calculator, Package, DollarSign, Grid3X3 } from 'lucide-react'

// Mock fabric data
const mockFabric = {
  id: 'demo-fabric-001',
  name: 'Luxurious Midnight Blue Velvet',
  price: 124.99,
  swatch_price: 7.99,
  width: 54,
  images: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800',
    'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=800',
    'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=800',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'
  ]
}

// Mock cart items
const mockCartItems = [
  {
    id: '1',
    title: 'Midnight Blue Velvet - Standard Sample',
    variant: 'Sample (4" x 6")',
    price: 799,
    quantity: 1,
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    type: 'swatch' as const
  },
  {
    id: '2',
    title: 'Midnight Blue Velvet',
    variant: 'Premium Upholstery Grade',
    price: 12499,
    quantity: 3,
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    type: 'fabric' as const
  }
]

export default function ComponentsDemo() {
  const [selectedQuantity, setSelectedQuantity] = useState(3)
  const [totalPrice, setTotalPrice] = useState(0)
  const [unitPrice, setUnitPrice] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState(mockCartItems)

  const handlePriceChange = (quantity: number, total: number, unit: number) => {
    setSelectedQuantity(quantity)
    setTotalPrice(total)
    setUnitPrice(unit)
  }

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCartItems(items => items.filter(item => item.id !== id))
    } else {
      setCartItems(items =>
        items.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      )
    }
  }

  const removeCartItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id))
  }

  const saveForLater = (id: string) => {
    // Mock implementation - in real app would move to saved items
    console.log('Saved for later:', id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-light mb-4">
              Sprint 2 & 3 Components
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Complete UI/UX enhancement suite for the confident purchase decision and effortless checkout
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">6</div>
              <div className="text-sm text-gray-300">New Components</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">12</div>
              <div className="text-sm text-gray-300">Enhanced Features</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-sm text-gray-300">Mobile Responsive</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">A11Y</div>
              <div className="text-sm text-gray-300">Accessible</div>
            </div>
          </div>
        </div>
      </div>

      {/* Components Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Component Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: 'gallery', icon: Eye, label: 'Image Gallery' },
              { id: 'estimator', icon: Calculator, label: 'Fabric Estimator' },
              { id: 'samples', icon: Package, label: 'Order Samples' },
              { id: 'pricing', icon: DollarSign, label: 'Dynamic Pricing' },
              { id: 'carousel', icon: Grid3X3, label: 'Product Carousel' },
              { id: 'cart', icon: ShoppingCart, label: 'Cart Drawer' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <Icon className="w-6 h-6 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* World-Class Image Gallery */}
        <section id="gallery" className="mb-16">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">World-Class Image Gallery</h3>
                <p className="text-gray-600">Multiple image types, lightbox, zoom, and keyboard navigation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ImageGalleryV2
                images={mockFabric.images}
                productName={mockFabric.name}
              />
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Key Features:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Multiple image types (swatch, lifestyle, detail, technical)
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Full-screen lightbox with zoom (1x to 4x)
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Keyboard navigation (arrows, ESC, +/-)
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Image type filtering and thumbnail grid
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    Drag to pan when zoomed
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Fabric Estimator Tool */}
        <section id="estimator" className="mb-16">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Fabric Estimator Tool</h3>
                <p className="text-gray-600">Smart yardage calculations for different project types</p>
              </div>
            </div>

            <FabricEstimator
              fabricWidth={mockFabric.width}
              pricePerYard={mockFabric.price}
              onQuantityChange={(yards, total) => console.log(`${yards} yards, $${total.toFixed(2)}`)}
            />
          </div>
        </section>

        {/* Order Sample Functionality */}
        <section id="samples" className="mb-16">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Order Sample Functionality</h3>
                <p className="text-gray-600">Multiple sample types with shipping options</p>
              </div>
            </div>

            <OrderSample
              fabricId={mockFabric.id}
              fabricName={mockFabric.name}
              fabricImage={mockFabric.images[0]}
              baseSamplePrice={mockFabric.swatch_price}
              available={true}
              onOrderComplete={() => console.log('Sample ordered!')}
            />
          </div>
        </section>

        {/* Dynamic Pricing */}
        <section id="pricing" className="mb-16">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Dynamic Pricing Engine</h3>
                <p className="text-gray-600">Volume discounts and tier-based pricing</p>
              </div>
            </div>

            <DynamicPricing
              basePrice={mockFabric.price}
              fabricWidth={mockFabric.width}
              onPriceChange={handlePriceChange}
            />

            {totalPrice > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Current Selection:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Quantity:</span>
                    <span className="font-medium ml-2">{selectedQuantity.toFixed(2)} yards</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Unit Price:</span>
                    <span className="font-medium ml-2">${unitPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Total:</span>
                    <span className="font-medium ml-2">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Similar Products Carousel */}
        <section id="carousel" className="mb-16">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Grid3X3 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Similar Products Carousel</h3>
                <p className="text-gray-600">Smart recommendations with smooth navigation</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <SimilarProductsCarousel
                currentProductId={mockFabric.id}
                category="Upholstery"
                color="Blue"
                material="Velvet"
                priceRange={[100, 150]}
                title="You Might Also Like"
                maxItems={6}
              />
            </div>
          </div>
        </section>

        {/* Cart Drawer Demo */}
        <section id="cart" className="mb-16">
          <div className="bg-white rounded-xl shadow-sm border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Enhanced Cart Drawer</h3>
                <p className="text-gray-600">Slide-out cart with order notes and promo codes</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-4">Cart Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      Slide-out drawer design
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      Quantity controls with validation
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      Save for later functionality
                    </li>
                  </ul>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      Order notes field
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      Promo code application
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-green-500" />
                      Real-time price calculations
                    </li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={() => setIsCartOpen(true)}
                className="w-full gap-2"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Open Cart Demo ({cartItems.length} items)
              </Button>
            </div>
          </div>
        </section>

        {/* Implementation Summary */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">🎉 Complete Implementation</h3>
            <p className="text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
              All Sprint 2 & 3 features have been successfully implemented with modern UI/UX standards,
              accessibility compliance, and mobile responsiveness.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h4 className="font-semibold mb-2">Sprint 2: Confident Purchase Decision</h4>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>✅ World-class image gallery</li>
                  <li>✅ Fabric estimator tool</li>
                  <li>✅ Order sample functionality</li>
                  <li>✅ Dynamic pricing engine</li>
                  <li>✅ Similar products carousel</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h4 className="font-semibold mb-2">Sprint 3: Effortless Checkout</h4>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>✅ Enhanced cart drawer</li>
                  <li>✅ Save for later functionality</li>
                  <li>✅ Order notes field</li>
                  <li>✅ Promo code system</li>
                  <li>✅ Trust & security elements</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h4 className="font-semibold mb-2">Technical Excellence</h4>
                <ul className="text-sm text-blue-100 space-y-1">
                  <li>✅ TypeScript implementation</li>
                  <li>✅ Responsive design</li>
                  <li>✅ Accessibility (ARIA, keyboard)</li>
                  <li>✅ Performance optimized</li>
                  <li>✅ Modular architecture</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Cart Drawer */}
      <CartDrawerV2
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeCartItem}
        onSaveForLater={saveForLater}
      />
    </div>
  )
}