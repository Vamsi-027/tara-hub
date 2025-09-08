import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for customers (in production, use a database)
const customers: Map<string, any> = new Map()

// Helper function to extract customers from orders
async function extractCustomersFromOrders() {
  try {
    // Fetch all orders
    const ordersResponse = await fetch('http://localhost:3006/api/orders')
    const ordersData = await ordersResponse.json()
    const orders = ordersData.orders || []
    
    // Extract unique customers from orders
    const customerMap = new Map()
    
    orders.forEach((order: any) => {
      const email = order.email
      if (!email) return
      
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: `cust_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: email,
          name: `${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}`.trim() || 'Unknown',
          firstName: order.shipping?.firstName || '',
          lastName: order.shipping?.lastName || '',
          phone: order.shipping?.phone || '',
          address: {
            address: order.shipping?.address || '',
            city: order.shipping?.city || '',
            state: order.shipping?.state || '',
            zipCode: order.shipping?.zipCode || '',
            country: order.shipping?.country || 'US'
          },
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
          firstOrderDate: order.createdAt,
          createdAt: order.createdAt,
          status: 'active',
          tags: [],
          notes: []
        })
      }
      
      const customer = customerMap.get(email)
      customer.totalOrders += 1
      customer.totalSpent += (order.totals?.total || 0)
      
      // Update last order date
      if (!customer.lastOrderDate || new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt
      }
      
      // Update first order date
      if (new Date(order.createdAt) < new Date(customer.firstOrderDate)) {
        customer.firstOrderDate = order.createdAt
      }
    })
    
    return customerMap
  } catch (error) {
    console.error('Error extracting customers from orders:', error)
    return new Map()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const id = searchParams.get('id')
    const search = searchParams.get('search')
    
    // Get customers from orders
    const customerMap = await extractCustomersFromOrders()
    
    // Merge with stored customers
    customerMap.forEach((customer, email) => {
      if (!customers.has(email)) {
        customers.set(email, customer)
      } else {
        // Update existing customer data
        const existing = customers.get(email)
        customers.set(email, {
          ...existing,
          ...customer,
          notes: existing.notes // Preserve notes
        })
      }
    })
    
    let filteredCustomers = Array.from(customers.values())
    
    if (id) {
      const customer = Array.from(customers.values()).find(c => c.id === id)
      return NextResponse.json(customer || null)
    }
    
    if (email) {
      const customer = customers.get(email)
      return NextResponse.json(customer || null)
    }
    
    if (search) {
      filteredCustomers = filteredCustomers.filter(customer =>
        customer.email?.toLowerCase().includes(search.toLowerCase()) ||
        customer.name?.toLowerCase().includes(search.toLowerCase()) ||
        customer.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Sort by last order date (most recent first)
    filteredCustomers.sort((a, b) => {
      if (!a.lastOrderDate) return 1
      if (!b.lastOrderDate) return -1
      return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    })
    
    // Calculate statistics
    const stats = {
      total: filteredCustomers.length,
      active: filteredCustomers.filter(c => c.status === 'active').length,
      inactive: filteredCustomers.filter(c => c.status === 'inactive').length,
      totalRevenue: filteredCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
      averageOrderValue: filteredCustomers.length > 0 
        ? filteredCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / 
          filteredCustomers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)
        : 0,
      newThisMonth: filteredCustomers.filter(c => {
        const created = new Date(c.createdAt)
        const now = new Date()
        return created.getMonth() === now.getMonth() && 
               created.getFullYear() === now.getFullYear()
      }).length
    }
    
    return NextResponse.json({
      customers: filteredCustomers,
      total: filteredCustomers.length,
      stats
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, firstName, lastName, phone, address, notes } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    const customer = {
      id: `cust_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email,
      name: `${firstName || ''} ${lastName || ''}`.trim() || email,
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      address: address || {},
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      firstOrderDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      tags: [],
      notes: notes ? [{ text: notes, timestamp: new Date().toISOString() }] : []
    }
    
    customers.set(email, customer)
    
    console.log(`👤 New customer created: ${customer.email}`)
    
    return NextResponse.json({
      success: true,
      customer
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, status, tags, notes } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    const customer = customers.get(email)
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }
    
    // Update customer
    if (status) {
      customer.status = status
    }
    
    if (tags) {
      customer.tags = tags
    }
    
    if (notes) {
      customer.notes.push({
        text: notes,
        timestamp: new Date().toISOString()
      })
    }
    
    customer.updatedAt = new Date().toISOString()
    customers.set(email, customer)
    
    console.log(`📝 Customer updated: ${email}`)
    
    return NextResponse.json({
      success: true,
      customer
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}