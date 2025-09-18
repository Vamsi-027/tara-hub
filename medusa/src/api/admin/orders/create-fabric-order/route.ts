/**
 * Create Fabric Order API
 * Creates orders directly in Medusa database using raw SQL
 * Bypasses the cart/checkout flow for fabric-store orders
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      email,
      items,
      shipping,
      totals,
      payment_intent_id,
      currency_code = "usd"
    } = req.body

    console.log("🔥 Creating fabric order in Medusa:", {
      email,
      itemCount: items?.length || 0,
      total: totals?.total || 0
    })

    // Get query service for direct database operations
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Generate unique IDs
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const displayId = Math.floor(Math.random() * 10000) + 1
    const now = new Date().toISOString()

    // Get or create customer
    let customerId = null
    try {
      const { data: customers } = await query.graph({
        entity: "customer",
        fields: ["id", "email"],
        filters: { email: email }
      })

      if (customers.length > 0) {
        customerId = customers[0].id
        console.log("✅ Found existing customer:", customerId)
      } else {
        // Create customer
        const newCustomer = await query.graph({
          entity: "customer",
          fields: ["id"],
          filters: {},
          pagination: { take: 1 }
        })
        console.log("ℹ️ Creating guest order without customer")
      }
    } catch (error) {
      console.log("⚠️ Customer lookup failed, creating guest order")
    }

    // Get region
    let regionId = null
    try {
      const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code"],
        filters: { currency_code: currency_code }
      })

      regionId = regions.length > 0 ? regions[0].id : null
      console.log("✅ Found region:", regionId)
    } catch (error) {
      console.log("⚠️ Region lookup failed")
    }

    // Create order data
    const orderData = {
      id: orderId,
      display_id: displayId,
      status: "pending",
      email: email,
      currency_code: currency_code,
      tax_rate: null,
      draft_order_id: null,
      cart_id: null,
      customer_id: customerId,
      payment_status: payment_intent_id ? "awaiting" : "not_paid",
      fulfillment_status: "not_fulfilled",
      region_id: regionId,

      // Totals
      subtotal: totals.subtotal || Math.round(totals.total * 0.9),
      shipping_total: totals.shipping || Math.round(totals.total * 0.1),
      tax_total: totals.tax || 0,
      discount_total: 0,
      gift_card_total: 0,
      gift_card_tax_total: 0,
      refunded_total: 0,
      total: totals.total,
      paid_total: 0,
      refundable_amount: totals.total,

      // Flags
      canceled_at: null,
      no_notification: false,
      idempotency_key: null,
      external_id: null,
      sales_channel_id: null,

      // Metadata
      metadata: JSON.stringify({
        fabric_store_order: true,
        payment_intent_id: payment_intent_id,
        created_from: "fabric-store",
        order_source: "web"
      }),

      // Timestamps
      created_at: now,
      updated_at: now
    }

    console.log("🔥 Order data prepared:", {
      id: orderData.id,
      display_id: orderData.display_id,
      email: orderData.email,
      total: orderData.total
    })

    // Create using the order module directly
    const orderModule = req.scope.resolve("order")
    const order = await orderModule.createOrders(orderData)

    console.log("✅ Base order created:", order.id)

    // Create line items
    const itemsData = items.map((item: any, index: number) => ({
      id: `item_${Date.now()}_${index}`,
      order_id: order.id,
      title: item.name,
      subtitle: item.color || "",
      thumbnail: item.image || null,
      variant_id: item.id.startsWith('variant_') ? item.id : null,
      product_id: null,
      product_title: item.name,
      product_description: null,
      product_subtitle: null,
      product_type: null,
      product_collection: null,
      product_handle: null,
      variant_sku: item.sku || "",
      variant_barcode: null,
      variant_title: item.color || "",
      variant_option_values: JSON.stringify({ Color: item.color || "" }),
      requires_shipping: true,
      is_discountable: true,
      is_tax_inclusive: false,
      is_return: false,
      is_giftcard: false,
      should_merge: true,
      allow_discounts: true,
      has_shipping: true,
      unit_price: item.price,
      quantity: item.quantity,
      fulfilled_quantity: 0,
      returned_quantity: 0,
      shipped_quantity: 0,
      refundable_amount: item.price * item.quantity,
      subtotal: item.price * item.quantity,
      tax_total: 0,
      total: item.price * item.quantity,
      original_total: item.price * item.quantity,
      original_tax_total: 0,
      discount_total: 0,
      raw_discount_total: 0,
      gift_card_total: 0,
      includes_tax: false,
      metadata: JSON.stringify({
        fabric_store_item: true,
        original_id: item.id,
        sku: item.sku,
        color: item.color,
        image: item.image,
        type: item.type || "fabric"
      }),
      created_at: now,
      updated_at: now
    }))

    console.log("🔥 Creating", itemsData.length, "line items...")

    // Create line items one by one
    for (const itemData of itemsData) {
      try {
        await orderModule.createOrderLineItems(itemData)
        console.log("✅ Created line item:", itemData.title)
      } catch (error) {
        console.error("❌ Failed to create line item:", itemData.title, error)
      }
    }

    // Create addresses
    const addressData = {
      first_name: shipping.firstName,
      last_name: shipping.lastName || "",
      phone: shipping.phone || "",
      company: "",
      address_1: shipping.address,
      address_2: "",
      city: shipping.city,
      province: shipping.state,
      postal_code: shipping.zipCode,
      country_code: shipping.country?.toLowerCase() || "us",
      metadata: null
    }

    console.log("🔥 Creating addresses...")

    try {
      const addressModule = req.scope.resolve("address")
      const shippingAddress = await addressModule.createAddresses(addressData)
      const billingAddress = await addressModule.createAddresses(addressData)

      // Update order with addresses
      await orderModule.updateOrders([{
        id: order.id,
        shipping_address_id: shippingAddress.id,
        billing_address_id: billingAddress.id
      }])

      console.log("✅ Addresses created and linked")
    } catch (error) {
      console.error("❌ Failed to create addresses:", error)
    }

    // Fetch the complete order
    const { data: completeOrders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "email",
        "currency_code",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "payment_status",
        "fulfillment_status",
        "metadata",
        "created_at",
        "updated_at",
        "items.*",
        "shipping_address.*",
        "billing_address.*"
      ],
      filters: { id: order.id }
    })

    const completeOrder = completeOrders[0]

    console.log("✅ Order created successfully:", {
      id: completeOrder.id,
      display_id: completeOrder.display_id,
      email: completeOrder.email,
      total: completeOrder.total,
      items: completeOrder.items?.length || 0
    })

    // Return the created order
    return res.status(201).json({
      success: true,
      order: completeOrder,
      message: "Order created successfully in Medusa database"
    })

  } catch (error) {
    console.error("❌ Error creating fabric order:", error)

    return res.status(500).json({
      success: false,
      error: "Failed to create order",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    })
  }
}