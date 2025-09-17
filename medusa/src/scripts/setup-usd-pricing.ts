import { Modules } from "@medusajs/framework/utils"

export default async function setupUSDPricing({ container }: any) {
  const logger = container.resolve("logger")

  logger.info("🇺🇸 Starting USD Pricing Setup for Fabric Store")
  logger.info("================================================")

  // Product variants with USD pricing
  const variantPricing = [
    {
      id: 'variant_01K51VADRT5G8KNKP7HWFEY235',
      name: 'Sandwell Lipstick - Fabric Per Yard',
      price: 12500 // $125.00 in cents
    },
    {
      id: 'variant_01K51VADRSDBEJTCXV0GTPZ484',
      name: 'Sandwell Lipstick - Swatch Sample',
      price: 500 // $5.00 in cents
    },
    {
      id: 'variant_01K57QA138A2MKQQNR667AM9XC',
      name: 'Jefferson Linen Sunglow - Fabric Per Yard',
      price: 8500 // $85.00 in cents
    },
    {
      id: 'variant_01K57QA137DXZZN3FZS20X7EAQ',
      name: 'Jefferson Linen Sunglow - Swatch Sample',
      price: 350 // $3.50 in cents
    }
  ]

  const regionId = 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN' // US/Europe region (configure as needed)
  const currencyCode = 'usd'

  try {
    const pricingModule = container.resolve(Modules.PRICING)
    const productModule = container.resolve(Modules.PRODUCT)

    logger.info("🔍 Setting up USD pricing for product variants...")

    for (const variant of variantPricing) {
      try {
        logger.info(`💰 Processing: ${variant.name}`)

        // Check if variant exists
        const productVariant = await productModule.retrieveVariant(variant.id).catch(() => null)

        if (!productVariant) {
          logger.warn(`⚠️  Variant ${variant.id} not found, skipping...`)
          continue
        }

        // Create or update price set for the variant
        let priceSet = null

        try {
          // Try to find existing price set
          const existingPriceSets = await pricingModule.listPriceSets({
            filters: {
              id: productVariant.price_set?.id
            }
          })

          if (existingPriceSets?.length > 0) {
            priceSet = existingPriceSets[0]
            logger.info(`   Found existing price set: ${priceSet.id}`)
          }
        } catch (e) {
          // No existing price set
        }

        if (!priceSet) {
          // Create new price set
          priceSet = await pricingModule.createPriceSets({
            prices: [
              {
                amount: variant.price,
                currency_code: currencyCode,
                min_quantity: 1,
                max_quantity: null
              }
            ]
          })
          logger.info(`   Created new price set: ${priceSet.id}`)

          // Link price set to variant
          await productModule.updateVariants(variant.id, {
            price_set_id: priceSet.id
          })
          logger.info(`   Linked price set to variant`)
        } else {
          // Update existing price set
          await pricingModule.updatePrices([
            {
              id: priceSet.prices?.[0]?.id,
              amount: variant.price,
              currency_code: currencyCode
            }
          ])
          logger.info(`   Updated existing price`)
        }

        logger.info(`✅ Set USD price: $${(variant.price/100).toFixed(2)}`)

      } catch (error) {
        logger.error(`❌ Failed to set pricing for ${variant.name}:`, error)
      }
    }

    logger.info('================================================')
    logger.info('🎉 USD Pricing setup complete!')
    logger.info('💡 Your fabric store now has proper USD pricing.')
    logger.info('')
    logger.info('📋 Next steps:')
    logger.info('1. Verify prices in Medusa Admin: /app/products')
    logger.info('2. Check the fabric store to see updated prices')
    logger.info('3. Test the checkout flow with USD pricing')

  } catch (error) {
    logger.error("Failed to setup USD pricing:", error)
    throw error
  }
}