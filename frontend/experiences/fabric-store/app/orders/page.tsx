'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Header from '@/components/header'
import {
  Package,
  ChevronDown,
  ChevronUp,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Eye
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

export default function OrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [customerEmail, setCustomerEmail] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [orderIdInput, setOrderIdInput] = useState('')
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    const checkEmail = () => {
      if (session?.user?.email) {
        setCustomerEmail(session.user.email)
        return session.user.email
      }

      const storedEmail = localStorage.getItem('customer-email')
      if (storedEmail) {
        setCustomerEmail(storedEmail)
        return storedEmail
      }

      const urlParams = new URLSearchParams(window.location.search)
      const emailParam = urlParams.get('email')
      if (emailParam) {
        setCustomerEmail(emailParam)
        localStorage.setItem('customer-email', emailParam)
        return emailParam
      }

      return null
    }

    const email = checkEmail()
    if (email) {
      fetchOrders(email)
    } else {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    let filtered = orders

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.status.toLowerCase() === statusFilter.toLowerCase()
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchQuery, statusFilter])

  const fetchOrders = async (email: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (emailInput) {
      setCustomerEmail(emailInput)
      localStorage.setItem('customer-email', emailInput)
      fetchOrders(emailInput)
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'processing':
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-500" />
      case 'cancelled':
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Package className="w-4 h-4 text-gray-500" />
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
      month: 'short',
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

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const handleOrderIdSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderIdInput) {
      // Redirect to the specific order page
      window.location.href = `/orders/${orderIdInput.trim()}`
    }
  }

  if (!customerEmail) {

    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-6">
                  <Package className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">Track Your Order</h1>
                <p className="text-gray-600 leading-relaxed">
                  Enter your Order ID to view order details and track your delivery
                </p>
              </div>

              <form onSubmit={handleOrderIdSubmit} className="space-y-6">
                <div>
                  <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                    Order ID
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="orderId"
                      value={orderIdInput}
                      onChange={(e) => setOrderIdInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-all duration-200 font-mono"
                      placeholder="e.g., order_1758133842735_h5dchh79i"
                      required
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    You received this ID in your order confirmation email
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl
                           hover:bg-blue-700 transform hover:scale-[1.02]
                           transition-all duration-200 font-medium shadow-lg"
                >
                  Track Order
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-600 mb-4">
                  Want to see all your orders?
                </p>
                <button
                  onClick={() => setIsTracking(!isTracking)}
                  className="w-full text-blue-600 hover:text-blue-700 font-medium
                           transition-colors duration-200"
                >
                  {isTracking ? 'Use Order ID instead' : 'Track by Email'}
                </button>

                {isTracking && (
                  <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 transition-all duration-200"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-gray-600 text-white py-3 rounded-xl
                               hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      View Order History
                    </button>
                  </form>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700
                             font-medium transition-colors duration-200 text-sm"
                  >
                    Sign in with Google for full account access
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (orders.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 text-gray-400 rounded-2xl mb-8">
                <ShoppingBag className="w-12 h-12" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">No Orders Found</h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                No orders found for <strong>{customerEmail}</strong>.
                You can track a specific order using your Order ID below.
              </p>

              {/* Track Order by ID Section */}
              <div className="max-w-md mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Track Your Order
                </h2>
                <form onSubmit={handleOrderIdSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={orderIdInput}
                      onChange={(e) => setOrderIdInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               transition-all duration-200 font-mono text-sm"
                      placeholder="Enter your Order ID"
                      required
                    />
                    <p className="mt-2 text-xs text-gray-600">
                      You received this ID in your order confirmation
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-xl
                             hover:bg-blue-700 transform hover:scale-[1.02]
                             transition-all duration-200 font-medium shadow-md"
                  >
                    Track Order
                  </button>
                </form>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/browse"
                  className="inline-flex items-center px-8 py-3 bg-gray-800 text-white
                           rounded-xl hover:bg-gray-900 transform hover:scale-105
                           transition-all duration-200 font-medium shadow-lg"
                >
                  Browse Fabrics
                </Link>
                <button
                  onClick={() => {
                    setCustomerEmail('')
                    localStorage.removeItem('customer-email')
                  }}
                  className="inline-flex items-center px-8 py-3 border border-gray-300 text-gray-700
                           rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Try Different Email
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-blue-600
                       mb-6 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              Back to Home
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Order History</h1>
                <p className="text-gray-600">
                  <span className="font-medium">{customerEmail}</span> · {filteredOrders.length} of {orders.length} orders
                </p>
              </div>
              <button
                onClick={() => {
                  setCustomerEmail('')
                  localStorage.removeItem('customer-email')
                }}
                className="lg:ml-auto text-sm text-gray-600 hover:text-blue-600
                         transition-colors duration-200 font-medium"
              >
                Switch Account
              </button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders by ID or product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200 bg-white min-w-[140px]"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200
                                           hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                          #{order.id.slice(-8).toUpperCase()}
                        </h2>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                       text-xs font-medium border ${getStatusStyle(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status}</span>
                        </span>
                      </div>
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
                            <span className="font-medium">Tracking Available</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200
                               flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                      <Eye className="w-4 h-4" />
                      {expandedOrders.has(order.id) ? 'Hide Details' : 'View Details'}
                      {expandedOrders.has(order.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="w-4 h-4" />
                      <span className="text-sm">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      ${(order.totals.total / 100).toFixed(2)}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrders.has(order.id) && (
                    <div className="mt-8 pt-6 border-t border-gray-100 space-y-8">
                      {/* Items */}
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-4">Order Items</h3>
                        <div className="grid gap-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
                                <div className="text-sm text-gray-600 space-y-0.5">
                                  <p>SKU: {item.sku}</p>
                                  <p>Color: {item.color}</p>
                                  <p>Quantity: {item.quantity}</p>
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

                      {/* Two Column Layout for Address and Summary */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Shipping Address */}
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base font-semibold text-gray-900">Shipping Address</h3>
                          </div>
                          <div className="text-sm text-gray-700 space-y-2">
                            <p className="font-medium">{order.shipping.firstName} {order.shipping.lastName}</p>
                            <p>{order.shipping.address}</p>
                            <p>{order.shipping.city}, {order.shipping.state} {order.shipping.zipCode}</p>
                            {order.shipping.phone && (
                              <div className="flex items-center gap-2 pt-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span>{order.shipping.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <h3 className="text-base font-semibold text-gray-900">Order Summary</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium text-gray-900">${(order.totals.subtotal / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Shipping</span>
                              <span className="font-medium text-gray-900">${(order.totals.shipping / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tax</span>
                              <span className="font-medium text-gray-900">${(order.totals.tax / 100).toFixed(2)}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200 flex justify-between">
                              <span className="font-semibold text-gray-900">Total</span>
                              <span className="font-bold text-gray-900 text-lg">
                                ${(order.totals.total / 100).toFixed(2)}
                              </span>
                            </div>
                            {order.paymentIntentId && (
                              <div className="pt-2 text-xs text-gray-500">
                                Payment ID: {order.paymentIntentId}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-400 rounded-xl mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or filter settings
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}