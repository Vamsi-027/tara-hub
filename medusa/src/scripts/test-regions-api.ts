import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function testRegionsApi({ container }: ExecArgs) {
  const regionModule = container.resolve(Modules.REGION)

  console.log("🔍 Testing Regions API...\n")

  try {
    // Test 1: List all regions
    console.log("Test 1: Listing all regions...")
    const regions = await regionModule.listRegions()
    console.log(`✅ Found ${regions.length} regions`)

    regions.forEach(region => {
      console.log(`  - ${region.name} (${region.currency_code}) - ID: ${region.id}`)
    })

    // Test 2: Get regions with count
    console.log("\nTest 2: Get regions with count...")
    const [regionsWithCount, count] = await regionModule.listAndCountRegions()
    console.log(`✅ Count: ${count}, Retrieved: ${regionsWithCount.length}`)

    // Test 3: Check region properties
    if (regions.length > 0) {
      console.log("\nTest 3: Checking first region properties...")
      const firstRegion = regions[0]
      console.log("Region properties:")
      console.log(`  - ID: ${firstRegion.id}`)
      console.log(`  - Name: ${firstRegion.name}`)
      console.log(`  - Currency: ${firstRegion.currency_code}`)
      console.log(`  - Countries: ${firstRegion.countries?.length || 0}`)
      console.log(`  - Created: ${firstRegion.created_at}`)
      console.log(`  - Metadata: ${JSON.stringify(firstRegion.metadata || {})}`)
    }

    console.log("\n✅ All tests passed!")
    console.log("\n📝 Note: If regions aren't showing in admin UI, check:")
    console.log("  1. Admin UI cache (clear browser cache)")
    console.log("  2. API route permissions")
    console.log("  3. Network tab for API errors")

  } catch (error) {
    console.error("❌ Error testing regions API:", error)
  }
}