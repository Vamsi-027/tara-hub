'use client'

import { useState } from 'react'
import { Package, Plus, Minus, Check, X, Truck, Clock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addToCart } from '../../lib/cart-utils'

interface SampleOption {
  id: string
  name: string
  size: string
  price: number
  description: string
  estimatedDays: number
}

interface OrderSampleProps {
  fabricId: string
  fabricName: string
  fabricImage: string
  baseSamplePrice: number
  available: boolean
  onOrderComplete?: () => void
  className?: string
}

const sampleOptions: SampleOption[] = [
  {
    id: 'memo',
    name: 'Memo Sample',
    size: '2" x 3"',
    price: 0,
    description: 'Small cutting for color and texture reference',
    estimatedDays: 3
  },
  {
    id: 'standard',
    name: 'Standard Sample',
    size: '4" x 6"',
    price: 5.99,
    description: 'Perfect for feeling the texture and seeing the pattern',
    estimatedDays: 5
  },
  {
    id: 'large',
    name: 'Large Sample',
    size: '8" x 10"',
    price: 12.99,
    description: 'Ideal for pattern matching and room coordination',
    estimatedDays: 7
  },
  {
    id: 'yardage',
    name: 'Sample Yardage',
    size: '1/4 yard',
    price: 24.99,
    description: 'Quarter yard cutting for detailed evaluation',
    estimatedDays: 10
  }
]

