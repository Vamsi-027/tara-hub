export default async () => {
  try {
    console.log("🔍 Checking fabric orders in PostgreSQL database...")
    
    const { Client } = require('pg')
    
    // Get database connection from environment
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      console.log("❌ DATABASE_URL not configured")
      return
    }
    
    console.log("🔌 Connecting to PostgreSQL database...")
    
    // Create PostgreSQL client
    const client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    try {
      // Check if fabric_orders table exists
      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'fabric_orders';
      `
      
      const tableExists = await client.query(tableCheckQuery)
      
      if (tableExists.rows.length === 0) {
        console.log("❌ fabric_orders table does not exist")
        console.log("   Creating table...")
        
        await client.query(`
          CREATE TABLE fabric_orders (
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
        
        console.log("✅ fabric_orders table created")
      } else {
        console.log("✅ fabric_orders table exists")
      }
      
      // Get orders from database
      const ordersQuery = `
        SELECT id, email, status, items_count, total_amount, 
               payment_intent_id, created_at, updated_at
        FROM fabric_orders 
        ORDER BY created_at DESC 
        LIMIT 10;
      `
      
      const ordersResult = await client.query(ordersQuery)
      const orders = ordersResult.rows
      
      console.log(`\n📦 Found ${orders.length} orders in PostgreSQL database`)
      
      if (orders.length > 0) {
        console.log("\n🗄️  Database Orders:")
        orders.forEach((order, index) => {
          console.log(`\n  ${index + 1}. Order ${order.id}`)
          console.log(`     ✅ Status: ${order.status}`)
          console.log(`     👤 Email: ${order.email}`)
          console.log(`     📅 Created: ${new Date(order.created_at).toLocaleString()}`)
          console.log(`     💰 Total: $${(order.total_amount / 100).toFixed(2)}`)
          console.log(`     📦 Items: ${order.items_count} item(s)`)
          if (order.payment_intent_id) {
            console.log(`     💳 Payment: ${order.payment_intent_id}`)
          }
        })
        
        // Get total statistics
        const statsQuery = `
          SELECT 
            COUNT(*) as total_orders,
            SUM(total_amount) as total_revenue,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
          FROM fabric_orders;
        `
        
        const statsResult = await client.query(statsQuery)
        const stats = statsResult.rows[0]
        
        console.log(`\n📊 Database Order Statistics:`)
        console.log(`   Total Orders: ${stats.total_orders}`)
        console.log(`   Total Revenue: $${((stats.total_revenue || 0) / 100).toFixed(2)}`)
        console.log(`   Pending: ${stats.pending_orders}`)
        console.log(`   Completed: ${stats.completed_orders}`)
        
      } else {
        console.log("\n❌ No orders found in database")
        console.log("   Orders may be stored only in file storage")
      }
      
      console.log("\n🔧 Database Connection Status:")
      console.log(`   ✅ Successfully connected to PostgreSQL`)
      console.log(`   ✅ fabric_orders table ready`)
      console.log(`   ✅ Ready to store orders in database`)
      
    } finally {
      await client.end()
      console.log("🔌 Database connection closed")
    }
    
  } catch (error) {
    console.error("❌ Error checking database orders:", error)
  }
}