/**
 * Store Orders by Email API Route
 * Public endpoint that queries orders by customer email
 * Bypasses Medusa v2 serialization issues
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const email = req.query.email as string
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      })
    }

    console.log(`🔍 Store orders query for email: ${email}`)

    // Get the query service for direct database access
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Query orders with minimal fields to avoid serialization issues
    const { data: orders, metadata } = await query.graph({
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
        "metadata",
        // Basic item data
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.total",
        // Basic address data
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.address_1",
        "shipping_address.city",
        "shipping_address.province",
        "shipping_address.postal_code",
        "shipping_address.country_code",
        // Payment data
        "payment_collections.status",
        "payment_collections.amount"
      ],
      filters: {
        email: email.toLowerCase()
      },
      pagination: {
        skip: offset,
        take: limit
      },
      orderBy: {
        created_at: "DESC"
      }
    })

    console.log(`✅ Found ${orders?.length || 0} orders for ${email}`)

    // Transform to fabric-store compatible format
    const transformedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      display_id: order.display_id,
      email: order.email,
      status: order.status || 'pending',
      currency_code: order.currency_code || 'usd',
      created_at: order.created_at,
      updated_at: order.updated_at,

      // Items
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        name: item.title || 'Unknown Product',
        title: item.title || 'Unknown Product',
        quantity: item.quantity || 1,
        price: item.unit_price || 0,
        unit_price: item.unit_price || 0,
        total: item.total || item.unit_price || 0,
      })),

      // Shipping address
      shipping: order.shipping_address ? {
        firstName: order.shipping_address.first_name || '',
        lastName: order.shipping_address.last_name || '',
        email: order.email,
        phone: '',
        address: order.shipping_address.address_1 || '',
        city: order.shipping_address.city || '',
        state: order.shipping_address.province || '',
        zipCode: order.shipping_address.postal_code || '',
        country: order.shipping_address.country_code?.toUpperCase() || 'US',
      } : null,

      // Totals
      totals: {
        subtotal: order.subtotal || 0,
        shipping: order.shipping_total || 0,
        tax: order.tax_total || 0,
        total: order.total || 0,
      },

      // Payment info
      payment_status: order.payment_collections?.[0]?.status || 'pending',
      payment_amount: order.payment_collections?.[0]?.amount || order.total || 0,

      // Metadata
      metadata: order.metadata || {}
    }))

    return res.status(200).json({
      success: true,
      orders: transformedOrders,
      total: metadata?.total || transformedOrders.length,
      limit,
      offset,
      hasMore: offset + limit < (metadata?.total || 0)
    })

  } catch (error) {
    console.error('Store orders by email query error:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * POST /store/orders-by-email
 * Create a new order directly in the database
 */
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

    console.log("🔥 Creating order via orders-by-email POST:", {
      email,
      itemCount: items?.length || 0,
      total: totals?.total || 0
    })

    // Get database manager for direct SQL operations
    const manager = req.scope.resolve("manager")

    // Generate unique IDs
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const displayId = Math.floor(Math.random() * 90000) + 10000
    const now = new Date()

    // Use a transaction to ensure data consistency
    const result = await manager.transaction(async (transactionalEntityManager: any) => {
      // Insert the main order record
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
        orderId,
        displayId,
        "pending",
        email,
        currency_code,
        totals.subtotal || Math.round(totals.total * 0.9),
        totals.shipping || Math.round(totals.total * 0.1),
        totals.tax || 0,
        0, // discount_total
        0, // gift_card_total
        0, // gift_card_tax_total
        0, // refunded_total
        totals.total,
        0, // paid_total
        totals.total, // refundable_amount
        payment_intent_id ? "awaiting" : "not_paid",
        "not_fulfilled",
        null, // canceled_at
        false, // no_notification
        JSON.stringify({
          fabric_store_order: true,
          payment_intent_id: payment_intent_id,
          created_from: "fabric-store"
        }),
        now,
        now
      ])

      console.log("✅ Order record created:", orderId)

      // Insert line items
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const itemId = `item_${Date.now()}_${i}`

        await transactionalEntityManager.query(`
          INSERT INTO "line_item" (
            id, order_id, title, subtitle, thumbnail,
            variant_id, product_id, product_title,
            variant_sku, variant_title, unit_price,
            quantity, fulfilled_quantity, returned_quantity,
            shipped_quantity, refundable_amount, subtotal,
            tax_total, total, original_total, original_tax_total,
            discount_total, raw_discount_total, gift_card_total,
            includes_tax, requires_shipping, is_discountable,
            is_tax_inclusive, is_return, is_giftcard, should_merge,
            allow_discounts, has_shipping, metadata, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36
          )
        `, [
          itemId,
          orderId,
          item.name,
          item.color || "",
          item.image || null,
          item.id.startsWith('variant_') ? item.id : null,
          null, // product_id
          item.name,
          item.sku || "",
          item.color || "",
          item.price,
          item.quantity,
          0, // fulfilled_quantity
          0, // returned_quantity
          0, // shipped_quantity
          item.price * item.quantity, // refundable_amount
          item.price * item.quantity, // subtotal
          0, // tax_total
          item.price * item.quantity, // total
          item.price * item.quantity, // original_total
          0, // original_tax_total
          0, // discount_total
          0, // raw_discount_total
          0, // gift_card_total
          false, // includes_tax
          true, // requires_shipping
          true, // is_discountable
          false, // is_tax_inclusive
          false, // is_return
          false, // is_giftcard
          true, // should_merge
          true, // allow_discounts
          true, // has_shipping
          JSON.stringify({
            fabric_store_item: true,
            original_id: item.id,
            sku: item.sku,
            color: item.color,
            image: item.image,
            type: item.type || "fabric"
          }),
          now,
          now
        ])

        console.log(`✅ Line item ${i + 1} created:`, item.name)
      }

      // Create shipping address
      const addressId = `addr_${Date.now()}`
      await transactionalEntityManager.query(`
        INSERT INTO "address" (
          id, first_name, last_name, phone, company,
          address_1, address_2, city, province, postal_code,
          country_code, metadata, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
      `, [
        addressId,
        shipping.firstName,
        shipping.lastName || "",
        shipping.phone || "",
        "",
        shipping.address,
        "",
        shipping.city,
        shipping.state,
        shipping.zipCode,
        shipping.country?.toLowerCase() || "us",
        null,
        now,
        now
      ])

      // Update order with shipping address
      await transactionalEntityManager.query(`
        UPDATE "order"
        SET shipping_address_id = $1, billing_address_id = $1, updated_at = $2
        WHERE id = $3
      `, [addressId, now, orderId])

      console.log("✅ Address created and linked:", addressId)

      return { orderId, displayId }
    })

    // Fetch the complete order to return
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
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
        "payment_status",
        "fulfillment_status",
        "metadata",
        "created_at",
        "updated_at",
        "items.id",
        "items.title",
        "items.subtitle",
        "items.quantity",
        "items.unit_price",
        "items.total",
        "items.metadata",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.address_1",
        "shipping_address.city",
        "shipping_address.province",
        "shipping_address.postal_code",
        "shipping_address.country_code"
      ],
      filters: { id: result.orderId }
    })

    const order = orders[0]

    console.log("✅ Complete order created:", {
      id: order.id,
      display_id: order.display_id,
      email: order.email,
      total: order.total,
      items: order.items?.length || 0
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
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
          metadata: item.metadata
        })),
        shipping_address: order.shipping_address,
        metadata: order.metadata,
        created_at: order.created_at,
        updated_at: order.updated_at
      },
      message: "Order created successfully with all details"
    })

  } catch (error) {
    console.error("❌ Error creating order via POST:", error)

    return res.status(500).json({
      success: false,
      error: "Failed to create order",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined
    })
  }
}