import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function syncFabricDataJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  
  try {
    logger.info("Starting fabric store data sync...")
    
    // Sync orders
    const ordersResponse = await fetch("http://localhost:3006/api/orders")
    const ordersData = await ordersResponse.json()
    const fabricOrders = ordersData.orders || []
    
    // Sync customers  
    const customersResponse = await fetch("http://localhost:3006/api/customers")
    const customersData = await customersResponse.json()
    const fabricCustomers = customersData.customers || []
    
    logger.info(`Fabric sync completed: ${fabricOrders.length} orders, ${fabricCustomers.length} customers`)
    
    // Store in cache or database for access by admin UI
    if (typeof global !== 'undefined') {
      global.fabricStoreData = {
        orders: fabricOrders,
        customers: fabricCustomers,
        lastSync: new Date().toISOString()
      }
    }
    
  } catch (error) {
    logger.error("Failed to sync fabric data:", error)
  }
}

export const config = {
  name: "sync-fabric-data",
  schedule: "*/5 * * * *", // Run every 5 minutes
}