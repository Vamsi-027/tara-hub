import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function setupRegionsComplete({ container }: ExecArgs) {
  const regionModule = container.resolve(Modules.REGION)

  console.log("🌍 Setting up complete regions with countries and providers...")

  try {
    // Check existing regions
    const existingRegions = await regionModule.listRegions()
    console.log(`Found ${existingRegions.length} existing regions`)

    // Update US region if it exists
    const usRegion = existingRegions.find(r => r.currency_code === "usd")
    if (usRegion) {
      console.log("Updating US region with complete data...")
      await regionModule.updateRegions(usRegion.id, {
        name: "United States",
        currency_code: "usd",
        countries: ["us", "ca"], // US and Canada
        metadata: {
          tax_rate: 0,
          automatic_taxes: true,
          includes_tax: false,
          payment_providers: ["stripe"],
          fulfillment_providers: ["manual"],
          updated_at: new Date().toISOString()
        }
      })
      console.log("✅ US region updated")
    } else {
      console.log("Creating US region...")
      const newUsRegion = await regionModule.createRegions({
        name: "United States",
        currency_code: "usd",
        countries: ["us", "ca"],
        metadata: {
          tax_rate: 0,
          automatic_taxes: true,
          includes_tax: false,
          payment_providers: ["stripe"],
          fulfillment_providers: ["manual"]
        }
      })
      console.log(`✅ US region created: ${newUsRegion.id}`)
    }

    // Update EU region if it exists
    const euRegion = existingRegions.find(r => r.currency_code === "eur")
    if (euRegion) {
      console.log("Updating EU region with complete data...")
      await regionModule.updateRegions(euRegion.id, {
        name: "Europe",
        currency_code: "eur",
        countries: ["de", "fr", "es", "it", "nl", "be"], // Major EU countries
        metadata: {
          tax_rate: 20,
          automatic_taxes: false,
          includes_tax: true,
          payment_providers: ["stripe"],
          fulfillment_providers: ["manual"],
          updated_at: new Date().toISOString()
        }
      })
      console.log("✅ EU region updated")
    } else {
      console.log("Creating EU region...")
      const newEuRegion = await regionModule.createRegions({
        name: "Europe",
        currency_code: "eur",
        countries: ["de", "fr", "es", "it", "nl", "be"],
        metadata: {
          tax_rate: 20,
          automatic_taxes: false,
          includes_tax: true,
          payment_providers: ["stripe"],
          fulfillment_providers: ["manual"]
        }
      })
      console.log(`✅ EU region created: ${newEuRegion.id}`)
    }

    // Create UK region if it doesn't exist
    const ukRegion = existingRegions.find(r => r.currency_code === "gbp")
    if (!ukRegion) {
      console.log("Creating UK region...")
      const newUkRegion = await regionModule.createRegions({
        name: "United Kingdom",
        currency_code: "gbp",
        countries: ["gb", "ie"], // UK and Ireland
        metadata: {
          tax_rate: 20,
          automatic_taxes: false,
          includes_tax: true,
          payment_providers: ["stripe"],
          fulfillment_providers: ["manual"]
        }
      })
      console.log(`✅ UK region created: ${newUkRegion.id}`)
    }

    console.log("\n🎉 All regions have been set up successfully!")
    console.log("\nTo view regions in admin:")
    console.log("1. Clear your browser cache")
    console.log("2. Navigate to Settings > Regions")
    console.log("3. Refresh the page if needed")

  } catch (error) {
    console.error("❌ Error setting up regions:", error)
  }
}