export function OrderSample({
  fabricId,
  fabricName,
  fabricImage,
  baseSamplePrice,
  available,
  onOrderComplete,
  className = ''
}: OrderSampleProps) {
  const [selectedSamples, setSelectedSamples] = useState<Record<string, number>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState<'select' | 'shipping' | 'confirmation'>('select')
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [isProcessing, setIsProcessing] = useState(false)

  const updateSampleQuantity = (sampleId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSamples = { ...selectedSamples }
      delete newSamples[sampleId]
      setSelectedSamples(newSamples)
    } else {
      setSelectedSamples(prev => ({ ...prev, [sampleId]: Math.min(quantity, 5) }))
    }
  }

  const getTotalPrice = () => {
    let total = 0
    Object.entries(selectedSamples).forEach(([sampleId, quantity]) => {
      const option = sampleOptions.find(opt => opt.id === sampleId)
      if (option) {
        total += option.price * quantity
      }
    })
    // Add shipping
    if (total > 0) {
      total += shippingMethod === 'express' ? 15.99 : 6.99
    }
    return total
  }

  const getEstimatedDelivery = () => {
    const maxDays = Math.max(
      ...Object.keys(selectedSamples).map(sampleId => {
        const option = sampleOptions.find(opt => opt.id === sampleId)
        return option?.estimatedDays || 0
      })
    )
    const shippingDays = shippingMethod === 'express' ? 2 : 5
    return maxDays + shippingDays
  }

  const handleQuickOrder = (sampleType: 'memo' | 'standard') => {
    const option = sampleOptions.find(opt => opt.id === sampleType)
    if (!option) return

    addToCart({
      variantId: `${fabricId}-sample-${sampleType}`,
      productId: fabricId,
      title: `${fabricName} - ${option.name}`,
      variant: option.name,
      price: option.price * 100,
      quantity: 1,
      thumbnail: fabricImage,
      type: 'swatch'
    })

    onOrderComplete?.()
  }

  const handleCompleteOrder = async () => {
    setIsProcessing(true)

    // Add all selected samples to cart
    Object.entries(selectedSamples).forEach(([sampleId, quantity]) => {
      const option = sampleOptions.find(opt => opt.id === sampleId)
      if (option) {
        addToCart({
          variantId: `${fabricId}-sample-${sampleId}`,
          productId: fabricId,
          title: `${fabricName} - ${option.name}`,
          variant: `${option.name} (${option.size})`,
          price: option.price * 100,
          quantity,
          thumbnail: fabricImage,
          type: 'swatch'
        })
      }
    })

    // Add shipping
    addToCart({
      variantId: `shipping-${shippingMethod}`,
      productId: 'shipping',
      title: `Sample Shipping - ${shippingMethod === 'express' ? 'Express' : 'Standard'}`,
      variant: shippingMethod === 'express' ? 'Express (2-3 days)' : 'Standard (5-7 days)',
      price: shippingMethod === 'express' ? 1599 : 699,
      quantity: 1,
      thumbnail: '',
      type: 'shipping'
    })

    setTimeout(() => {
      setIsProcessing(false)
      setStep('confirmation')
      setTimeout(() => {
        setIsModalOpen(false)
        setStep('select')
        setSelectedSamples({})
        onOrderComplete?.()
      }, 2000)
    }, 1500)
  }

  if (!available) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">Samples Currently Unavailable</p>
            <p className="text-sm text-gray-600">Check back soon or contact us for availability</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`bg-white rounded-xl border shadow-sm p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Order Fabric Sample</h3>
            <p className="text-sm text-gray-600">See and feel before you buy</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Button
            onClick={() => handleQuickOrder('memo')}
            variant="outline"
            className="justify-between"
          >
            <span>Free Memo Sample</span>
            <span className="text-green-600 font-semibold">FREE</span>
          </Button>
          <Button
            onClick={() => handleQuickOrder('standard')}
            className="justify-between"
          >
            <span>Standard Sample</span>
            <span>${sampleOptions[1].price}</span>
          </Button>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          variant="outline"
          className="w-full"
        >
          More Sample Options
        </Button>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Truck className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Free shipping on orders over $50</p>
              <p>Sample shipping: $6.99 standard, $15.99 express</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Order Fabric Samples</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="max-h-[calc(90vh-200px)] overflow-y-auto">
              {step === 'select' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Select Sample Types</h3>
                    <p className="text-sm text-gray-600">Choose the sample sizes that work best for your project</p>
                  </div>

                  <div className="space-y-4">
                    {sampleOptions.map((option) => (
                      <div key={option.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-gray-900">{option.name}</h4>
                              <span className="text-sm text-gray-500">({option.size})</span>
                              {option.price === 0 && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                  FREE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {option.estimatedDays} days
                              </span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                ${option.price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateSampleQuantity(option.id, (selectedSamples[option.id] || 0) - 1)}
                              disabled={!selectedSamples[option.id]}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {selectedSamples[option.id] || 0}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateSampleQuantity(option.id, (selectedSamples[option.id] || 0) + 1)}
                              disabled={(selectedSamples[option.id] || 0) >= 5}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 'shipping' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Shipping Method</h3>
                    <p className="text-sm text-gray-600">Choose your preferred delivery speed</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="standard"
                        checked={shippingMethod === 'standard'}
                        onChange={(e) => setShippingMethod(e.target.value as 'standard')}
                        className="text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Standard Shipping</span>
                          <span className="font-semibold">$6.99</span>
                        </div>
                        <p className="text-sm text-gray-600">5-7 business days</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="express"
                        checked={shippingMethod === 'express'}
                        onChange={(e) => setShippingMethod(e.target.value as 'express')}
                        className="text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Express Shipping</span>
                          <span className="font-semibold">$15.99</span>
                        </div>
                        <p className="text-sm text-gray-600">2-3 business days</p>
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Estimated delivery:</span>
                      <span className="font-medium">{getEstimatedDelivery()} days</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 'confirmation' && (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Samples Added to Cart!</h3>
                  <p className="text-gray-600">Your fabric samples have been added and are ready for checkout.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {step !== 'confirmation' && (
              <div className="border-t p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {Object.keys(selectedSamples).length} sample{Object.keys(selectedSamples).length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="text-lg font-semibold">
                    Total: ${getTotalPrice().toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-3">
                  {step === 'shipping' && (
                    <Button
                      variant="outline"
                      onClick={() => setStep('select')}
                      className="flex-1"
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={step === 'select' ? () => setStep('shipping') : handleCompleteOrder}
                    disabled={Object.keys(selectedSamples).length === 0 || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      'Processing...'
                    ) : step === 'select' ? (
                      'Continue to Shipping'
                    ) : (
                      'Add to Cart'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}