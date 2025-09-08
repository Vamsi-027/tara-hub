'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Mail, Truck } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const paymentIntentId = searchParams.get('payment_intent')
  const emailParam = searchParams.get('email')
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    // Send confirmation email when page loads
    if (orderId && paymentIntentId && !emailSent) {
      sendOrderConfirmation()
    }
  }, [orderId, paymentIntentId, emailSent])

  const sendOrderConfirmation = async () => {
    try {
      // Get email from URL params or localStorage
      const email = emailParam || localStorage.getItem('order-email') || 'customer@example.com'
      
      // Get order data from localStorage
      const orderDataStr = localStorage.getItem('order-data')
      const orderData = orderDataStr ? JSON.parse(orderDataStr) : null
      
      const response = await fetch('/api/send-order-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          paymentIntentId,
          email,
          orderData
        })
      })
      
      // Clean up localStorage after sending
      if (response.ok) {
        localStorage.removeItem('order-data')
        setEmailSent(true)
      }
    } catch (error) {
      console.error('Failed to send confirmation email:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been successfully placed.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order ID</p>
            <p className="font-mono font-semibold">{orderId}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          {emailSent ? (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <div>
                  <p className="font-medium">Email Confirmation Sent!</p>
                  <p className="text-sm mt-1">Check your email for order details. If you don't see it, check your spam folder.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2 animate-pulse" />
                <div>
                  <p className="font-medium">Sending Confirmation Email...</p>
                  <p className="text-sm mt-1">We're sending your order details to your email address.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-3">
            <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="text-left">
              <p className="font-medium">Email Status</p>
              <p className="text-sm text-gray-600">
                {emailSent ? '✅ Confirmation sent successfully' : '⏳ Processing...'}
              </p>
              {emailParam && (
                <p className="text-xs text-gray-500 mt-1">Sent to: {decodeURIComponent(emailParam)}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Package className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="text-left">
              <p className="font-medium">Shipping Updates</p>
              <p className="text-sm text-gray-600">
                You'll receive tracking information once your order ships
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-black text-white py-3 rounded-md hover:bg-gray-800 transition"
          >
            Continue Shopping
          </Link>
          
          <Link
            href="/orders"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-50 transition"
          >
            View Orders
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}