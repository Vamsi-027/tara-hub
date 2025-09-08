'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Users,
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react'

interface Order {
  id: string
  email: string
  items: any[]
  shipping: any
  totals: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  status: string
  createdAt: string
  updatedAt: string
  paymentIntentId?: string
  tracking?: string
  timeline: any[]
  notes: any[]
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data.orders || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        })
      })
      
      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateRevenue = () => {
    return orders.reduce((sum, order) => sum + order.totals.total, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and track all customer orders</p>
            </div>
            <button
              onClick={fetchOrders}
              className={`flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition ${refreshing ? 'opacity-50' : ''}`}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(calculateRevenue() / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order ID or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button className="px-4 py-2 border rounded-md hover:bg-gray-50 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.id.substring(0, 20)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.email}</div>
                    <div className="text-xs text-gray-500">
                      {order.shipping?.city}, {order.shipping?.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.items.length} items
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${(order.totals.total / 100).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <Eye className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Order Details</h2>
                  <p className="text-gray-600">{selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Email:</strong> {selectedOrder.email}</p>
                    <p><strong>Name:</strong> {selectedOrder.shipping?.firstName} {selectedOrder.shipping?.lastName}</p>
                    <p><strong>Address:</strong> {selectedOrder.shipping?.address}</p>
                    <p><strong>City:</strong> {selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} {selectedOrder.shipping?.zipCode}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>Status:</strong> <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                    <p><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    <p><strong>Payment ID:</strong> {selectedOrder.paymentIntentId}</p>
                    {selectedOrder.tracking && (
                      <p><strong>Tracking:</strong> {selectedOrder.tracking}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-gray-600">{item.variant}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">${(item.price / 100).toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">${((item.price * item.quantity) / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-medium">Subtotal:</td>
                        <td className="px-4 py-2 text-right">${(selectedOrder.totals.subtotal / 100).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-medium">Shipping:</td>
                        <td className="px-4 py-2 text-right">${(selectedOrder.totals.shipping / 100).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right font-medium">Tax:</td>
                        <td className="px-4 py-2 text-right">${(selectedOrder.totals.tax / 100).toFixed(2)}</td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={3} className="px-4 py-2 text-right">Total:</td>
                        <td className="px-4 py-2 text-right text-lg">${(selectedOrder.totals.total / 100).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">Order Timeline</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    {selectedOrder.timeline.map((event, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{event.message}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}