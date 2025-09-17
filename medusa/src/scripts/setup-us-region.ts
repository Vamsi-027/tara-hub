import { Modules } from "@medusajs/framework/utils"

export default async function setupUSRegion({ container }: any) {
  const logger = container.resolve("logger")

  logger.info("🇺🇸 Setting up US Region with USD pricing")
  logger.info("=====================================")

  try {
    const query = container.resolve("query")

    // Check if US region already exists
    const { data: existingRegions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
      filters: {
        name: "United States"
      }
    })

    let usRegionId = null

    if (existingRegions.length > 0) {
      usRegionId = existingRegions[0].id
      logger.info(`✅ US region already exists: ${usRegionId}`)
    } else {
      // Create US region
      logger.info("🏗️ Creating US region...")

      const { data: newRegions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code"],
        data: [{
          name: "United States",
          currency_code: "usd"
        }]
      })

      usRegionId = newRegions[0].id
      logger.info(`✅ Created US region: ${usRegionId}`)

      // Add US country to the region
      logger.info("🌍 Adding United States country...")

      await query.graph({
        entity: "country",
        fields: ["id"],
        data: [{
          iso_2: "us",
          iso_3: "usa",
          num_code: "840",
          name: "UNITED STATES",
          display_name: "United States",
          region_id: usRegionId
        }]
      })

      logger.info("✅ Added United States country to region")
    }

    // Now add USD pricing to existing variants using ProductService
    const productService = container.resolve("product")

    const variantPricing = [
      {
        id: 'variant_01K51VADRT5G8KNKP7HWFEY235', // Sandwell Lipstick - Fabric Per Yard
        name: 'Sandwell Lipstick - Fabric Per Yard',
        usd_price: 6000 // $60.00 in cents
      },
      {
        id: 'variant_01K51VADRSDBEJTCXV0GTPZ484', // Sandwell Lipstick - Swatch Sample
        name: 'Sandwell Lipstick - Swatch Sample',
        usd_price: 600 // $6.00 in cents
      },
      {
        id: 'variant_01K57QA138A2MKQQNR667AM9XC', // Jefferson Linen Sunglow - Fabric Per Yard
        name: 'Jefferson Linen Sunglow - Fabric Per Yard',
        usd_price: 7000 // $70.00 in cents
      },
      {
        id: 'variant_01K57QA137DXZZN3FZS20X7EAQ', // Jefferson Linen Sunglow - Swatch Sample
        name: 'Jefferson Linen Sunglow - Swatch Sample',
        usd_price: 600 // $6.00 in cents
      }
    ]

    logger.info("💰 Adding USD pricing to variants...")

    for (const variant of variantPricing) {
      try {
        logger.info(`💵 Adding USD pricing to ${variant.name}...`)

        // Get current variant data to preserve existing information
        const { data: variants } = await query.graph({
          entity: "product_variant",
          fields: ["id", "title", "sku", "prices"],
          filters: {
            id: variant.id
          }
        })

        if (variants.length > 0) {
          const currentVariant = variants[0]

          // Check if USD price already exists
          const existingUsdPrice = currentVariant.prices?.find(p => p.currency_code === "usd")

          if (!existingUsdPrice) {
            // Add USD price to existing prices
            const updatedPrices = [
              ...(currentVariant.prices || []),
              {
                amount: variant.usd_price,
                currency_code: "usd",
                region_id: usRegionId
              }
            ]

            // Update variant with new USD pricing
            await productService.updateVariant(variant.id, {
              prices: updatedPrices
            })

            logger.info(`✅ Added USD price: $${(variant.usd_price/100).toFixed(2)}`)
          } else {
            // Update existing USD price
            const updatedPrices = currentVariant.prices.map(p =>
              p.currency_code === "usd"
                ? { ...p, amount: variant.usd_price, region_id: usRegionId }
                : p
            )

            await productService.updateVariant(variant.id, {
              prices: updatedPrices
            })

            logger.info(`✅ Updated USD price: $${(variant.usd_price/100).toFixed(2)}`)
          }
        } else {
          logger.warn(`⚠️ Variant ${variant.id} not found`)
        }

      } catch (error) {
        logger.error(`❌ Failed to set USD pricing for ${variant.name}:`, error)
      }
    }

    logger.info('=====================================')
    logger.info('🎉 US Region setup complete!')
    logger.info(`💡 Region ID: ${usRegionId}`)
    logger.info('🏪 You can now use USD pricing in the fabric-store')

    return { regionId: usRegionId }

  } catch (error) {
    logger.error("Failed to setup US region:", error)
    throw error
  }
}