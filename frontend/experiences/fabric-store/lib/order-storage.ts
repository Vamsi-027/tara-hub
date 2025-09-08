import fs from 'fs'
import path from 'path'

const ORDERS_FILE = path.join(process.cwd(), '.orders.json')

interface Order {
  id: string
  email: string
  items: any[]
  shipping: any
  totals: any
  paymentIntentId?: string
  status: string
  createdAt: string
  updatedAt: string
  notes: any[]
  timeline: any[]
}

class OrderStorage {
  private orders: Map<string, Order>

  constructor() {
    this.orders = new Map()
    this.loadOrders()
  }

  private loadOrders() {
    try {
      if (fs.existsSync(ORDERS_FILE)) {
        const data = fs.readFileSync(ORDERS_FILE, 'utf-8')
        const ordersArray = JSON.parse(data)
        ordersArray.forEach((order: Order) => {
          this.orders.set(order.id, order)
        })
        console.log(`Loaded ${this.orders.size} orders from storage`)
      }
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  private saveOrders() {
    try {
      const ordersArray = Array.from(this.orders.values())
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersArray, null, 2))
      console.log(`Saved ${ordersArray.length} orders to storage`)
    } catch (error) {
      console.error('Error saving orders:', error)
    }
  }

  set(orderId: string, order: Order) {
    this.orders.set(orderId, order)
    this.saveOrders()
  }

  get(orderId: string) {
    return this.orders.get(orderId)
  }

  getAll() {
    return Array.from(this.orders.values())
  }

  update(orderId: string, updates: Partial<Order>) {
    const order = this.orders.get(orderId)
    if (order) {
      const updatedOrder = { ...order, ...updates, updatedAt: new Date().toISOString() }
      this.orders.set(orderId, updatedOrder)
      this.saveOrders()
      return updatedOrder
    }
    return null
  }

  getStats() {
    const allOrders = this.getAll()
    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      processing: allOrders.filter(o => o.status === 'processing').length,
      completed: allOrders.filter(o => o.status === 'completed').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length,
      revenue: allOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0)
    }
  }
}

// Singleton instance
let orderStorage: OrderStorage | null = null

export function getOrderStorage() {
  if (!orderStorage) {
    orderStorage = new OrderStorage()
  }
  return orderStorage
}