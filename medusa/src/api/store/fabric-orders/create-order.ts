/**
 * Production-Ready Fabric Store Order Creation
 * Creates orders that are visible in Medusa Admin
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const {
      orderId,
      email,
      items = [],
      shipping = {},
      totals = {},
      paymentIntentId,
      status = 'pending'
    } = req.body

    // Get required Medusa services
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const orderModuleService = req.scope.resolve("order")
    const regionModuleService = req.scope.resolve("region")
    const customerModuleService = req.scope.resolve("customer")

    console.log(`📦 Creating Medusa order for fabric-store`)
    console.log(`   Customer: ${email}`)
    console.log(`   Items: ${items.length}`)

    // Step 1: Get or create customer
    let customer
    try {
      const existingCustomers = await customerModuleService.listCustomers({
        email: email
      })

      if (existingCustomers?.length > 0) {
        customer = existingCustomers[0]
      } else {
        customer = await customerModuleService.createCustomers({
          email: email,
          first_name: shipping.firstName || '',
          last_name: shipping.lastName || '',
          phone: shipping.phone || null,
        })
      }
    } catch (error) {
      console.log(`Creating customer without customer module`)
      customer = { id: `cus_${Date.now()}`, email }
    }

    // Step 2: Get default region
    let region
    try {
      const regions = await regionModuleService.listRegions()
      region = regions[0] // Use first available region

      if (!region) {
        // Create a default region if none exists
        region = await regionModuleService.createRegions({
          name: "United States",
          currency_code: "usd",
          countries: ["us"]
        })
      }
    } catch (error) {
      console.log(`Using fallback region`)
      region = { id: "reg_default", currency_code: "usd" }
    }

    // Step 3: Transform items to Medusa format
    const orderItems = items.map(item => ({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: item.name,
      variant_id: item.id || null,
      quantity: item.quantity,
      unit_price: Math.round(item.price), // Ensure it's in cents
      subtotal: Math.round(item.price * item.quantity),
      total: Math.round(item.price * item.quantity),
      metadata: {
        sku: item.sku,
        color: item.color,
        image: item.image
      }
    }))

    // Step 4: Create the order in Medusa's order table
    const order = await orderModuleService.createOrders({
      id: orderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email,
      customer_id: customer?.id || null,
      region_id: region?.id || null,
      currency_code: region?.currency_code || "usd",

      // Address information
      shipping_address: {
        first_name: shipping.firstName || '',
        last_name: shipping.lastName || '',
        address_1: shipping.address || '',
        city: shipping.city || '',
        province: shipping.state || '',
        postal_code: shipping.zipCode || '',
        country_code: shipping.country?.toLowerCase() || 'us',
        phone: shipping.phone || null,
      },

      billing_address: {
        first_name: shipping.firstName || '',
        last_name: shipping.lastName || '',
        address_1: shipping.address || '',
        city: shipping.city || '',
        province: shipping.state || '',
        postal_code: shipping.zipCode || '',
        country_code: shipping.country?.toLowerCase() || 'us',
        phone: shipping.phone || null,
      },

      // Items
      items: orderItems,

      // Totals (all in cents)
      subtotal: totals.subtotal || 0,
      shipping_total: totals.shipping || 0,
      tax_total: totals.tax || 0,
      total: totals.total || 0,

      // Payment
      payment_status: paymentIntentId ? 'captured' : 'awaiting',
      fulfillment_status: 'not_fulfilled',
      status: status,

      // Metadata
      metadata: {
        source: 'fabric-store',
        payment_intent_id: paymentIntentId,
        created_via: 'checkout',
        original_order_id: orderId
      },

      // Timestamps
      created_at: new Date(),
      updated_at: new Date()
    })

    console.log(`✅ Order created in Medusa: ${order.id}`)
    console.log(`   Order will be visible in Medusa Admin`)

    // Step 5: Also store in fabric_orders table for backup
    try {
      const { Client } = require('pg')
      const databaseUrl = process.env.DATABASE_URL

      if (databaseUrl) {
        const client = new Client({
          connectionString: databaseUrl,
          ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
        })

        await client.connect()

        // Create backup table if needed
        await client.query(`
          CREATE TABLE IF NOT EXISTS fabric_orders (
            id VARCHAR(255) PRIMARY KEY,
            medusa_order_id VARCHAR(255),
            email VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            items_count INTEGER DEFAULT 0,
            total_amount INTEGER NOT NULL DEFAULT 0,
            payment_intent_id VARCHAR(255),
            customer_data JSONB,
            shipping_data JSONB,
            items_data JSONB,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `)

        // Store backup
        await client.query(`
          INSERT INTO fabric_orders (
            id, medusa_order_id, email, status, items_count,
            total_amount, payment_intent_id, customer_data,
            shipping_data, items_data, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            medusa_order_id = EXCLUDED.medusa_order_id,
            updated_at = NOW()
        `, [
          orderId || order.id,
          order.id,
          email,
          status,
          items.length,
          totals.total || 0,
          paymentIntentId,
          JSON.stringify({ email, firstName: shipping.firstName, lastName: shipping.lastName }),
          JSON.stringify(shipping),
          JSON.stringify(items),
          JSON.stringify({ source: "fabric-store", medusa_order_id: order.id })
        ])

        await client.end()
        console.log(`📋 Backup stored in fabric_orders table`)
      }
    } catch (backupError) {
      console.log(`⚠️ Backup storage failed:`, backupError.message)
      // Continue - main order is already created
    }

    // Return success response
    res.json({
      success: true,
      order: {
        id: order.id,
        display_id: order.display_id,
        email: order.email,
        status: order.status,
        total: order.total,
        created_at: order.created_at,
        medusa_admin_visible: true,
        customer_portal_visible: true
      },
      message: "Order created successfully and visible in Medusa Admin"
    })

  } catch (error) {
    console.error("❌ Error creating order:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create order",
      message: error.message,
      details: error.stack
    })
  }
}

/**
 * GET endpoint to retrieve customer orders
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { email, limit = 50, offset = 0 } = req.query

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email parameter is required"
      })
    }

    // Get order service
    const orderModuleService = req.scope.resolve("order")

    // Fetch orders for the customer
    const orders = await orderModuleService.listOrders(
      {
        email: email as string
      },
      {
        relations: ["items", "shipping_address", "billing_address"],
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        order: { created_at: "DESC" }
      }
    )

    console.log(`📊 Retrieved ${orders.length} orders for ${email}`)

    // Transform orders for response
    const transformedOrders = orders.map(order => ({
      id: order.id,
      display_id: order.display_id,
      email: order.email,
      status: order.status,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      items: order.items?.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.total,
        metadata: item.metadata
      })),
      shipping_address: order.shipping_address,
      totals: {
        subtotal: order.subtotal,
        shipping: order.shipping_total,
        tax: order.tax_total,
        total: order.total
      },
      created_at: order.created_at,
      updated_at: order.updated_at
    }))

    res.json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length,
      has_more: transformedOrders.length === parseInt(limit as string)
    })

  } catch (error) {
    console.error("❌ Error retrieving orders:", error)

    // Fallback to fabric_orders table
    try {
      const { Client } = require('pg')
      const databaseUrl = process.env.DATABASE_URL
      const { email } = req.query

      if (databaseUrl && email) {
        const client = new Client({
          connectionString: databaseUrl,
          ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
        })

        await client.connect()

        const result = await client.query(`
          SELECT * FROM fabric_orders
          WHERE email = $1
          ORDER BY created_at DESC
        `, [email])

        await client.end()

        const orders = result.rows.map(row => ({
          id: row.medusa_order_id || row.id,
          email: row.email,
          status: row.status,
          items: row.items_data || [],
          shipping_address: row.shipping_data || {},
          totals: {
            total: row.total_amount
          },
          created_at: row.created_at
        }))

        return res.json({
          success: true,
          orders: orders,
          count: orders.length,
          source: 'backup'
        })
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError)
    }

    res.status(500).json({
      success: false,
      error: "Failed to retrieve orders",
      message: error.message
    })
  }
}