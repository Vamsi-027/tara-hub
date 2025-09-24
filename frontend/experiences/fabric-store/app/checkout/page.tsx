'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Mail,
  MapPin,
  User,
  Lock,
  CheckCircle,
  Sparkles,
  ShoppingCart,
  Phone,
  Home,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
  LogIn
} from 'lucide-react'
import { useSession, signIn } from 'next-auth/react'

// Lazy initialize Stripe only when needed
let stripePromise: Promise<any> | null = null
const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey) {
      console.error('❌ Stripe publishable key is missing! Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to environment variables.')
      // Return null to prevent Stripe initialization without proper key
      return null
    }
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}

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

// Input Component with floating labels
function FormInput({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon: Icon,
  className = '',
  autoComplete
}: {
  id: string
  name: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  required?: boolean
  error?: string
  icon?: React.ElementType
  className?: string
  autoComplete?: string
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setHasValue(value.length > 0)
  }, [value])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <Icon className="w-5 h-5 text-gray-500" />
          </div>
        )}
        <input
          type={type === 'password' && showPassword ? 'text' : type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete={autoComplete}
          className={`w-full h-14 bg-white border-2 rounded-lg font-sans transition-all duration-200
                     outline-none peer
                     ${Icon ? 'pl-12 pr-4' : 'px-4'}
                     ${type === 'password' ? 'pr-12' : ''}
                     ${isFocused || hasValue ? 'pt-6 pb-2' : 'py-4'}
                     ${error
                       ? 'border-red-300 focus:border-red-500 bg-red-50/30'
                       : 'border-gray-200 focus:border-blue-600 hover:border-gray-300'
                     }`}
          placeholder=""
          required={required}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700
                      transition-colors duration-200"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        <label
          htmlFor={id}
          className={`absolute font-sans font-medium transition-all duration-300 pointer-events-none
                     ${Icon ? 'left-12' : 'left-4'}
                     ${isFocused || hasValue
                       ? 'top-2 text-xs text-gray-600'
                       : 'top-1/2 -translate-y-1/2 text-base text-gray-500'
                     }
                     ${error ? 'text-red-500' : ''}`}
        >
          {placeholder}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

// Progress Steps Component
function CheckoutProgress({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, name: 'Shipping', icon: MapPin },
    { id: 2, name: 'Payment', icon: CreditCard },
    { id: 3, name: 'Review', icon: CheckCircle }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = step.id < currentStep
          const isUpcoming = step.id > currentStep

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center
                               transition-all duration-300
                               ${isCompleted
                                 ? 'bg-green-50 border-green-500 text-green-600'
                                 : isActive
                                 ? 'bg-blue-50 border-blue-600 text-blue-600'
                                 : 'bg-gray-50 border-gray-300 text-gray-400'
                               }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium
                               ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                  {step.name}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 transition-all duration-300
                               ${step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// Order Summary Sidebar Component
const OrderSummarySidebar = React.memo(({ items, totals }: {
  items: CartItem[]
  totals: { subtotal: number; shipping: number; tax: number; total: number }
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">
          Order Summary
        </h2>
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            {item.thumbnail && (
              <div className="relative w-12 h-12 flex-shrink-0">
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  sizes="48px"
                  className="object-cover rounded-md"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800 text-sm truncate">
                {item.title}
              </h4>
              <p className="text-xs text-gray-500 mb-1">{item.variant}</p>
              <p className="text-sm font-medium text-gray-700">
                ${(item.price / 100).toFixed(2)} × {item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3 pb-4 border-b border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium">${(totals.subtotal / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Shipping</span>
          <span className="font-medium">
            {totals.shipping === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `$${(totals.shipping / 100).toFixed(2)}`
            )}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Tax</span>
          <span className="font-medium">${(totals.tax / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            ${(totals.total / 100).toFixed(2)}
          </span>
        </div>

        {/* Free Shipping Progress */}
        {totals.shipping > 0 && totals.subtotal < 15000 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-blue-700">Add ${((15000 - totals.subtotal) / 100).toFixed(2)} for free shipping</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totals.subtotal / 15000) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Secure SSL encryption</span>
        </div>
      </div>
    </div>
  )
})

// Main Checkout Form Component
function CheckoutForm() {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const { data: session } = useSession()

  const [cart, setCart] = useState<CartItem[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'account' | null>(null)
  const [showSignInOptions, setShowSignInOptions] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  })
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load cart from localStorage asynchronously
    const loadCart = async () => {
      try {
        const savedCart = localStorage.getItem('fabric-cart')
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          if (parsedCart.length > 0) {
            setCart(parsedCart)
          } else {
            router.push('/cart')
          }
        } else {
          router.push('/cart')
        }
      } catch (error) {
        console.error('Error loading cart:', error)
        router.push('/cart')
      }
    }

    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadCart)
    } else {
      setTimeout(loadCart, 0)
    }
  }, [router])

  // Auto-fill user data if signed in
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        email: session.user?.email || prev.email,
        firstName: session.user?.name?.split(' ')[0] || prev.firstName,
        lastName: session.user?.name?.split(' ').slice(1).join(' ') || prev.lastName
      }))
      setCheckoutMode('account')
    }
  }, [session])

  // Memoize expensive calculations
  const totals = useMemo(() => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    const shipping = subtotal > 15000 ? 0 : 1500 // Free shipping over $150
    const tax = Math.round(subtotal * 0.08) // 8% tax
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    }
  }, [cart])

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      // Validate shipping information
      if (!formData.email.trim()) errors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email address'

      if (!formData.firstName.trim()) errors.firstName = 'First name is required'

      // Last name is optional - no validation

      // Phone is optional - only validate format if provided
      if (formData.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
        errors.phone = 'Invalid phone number format'
      }

      if (!formData.address.trim()) errors.address = 'Address is required'
      if (!formData.city.trim()) errors.city = 'City is required'
      if (!formData.state.trim()) errors.state = 'State is required'
      if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required'
      else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) errors.zipCode = 'Invalid ZIP code format'
    }

    setFormErrors(errors)

    // Scroll to first error if any
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0]
      const element = document.getElementById(firstErrorField)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element?.focus()
    }

    return Object.keys(errors).length === 0
  }

  // Debounced input handler to reduce re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [formErrors])

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !validateStep(currentStep)) {
      return
    }

    // If we're not on the final step, just move to the next step
    if (currentStep < 3) {
      nextStep()
      return
    }

    // Get the card element
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Payment information is missing. Please go back to the payment step.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create order using Medusa best practices workflow
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totals.total,
          total: totals.total,
          email: formData.email,
          items: cart,
          shipping: formData,
          billing: formData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Order creation failed:', errorData)
        throw new Error(errorData.error || 'Failed to create order')
      }

      const responseData = await response.json()
      const { cart_id, client_secret, payment_session } = responseData
      console.log('✅ Cart created with payment session:', cart_id)

      // Check if we have a client_secret
      if (!client_secret && !payment_session?.data?.client_secret) {
        console.error('❌ No client_secret received:', responseData)
        throw new Error('Payment initialization failed - no client secret received from server')
      }

      const paymentClientSecret = client_secret || payment_session?.data?.client_secret
      console.log('💳 Using client_secret:', paymentClientSecret.substring(0, 20) + '...')

      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(paymentClientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.phone,
            address: {
              line1: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zipCode,
              country: formData.country,
            }
          }
        }
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
      } else {
        // Payment successful - complete the order
        console.log('💳 Payment confirmed, completing order...')

        const completeResponse = await fetch('/api/orders/complete-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cart_id: cart_id,
            payment_intent_id: result.paymentIntent?.id
          })
        })

        if (!completeResponse.ok) {
          throw new Error('Failed to complete order after payment')
        }

        const { order } = await completeResponse.json()
        console.log('✅ Order completed:', order.id)

        // Success - save order data for email and clear cart
        const orderData = {
          items: cart,
          shipping: formData,
          email: formData.email,
          total: totals.total,
          order: order
        }

        // Save order data and email for the success page
        localStorage.setItem('order-data', JSON.stringify(orderData))
        localStorage.setItem('order-email', formData.email)

        // Clear cart
        localStorage.removeItem('fabric-cart')

        // Redirect to success page with order details
        router.push(`/checkout/success?orderId=${order.id}&displayId=${order.display_id}&email=${encodeURIComponent(formData.email)}`)
      }

    } catch (err) {
      console.error('Checkout error:', err)

      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes('client secret')) {
          setError('Payment setup failed. Please refresh and try again.')
        } else if (err.message.includes('payment provider')) {
          setError('Payment provider error. Please check your card details.')
        } else if (err.message.includes('network')) {
          setError('Network error. Please check your connection.')
        } else {
          setError(err.message || 'Something went wrong. Please try again.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Totals are now memoized above

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-xl">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Payment
            </h3>
            <p className="text-gray-600">
              Please wait while we securely process your payment...
            </p>
          </div>
        </div>
      )}

      {/* Simplified Header */}
      <div className="bg-white border-b border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Checkout
              </h1>
              <p className="text-gray-600">
                Complete your order securely
              </p>
            </div>

            <Link
              href="/cart"
              className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900
                        px-4 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Cart
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutProgress currentStep={currentStep} />

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Guest Checkout Option - Show only if not signed in and not selected a mode */}
              {!session && !checkoutMode && currentStep === 1 && (
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    How would you like to checkout?
                  </h2>

                  <div className="space-y-4">
                    {/* Guest Checkout Option */}
                    <button
                      type="button"
                      onClick={() => setCheckoutMode('guest')}
                      className="w-full p-6 bg-white border-2 border-gray-200 rounded-lg
                                hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200
                                group text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <UserCheck className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Continue as Guest</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Quick checkout without creating an account
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </button>

                    {/* Sign In Option */}
                    <button
                      type="button"
                      onClick={() => setShowSignInOptions(true)}
                      className="w-full p-6 bg-white border-2 border-gray-200 rounded-lg
                                hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200
                                group text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <LogIn className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Sign In & Checkout</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Sign in with Google for faster checkout
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                    </button>
                  </div>

                  {/* Sign In Options - Show when clicked */}
                  {showSignInOptions && (
                    <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                      <button
                        type="button"
                        onClick={() => signIn('google', { callbackUrl: '/checkout' })}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3
                                  bg-white border border-gray-300 rounded-lg hover:bg-gray-50
                                  transition-colors duration-200 font-medium text-gray-700"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </button>

                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSignInOptions(false)
                            setCheckoutMode('guest')
                          }}
                          className="text-sm text-gray-600 hover:text-gray-900 underline"
                        >
                          Continue as guest instead
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1: Shipping Information - Show after selecting checkout mode */}
              {currentStep === 1 && (checkoutMode || session) && (
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-700" />
                      <h2 className="text-xl font-semibold text-gray-900">
                        Shipping Information
                      </h2>
                    </div>
                    {checkoutMode === 'guest' && (
                      <span className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                        Guest Checkout
                      </span>
                    )}
                    {session && (
                      <span className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Signed In
                      </span>
                    )}
                  </div>

                  <div className="space-y-6">
                    <FormInput
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email Address"
                      required
                      error={formErrors.email}
                      icon={Mail}
                      autoComplete="email"
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormInput
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First Name"
                        required
                        error={formErrors.firstName}
                        icon={User}
                        autoComplete="given-name"
                      />
                      <FormInput
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last Name (Optional)"
                        error={formErrors.lastName}
                        autoComplete="family-name"
                      />
                    </div>

                    <FormInput
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number (Optional)"
                      error={formErrors.phone}
                      icon={Phone}
                      autoComplete="tel"
                    />

                    <FormInput
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Street Address"
                      required
                      error={formErrors.address}
                      icon={Home}
                      autoComplete="street-address"
                    />

                    <div className="grid md:grid-cols-3 gap-6">
                      <FormInput
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
                        required
                        error={formErrors.city}
                        autoComplete="address-level2"
                      />
                      <FormInput
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        required
                        error={formErrors.state}
                        autoComplete="address-level1"
                      />
                      <FormInput
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        placeholder="ZIP Code"
                        required
                        error={formErrors.zipCode}
                        autoComplete="postal-code"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Information */}
              <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-5 h-5 text-gray-700" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Payment Information
                    </h2>
                  </div>

                  <div className="mb-6">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Test Mode:</strong> Use card 4242 4242 4242 4242 with any future date and CVC
                      </p>
                    </div>
                    <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#374151',
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              '::placeholder': {
                                color: '#9CA3AF',
                              },
                            },
                            invalid: {
                              color: '#EF4444',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Review & Confirm */}
              {currentStep === 3 && (
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="w-5 h-5 text-gray-700" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Review & Confirm
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {/* Shipping Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Shipping Address
                      </h3>
                      <div className="space-y-1 text-gray-600">
                        <p className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</p>
                        <p>{formData.email}</p>
                        <p>{formData.phone}</p>
                        <p>{formData.address}</p>
                        <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit Address
                      </button>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Order Items ({cart.length})
                      </h3>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-800">{item.title}</p>
                              <p className="text-sm text-gray-500">{item.variant} × {item.quantity}</p>
                            </div>
                            <span className="font-semibold text-gray-900">
                              ${((item.price * item.quantity) / 100).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-1">
                      Payment Error
                    </h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300
                              text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Previous
                  </button>
                ) : (
                  <Link
                    href="/cart"
                    className="flex items-center gap-2 px-6 py-3 border border-gray-300
                              text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Cart
                  </Link>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={currentStep === 1 && !checkoutMode && !session}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3
                              rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold
                              shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || cart.length === 0}
                    className="flex items-center gap-3 bg-blue-600 text-white px-8 py-3
                              rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold
                              disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Complete Order - ${(totals.total / 100).toFixed(2)}
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummarySidebar items={cart} totals={totals} />
          </div>
        </div>
      </main>
    </div>
  )
}

// Main Checkout Page Component
export default function CheckoutPage() {
  const [stripeInstance, setStripeInstance] = useState<any>(null)

  useEffect(() => {
    // Lazy load Stripe only when checkout page is accessed
    getStripe().then(setStripeInstance)
  }, [])

  if (!stripeInstance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-600">Loading secure checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripeInstance}>
      <CheckoutForm />
    </Elements>
  )
}