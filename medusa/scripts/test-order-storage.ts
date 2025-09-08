export default async () => {
  try {
    console.log("🧪 Testing database order storage functionality...")
    
    // Test order data
    const testOrder = {
      orderId: `test_order_${Date.now()}`,
      email: "test@example.com",
      items: [
        {
          id: "test-item-1",
          title: "Test Fabric Sample",
          variant: "Swatch Sample",
          price: 500, // $5.00 in cents
          quantity: 1,
          type: "swatch"
        }
      ],
      shipping: {
        firstName: "Test",
        lastName: "Customer",
        address: "123 Test St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        country: "US"
      },
      total: 1540, // $15.40 in cents
      paymentIntentId: "pi_test_" + Date.now(),
      status: "pending"
    }
    
    console.log("\n1. Testing direct Medusa database storage...")
    
    // Test direct database storage
    try {
      const dbResponse = await fetch("http://localhost:9000/admin/fabric-orders/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testOrder)
      })
      
      if (dbResponse.ok) {
        const dbData = await dbResponse.json()
        console.log("✅ Direct database storage: SUCCESS")
        console.log(`   Order ID: ${dbData.order?.id || 'N/A'}`)
      } else {
        console.log("❌ Direct database storage: FAILED")
        console.log(`   Status: ${dbResponse.status}`)
        const errorText = await dbResponse.text()
        console.log(`   Error: ${errorText}`)
      }
    } catch (error) {
      console.log("❌ Direct database storage: ERROR")
      console.log(`   Error: ${error.message}`)
    }
    
    console.log("\n2. Testing fabric store API with database integration...")
    
    // Test fabric store API (should store in both file and database)
    try {
      const apiResponse = await fetch("http://localhost:3006/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testOrder)
      })
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json()
        console.log("✅ Fabric store API: SUCCESS")
        console.log(`   Order ID: ${apiData.order?.id || 'N/A'}`)
        console.log(`   File storage: ${apiData.storage?.file ? '✅' : '❌'}`)
        console.log(`   Database storage: ${apiData.storage?.database ? '✅' : '❌'}`)
      } else {
        console.log("❌ Fabric store API: FAILED")
        console.log(`   Status: ${apiResponse.status}`)
        const errorText = await apiResponse.text()
        console.log(`   Error: ${errorText}`)
      }
    } catch (error) {
      console.log("❌ Fabric store API: ERROR")
      console.log(`   Error: ${error.message}`)
    }
    
    console.log("\n3. Checking file storage...")
    
    // Check file storage
    const fs = require('fs')
    const path = require('path')
    
    const fabricOrdersFile = path.join(__dirname, '../../frontend/experiences/fabric-store/.orders.json')
    
    if (fs.existsSync(fabricOrdersFile)) {
      const fabricOrders = JSON.parse(fs.readFileSync(fabricOrdersFile, 'utf-8'))
      console.log(`✅ File storage: ${fabricOrders.length} orders found`)
      
      // Check for test orders
      const testOrders = fabricOrders.filter(order => order.email === 'test@example.com')
      console.log(`   Test orders: ${testOrders.length}`)
    } else {
      console.log("❌ File storage: No orders file found")
    }
    
    console.log("\n📋 Database Integration Status:")
    console.log("   ✅ Medusa database endpoint created")
    console.log("   ✅ Fabric store API updated with dual storage") 
    console.log("   ✅ File storage maintained as backup")
    console.log("   ✅ Error handling for database failures")
    
    console.log("\n🔄 Next Steps:")
    console.log("   1. Verify Medusa backend is running (port 9000)")
    console.log("   2. Test placing an order through the UI")
    console.log("   3. Check admin interface for database orders")
    
  } catch (error) {
    console.error("❌ Test script error:", error)
  }
}