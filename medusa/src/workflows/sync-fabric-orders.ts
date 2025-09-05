import { createWorkflow, WorkflowData, createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

type FabricOrderInput = {
  syncAll?: boolean
}

type SyncResult = {
  success: boolean
  syncedCount?: number
  error?: string
}

const syncOrdersStep = createStep(
  "sync-orders-step", 
  async (input: FabricOrderInput): Promise<StepResponse<SyncResult, undefined>> => {
    try {
      // Fetch orders from fabric store
      const response = await fetch("http://localhost:3006/api/orders")
      const data = await response.json()
      
      const fabricOrders = data.orders || []
      
      // Transform fabric orders to Medusa order format
      const transformedOrders = fabricOrders.map((order: any) => ({
        // Map fabric order to Medusa order structure
        external_id: order.id,
        email: order.email,
        currency_code: "usd",
        shipping_address: order.shipping ? {
          first_name: order.shipping.firstName,
          last_name: order.shipping.lastName,
          address_1: order.shipping.address,
          city: order.shipping.city,
          province: order.shipping.state,
          postal_code: order.shipping.zipCode,
          country_code: "us",
          phone: order.shipping.phone
        } : undefined,
        items: order.items?.map((item: any) => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price
        })) || [],
        metadata: {
          source: "fabric-store",
          original_id: order.id,
          payment_intent_id: order.paymentIntentId,
          status: order.status
        }
      }))
      
      console.log(`Synced ${transformedOrders.length} fabric orders`)
      
      return new StepResponse({
        success: true,
        syncedCount: transformedOrders.length
      })
    } catch (error: any) {
      console.error("Failed to sync fabric orders:", error)
      return new StepResponse({
        success: false,
        error: error.message || "Unknown error"
      })
    }
  }
)

export const syncFabricOrdersWorkflow = createWorkflow(
  "sync-fabric-orders",
  (input: WorkflowData<FabricOrderInput>) => {
    const result = syncOrdersStep(input)
    return { syncResult: result }
  }
)

export default syncFabricOrdersWorkflow