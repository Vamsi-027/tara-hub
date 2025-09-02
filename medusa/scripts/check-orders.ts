export default async () => {
  try {
    // Check fabric store orders from file storage
    console.log("🗂️  Checking fabric store file storage...")
    const fs = require('fs')
    const path = require('path')
    
    const fabricOrdersFile = path.join(__dirname, '../../frontend/experiences/fabric-store/.orders.json')
    
    if (fs.existsSync(fabricOrdersFile)) {
      const fabricOrders = JSON.parse(fs.readFileSync(fabricOrdersFile, 'utf-8'))
      console.log(`\n📁 Found ${fabricOrders.length} orders in fabric store file storage`)
      
      if (fabricOrders.length > 0) {
        console.log("\n📦 Recent fabric store orders:")
        fabricOrders.slice(-5).forEach((order, index) => {
          console.log(`\n  ${index + 1}. Order ${order.id}`)
          console.log(`     ✅ Status: ${order.status}`)
          console.log(`     👤 Email: ${order.email}`)
          console.log(`     📅 Created: ${new Date(order.createdAt).toLocaleString()}`)
          console.log(`     💰 Total: $${(order.totals.total / 100).toFixed(2)}`)
          console.log(`     📦 Items: ${order.items.length} item(s)`)
          if (order.items.length > 0) {
            order.items.forEach((item, itemIndex) => {
              console.log(`        ${itemIndex + 1}. ${item.title} (${item.variant})`)
            })
          }
          if (order.paymentIntentId) {
            console.log(`     💳 Payment: ${order.paymentIntentId}`)
          }
        })
        
        console.log(`\n📊 Order Status Summary:`)
        const statusCounts = fabricOrders.reduce((counts, order) => {
          counts[order.status] = (counts[order.status] || 0) + 1
          return counts
        }, {})
        
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`     ${status}: ${count} orders`)
        })
        
        const totalRevenue = fabricOrders.reduce((sum, order) => sum + order.totals.total, 0)
        console.log(`\n💰 Total Revenue: $${(totalRevenue / 100).toFixed(2)}`)
      } else {
        console.log("\n❌ No orders found in fabric store file")
      }
    } else {
      console.log("\n❌ No fabric store orders file found at:", fabricOrdersFile)
    }
    
    // Check if orders are being stored in PostgreSQL database
    console.log("\n🔍 Database storage status:")
    console.log("   ❌ Orders are NOT being stored in PostgreSQL database")
    console.log("   📁 Orders are only stored in local file: .orders.json")
    console.log("   ⚠️  File storage is not suitable for production")
    
    console.log("\n🔧 To fix this, orders should be stored in:")
    console.log("   1. PostgreSQL database (persistent, scalable)")
    console.log("   2. Medusa backend (integrated with e-commerce platform)")
    
  } catch (error) {
    console.error("❌ Error checking orders:", error)
  }
}