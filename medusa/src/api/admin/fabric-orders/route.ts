import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Fetch fabric store orders
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
      _isFabricOrder: true // Flag to identify fabric orders
    }))
    
    res.json({
      orders: fabricOrders,
      count: fabricOrders.length,
      offset: 0,
      limit: 100
    })
  } catch (error) {
    console.error("Error fetching fabric orders:", error)
    res.status(500).json({ 
      error: "Failed to fetch fabric orders",
      message: error.message 
    })
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