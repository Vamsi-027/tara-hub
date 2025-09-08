'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShoppingBag, Trash2, Plus, Minus } from 'lucide-react'

interface CartItem {
  id: string
  variantId: string
  productId: string
  title: string
  variant: string
  price: number
  quantity: number
  thumbnail?: string
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('fabric-cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
    setLoading(false)
  }, [])

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }
    const updatedCart = cart.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    )
    setCart(updatedCart)
    localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
  }

  const removeItem = (id: string) => {
    const updatedCart = cart.filter(item => item.id !== id)
    setCart(updatedCart)
    localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Add some beautiful fabrics to get started</p>
        <Link
          href="/"
          className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <Link
              href="/browse"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[40px] px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-600">{item.variant}</p>
                    {(item as any).type && (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        (item as any).type === 'swatch' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {(item as any).type === 'swatch' ? 'Swatch Sample' : 'Fabric Order'}
                      </span>
                    )}
                    <p className="text-lg font-medium mt-2">
                      ${(item.price / 100).toFixed(2)}
                    </p>
                  </div>
                  {(item as any).type === 'swatch' ? (
                    // Swatches can't change quantity (always 1)
                    <div className="flex items-center space-x-2">
                      <span className="w-12 text-center text-gray-500 bg-gray-100 py-1 px-2 rounded">1</span>
                    </div>
                  ) : (
                    // Fabric orders can change quantity
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${(calculateTotal() / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${(calculateTotal() / 100).toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full bg-black text-white text-center py-3 rounded-md hover:bg-gray-800 transition"
              >
                Proceed to Checkout
              </Link>
              
              <Link
                href="/"
                className="block w-full text-center mt-4 text-gray-600 hover:text-gray-900"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}