import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function fabricSyncLoader(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  logger.info("Initializing fabric store data sync...")
  
  // Function to sync fabric data
  const syncFabricData = async () => {
    try {
      // Fetch and sync orders from database
      const ordersResponse = await fetch("http://localhost:9000/admin/fabric-orders")
      const ordersData = await ordersResponse.json()
      
      // Try to fetch customers from frontend API (fallback)
      let customersData = { customers: [], stats: {} }
      try {
        const customersResponse = await fetch("http://localhost:3006/api/customers")
        customersData = await customersResponse.json()
      } catch (customerError) {
        logger.warn("Failed to sync customers from frontend, using empty data:", customerError.message)
      }
      
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
      
      logger.info(`Fabric sync completed: ${ordersData.orders?.length || 0} orders, ${customersData.customers?.length || 0} customers`)
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