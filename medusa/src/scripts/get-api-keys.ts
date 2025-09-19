import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function getApiKeys({ container }: ExecArgs) {
  const apiKeyModule = container.resolve(Modules.API_KEY)

  console.log("🔑 Fetching Publishable API Keys...")

  const keys = await apiKeyModule.listApiKeys({
    type: "publishable"
  })

  if (keys.length === 0) {
    console.log("❌ No publishable API keys found!")
    console.log("Run the seed script first: npx medusa exec ./src/scripts/seed.ts")
    return
  }

  console.log(`\n✅ Found ${keys.length} publishable API key(s):\n`)

  keys.forEach((key, index) => {
    console.log(`${index + 1}. Title: ${key.title}`)
    console.log(`   Token: ${key.token}`)
    console.log(`   Created: ${key.created_at}`)
    console.log(`   Sales Channels: ${key.sales_channels?.map(sc => sc.name).join(", ") || "None linked"}`)
    console.log("")
  })

  console.log("📝 To use in fabric-store, update your environment variable:")
  console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${keys[0].token}`)
  console.log("\n🔗 Test the key with:")
  console.log(`curl https://medusa-backend-production-3655.up.railway.app/store/products \\`)
  console.log(`  -H "x-publishable-api-key: ${keys[0].token}"`)
}