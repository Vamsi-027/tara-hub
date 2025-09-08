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
      {/* Variant Selection */}
      {product.variants.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Option
          </label>
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title} - ${(variant.prices[0]?.amount / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center px-2 py-1 border rounded"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Price Display */}
      <div className="text-2xl font-bold">
        ${((price * quantity) / 100).toFixed(2)}
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedVariant}
        className={`w-full py-3 px-4 rounded-md font-medium transition flex items-center justify-center space-x-2 ${
          added 
            ? 'bg-green-600 text-white' 
            : 'bg-black text-white hover:bg-gray-800'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
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
      </button>
    </div>
  )
}