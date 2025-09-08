export default async (container) => {
  try {
    console.log("🗄️  Creating fabric orders table in PostgreSQL database...")
    
    // Get database manager from Medusa container
    const manager = container.resolve("manager")
    
    // Create fabric_orders table with proper schema
    const createTableQuery = `
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
    `
    
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_fabric_orders_email ON fabric_orders(email);
      CREATE INDEX IF NOT EXISTS idx_fabric_orders_status ON fabric_orders(status);
      CREATE INDEX IF NOT EXISTS idx_fabric_orders_created_at ON fabric_orders(created_at);
    `
    
    // Execute table creation
    await manager.query(createTableQuery)
    console.log("✅ fabric_orders table created successfully")
    
    // Create indexes
    await manager.query(createIndexQuery)
    console.log("✅ Indexes created successfully")
    
    // Verify table exists
    const verifyQuery = `
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'fabric_orders'
      ORDER BY ordinal_position;
    `
    
    const columns = await manager.query(verifyQuery)
    console.log(`\n📋 Table structure (${columns.length} columns):`)
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`)
    })
    
    console.log("\n🔧 Next steps:")
    console.log("   1. Update fabric orders API to use this table")
    console.log("   2. Test order creation with database storage")
    console.log("   3. Create admin interface to view database orders")
    
  } catch (error) {
    console.error("❌ Error creating fabric orders table:", error)
  }
}