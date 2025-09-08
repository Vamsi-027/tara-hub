'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { ArrowLeft, CreditCard, Mail, MapPin, User } from 'lucide-react'
import Link from 'next/link'

// Initialize Stripe - You'll need to replace with your Stripe publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51PVOZh08gPJjfTdFLBQJPcG42YxvWKCjBRNgCqzN7Y9tJjGnBJ9xeQzHMTLKT4uGxb9Gx6Bx5nJzKZKxJxJxJxJx00Y9YJxJxJ')

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

function CheckoutForm() {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [email, setEmail] = useState('')
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  })

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('fabric-cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    } else {
      router.push('/cart')
    }
  }, [router])

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    const shipping = 1000 // $10 flat rate
    const tax = Math.round(subtotal * 0.08) // 8% tax
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create payment intent on your backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: calculateTotal().total,
          email,
          items: cart.map(item => ({
            id: item.id,
            title: item.title,
            variant: item.variant,
            price: item.price,
            quantity: item.quantity
          })),
          shipping: shippingInfo
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret, orderId } = await response.json()

      // Confirm the payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            email,
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.zipCode,
              country: shippingInfo.country,
            }
          }
        }
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
      } else {
        // Payment successful
        // Store order data for confirmation email
        const orderData = {
          items: cart,
          shipping: shippingInfo,
          email: email,
          total: calculateTotal().total
        }
        localStorage.setItem('order-email', email)
        localStorage.setItem('order-data', JSON.stringify(orderData))
        // Clear cart and redirect to success page
        localStorage.removeItem('fabric-cart')
        router.push(`/order-success?order_id=${orderId}&payment_intent=${result.paymentIntent.id}&email=${encodeURIComponent(email)}`)
      }

    } catch (err) {
      console.error('Checkout error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-12 w-12 text-black mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-gray-600 text-center">Please wait while we securely process your payment...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/cart" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors min-h-[40px] px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Cart</span>
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </h2>
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[42px] px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Shipping Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="First name"
                    value={shippingInfo.firstName}
                    onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                    className="h-[42px] px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Last name"
                    value={shippingInfo.lastName}
                    onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                    className="h-[42px] px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Address"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                    className="md:col-span-2 h-[42px] px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={shippingInfo.city}
                    onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                    className="h-[42px] px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={shippingInfo.state}
                    onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                    className="h-[42px] px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <input
                    type="text"
                    required
                    placeholder="ZIP code"
                    value={shippingInfo.zipCode}
                    onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                    className="h-[42px] px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <select
                    value={shippingInfo.country}
                    onChange={(e) => setShippingInfo({...shippingInfo, country: e.target.value})}
                    className="h-[42px] px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </h2>
                <p className="text-gray-600 mb-4">
                  Test Mode: Use card number 4242 4242 4242 4242 with any future expiry and CVC
                </p>
                <div className="p-4 border rounded-md">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full h-[42px] bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Payment...
                  </>
                ) : (
                  `Place Order - $${(totals.total / 100).toFixed(2)}`
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-gray-600">{item.variant} x {item.quantity}</p>
                    </div>
                    <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${(totals.subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${(totals.shipping / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${(totals.tax / 100).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${(totals.total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}