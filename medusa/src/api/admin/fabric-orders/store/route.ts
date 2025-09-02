import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Client } from 'pg'

// Store fabric orders in PostgreSQL database
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

    console.log(`📦 Storing order in database: ${orderId}`)
    console.log(`   Customer: ${email}`)
    console.log(`   Items: ${items.length}`)
    console.log(`   Total: $${((totals.total || 0) / 100).toFixed(2)}`)
    
    // Get database connection from environment
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured")
    }
    
    // Create PostgreSQL client
    const client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    try {
      // Create table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS fabric_orders (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          items_count INTEGER DEFAULT 0,
          total_amount INTEGER NOT NULL DEFAULT 0,
          subtotal INTEGER DEFAULT 0,
          shipping_cost INTEGER DEFAULT 0,
          tax_amount INTEGER DEFAULT 0,
          payment_intent_id VARCHAR(255),
          customer_data JSONB,
          shipping_data JSONB,
          items_data JSONB,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      
      // Insert order into database
      const insertQuery = `
        INSERT INTO fabric_orders (
          id, email, status, items_count, total_amount, 
          subtotal, shipping_cost, tax_amount, payment_intent_id,
          customer_data, shipping_data, items_data, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          updated_at = NOW(),
          status = EXCLUDED.status
        RETURNING *;
      `
      
      const values = [
        orderId,
        email,
        status,
        items.length,
        totals.total || 0,
        totals.subtotal || 0,
        totals.shipping || 0,
        totals.tax || 0,
        paymentIntentId,
        JSON.stringify({ email, firstName: shipping.firstName, lastName: shipping.lastName }),
        JSON.stringify(shipping),
        JSON.stringify(items),
        JSON.stringify({ source: "fabric-store", created_via: "checkout" })
      ]
      
      const result = await client.query(insertQuery, values)
      const savedOrder = result.rows[0]
      
      console.log(`✅ Order stored in PostgreSQL database: ${orderId}`)
      console.log(`   Database ID: ${savedOrder.id}`)
      console.log(`   Created: ${savedOrder.created_at}`)
      
      res.json({
        success: true,
        order: {
          id: savedOrder.id,
          email: savedOrder.email,
          status: savedOrder.status,
          total: savedOrder.total_amount,
          created_at: savedOrder.created_at,
          database_stored: true
        },
        message: "Order stored in database successfully"
      })
      return
      
    } finally {
      await client.end()
    }
    
  } catch (error) {
    console.error("❌ Error storing order in database:", error)
    res.status(500).json({ 
      success: false,
      error: "Failed to store order in database",
      message: error.message,
      database_stored: false
    })
  }
}