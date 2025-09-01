import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id } = req.params
    
    // Fetch specific order from fabric store
    const fabricResponse = await fetch(`http://localhost:3006/api/orders?id=${id}`)
    const order = await fabricResponse.json()
    
    if (!order) {
      return res.status(404).json({ 
        error: "Order not found" 
      })
    }
    
    // Transform to Medusa-compatible format
    const transformedOrder = {
      id: order.id,
      display_id: order.id.split('_')[1] || order.id,
      status: order.status || "pending",
      email: order.email,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      canceled_at: null,
      payment_status: order.status === "completed" ? "captured" : "awaiting",
      fulfillment_status: order.status === "shipped" || order.status === "completed" ? "fulfilled" : "not_fulfilled",
      total: order.totals?.total || 0,
      subtotal: order.totals?.subtotal || 0,
      shipping_total: order.totals?.shipping || 0,
      tax_total: order.totals?.tax || 0,
      currency_code: "usd",
      customer: {
        id: `cust_${order.email}`,
        email: order.email,
        first_name: order.shipping?.firstName || "",
        last_name: order.shipping?.lastName || "",
        phone: order.shipping?.phone || "",
        has_account: false
      },
      items: order.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.variant || "",
        quantity: item.quantity,
        unit_price: item.price,
        variant: {
          id: item.id,
          title: item.variant || item.title,
          product: {
            title: item.title,
            thumbnail: null
          }
        },
        subtotal: item.price * item.quantity,
        total: item.price * item.quantity,
        original_total: item.price * item.quantity,
        discount_total: 0,
        tax_total: 0
      })) || [],
      shipping_address: order.shipping ? {
        id: `addr_${order.id}`,
        first_name: order.shipping.firstName || "",
        last_name: order.shipping.lastName || "",
        address_1: order.shipping.address || "",
        address_2: "",
        city: order.shipping.city || "",
        province: order.shipping.state || "",
        postal_code: order.shipping.zipCode || "",
        country_code: order.shipping.country?.toLowerCase() || "us",
        phone: order.shipping.phone || ""
      } : null,
      billing_address: order.billing || order.shipping ? {
        id: `addr_bill_${order.id}`,
        first_name: order.billing?.firstName || order.shipping?.firstName || "",
        last_name: order.billing?.lastName || order.shipping?.lastName || "",
        address_1: order.billing?.address || order.shipping?.address || "",
        address_2: "",
        city: order.billing?.city || order.shipping?.city || "",
        province: order.billing?.state || order.shipping?.state || "",
        postal_code: order.billing?.zipCode || order.shipping?.zipCode || "",
        country_code: (order.billing?.country || order.shipping?.country || "US").toLowerCase(),
        phone: order.shipping?.phone || ""
      } : null,
      shipping_methods: order.shipping ? [{
        id: `ship_${order.id}`,
        name: "Standard Shipping",
        price: order.totals?.shipping || 1000,
        shipping_option: {
          name: "Standard Shipping"
        }
      }] : [],
      payment_collections: [{
        id: `paycol_${order.id}`,
        status: order.paymentIntentId ? "authorized" : "pending",
        amount: order.totals?.total || 0,
        currency_code: "usd",
        payments: order.paymentIntentId ? [{
          id: order.paymentIntentId,
          amount: order.totals?.total || 0,
          currency_code: "usd",
          provider_id: "stripe",
          data: {
            payment_intent_id: order.paymentIntentId
          }
        }] : []
      }],
      sales_channel: {
        id: "fabric-store",
        name: "Fabric Store"
      },
      metadata: {
        source: "fabric-store",
        original_id: order.id,
        payment_intent_id: order.paymentIntentId
      },
      summary: {
        subtotal: order.totals?.subtotal || 0,
        discount_total: 0,
        shipping_total: order.totals?.shipping || 0,
        tax_total: order.totals?.tax || 0,
        total: order.totals?.total || 0,
        paid_total: order.paymentIntentId ? (order.totals?.total || 0) : 0,
        refunded_total: 0
      },
      timeline: order.timeline || [],
      notes: order.notes || [],
      _isFabricOrder: true
    }
    
    res.json({ order: transformedOrder })
  } catch (error) {
    console.error("Error fetching fabric order:", error)
    res.status(500).json({ 
      error: "Failed to fetch fabric order",
      message: error.message 
    })
  }
}