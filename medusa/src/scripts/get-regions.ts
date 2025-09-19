import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function getRegions({ container }: ExecArgs) {
  const regionModule = container.resolve(Modules.REGION)

  console.log("📍 Fetching regions from database...\n")

  const regions = await regionModule.listRegions()

  if (regions.length === 0) {
    console.log("❌ No regions found!")
    console.log("Run the seed script first: railway run npx medusa exec ./src/scripts/seed.ts")
    return
  }

  console.log(`✅ Found ${regions.length} region(s):\n`)

  regions.forEach((region, index) => {
    console.log(`${index + 1}. ${region.name}`)
    console.log(`   ID: ${region.id}`)
    console.log(`   Currency: ${region.currency_code.toUpperCase()}`)
    console.log(`   Countries: ${region.countries?.map(c => c.iso_2).join(", ") || "None"}`)
    console.log(`   Tax Inclusive: ${region.is_tax_inclusive}`)
    console.log(`   Created: ${region.created_at}`)
    console.log("")
  })

  console.log("=" * 60)
  console.log("\n📝 Environment variables for fabric-store:\n")

  const usdRegion = regions.find(r => r.currency_code === "usd")
  const eurRegion = regions.find(r => r.currency_code === "eur")
  const gbpRegion = regions.find(r => r.currency_code === "gbp")

  if (usdRegion) {
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_USD=${usdRegion.id}`)
  } else {
    console.log("# USD region not found - create it with seed script")
  }

  if (eurRegion) {
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_EUR=${eurRegion.id}`)
  } else {
    console.log("# EUR region not found - create it with seed script")
  }

  if (gbpRegion) {
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_GBP=${gbpRegion.id}`)
  } else {
    console.log("# GBP region not found (optional)")
  }

  console.log("\n🔧 To create missing regions, run:")
  console.log("railway run npx medusa exec ./src/scripts/seed.ts")
}