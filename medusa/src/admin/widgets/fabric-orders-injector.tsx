import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"
import { Container } from "@medusajs/ui"

const FabricOrdersInjector = () => {
  useEffect(() => {
    // Function to inject fabric orders into the orders table
    const injectFabricOrders = async () => {
      try {
        // Check if we're on the orders page
        if (!window.location.pathname.includes("/orders")) return
        
        // Fetch fabric orders from our custom endpoint
        const response = await fetch("/admin/fabric-orders")
        const data = await response.json()
        
        // Log for debugging
        console.log("Fabric orders fetched:", data.orders?.length || 0)
        
        // The Medusa admin will handle displaying orders through its own components
        // This widget just ensures the data is available
      } catch (error) {
        console.error("Failed to inject fabric orders:", error)
      }
    }
    
    // Run injection when component mounts and on navigation
    injectFabricOrders()
    
    // Listen for route changes
    const handleRouteChange = () => {
      setTimeout(injectFabricOrders, 500)
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