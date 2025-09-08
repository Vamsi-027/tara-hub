import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { orders, customers, stats } = req.body

    // Store in global context for middleware access
    if (typeof global !== 'undefined') {
      global.fabricStoreData = {
        orders: orders || [],
        customers: customers || [],
        stats: stats || {},
        lastSync: new Date().toISOString()
      }
    }

    console.log(`Fabric data synced: ${orders?.length || 0} orders, ${customers?.length || 0} customers`)

    res.json({
      success: true,
      ordersCount: orders?.length || 0,
      customersCount: customers?.length || 0,
      syncedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error syncing fabric data:", error)
    res.status(500).json({ 
      error: "Failed to sync fabric data",
      message: error.message 
    })
  }
}