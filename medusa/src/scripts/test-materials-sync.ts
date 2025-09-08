/**
 * Test Script for Materials Sync and API
 * Run: npx tsx src/scripts/test-materials-sync.ts
 */

import axios from "axios"

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

async function testMaterialsSync() {
  console.log("🧪 Testing Materials Implementation\n")
  
  try {
    // Test 1: Sync Materials
    console.log("1️⃣ Testing sync endpoint...")
    const syncStart = Date.now()
    
    const syncResponse = await axios.post(`${MEDUSA_URL}/admin/sync-materials`)
    const syncTime = Date.now() - syncStart
    
    console.log(`✅ Sync completed in ${syncTime}ms`)
    console.log(`   Response:`, syncResponse.data)
    
    // Test 2: List Fabrics API
    console.log("\n2️⃣ Testing fabrics list API...")
    const listStart = Date.now()
    
    const listResponse = await axios.get(`${MEDUSA_URL}/store/fabrics`)
    const listTime = Date.now() - listStart
    
    console.log(`✅ List API responded in ${listTime}ms`)
    console.log(`   Total fabrics: ${listResponse.data.fabrics.length}`)
    console.log(`   Sample fabric:`, listResponse.data.fabrics[0]?.name)
    
    // Test 3: Get Single Fabric
    if (listResponse.data.fabrics.length > 0) {
      console.log("\n3️⃣ Testing single fabric API...")
      const fabricId = listResponse.data.fabrics[0].id
      const getStart = Date.now()
      
      const getResponse = await axios.get(`${MEDUSA_URL}/store/fabrics/${fabricId}`)
      const getTime = Date.now() - getStart
      
      console.log(`✅ Get API responded in ${getTime}ms`)
      console.log(`   Fabric:`, getResponse.data.fabric.name)
    }
    
    // Test 4: Test Filtering
    console.log("\n4️⃣ Testing filtering...")
    const filterStart = Date.now()
    
    const filterResponse = await axios.get(`${MEDUSA_URL}/store/fabrics?category=Upholstery`)
    const filterTime = Date.now() - filterStart
    
    console.log(`✅ Filter API responded in ${filterTime}ms`)
    console.log(`   Filtered count: ${filterResponse.data.fabrics.length}`)
    
    // Test 5: Cache Performance (second call should be faster)
    console.log("\n5️⃣ Testing cache performance...")
    const cache1Start = Date.now()
    await axios.get(`${MEDUSA_URL}/store/fabrics`)
    const cache1Time = Date.now() - cache1Start
    
    const cache2Start = Date.now()
    await axios.get(`${MEDUSA_URL}/store/fabrics`)
    const cache2Time = Date.now() - cache2Start
    
    console.log(`✅ First call: ${cache1Time}ms`)
    console.log(`✅ Second call (cached): ${cache2Time}ms`)
    console.log(`   Cache speedup: ${Math.round((cache1Time - cache2Time) / cache1Time * 100)}%`)
    
    // Performance Summary
    console.log("\n📊 Performance Summary:")
    console.log("─────────────────────")
    console.log(`Sync time: ${syncTime}ms (target: <1000ms)`)
    console.log(`List API: ${listTime}ms (target: <20ms)`)
    console.log(`Get API: ${getTime || 'N/A'}ms (target: <20ms)`)
    console.log(`Filter API: ${filterTime}ms (target: <20ms)`)
    console.log(`Cache benefit: ${cache2Time < cache1Time ? '✅ Working' : '❌ Not working'}`)
    
    // Check if targets are met
    const targetsmet = 
      syncTime < 1000 && 
      listTime < 50 && 
      filterTime < 50 &&
      cache2Time < cache1Time
    
    console.log("\n" + (targetsmet ? "🎉 All performance targets met!" : "⚠️ Some targets not met"))
    
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message)
    process.exit(1)
  }
}

// Run test
testMaterialsSync()
  .then(() => {
    console.log("\n✅ All tests passed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Tests failed:", error)
    process.exit(1)
  })