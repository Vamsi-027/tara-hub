'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import {
  Package,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Copy,
  Share2
} from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  sku: string
  color: string
  price: number
  quantity: number
  image?: string
}

interface Order {
  id: string
  email: string
  items: OrderItem[]
  shipping: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zipCode: string
    phone?: string
  }
  totals: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  status: string
  paymentIntentId?: string
  tracking?: string
  createdAt: string
  updatedAt: string
}

/**
 * Guest Order Lookup Page
 * Allows anyone with an order ID to view order details
 * Useful for guest checkout scenarios
 */
export default function GuestOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId)
    }
  }, [orderId])

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch from API first
      const response = await fetch(`/api/orders?id=${encodeURIComponent(id)}`)

      if (response.ok) {
        const data = await response.json()
        if (data.order) {
          setOrder(data.order)
        } else {
          setError('Order not found')
        }
      } else if (response.status === 404) {
        setError('Order not found. Please check your order ID.')
      } else {
        setError('Unable to fetch order details')
      }
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'processing':
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />
      case 'cancelled':
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'processing':
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'cancelled':
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOrder = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: `Order #${orderId.slice(-8).toUpperCase()}`,
        text: 'View order details',
        url: url
      })
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-600 rounded-2xl mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Order Not Found</h1>
              <p className="text-gray-600 mb-8">
                {error}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/orders"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300
                           text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  View All Orders
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white
                           rounded-xl hover:bg-blue-700 transform hover:scale-105
                           transition-all duration-200 font-medium shadow-lg"
                >
                  Go to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!order) {
    return null
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link
              href="/orders"
              className="inline-flex items-center text-gray-600 hover:text-blue-600
                       mb-6 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Orders
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Order Details
                </h1>
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-mono text-sm">
                    Order ID: {orderId.slice(-8).toUpperCase()}
                  </span>
                  <button
                    onClick={copyOrderId}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Copy Order ID"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={shareOrder}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    title="Share Order"
                  >
                    <Share2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {copied && (
                  <span className="text-sm text-emerald-600 mt-2 inline-block">
                    Copied to clipboard!
                  </span>
                )}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                             text-sm font-medium border ${getStatusStyle(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="capitalize">{order.status}</span>
              </span>
            </div>
          </div>

          {/* Order Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Order Summary Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatDate(order.createdAt)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {formatTime(order.createdAt)}
                  </div>
                  {order.tracking && (
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">Tracking: {order.tracking}</span>
                    </div>
                  )}
                </div>
                <div className="text-xl font-bold text-gray-900">
                  ${(order.totals.total / 100).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <span>SKU: {item.sku}</span>
                        <span className="mx-2">•</span>
                        <span>Color: {item.color}</span>
                        <span className="mx-2">•</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        ${(item.price / 100).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Shipping Address */}
              <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <h3 className="text-base font-semibold text-gray-900">Shipping Address</h3>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium">
                    {order.shipping.firstName} {order.shipping.lastName}
                  </p>
                  <p>{order.shipping.address}</p>
                  <p>
                    {order.shipping.city}, {order.shipping.state} {order.shipping.zipCode}
                  </p>
                  {order.shipping.phone && (
                    <div className="flex items-center gap-2 pt-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{order.shipping.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{order.email}</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h3 className="text-base font-semibold text-gray-900">Payment Summary</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      ${(order.totals.subtotal / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">
                      ${(order.totals.shipping / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">
                      ${(order.totals.tax / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900 text-lg">
                      ${(order.totals.total / 100).toFixed(2)}
                    </span>
                  </div>
                  {order.paymentIntentId && (
                    <div className="pt-2 text-xs text-gray-500">
                      Payment ID: {order.paymentIntentId.slice(0, 20)}...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">Save this page</h3>
            <p className="text-blue-700 text-sm leading-relaxed">
              Bookmark this page or save the order ID to check your order status anytime.
              You can also share this link with others who need to view this order.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}