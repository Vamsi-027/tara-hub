import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createRegionsWorkflow } from "@medusajs/medusa/core-flows"

export default async function createRegions({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const regionModule = container.resolve(Modules.REGION)
  const storeModule = container.resolve(Modules.STORE)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)

  console.log("🌍 Creating regions...")

  // Get the default store
  const [store] = await storeModule.listStores()
  if (!store) {
    console.error("❌ No store found. Please run seed script first.")
    return
  }

  // Get fulfillment providers
  const fulfillmentProviders = await fulfillmentModule.listFulfillmentProviders()
  const manualFulfillment = fulfillmentProviders.find(fp => fp.id === "manual-fulfillment")

  if (!manualFulfillment) {
    console.error("❌ No manual fulfillment provider found. Please run seed script first.")
    return
  }

  // Check existing regions
  const existingRegions = await regionModule.listRegions()
  console.log(`📍 Found ${existingRegions.length} existing regions`)

  // Create US Region
  const usRegion = existingRegions.find(r => r.currency_code === "usd")
  if (!usRegion) {
    console.log("🇺🇸 Creating US region...")

    const { result: usRegionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United States",
            currency_code: "usd",
            countries: ["us"],
            payment_providers: ["pp_system_default"],
            fulfillment_providers: [manualFulfillment.id],
            automatic_taxes: true,
            is_tax_inclusive: false
          }
        ]
      }
    })

    console.log("✅ US region created:", usRegionResult[0].id)
    console.log("   Currency: USD")
    console.log("   Country: United States")
  } else {
    console.log("✅ US region already exists:", usRegion.id)
  }

  // Create EUR Region
  const eurRegion = existingRegions.find(r => r.currency_code === "eur")
  if (!eurRegion) {
    console.log("🇪🇺 Creating EUR region...")

    const { result: eurRegionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Europe",
            currency_code: "eur",
            countries: ["de", "fr", "it", "es", "nl", "be", "at"],
            payment_providers: ["pp_system_default"],
            fulfillment_providers: [manualFulfillment.id],
            automatic_taxes: true,
            is_tax_inclusive: true
          }
        ]
      }
    })

    console.log("✅ EUR region created:", eurRegionResult[0].id)
    console.log("   Currency: EUR")
    console.log("   Countries: Germany, France, Italy, Spain, Netherlands, Belgium, Austria")
  } else {
    console.log("✅ EUR region already exists:", eurRegion.id)
  }

  // Create GBP Region
  const gbpRegion = existingRegions.find(r => r.currency_code === "gbp")
  if (!gbpRegion) {
    console.log("🇬🇧 Creating UK region...")

    const { result: gbpRegionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United Kingdom",
            currency_code: "gbp",
            countries: ["gb"],
            payment_providers: ["pp_system_default"],
            fulfillment_providers: [manualFulfillment.id],
            automatic_taxes: true,
            is_tax_inclusive: true
          }
        ]
      }
    })

    console.log("✅ UK region created:", gbpRegionResult[0].id)
    console.log("   Currency: GBP")
    console.log("   Country: United Kingdom")
  } else {
    console.log("✅ UK region already exists:", gbpRegion.id)
  }

  // List all regions
  console.log("\n📊 All regions:")
  const allRegions = await regionModule.listRegions()
  allRegions.forEach(region => {
    console.log(`• ${region.name} (${region.currency_code.toUpperCase()}) - ID: ${region.id}`)
    console.log(`  Countries: ${region.countries?.map(c => c.iso_2).join(", ") || "None"}`)
  })

  console.log("\n🎉 Region setup complete!")
  console.log("\n📝 Next steps:")
  console.log("1. Update fabric-store environment variables:")
  console.log("   NEXT_PUBLIC_MEDUSA_REGION_ID_USD=" + (allRegions.find(r => r.currency_code === "usd")?.id || "[USD_REGION_ID]"))
  console.log("   NEXT_PUBLIC_MEDUSA_REGION_ID_EUR=" + (allRegions.find(r => r.currency_code === "eur")?.id || "[EUR_REGION_ID]"))
  console.log("   NEXT_PUBLIC_MEDUSA_REGION_ID_GBP=" + (allRegions.find(r => r.currency_code === "gbp")?.id || "[GBP_REGION_ID]"))
  console.log("\n2. Set product prices for each region in the admin panel")
}