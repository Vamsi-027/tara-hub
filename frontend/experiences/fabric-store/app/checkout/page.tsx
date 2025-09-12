'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  EyeOff
} from 'lucide-react'

// Initialize Stripe
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
            <Icon className="w-5 h-5 text-warm-500" />
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
          className={`w-full h-14 bg-white border-2 rounded-xl font-body transition-all duration-300 
                     outline-none peer
                     ${Icon ? 'pl-12 pr-4' : 'px-4'}
                     ${type === 'password' ? 'pr-12' : ''}
                     ${isFocused || hasValue ? 'pt-6 pb-2' : 'py-4'}
                     ${error 
                       ? 'border-red-300 focus:border-red-500 bg-red-50/30' 
                       : 'border-warm-300 focus:border-navy-800 hover:border-gold-800'
                     }`}
          placeholder=""
          required={required}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-500 hover:text-navy-800
                      transition-colors duration-200"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        
        <label
          htmlFor={id}
          className={`absolute font-body font-medium transition-all duration-300 pointer-events-none
                     ${Icon ? 'left-12' : 'left-4'}
                     ${isFocused || hasValue 
                       ? 'top-2 text-xs text-warm-600' 
                       : 'top-1/2 -translate-y-1/2 text-base text-warm-500'
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
    <div className="bg-white border border-warm-200 rounded-2xl p-6 mb-8">
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
                                 ? 'bg-green-100 border-green-500 text-green-600' 
                                 : isActive
                                 ? 'bg-gold-100 border-gold-800 text-gold-800'
                                 : 'bg-warm-100 border-warm-300 text-warm-500'
                               }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium
                               ${isActive ? 'text-gold-800' : 'text-warm-600'}`}>
                  {step.name}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 transition-all duration-300
                               ${step.id < currentStep ? 'bg-green-500' : 'bg-warm-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

// Order Summary Sidebar Component
function OrderSummarySidebar({ items, totals }: { 
  items: CartItem[]
  totals: { subtotal: number; shipping: number; tax: number; total: number }
}) {
  return (
    <div className="bg-white border border-warm-200 rounded-2xl p-6 sticky top-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-6 h-6 text-navy-800" />
        <h2 className="font-display text-xl font-semibold text-navy-800">
          Order Summary
        </h2>
      </div>

      {/* Items List */}
      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 bg-warm-50 rounded-xl">
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-12 h-12 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-body font-medium text-navy-800 text-sm truncate">
                {item.title}
              </h4>
              <p className="text-xs text-warm-600 mb-1">{item.variant}</p>
              <p className="text-sm font-medium text-navy-700">
                ${(item.price / 100).toFixed(2)} × {item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3 pb-6 border-b border-warm-200">
        <div className="flex justify-between font-body text-navy-700">
          <span>Subtotal</span>
          <span>${(totals.subtotal / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-body text-navy-700">
          <span>Shipping</span>
          <span>${(totals.shipping / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-body text-navy-700">
          <span>Tax</span>
          <span>${(totals.tax / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="pt-6">
        <div className="flex justify-between items-center mb-6">
          <span className="font-display text-xl font-medium text-navy-800">Total</span>
          <span className="font-display text-2xl font-semibold text-navy-800">
            ${(totals.total / 100).toFixed(2)}
          </span>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-sm text-warm-600 mb-4">
          <Shield className="w-4 h-4 text-green-600" />
          <span>Secured with SSL encryption</span>
        </div>
      </div>
    </div>
  )
}

// Main Checkout Form Component
function CheckoutForm() {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
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
    // Load cart from localStorage
    const savedCart = localStorage.getItem('fabric-cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart:', error)
        router.push('/cart')
      }
    } else {
      router.push('/cart')
    }
  }, [router])

  const calculateTotals = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
    const shipping = subtotal > 10000 ? 0 : 1500 // Free shipping over $100
    const tax = Math.round(subtotal * 0.08) // 8% tax
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax
    }
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}
    
    if (step === 1) {
      // Validate shipping information
      if (!formData.email.trim()) errors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email address'
      
      if (!formData.firstName.trim()) errors.firstName = 'First name is required'
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
      if (!formData.phone.trim()) errors.phone = 'Phone number is required'
      if (!formData.address.trim()) errors.address = 'Address is required'
      if (!formData.city.trim()) errors.city = 'City is required'
      if (!formData.state.trim()) errors.state = 'State is required'
      if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

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

    setLoading(true)
    setError('')

    try {
      const totals = calculateTotals()
      
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totals.total,
          email: formData.email,
          items: cart,
          shipping: formData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret, orderId } = await response.json()

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
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
        // Success - clear cart and redirect
        localStorage.removeItem('fabric-cart')
        router.push(`/order-success?order_id=${orderId}&payment_intent=${result.paymentIntent.id}`)
      }

    } catch (err) {
      console.error('Checkout error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-warm-50">
      <Header />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-navy-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 border-4 border-navy-200 border-t-navy-800 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-navy-800 mb-2">
              Processing Payment
            </h3>
            <p className="font-body text-warm-600">
              Please wait while we securely process your payment...
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-6 h-6 text-gold-800" />
                <span className="text-gold-800 font-body font-medium uppercase tracking-wide text-sm">
                  Secure Checkout
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4 tracking-tight">
                Complete Your Order
              </h1>
              <p className="text-xl text-navy-100 max-w-2xl font-body leading-relaxed">
                Your premium fabric collection is just moments away. 
                Complete your secure checkout with confidence.
              </p>
            </div>
            
            <Link
              href="/cart"
              className="hidden md:flex items-center gap-2 bg-navy-700/50 border border-navy-600 
                        text-white px-6 py-3 rounded-xl hover:bg-navy-600 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Cart
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutProgress currentStep={currentStep} />

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <div className="bg-white border border-warm-200 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-navy-800" />
                    <h2 className="font-display text-2xl font-semibold text-navy-800">
                      Shipping Information
                    </h2>
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
                        placeholder="Last Name"
                        required
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
                      placeholder="Phone Number"
                      required
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
              {currentStep === 2 && (
                <div className="bg-white border border-warm-200 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-6 h-6 text-navy-800" />
                    <h2 className="font-display text-2xl font-semibold text-navy-800">
                      Payment Information
                    </h2>
                  </div>

                  <div className="mb-6">
                    <p className="font-body text-warm-600 text-sm mb-4">
                      <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future expiry and CVC
                    </p>
                    <div className="p-6 border-2 border-warm-200 rounded-xl bg-warm-50/50">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#2C2C2C',
                              fontFamily: 'Source Sans 3, system-ui, sans-serif',
                              '::placeholder': {
                                color: '#A3A3A3',
                              },
                            },
                            invalid: {
                              color: '#dc2626',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <Shield className="w-5 h-5 text-green-600" />
                    <p className="font-body text-green-800 text-sm">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Confirm */}
              {currentStep === 3 && (
                <div className="bg-white border border-warm-200 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle className="w-6 h-6 text-navy-800" />
                    <h2 className="font-display text-2xl font-semibold text-navy-800">
                      Review & Confirm
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Shipping Details */}
                    <div className="bg-warm-50 border border-warm-200 rounded-xl p-6">
                      <h3 className="font-display text-lg font-medium text-navy-800 mb-4">
                        Shipping Address
                      </h3>
                      <div className="space-y-2 font-body text-navy-700">
                        <p>{formData.firstName} {formData.lastName}</p>
                        <p>{formData.email}</p>
                        <p>{formData.phone}</p>
                        <p>{formData.address}</p>
                        <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="mt-4 text-sm text-gold-800 hover:text-gold-900 font-medium"
                      >
                        Edit Address
                      </button>
                    </div>

                    {/* Order Items */}
                    <div className="bg-warm-50 border border-warm-200 rounded-xl p-6">
                      <h3 className="font-display text-lg font-medium text-navy-800 mb-4">
                        Order Items ({cart.length})
                      </h3>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-body font-medium text-navy-800">{item.title}</p>
                              <p className="text-sm text-warm-600">{item.variant} × {item.quantity}</p>
                            </div>
                            <span className="font-body font-semibold text-navy-800">
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
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-body font-semibold text-red-800 mb-1">
                      Payment Error
                    </h3>
                    <p className="font-body text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 px-6 py-3 border border-warm-300 
                              text-navy-700 rounded-xl hover:bg-warm-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Previous
                  </button>
                ) : (
                  <Link
                    href="/cart"
                    className="flex items-center gap-2 px-6 py-3 border border-warm-300 
                              text-navy-700 rounded-xl hover:bg-warm-50 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Cart
                  </Link>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-navy-800 text-white px-8 py-3 
                              rounded-xl hover:bg-navy-700 hover:-translate-y-0.5 hover:shadow-lg
                              transition-all duration-300 font-semibold"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || cart.length === 0}
                    className="flex items-center gap-3 bg-navy-800 text-white px-8 py-4
                              rounded-xl hover:bg-navy-700 hover:-translate-y-0.5 hover:shadow-lg
                              transition-all duration-300 font-semibold text-lg
                              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}