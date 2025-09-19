import { MedusaContainer } from "@medusajs/framework/types"

export default async function setupRegionsProduction(
  container: MedusaContainer
): Promise<void> {
  const regionService = container.resolve("region")
  const storeService = container.resolve("store")

  console.log("🌍 Setting up production regions...")

  try {
    // Check existing regions
    const regions = await regionService.list({})
    console.log(`Found ${regions.length} existing regions`)

    if (regions.length === 0) {
      console.log("Creating US region...")

      // Create US region
      const usRegion = await regionService.create({
        name: "United States",
        currency_code: "usd",
        tax_rate: 0,
        payment_providers: ["pp_stripe_stripe"],
        fulfillment_providers: ["manual"],
        countries: ["us"]
      })

      console.log("✅ US region created:", usRegion.id)

      // Update store with default region
      const stores = await storeService.list({})
      if (stores.length > 0) {
        await storeService.update(stores[0].id, {
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