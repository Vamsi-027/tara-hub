import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function fabricSyncLoader(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  logger.info("Initializing fabric store data sync...")
  
  // Function to sync fabric data
  const syncFabricData = async () => {
    try {
      // Fetch and sync orders
      const ordersResponse = await fetch("http://localhost:3006/api/orders")
      const ordersData = await ordersResponse.json()
      
      // Fetch and sync customers
      const customersResponse = await fetch("http://localhost:3006/api/customers")
      const customersData = await customersResponse.json()
      
      // Store in global context for access by API routes
      if (typeof global !== 'undefined') {
        global.fabricStoreData = {
          orders: ordersData.orders || [],
          customers: customersData.customers || [],
          stats: {
            orders: ordersData.stats || {},
            customers: customersData.stats || {}
          },
          lastSync: new Date().toISOString()
        }
      }
      
      logger.info(`Fabric data synced: ${ordersData.orders?.length || 0} orders, ${customersData.customers?.length || 0} customers`)
    } catch (error) {
      logger.error("Failed to sync fabric data:", error)
    }
  }
  
  // Initial sync
  await syncFabricData()
  
  // Set up periodic sync every 2 minutes
  setInterval(syncFabricData, 2 * 60 * 1000)
  
  logger.info("Fabric store sync loader initialized")
}