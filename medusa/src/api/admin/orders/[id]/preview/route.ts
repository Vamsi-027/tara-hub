import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const orderId = req.params.id
  
  // Check if this is a fabric order
  if (orderId?.startsWith('order_')) {
    try {
      // Get fabric orders from global store or fetch directly
      const fabricOrders = global.fabricStoreData?.orders || []
      const fabricOrder = fabricOrders.find((o: any) => o.id === orderId)
      
      if (!fabricOrder) {
        // Try fetching directly from fabric store
        const response = await fetch('http://localhost:3006/api/orders')
        const data = await response.json()
        const order = data.orders?.find((o: any) => o.id === orderId)
        
        if (order) {
          // Return preview data
          return res.json({
            order: {
              id: order.id,
              status: order.status,
              email: order.email,
              created_at: order.createdAt,
              items: order.items || [],
              total: order.totals?.total || 0,
              currency_code: "usd"
            }
          })
        }
      } else {
        // Return preview data from cached order
        return res.json({
          order: {
            id: fabricOrder.id,
            status: fabricOrder.status,
            email: fabricOrder.email,
            created_at: fabricOrder.createdAt,
            items: fabricOrder.items || [],
            total: fabricOrder.totals?.total || 0,
            currency_code: "usd"
          }
        })
      }
    } catch (error) {
      console.error('Error fetching fabric order preview:', error)
    }
  }
  
  // If not found, return 404
  return res.status(404).json({ 
    message: `Order with id: ${orderId} was not found`,
    type: "not_found" 
  })
}