import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Client } from 'pg'

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log('📊 Fetching fabric orders from PostgreSQL database...')
    
    // Get database connection from environment
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL not configured')
      // Fallback to fabric store API if database is not configured
      const fabricResponse = await fetch("http://localhost:3006/api/orders")
      const fabricData = await fabricResponse.json()
      
      const fabricOrders = (fabricData.orders || []).map((order: any) => ({
        id: order.id,
        display_id: order.id.split('_')[1] || order.id,
        status: order.status || "pending",
        email: order.email,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        payment_status: order.status === "completed" ? "captured" : "awaiting",
        fulfillment_status: order.status === "completed" ? "fulfilled" : "not_fulfilled",
        total: order.totals?.total || 0,
        currency_code: "usd",
        customer: {
          email: order.email,
          first_name: order.shipping?.firstName,
          last_name: order.shipping?.lastName,
        },
        sales_channel: {
          name: "Fabric Store",
          id: "fabric-store"
        },
        items: order.items?.map((item: any) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          total: item.price * item.quantity
        })) || [],
        shipping_address: order.shipping ? {
          first_name: order.shipping.firstName,
          last_name: order.shipping.lastName,
          address_1: order.shipping.address,
          city: order.shipping.city,
          province: order.shipping.state,
          postal_code: order.shipping.zipCode,
          country_code: "us",
          phone: order.shipping.phone
        } : null,
        _isFabricOrder: true,
        _source: 'file' // Indicate data source
      }))
      
      return res.json({
        orders: fabricOrders,
        count: fabricOrders.length,
        offset: 0,
        limit: 100,
        source: 'file'
      })
    }
    
    // Create PostgreSQL client
    const client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    try {
      // Query orders from database
      const result = await client.query(`
        SELECT 
          id, 
          email, 
          status, 
          items_count, 
          total_amount, 
          subtotal,
          shipping_cost,
          tax_amount,
          payment_intent_id, 
          customer_data,
          shipping_data,
          items_data,
          metadata,
          created_at, 
          updated_at
        FROM fabric_orders 
        ORDER BY created_at DESC 
        LIMIT 100
      `)
      
      console.log(`✅ Retrieved ${result.rows.length} orders from database`)
      
      // Transform database orders to match admin dashboard format
      const fabricOrders = result.rows.map((dbOrder: any) => {
        // Parse JSON fields
        const customerData = typeof dbOrder.customer_data === 'string' 
          ? JSON.parse(dbOrder.customer_data) 
          : dbOrder.customer_data || {}
        const shippingData = typeof dbOrder.shipping_data === 'string'
          ? JSON.parse(dbOrder.shipping_data)
          : dbOrder.shipping_data || {}
        const itemsData = typeof dbOrder.items_data === 'string'
          ? JSON.parse(dbOrder.items_data)
          : dbOrder.items_data || []
        
        return {
          id: dbOrder.id,
          display_id: dbOrder.id.split('_')[1] || dbOrder.id,
          status: dbOrder.status || "pending",
          email: dbOrder.email,
          created_at: dbOrder.created_at,
          updated_at: dbOrder.updated_at,
          payment_status: dbOrder.status === "completed" ? "captured" : "awaiting",
          fulfillment_status: dbOrder.status === "completed" ? "fulfilled" : "not_fulfilled",
          total: dbOrder.total_amount || 0,
          totals: {
            total: dbOrder.total_amount || 0,
            subtotal: dbOrder.subtotal || 0,
            shipping: dbOrder.shipping_cost || 0,
            tax: dbOrder.tax_amount || 0
          },
          currency_code: "usd",
          customer: {
            email: dbOrder.email,
            first_name: customerData.firstName || shippingData.firstName,
            last_name: customerData.lastName || shippingData.lastName,
          },
          sales_channel: {
            name: "Fabric Store",
            id: "fabric-store"
          },
          items: itemsData.map((item: any) => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            unit_price: item.price,
            total: item.price * (item.quantity || 1),
            variant: item.variant
          })),
          shipping: shippingData,
          shipping_address: shippingData ? {
            first_name: shippingData.firstName,
            last_name: shippingData.lastName,
            address_1: shippingData.address,
            city: shippingData.city,
            province: shippingData.state,
            postal_code: shippingData.zipCode,
            country_code: shippingData.country || "us",
            phone: shippingData.phone
          } : null,
          paymentIntentId: dbOrder.payment_intent_id,
          createdAt: dbOrder.created_at, // Include both formats for compatibility
          updatedAt: dbOrder.updated_at,
          _isFabricOrder: true,
          _source: 'database' // Indicate data source
        }
      })
      
      res.json({
        orders: fabricOrders,
        count: fabricOrders.length,
        offset: 0,
        limit: 100,
        source: 'database'
      })
      
    } finally {
      await client.end()
      console.log('🔌 Database connection closed')
    }
    
  } catch (error: any) {
    console.error("❌ Error fetching fabric orders from database:", error)
    console.log("⚠️  Falling back to file storage...")
    
    // Fallback to fabric store API if database query fails
    try {
      const fabricResponse = await fetch("http://localhost:3006/api/orders")
      const fabricData = await fabricResponse.json()
      
      const fabricOrders = (fabricData.orders || []).map((order: any) => ({
        id: order.id,
        display_id: order.id.split('_')[1] || order.id,
        status: order.status || "pending",
        email: order.email,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        payment_status: order.status === "completed" ? "captured" : "awaiting",
        fulfillment_status: order.status === "completed" ? "fulfilled" : "not_fulfilled",
        total: order.totals?.total || 0,
        totals: order.totals,
        currency_code: "usd",
        customer: {
          email: order.email,
          first_name: order.shipping?.firstName,
          last_name: order.shipping?.lastName,
        },
        sales_channel: {
          name: "Fabric Store",
          id: "fabric-store"
        },
        items: order.items?.map((item: any) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          total: item.price * item.quantity
        })) || [],
        shipping: order.shipping,
        shipping_address: order.shipping ? {
          first_name: order.shipping.firstName,
          last_name: order.shipping.lastName,
          address_1: order.shipping.address,
          city: order.shipping.city,
          province: order.shipping.state,
          postal_code: order.shipping.zipCode,
          country_code: "us",
          phone: order.shipping.phone
        } : null,
        _isFabricOrder: true,
        _source: 'file-fallback'
      }))
      
      res.json({
        orders: fabricOrders,
        count: fabricOrders.length,
        offset: 0,
        limit: 100,
        source: 'file-fallback'
      })
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError)
      res.status(500).json({ 
        error: "Failed to fetch fabric orders from both database and file storage",
        message: error.message 
      })
    }
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Forward POST requests to fabric store API
    const response = await fetch("http://localhost:3006/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body)
    })
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("Error creating fabric order:", error)
    res.status(500).json({ 
      error: "Failed to create fabric order",
      message: error.message 
    })
  }
}

export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Forward PUT requests to fabric store API
    const response = await fetch("http://localhost:3006/api/orders", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body)
    })
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("Error updating fabric order:", error)
    res.status(500).json({ 
      error: "Failed to update fabric order",
      message: error.message 
    })
  }
}