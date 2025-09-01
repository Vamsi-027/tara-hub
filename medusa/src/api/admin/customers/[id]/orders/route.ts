import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

// Helper function to transform a fabric order
function transformFabricOrderForCustomer(order: any) {
  return {
    id: order.id,
    display_id: parseInt(order.id.split('_')[1]) || 9999,
    status: order.status || "pending",
    email: order.email,
    created_at: order.createdAt,
    updated_at: order.updatedAt || order.createdAt,
    payment_status: order.status === "completed" ? "captured" : "awaiting",
    fulfillment_status: order.status === "completed" ? "fulfilled" : "not_fulfilled",
    total: order.totals?.total || 0,
    subtotal: order.totals?.subtotal || 0,
    tax_total: order.totals?.tax || 0,
    shipping_total: order.totals?.shipping || 0,
    currency_code: "usd",
    items: (order.items || []).map((item: any, index: number) => ({
      id: `item_${order.id}_${index}`,
      title: item.title,
      description: item.title,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
      total: item.price * item.quantity,
      thumbnail: null,
      variant: {
        id: item.id,
        title: item.title,
        product: {
          id: `prod_${item.id}`,
          title: item.title
        }
      }
    })),
    shipping_address: order.shipping ? {
      id: `addr_ship_${order.id}`,
      first_name: order.shipping.firstName,
      last_name: order.shipping.lastName,
      address_1: order.shipping.address,
      city: order.shipping.city,
      province: order.shipping.state,
      postal_code: order.shipping.zipCode,
      country_code: "us",
      phone: order.shipping.phone
    } : null,
    metadata: {
      source: "fabric-store",
      original_id: order.id
    }
  }
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.params.id
  
  // Check if this is a fabric customer
  if (customerId?.startsWith('cust_')) {
    try {
      // Get fabric customers from global store
      const fabricCustomers = global.fabricStoreData?.customers || []
      const fabricCustomer = fabricCustomers.find((c: any) => c.id === customerId)
      
      if (fabricCustomer) {
        // Get all orders for this customer
        const fabricOrders = global.fabricStoreData?.orders || []
        const customerOrders = fabricOrders.filter((order: any) => order.email === fabricCustomer.email)
        
        // Transform orders
        const transformedOrders = customerOrders.map((order: any) => 
          transformFabricOrderForCustomer(order)
        )
        
        // Sort by created date (most recent first)
        transformedOrders.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        
        return res.json({ 
          orders: transformedOrders,
          count: transformedOrders.length,
          limit: 20,
          offset: 0
        })
      }
    } catch (error) {
      console.error('Error fetching fabric customer orders:', error)
    }
  }
  
  // If not a fabric customer, return empty orders
  return res.json({ 
    orders: [],
    count: 0,
    limit: 20,
    offset: 0
  })
}