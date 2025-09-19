import { MedusaContainer } from "@medusajs/framework/types"

export default async function createRegionDirect({
  container,
}: {
  container: MedusaContainer
}) {
  try {
    console.log("🌍 Creating US region directly...")

    // Use the region module service
    const regionModule = container.resolve("@medusajs/region")

    // Check existing regions
    const existingRegions = await regionModule.listRegions()
    console.log(`Found ${existingRegions?.length || 0} existing regions`)

    if (!existingRegions || existingRegions.length === 0) {
      console.log("Creating new US region...")

      // Create region with simplified data
      const region = await regionModule.createRegions({
        name: "United States",
        currency_code: "usd",
        countries: ["us"],
        metadata: {
          created_via: "script",
        }
      })

      console.log("✅ Region created successfully:", region.id)
      console.log("   Name:", region.name)
      console.log("   Currency:", region.currency_code)

      // Try to update store
      try {
        const storeModule = container.resolve("@medusajs/store")
        const stores = await storeModule.listStores()

        if (stores && stores.length > 0) {
          console.log("Updating store with default region...")
          await storeModule.updateStores({
            id: stores[0].id,
            supported_currencies: [{ currency_code: "usd" }],
          })
          console.log("✅ Store updated")
        }
      } catch (storeError) {
        console.log("⚠️ Could not update store:", storeError.message)
      }

    } else {
      console.log("✅ Regions already exist:")
      existingRegions.forEach(r => {
        console.log(`   - ${r.name} (${r.id}) - ${r.currency_code}`)
      })
    }

  } catch (error) {
    console.error("❌ Error:", error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    throw error
  }
}