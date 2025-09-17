import { Modules } from "@medusajs/framework/utils"

export default async function setupPricing({ container }: any) {
  const logger = container.resolve("logger")

  logger.info("🚀 Starting Medusa Product Pricing Setup")
  logger.info("========================================")

  // Product variants that need pricing
  const variantPricing = [
    {
      id: 'variant_01K51VADRT5G8KNKP7HWFEY235',
      name: 'Sandwell Lipstick - Fabric Per Yard',
      price: 2500 // €25.00 in cents
    },
    {
      id: 'variant_01K51VADRSDBEJTCXV0GTPZ484',
      name: 'Sandwell Lipstick - Swatch Sample',
      price: 500 // €5.00 in cents
    },
    {
      id: 'variant_01K57QA138A2MKQQNR667AM9XC',
      name: 'Jefferson Linen Sunglow - Fabric Per Yard',
      price: 3000 // €30.00 in cents
    },
    {
      id: 'variant_01K57QA137DXZZN3FZS20X7EAQ',
      name: 'Jefferson Linen Sunglow - Swatch Sample',
      price: 500 // €5.00 in cents
    }
  ]

  const regionId = 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN' // Europe region
  const currencyCode = 'eur'

  try {
    const query = container.resolve("query")

    logger.info("🔍 Setting up pricing for variants...")

    for (const variant of variantPricing) {
      try {
        logger.info(`💰 Adding pricing to ${variant.name}...`)

        // Use the query service to update pricing directly
        const { data: prices } = await query.graph({
          entity: "price",
          fields: ["id", "amount", "currency_code", "variant_id"],
          filters: {
            variant_id: variant.id
          }
        })

        if (prices.length === 0) {
          // Create new price via query
          await query.graph({
            entity: "price",
            fields: ["id"],
            data: [{
              variant_id: variant.id,
              currency_code: currencyCode,
              amount: variant.price
            }]
          })
          logger.info(`✅ Created new price: €${(variant.price/100).toFixed(2)}`)
        } else {
          // Update existing price
          const existingPrice = prices[0]
          await query.graph({
            entity: "price",
            fields: ["id"],
            filters: { id: existingPrice.id },
            data: [{
              amount: variant.price
            }]
          })
          logger.info(`✅ Updated existing price: €${(variant.price/100).toFixed(2)}`)
        }

      } catch (error) {
        logger.error(`❌ Failed to set pricing for ${variant.name}:`, error)
      }
    }

    logger.info('========================================')
    logger.info('🎉 Pricing setup complete!')
    logger.info('💡 The fabric-store integration should now work completely.')

  } catch (error) {
    logger.error("Failed to setup pricing:", error)
    throw error
  }
}