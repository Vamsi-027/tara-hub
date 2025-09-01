'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Package, 
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  CreditCard,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  orders: {
    total: number
    pending: number
    processing: number
    completed: number
    cancelled: number
  }
  revenue: {
    total: number
    today: number
    week: number
    month: number
  }
  customers: {
    total: number
    new: number
  }
  products: {
    totalSold: number
    topSelling: any[]
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    orders: { total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 },
    revenue: { total: 0, today: 0, week: 0, month: 0 },
    customers: { total: 0, new: 0 },
    products: { totalSold: 0, topSelling: [] }
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch orders
      const ordersResponse = await fetch('/api/orders')
      const ordersData = await ordersResponse.json()
      
      const orders = ordersData.orders || []
      const orderStats = ordersData.stats || {}
      
      // Calculate revenue
      const totalRevenue = orders.reduce((sum: number, order: any) => 
        sum + (order.totals?.total || 0), 0)
      
      // Calculate today's revenue
      const today = new Date().toDateString()
      const todayRevenue = orders
        .filter((order: any) => new Date(order.createdAt).toDateString() === today)
        .reduce((sum: number, order: any) => sum + (order.totals?.total || 0), 0)
      
      // Calculate week's revenue
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekRevenue = orders
        .filter((order: any) => new Date(order.createdAt) >= weekAgo)
        .reduce((sum: number, order: any) => sum + (order.totals?.total || 0), 0)
      
      // Calculate month's revenue
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const monthRevenue = orders
        .filter((order: any) => new Date(order.createdAt) >= monthAgo)
        .reduce((sum: number, order: any) => sum + (order.totals?.total || 0), 0)
      
      // Get unique customers
      const uniqueCustomers = new Set(orders.map((order: any) => order.email))
      
      // Count products sold
      const totalProductsSold = orders.reduce((sum: number, order: any) => 
        sum + (order.items?.length || 0), 0)
      
      // Get recent orders (last 5)
      const recent = orders.slice(0, 5)
      
      setStats({
        orders: orderStats,
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue
        },
        customers: {
          total: uniqueCustomers.size,
          new: uniqueCustomers.size // In production, track new vs returning
        },
        products: {
          totalSold: totalProductsSold,
          topSelling: []
        }
      })
      
      setRecentOrders(recent)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back! Here's what's happening with your store.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/orders"
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition"
              >
                View Orders
              </Link>
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              >
                View Store
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 flex items-center">
                +12.5% <ArrowUpRight className="h-4 w-4 ml-1" />
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold">${(stats.revenue.total / 100).toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 flex items-center">
                +8.2% <ArrowUpRight className="h-4 w-4 ml-1" />
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Total Orders</h3>
            <p className="text-2xl font-bold">{stats.orders.total}</p>
            <p className="text-xs text-gray-500 mt-2">{stats.orders.pending} pending</p>
          </div>

          {/* Customers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600 flex items-center">
                +5.3% <ArrowUpRight className="h-4 w-4 ml-1" />
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Total Customers</h3>
            <p className="text-2xl font-bold">{stats.customers.total}</p>
            <p className="text-xs text-gray-500 mt-2">Active customers</p>
          </div>

          {/* Products Sold */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm text-green-600 flex items-center">
                +15.7% <ArrowUpRight className="h-4 w-4 ml-1" />
              </span>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Products Sold</h3>
            <p className="text-2xl font-bold">{stats.products.totalSold}</p>
            <p className="text-xs text-gray-500 mt-2">Total items</p>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Revenue Overview
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Today</p>
                <p className="text-xl font-bold">${(stats.revenue.today / 100).toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">↑ Active</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">This Week</p>
                <p className="text-xl font-bold">${(stats.revenue.week / 100).toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">↑ 12%</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-xl font-bold">${(stats.revenue.month / 100).toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">↑ 8%</p>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-600 mb-4">Order Status Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <span className="text-sm font-medium">{stats.orders.pending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                    <span className="text-sm">Processing</span>
                  </div>
                  <span className="text-sm font-medium">{stats.orders.processing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-sm">Completed</span>
                  </div>
                  <span className="text-sm font-medium">{stats.orders.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                    <span className="text-sm">Cancelled</span>
                  </div>
                  <span className="text-sm font-medium">{stats.orders.cancelled}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/admin/orders"
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Orders
                </span>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link
                href="/products/simple"
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Products
                </span>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </Link>
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Customer List
                </span>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <span className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </span>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
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
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.id.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${((order.totals?.total || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}