import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework"

export async function fabricOrderSync(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Only sync for GET requests to orders endpoint
    if (req.method === "GET" && req.path.includes("/admin/orders")) {
      // Fetch fabric store orders
      const fabricResponse = await fetch("http://localhost:3006/api/orders")
      const fabricData = await fabricResponse.json()
      
      // Store fabric orders in request context for merging
      req.fabricOrders = fabricData.orders || []
    }
  } catch (error) {
    console.error("Failed to sync fabric orders:", error)
  }
  
  next()
}

export async function fabricCustomerSync(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Only sync for GET requests to customers endpoint
    if (req.method === "GET" && req.path.includes("/admin/customers")) {
      // Fetch fabric store customers
      const fabricResponse = await fetch("http://localhost:3006/api/customers")
      const fabricData = await fabricResponse.json()
      
      // Store fabric customers in request context for merging
      req.fabricCustomers = fabricData.customers || []
    }
  } catch (error) {
    console.error("Failed to sync fabric customers:", error)
  }
  
  next()
}