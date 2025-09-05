import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const FabricOrdersInjector = () => {
  useEffect(() => {
    const syncFabricOrders = async () => {
      try {
        const response = await fetch("/admin/fabric-orders")
        const data = await response.json()

        await fetch("/admin/sync-fabric-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orders: data.orders || [] })
        })
      } catch (error) {
        console.error("Failed to sync fabric orders:", error)
      }
    }

    syncFabricOrders()
    const handleRouteChange = () => setTimeout(syncFabricOrders, 500)
    window.addEventListener("popstate", handleRouteChange)
    return () => window.removeEventListener("popstate", handleRouteChange)
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: "order.list.before"
})

export default FabricOrdersInjector
