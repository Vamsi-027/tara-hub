import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"
import { Container } from "@medusajs/ui"

const FabricOrdersInjector = () => {
  useEffect(() => {
    // Function to sync fabric orders to global context
    const syncFabricOrders = async () => {
      try {
        // Fetch fabric orders from our custom endpoint
        const response = await fetch("/admin/fabric-orders")
        const data = await response.json()
        
        // Send data to backend via a sync endpoint
        try {
          await fetch("/admin/sync-fabric-orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              orders: data.orders || [],
              customers: [],
              stats: {}
            })
          })
          
          console.log("Fabric orders synced to backend:", data.orders?.length || 0)
        } catch (syncError) {
          console.error("Failed to sync to backend:", syncError)
        }
        
      } catch (error) {
        console.error("Failed to fetch fabric orders:", error)
      }
    }
    
    // Run sync when component mounts and on navigation
    syncFabricOrders()
    
    // Listen for route changes
    const handleRouteChange = () => {
      setTimeout(syncFabricOrders, 500)
    }
    
    window.addEventListener("popstate", handleRouteChange)
    
    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [])
  
  // This widget doesn't render anything visible
  return null
}

export const config = defineWidgetConfig({
  zone: "order.list.before"
})

export default FabricOrdersInjector