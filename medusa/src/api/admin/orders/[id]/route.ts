import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const orderId = req.params.id
  
  // Check if this is a fabric order
  if (orderId?.startsWith('order_')) {
    try {
      // Fetch the specific fabric order
      const response = await fetch('http://localhost:3006/api/orders')
      const data = await response.json()
      const fabricOrder = data.orders?.find((o: any) => o.id === orderId)
      
      if (fabricOrder) {
        // Transform to full Medusa order format
        const transformedOrder = {
          id: fabricOrder.id,
          display_id: parseInt(fabricOrder.id.split('_')[1]) || 9999,
          status: fabricOrder.status || "pending",
          email: fabricOrder.email,
          created_at: fabricOrder.createdAt,
          updated_at: fabricOrder.updatedAt || fabricOrder.createdAt,
          payment_status: fabricOrder.status === "completed" ? "captured" : "awaiting",
          fulfillment_status: fabricOrder.status === "completed" ? "fulfilled" : "not_fulfilled",
          total: fabricOrder.totals?.total || 0,
          subtotal: fabricOrder.totals?.subtotal || 0,
          tax_total: fabricOrder.totals?.tax || 0,
          shipping_total: fabricOrder.totals?.shipping || 0,
          discount_total: 0,
          gift_card_total: 0,
          currency_code: "usd",
          customer: {
            id: `cust_${fabricOrder.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: fabricOrder.email,
            first_name: fabricOrder.shipping?.firstName,
            last_name: fabricOrder.shipping?.lastName,
            phone: fabricOrder.shipping?.phone,
            has_account: false
          },
          billing_address: fabricOrder.shipping ? {
            id: `addr_bill_${fabricOrder.id}`,
            first_name: fabricOrder.shipping.firstName,
            last_name: fabricOrder.shipping.lastName,
            address_1: fabricOrder.shipping.address,
            city: fabricOrder.shipping.city,
            province: fabricOrder.shipping.state,
            postal_code: fabricOrder.shipping.zipCode,
            country_code: "us",
            phone: fabricOrder.shipping.phone
          } : null,
          shipping_address: fabricOrder.shipping ? {
            id: `addr_ship_${fabricOrder.id}`,
            first_name: fabricOrder.shipping.firstName,
            last_name: fabricOrder.shipping.lastName,
            address_1: fabricOrder.shipping.address,
            city: fabricOrder.shipping.city,
            province: fabricOrder.shipping.state,
            postal_code: fabricOrder.shipping.zipCode,
            country_code: "us",
            phone: fabricOrder.shipping.phone
          } : null,
          region: {
            id: "reg_fabric",
            name: "United States",
            currency_code: "usd",
            tax_rate: 0
          },
          sales_channel: {
            name: "Fabric Store",
            id: "sc_fabric_store"
          },
          shipping_methods: [{
            id: `sm_${fabricOrder.id}`,
            shipping_option: {
              name: "Standard Shipping",
              id: "so_standard"
            },
            price: fabricOrder.totals?.shipping || 1000,
            data: {},
            tax_lines: []
          }],
          payments: [{
            id: `pay_${fabricOrder.id}`,
            amount: fabricOrder.totals?.total || 0,
            currency_code: "usd",
            provider_id: "stripe",
            data: {
              payment_intent_id: fabricOrder.paymentIntentId
            },
            captured_at: fabricOrder.status === "completed" ? fabricOrder.createdAt : null,
            created_at: fabricOrder.createdAt
          }],
          items: (fabricOrder.items || []).map((item: any, index: number) => ({
            id: `item_${fabricOrder.id}_${index}`,
            title: item.title,
            description: item.title,
            thumbnail: null,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity,
            total: item.price * item.quantity,
            original_total: item.price * item.quantity,
            original_tax_total: 0,
            tax_total: 0,
            discount_total: 0,
            raw_discount_total: 0,
            variant: {
              id: item.id,
              title: item.title,
              product_id: `prod_${item.id}`,
              product: {
                id: `prod_${item.id}`,
                title: item.title,
                thumbnail: null
              },
              sku: item.id,
              barcode: null,
              ean: null,
              upc: null,
              inventory_quantity: 100,
              manage_inventory: false
            },
            tax_lines: [],
            adjustments: [],
            refundable: item.price * item.quantity,
            fulfilled_quantity: fabricOrder.status === "completed" ? item.quantity : 0,
            returned_quantity: 0,
            shipped_quantity: fabricOrder.status === "completed" ? item.quantity : 0
          })),
          refunds: [],
          fulfillments: fabricOrder.status === "completed" ? [{
            id: `ful_${fabricOrder.id}`,
            items: (fabricOrder.items || []).map((item: any, index: number) => ({
              item_id: `item_${fabricOrder.id}_${index}`,
              quantity: item.quantity
            })),
            shipped_at: fabricOrder.updatedAt || fabricOrder.createdAt,
            created_at: fabricOrder.createdAt
          }] : [],
          returns: [],
          claims: [],
          swaps: [],
          draft_order_id: null,
          no_notification: false,
          metadata: {
            source: "fabric-store",
            original_id: fabricOrder.id
          }
        }
        
        return res.json({ order: transformedOrder })
      }
    } catch (error) {
      console.error('Error fetching fabric order:', error)
    }
  }
  
  // If not a fabric order, return 404 to let Medusa handle it
  return res.status(404).json({ message: "Order not found" })
}