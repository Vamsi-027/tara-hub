'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, TrendingDown, Tag, Percent } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface PricingTier {
  minYards: number
  maxYards: number | null
  discount: number
  label: string
  description: string
}

interface DynamicPricingProps {
  basePrice: number
  fabricWidth: number
  onPriceChange?: (quantity: number, totalPrice: number, unitPrice: number) => void
  className?: string
}

const pricingTiers: PricingTier[] = [
  {
    minYards: 0,
    maxYards: 5,
    discount: 0,
    label: 'Retail',
    description: 'Standard pricing'
  },
  {
    minYards: 5,
    maxYards: 20,
    discount: 5,
    label: 'Volume',
    description: '5% off 5+ yards'
  },
  {
    minYards: 20,
    maxYards: 50,
    discount: 10,
    label: 'Trade',
    description: '10% off 20+ yards'
  },
  {
    minYards: 50,
    maxYards: null,
    discount: 15,
    label: 'Wholesale',
    description: '15% off 50+ yards'
  }
]

export function DynamicPricing({ basePrice, fabricWidth, onPriceChange, className = '' }: DynamicPricingProps) {
  const [quantity, setQuantity] = useState([3])
  const [unit, setUnit] = useState<'yards' | 'feet' | 'meters'>('yards')

  const getCurrentTier = (yards: number): PricingTier => {
    return pricingTiers.find(tier =>
      yards >= tier.minYards && (tier.maxYards === null || yards < tier.maxYards)
    ) || pricingTiers[0]
  }

  const convertQuantity = (value: number, fromUnit: typeof unit, toUnit: 'yards'): number => {
    if (fromUnit === toUnit) return value
    if (fromUnit === 'feet') return value / 3
    if (fromUnit === 'meters') return value * 1.094
    return value
  }

  const displayQuantity = quantity[0]
  const yardsQuantity = convertQuantity(displayQuantity, unit, 'yards')
  const currentTier = getCurrentTier(yardsQuantity)
  const discountedPrice = basePrice * (1 - currentTier.discount / 100)
  const totalPrice = discountedPrice * yardsQuantity
  const savings = (basePrice - discountedPrice) * yardsQuantity

  useEffect(() => {
    onPriceChange?.(yardsQuantity, totalPrice, discountedPrice)
  }, [yardsQuantity, totalPrice, discountedPrice, onPriceChange])

  const getNextTier = () => {
    const currentIndex = pricingTiers.findIndex(tier => tier === currentTier)
    return currentIndex < pricingTiers.length - 1 ? pricingTiers[currentIndex + 1] : null
  }

  const nextTier = getNextTier()

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Calculator className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Dynamic Pricing</h3>
          <p className="text-sm text-gray-600">Quantity discounts applied automatically</p>
        </div>
      </div>

      {/* Unit Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Unit</label>
        <div className="flex gap-2">
          {(['yards', 'feet', 'meters'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`
                px-3 py-2 rounded-lg border text-sm font-medium transition-all
                ${unit === u
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Slider */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">Quantity</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={displayQuantity}
              onChange={(e) => setQuantity([Number(e.target.value)])}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
              min="0.25"
              max="100"
              step="0.25"
            />
            <span className="text-sm text-gray-600">{unit}</span>
          </div>
        </div>

        <Slider
          value={quantity}
          onValueChange={setQuantity}
          min={0.25}
          max={100}
          step={0.25}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0.25 {unit}</span>
          <span>100 {unit}</span>
        </div>
      </div>

      {/* Current Pricing Tier */}
      <div className={`
        p-4 rounded-lg border-2 mb-4
        ${currentTier.discount > 0
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-gray-50'
        }
      `}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Tag className={`w-4 h-4 ${currentTier.discount > 0 ? 'text-green-600' : 'text-gray-600'}`} />
            <span className="font-medium text-gray-900">{currentTier.label} Pricing</span>
            {currentTier.discount > 0 && (
              <span className="bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {currentTier.discount}% OFF
              </span>
            )}
          </div>
          {currentTier.discount > 0 && (
            <TrendingDown className="w-4 h-4 text-green-600" />
          )}
        </div>
        <p className="text-sm text-gray-600">{currentTier.description}</p>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Base price per yard:</span>
          <span className="font-medium">${basePrice.toFixed(2)}</span>
        </div>

        {currentTier.discount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Volume discount ({currentTier.discount}%):</span>
            <span className="text-green-600 font-medium">-${(basePrice * currentTier.discount / 100).toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Discounted price per yard:</span>
          <span className="font-medium">${discountedPrice.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Quantity ({yardsQuantity.toFixed(2)} yards):</span>
          <span className="font-medium">×{yardsQuantity.toFixed(2)}</span>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-green-600">You save:</span>
              <span className="text-sm font-medium text-green-600">${savings.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Next Tier Incentive */}
      {nextTier && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">
                Add {(nextTier.minYards - yardsQuantity).toFixed(2)} more yards
              </p>
              <p className="text-blue-700">
                Get {nextTier.discount}% off and save ${((nextTier.discount - currentTier.discount) / 100 * basePrice * nextTier.minYards).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fabric Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Fabric width:</span>
            <span className="font-medium ml-2">{fabricWidth}"</span>
          </div>
          <div>
            <span className="text-gray-600">Coverage:</span>
            <span className="font-medium ml-2">{(yardsQuantity * fabricWidth / 144).toFixed(1)} sq ft</span>
          </div>
        </div>
      </div>

      {/* Pricing Tiers Reference */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Volume Pricing Tiers</h4>
        <div className="space-y-2">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`
                flex justify-between items-center text-xs p-2 rounded
                ${tier === currentTier ? 'bg-blue-50 text-blue-900' : 'text-gray-600'}
              `}
            >
              <span>
                {tier.minYards}+ yards
                {tier.maxYards && ` (up to ${tier.maxYards})`}
              </span>
              <span className="font-medium">
                {tier.discount > 0 ? `${tier.discount}% off` : 'Standard'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}