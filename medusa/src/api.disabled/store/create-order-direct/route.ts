/**
 * Direct Order Creation API
 * Creates orders directly in the database using SQL
 * Ensures all order details including line items are properly stored
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { isLegacyCheckoutEnabled } from "../../../config/feature-flags"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Check feature flag
  if (!isLegacyCheckoutEnabled()) {
    return res.status(501).json({
      error: "Direct order creation is disabled",
      message: "The legacy checkout system has been disabled. Direct order creation is not available.",
      code: "LEGACY_CHECKOUT_DISABLED"
    })
  }

  try {
    const {
      email,
      items,
      shipping,
      totals,
      payment_intent_id,
      currency_code = "usd"
    } = req.body

    console.log("🔥 Creating direct order:", {
      email,
      itemCount: items?.length || 0,
      total: totals?.total || 0
    })

    // Get database connection
    const manager = req.scope.resolve("manager")

    // Generate unique IDs
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const displayId = Math.floor(Math.random() * 90000) + 10000
    const now = new Date()

    // Begin transaction
    return await manager.transaction(async (transactionalEntityManager: any) => {
      // Create the order record
      const orderData = {
        id: orderId,
        display_id: displayId,
        status: "pending",
        email: email,
        currency_code: currency_code,
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
        payment_status: payment_intent_id ? "awaiting" : "not_paid",
        fulfillment_status: "not_fulfilled",
        canceled_at: null,
        no_notification: false,
        metadata: {
          fabric_store_order: true,
          payment_intent_id: payment_intent_id,
          created_from: "fabric-store"
        },
        created_at: now,
        updated_at: now
      }

      // Insert order using raw SQL to ensure compatibility
      await transactionalEntityManager.query(`
        INSERT INTO "order" (
          id, display_id, status, email, currency_code,
          subtotal, shipping_total, tax_total, discount_total,
          gift_card_total, gift_card_tax_total, refunded_total,
          total, paid_total, refundable_amount,
          payment_status, fulfillment_status, canceled_at,
          no_notification, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
      `, [
        orderData.id,
        orderData.display_id,
        orderData.status,
        orderData.email,
        orderData.currency_code,
        orderData.subtotal,
        orderData.shipping_total,
        orderData.tax_total,
        orderData.discount_total,
        orderData.gift_card_total,
        orderData.gift_card_tax_total,
        orderData.refunded_total,
        orderData.total,
        orderData.paid_total,
        orderData.refundable_amount,
        orderData.payment_status,
        orderData.fulfillment_status,
        orderData.canceled_at,
        orderData.no_notification,
        JSON.stringify(orderData.metadata),
        orderData.created_at,
        orderData.updated_at
      ])

      console.log("✅ Order record created:", orderId)

      // Create line items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const itemId = `item_${Date.now()}_${i}`

        const lineItemData = {
          id: itemId,
          order_id: orderId,
          title: item.name,
          subtitle: item.color || "",
          thumbnail: item.image || null,
          variant_id: item.id.startsWith('variant_') ? item.id : null,
          product_id: null,
          product_title: item.name,
          product_description: null,
          product_subtitle: null,
          product_type: "fabric",
          product_collection: null,
          product_handle: null,
          variant_sku: item.sku || "",
          variant_barcode: null,
          variant_title: item.color || "",
          variant_option_values: { Color: item.color || "" },
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
          metadata: {
            fabric_store_item: true,
            original_id: item.id,
            sku: item.sku,
            color: item.color,
            image: item.image,
            type: item.type || "fabric"
          },
          created_at: now,
          updated_at: now
        }

        // Insert line item using raw SQL
        await transactionalEntityManager.query(`
          INSERT INTO "line_item" (
            id, order_id, title, subtitle, thumbnail,
            variant_id, product_id, product_title, product_description,
            product_subtitle, product_type, product_collection,
            product_handle, variant_sku, variant_barcode,
            variant_title, variant_option_values, requires_shipping,
            is_discountable, is_tax_inclusive, is_return, is_giftcard,
            should_merge, allow_discounts, has_shipping, unit_price,
            quantity, fulfilled_quantity, returned_quantity,
            shipped_quantity, refundable_amount, subtotal, tax_total,
            total, original_total, original_tax_total, discount_total,
            raw_discount_total, gift_card_total, includes_tax,
            metadata, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
            $41, $42, $43
          )
        `, [
          lineItemData.id,
          lineItemData.order_id,
          lineItemData.title,
          lineItemData.subtitle,
          lineItemData.thumbnail,
          lineItemData.variant_id,
          lineItemData.product_id,
          lineItemData.product_title,
          lineItemData.product_description,
          lineItemData.product_subtitle,
          lineItemData.product_type,
          lineItemData.product_collection,
          lineItemData.product_handle,
          lineItemData.variant_sku,
          lineItemData.variant_barcode,
          lineItemData.variant_title,
          JSON.stringify(lineItemData.variant_option_values),
          lineItemData.requires_shipping,
          lineItemData.is_discountable,
          lineItemData.is_tax_inclusive,
          lineItemData.is_return,
          lineItemData.is_giftcard,
          lineItemData.should_merge,
          lineItemData.allow_discounts,
          lineItemData.has_shipping,
          lineItemData.unit_price,
          lineItemData.quantity,
          lineItemData.fulfilled_quantity,
          lineItemData.returned_quantity,
          lineItemData.shipped_quantity,
          lineItemData.refundable_amount,
          lineItemData.subtotal,
          lineItemData.tax_total,
          lineItemData.total,
          lineItemData.original_total,
          lineItemData.original_tax_total,
          lineItemData.discount_total,
          lineItemData.raw_discount_total,
          lineItemData.gift_card_total,
          lineItemData.includes_tax,
          JSON.stringify(lineItemData.metadata),
          lineItemData.created_at,
          lineItemData.updated_at
        ])

        console.log(`✅ Line item ${i + 1} created:`, item.name)
      }

      // Create shipping address
      const addressId = `addr_${Date.now()}`
      const addressData = {
        id: addressId,
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
        metadata: null,
        created_at: now,
        updated_at: now
      }

      await transactionalEntityManager.query(`
        INSERT INTO "address" (
          id, first_name, last_name, phone, company,
          address_1, address_2, city, province, postal_code,
          country_code, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
      `, [
        addressData.id,
        addressData.first_name,
        addressData.last_name,
        addressData.phone,
        addressData.company,
        addressData.address_1,
        addressData.address_2,
        addressData.city,
        addressData.province,
        addressData.postal_code,
        addressData.country_code,
        addressData.metadata,
        addressData.created_at,
        addressData.updated_at
      ])

      // Update order with shipping address
      await transactionalEntityManager.query(`
        UPDATE "order"
        SET shipping_address_id = $1, billing_address_id = $1, updated_at = $2
        WHERE id = $3
      `, [addressId, now, orderId])

      console.log("✅ Address created and linked:", addressId)

      // Fetch the complete order with all details
      const completeOrder = await transactionalEntityManager.query(`
        SELECT
          o.*,
          json_agg(
            json_build_object(
              'id', li.id,
              'title', li.title,
              'subtitle', li.subtitle,
              'thumbnail', li.thumbnail,
              'variant_sku', li.variant_sku,
              'variant_title', li.variant_title,
              'unit_price', li.unit_price,
              'quantity', li.quantity,
              'subtotal', li.subtotal,
              'total', li.total,
              'metadata', li.metadata
            )
          ) as items,
          json_build_object(
            'id', addr.id,
            'first_name', addr.first_name,
            'last_name', addr.last_name,
            'address_1', addr.address_1,
            'city', addr.city,
            'province', addr.province,
            'postal_code', addr.postal_code,
            'country_code', addr.country_code,
            'phone', addr.phone
          ) as shipping_address
        FROM "order" o
        LEFT JOIN "line_item" li ON li.order_id = o.id
        LEFT JOIN "address" addr ON addr.id = o.shipping_address_id
        WHERE o.id = $1
        GROUP BY o.id, addr.id
      `, [orderId])

      const order = completeOrder[0]

      console.log("✅ Complete order created:", {
        id: order.id,
        display_id: order.display_id,
        email: order.email,
        total: order.total,
        items: Array.isArray(order.items) ? order.items.length : 0
      })

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
          payment_status: order.payment_status,
          fulfillment_status: order.fulfillment_status,
          items: order.items || [],
          shipping_address: order.shipping_address,
          metadata: order.metadata,
          created_at: order.created_at,
          updated_at: order.updated_at
        },
        message: "Order created successfully with all details"
      })
    })

  } catch (error) {
    console.error("❌ Error creating direct order:", error)

    return res.status(500).json({
      success: false,
      error: "Failed to create order",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    })
  }
}