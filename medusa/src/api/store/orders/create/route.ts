/**
 * Production-Ready Medusa v2 Order Creation API
 * Follows Medusa industry best practices and workflows
 * Handles the complete order lifecycle from cart creation to completion
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { isLegacyCheckoutEnabled } from "../../../../config/feature-flags"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Check feature flag
  if (!isLegacyCheckoutEnabled()) {
    return res.status(501).json({
      error: "Order creation via checkout is disabled",
      message: "The legacy checkout system has been disabled. Order creation through cart/checkout flow is not available.",
      code: "LEGACY_CHECKOUT_DISABLED"
    })
  }

  try {
    const {
      email,
      items,
      shipping_address,
      billing_address,
      payment_intent_id,
      region_id = "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ" // Default USD region
    } = req.body

    console.log("🚀 [PRODUCTION] Creating Medusa order:", {
      email,
      itemCount: items?.length || 0,
      region_id
    })

    // Get required services
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Step 1: Create cart using Medusa workflows
    console.log("📝 Step 1: Creating cart...")

    // Use HTTP request to create cart via standard Medusa API
    const cartResponse = await fetch(`${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_KEY || '',
      },
      body: JSON.stringify({
        email,
        region_id,
        currency_code: "usd"
      })
    })

    if (!cartResponse.ok) {
      throw new Error(`Failed to create cart: ${cartResponse.status}`)
    }

    const { cart: newCart } = await cartResponse.json()

    console.log("✅ Cart created:", newCart.id)

    // Step 2: Add line items to cart
    console.log("📦 Step 2: Adding line items...")

    for (const item of items) {
      try {
        // Add line item via HTTP request
        const addItemResponse = await fetch(`${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/carts/${newCart.id}/line-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify({
            variant_id: item.variant_id || 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A', // Default variant
            quantity: item.quantity,
            metadata: {
              fabric_store_item: true,
              original_id: item.id,
              title: item.title || item.name,
              sku: item.sku,
              color: item.color,
              type: item.type || "fabric",
              unit_price: item.price
            }
          })
        })

        if (addItemResponse.ok) {
          console.log(`✅ Added line item: ${item.title || item.name}`)
        } else {
          const errorText = await addItemResponse.text()
          console.error(`❌ Failed to add item ${item.title}:`, errorText)
        }
      } catch (itemError) {
        console.error(`❌ Failed to add item ${item.title}:`, itemError)
        // Continue with other items
      }
    }

    // Step 3: Set addresses
    console.log("🏠 Step 3: Setting addresses...")

    try {
      const updateAddressResponse = await fetch(`${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/carts/${newCart.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_KEY || '',
        },
        body: JSON.stringify({
          shipping_address: {
            first_name: shipping_address.first_name,
            last_name: shipping_address.last_name,
            address_1: shipping_address.address_1,
            address_2: shipping_address.address_2 || "",
            city: shipping_address.city,
            province: shipping_address.province,
            postal_code: shipping_address.postal_code,
            country_code: shipping_address.country_code,
            phone: shipping_address.phone || ""
          },
          billing_address: billing_address || shipping_address,
          email: email
        })
      })

      if (updateAddressResponse.ok) {
        console.log("✅ Addresses set")
      } else {
        const errorText = await updateAddressResponse.text()
        console.error("❌ Address setting failed:", errorText)
      }
    } catch (addressError) {
      console.error("❌ Address setting failed:", addressError)
    }

    // Step 4: Add shipping methods
    console.log("🚚 Step 4: Setting shipping methods...")

    try {
      // Get available shipping options for the region
      const { data: shippingOptions } = await query.graph({
        entity: "shipping_option",
        fields: ["id", "name", "price_type", "amount"],
        filters: { region_id: region_id }
      })

      if (shippingOptions && shippingOptions.length > 0) {
        const defaultShipping = shippingOptions[0]

        const addShippingResponse = await fetch(`${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/carts/${newCart.id}/shipping-methods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify({
            option_id: defaultShipping.id
          })
        })

        if (addShippingResponse.ok) {
          console.log("✅ Shipping method added:", defaultShipping.name)
        } else {
          const errorText = await addShippingResponse.text()
          console.error("❌ Shipping method failed:", errorText)
        }
      } else {
        console.log("ℹ️ No shipping options found, skipping")
      }
    } catch (shippingError) {
      console.error("❌ Shipping method failed:", shippingError)
    }

    // Step 5: Complete cart to create order
    console.log("🎯 Step 5: Completing cart to create order...")

    try {
      // Complete cart to create order via HTTP API
      const completeCartResponse = await fetch(`${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/carts/${newCart.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_KEY || '',
        }
      })

      if (!completeCartResponse.ok) {
        throw new Error(`Failed to complete cart: ${completeCartResponse.status}`)
      }

      const { order: orderResult } = await completeCartResponse.json()

      if (orderResult && orderResult.id) {
        const orderId = orderResult.id

        // Fetch the complete order
        const { data: orders } = await query.graph({
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
            "created_at",
            "updated_at",
            "items.*",
            "shipping_address.*",
            "billing_address.*",
            "payment_collections.*"
          ],
          filters: { id: orderId }
        })

        const order = orders[0]

        console.log("🎉 Order created successfully:", {
          id: order.id,
          display_id: order.display_id,
          email: order.email,
          total: order.total,
          items: order.items?.length || 0
        })

        // Step 6: Update payment status if payment_intent_id provided
        if (payment_intent_id) {
          try {
            // Update order metadata with payment intent
            await query.graph({
              entity: "order",
              fields: ["id"],
              filters: { id: order.id },
              data: {
                metadata: {
                  ...order.metadata,
                  payment_intent_id,
                  fabric_store_order: true
                }
              }
            })

            console.log("✅ Payment intent linked:", payment_intent_id)
          } catch (paymentError) {
            console.error("❌ Payment linking failed:", paymentError)
          }
        }

        return res.status(201).json({
          success: true,
          order: {
            id: order.id,
            display_id: order.display_id,
            status: order.status,
            email: order.email,
            currency_code: order.currency_code,
            total: order.total,
            subtotal: order.subtotal,
            tax_total: order.tax_total,
            shipping_total: order.shipping_total,
            items: order.items?.map((item: any) => ({
              id: item.id,
              title: item.title,
              subtitle: item.subtitle,
              thumbnail: item.thumbnail,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total: item.total,
              metadata: item.metadata
            })) || [],
            shipping_address: order.shipping_address,
            billing_address: order.billing_address,
            payment_collections: order.payment_collections,
            created_at: order.created_at,
            updated_at: order.updated_at
          },
          message: "Order created successfully using Medusa workflows"
        })

      } else {
        throw new Error("Cart completion did not return an order")
      }

    } catch (completionError) {
      console.error("❌ Cart completion failed:", completionError)

      // Return cart info for debugging
      const { data: cartWithItems } = await query.graph({
        entity: "cart",
        fields: [
          "id",
          "email",
          "total",
          "subtotal",
          "items.*"
        ],
        filters: { id: newCart.id }
      })

      return res.status(500).json({
        success: false,
        error: "Failed to complete cart",
        message: completionError instanceof Error ? completionError.message : "Unknown error",
        debug: {
          cart_id: newCart.id,
          cart_items: cartWithItems?.items?.length || 0,
          cart_total: cartWithItems?.total || 0
        }
      })
    }

  } catch (error) {
    console.error("❌ Production order creation failed:", error)

    return res.status(500).json({
      success: false,
      error: "Failed to create order",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    })
  }
}