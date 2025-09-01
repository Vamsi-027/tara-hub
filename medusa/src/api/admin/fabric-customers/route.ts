import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    // Fetch fabric store customers
    const fabricResponse = await fetch("http://localhost:3006/api/customers")
    const fabricData = await fabricResponse.json()
    
    const fabricCustomers = (fabricData.customers || []).map((customer: any) => ({
      id: customer.id,
      email: customer.email,
      first_name: customer.firstName || customer.name?.split(' ')[0] || '',
      last_name: customer.lastName || customer.name?.split(' ')[1] || '',
      phone: customer.phone,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt || customer.createdAt,
      has_account: true,
      groups: [],
      addresses: customer.address ? [{
        id: `addr_${customer.id}`,
        first_name: customer.firstName,
        last_name: customer.lastName,
        address_1: customer.address.address,
        city: customer.address.city,
        province: customer.address.state,
        postal_code: customer.address.zipCode,
        country_code: customer.address.country?.toLowerCase() || 'us',
        phone: customer.phone
      }] : [],
      metadata: {
        source: "fabric-store",
        total_orders: customer.totalOrders,
        total_spent: customer.totalSpent,
        last_order_date: customer.lastOrderDate,
        status: customer.status
      },
      _isFabricCustomer: true // Flag to identify fabric customers
    }))
    
    res.json({
      customers: fabricCustomers,
      count: fabricCustomers.length,
      offset: 0,
      limit: 100
    })
  } catch (error) {
    console.error("Error fetching fabric customers:", error)
    res.status(500).json({ 
      error: "Failed to fetch fabric customers",
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
    const response = await fetch("http://localhost:3006/api/customers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body)
    })
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("Error creating fabric customer:", error)
    res.status(500).json({ 
      error: "Failed to create fabric customer",
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
    const response = await fetch("http://localhost:3006/api/customers", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body)
    })
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error("Error updating fabric customer:", error)
    res.status(500).json({ 
      error: "Failed to update fabric customer",
      message: error.message 
    })
  }
}