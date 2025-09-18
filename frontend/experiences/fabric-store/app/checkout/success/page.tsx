'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import {
  CheckCircle,
  Package,
  Copy,
  Mail,
  ArrowRight,
  Home,
  AlertCircle
} from 'lucide-react'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const [copied, setCopied] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // Get order details from URL params or session storage
    const orderIdParam = searchParams.get('orderId')
    const emailParam = searchParams.get('email')

    if (orderIdParam) {
      setOrderId(orderIdParam)
      // Save to session storage for page refresh
      sessionStorage.setItem('lastOrderId', orderIdParam)
    } else {
      // Try to get from session storage
      const lastOrder = sessionStorage.getItem('lastOrderId')
      if (lastOrder) {
        setOrderId(lastOrder)
      }
    }

    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!orderId) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">No Order Information</h1>
              <p className="text-gray-600 mb-8">
                We couldn't find your order information. Please check your email for order details.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white
                         rounded-xl hover:bg-blue-700 transform hover:scale-105
                         transition-all duration-200 font-medium shadow-lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Success Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
              <p className="text-emerald-50 text-lg">
                Thank you for your purchase
              </p>
            </div>

            {/* Order Details */}
            <div className="p-8">
              {/* Order ID Section - Prominent Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Order ID</h2>
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-blue-200">
                  <code className="text-lg font-mono font-bold text-blue-900 select-all">
                    {orderId}
                  </code>
                  <button
                    onClick={copyOrderId}
                    className="ml-4 p-2.5 hover:bg-blue-50 rounded-lg transition-all duration-200
                             group relative"
                    title="Copy Order ID"
                  >
                    <Copy className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                    {copied && (
                      <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        Copied!
                      </span>
                    )}
                  </button>
                </div>
                <p className="mt-3 text-sm text-blue-700 flex items-start">
                  <AlertCircle className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                  Save this ID to track your order. You'll also receive it via email.
                </p>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
                <h3 className="font-semibold text-amber-900 mb-2 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Check Your Email
                </h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  We've sent a confirmation to <strong>{email || 'your email address'}</strong> with:
                </p>
                <ul className="mt-3 space-y-1 text-amber-700 text-sm">
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Your order ID for tracking
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Receipt and order details
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    Estimated delivery timeline
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/orders/${orderId}`}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 text-white
                           rounded-xl hover:bg-blue-700 transform hover:scale-[1.02]
                           transition-all duration-200 font-medium shadow-lg group"
                >
                  View Order Details
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/browse"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3.5 border-2 border-gray-300
                           text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400
                           transition-all duration-200 font-medium"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Help Text */}
              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <p className="text-gray-600 text-sm">
                  Questions about your order? Track it anytime using your Order ID above.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  No account needed - just your Order ID!
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-blue-600
                       transition-colors duration-200 group"
            >
              <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}