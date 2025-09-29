import { MedusaContainer } from "@medusajs/framework/types"

export default async function setupRegionsProduction(
  container: MedusaContainer
): Promise<void> {
  const regionService = container.resolve("region")
  const storeService = container.resolve("store")

  console.log("🌍 Setting up production regions...")

  try {
    // Check existing regions using Medusa v2 API
    const [regions] = await regionService.listAndCountRegions({})
    console.log(`Found ${regions.length} existing regions`)

    if (regions.length === 0) {
      console.log("Creating US region...")

      // Create US region using Medusa v2 API
      const [usRegion] = await regionService.createRegions([{
        name: "United States",
        currency_code: "usd",
        automatic_taxes: true,
        countries: ["us"]
      }])

      console.log("✅ US region created:", usRegion.id)

      // Update store with default region using Medusa v2 API
      const [stores] = await storeService.listAndCountStores({})
      if (stores.length > 0) {
        await storeService.updateStores(stores[0].id, {
          default_region_id: usRegion.id
        })
        console.log("✅ Store updated with default region")
      }
    } else {
      console.log("Regions already exist:")
      regions.forEach(r => {
        console.log(`- ${r.name} (${r.id}) - ${r.currency_code}`)
      })
    }

  } catch (error) {
    console.error("❌ Error setting up regions:", error)
    throw error
  }
}