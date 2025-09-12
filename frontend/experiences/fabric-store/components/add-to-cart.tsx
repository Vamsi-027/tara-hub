'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'

interface AddToCartProps {
  product: {
    id: string
    title: string
    variants: Array<{
      id: string
      title: string
      prices: Array<{
        amount: number
        currency_code: string
      }>
    }>
    thumbnail?: string
  }
}

export default function AddToCart({ product }: AddToCartProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const handleAddToCart = () => {
    const variant = product.variants.find(v => v.id === selectedVariant)
    if (!variant) return

    const cartItem = {
      id: `${product.id}-${variant.id}-${Date.now()}`,
      variantId: variant.id,
      productId: product.id,
      title: product.title,
      variant: variant.title,
      price: variant.prices[0]?.amount || 0,
      quantity,
      thumbnail: product.thumbnail
    }

    // Get existing cart
    const existingCart = localStorage.getItem('fabric-cart')
    const cart = existingCart ? JSON.parse(existingCart) : []
    
    // Check if this variant already exists in cart
    const existingItemIndex = cart.findIndex((item: any) => 
      item.variantId === variant.id
    )

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      cart[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      cart.push(cartItem)
    }

    // Save to localStorage
    localStorage.setItem('fabric-cart', JSON.stringify(cart))
    
    // Show success state
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)

    // Dispatch custom event for cart update
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }))
  }

  const selectedVariantData = product.variants.find(v => v.id === selectedVariant)
  const price = selectedVariantData?.prices[0]?.amount || 0

  return (
    <div className="space-y-4">
      {/* Enhanced Variant Selection */}
      {product.variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-charcoal-700 mb-3">
            Select Option
          </label>
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="input-luxury w-full"
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title} - ${(variant.prices[0]?.amount / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Enhanced Quantity Selection */}
      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-3">
          Quantity
        </label>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 bg-pearl-50 border border-pearl-300 rounded-lg 
                       hover:bg-champagne-300 transition-colors duration-300 
                       flex items-center justify-center font-medium text-charcoal-700"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="input-luxury w-20 text-center"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-10 h-10 bg-pearl-50 border border-pearl-300 rounded-lg 
                       hover:bg-champagne-300 transition-colors duration-300 
                       flex items-center justify-center font-medium text-charcoal-700"
          >
            +
          </button>
        </div>
      </div>

      {/* Enhanced Price Display */}
      <div className="border-t border-pearl-300 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-charcoal-500">Total Price:</span>
          <span className="font-display text-3xl font-semibold text-charcoal-800">
            ${((price * quantity) / 100).toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-charcoal-500">
          Per yard: ${(price / 100).toFixed(2)} × {quantity} {quantity === 1 ? 'yard' : 'yards'}
        </p>
      </div>

      {/* Enhanced Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedVariant}
        className={`btn-primary w-full transition-all duration-300 ${
          added 
            ? 'bg-forest-500 hover:bg-forest-500 transform-none shadow-luxury-lg' 
            : ''
        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      >
        <div className="flex items-center justify-center space-x-2">
          {added ? (
            <>
              <Check className="h-5 w-5" />
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              <span>Add to Cart</span>
            </>
          )}
        </div>
      </button>
    </div>
  )
}