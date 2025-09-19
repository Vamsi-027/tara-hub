/**
 * Debug Cart Creation API
 * Senior Medusa Developer debugging approach
 * Step-by-step analysis of cart creation issues
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { isLegacyCheckoutEnabled } from "../../../../config/feature-flags"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Check feature flag
  if (!isLegacyCheckoutEnabled()) {
    return res.status(501).json({
      error: "Cart creation is disabled",
      message: "The legacy checkout system has been disabled. Cart creation is not available.",
      code: "LEGACY_CHECKOUT_DISABLED"
    })
  }

  try {
    console.log("🔍 [DEBUG] Starting cart creation analysis...")

    const { email, region_id = "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ" } = req.body

    // Step 1: Check regions
    console.log("📍 Step 1: Checking available regions...")
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    try {
      const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code", "countries.*"],
        filters: {}
      })

      console.log("✅ Available regions:", regions.map(r => ({
        id: r.id,
        name: r.name,
        currency: r.currency_code,
        countries: r.countries?.length || 0
      })))

      const targetRegion = regions.find(r => r.id === region_id)
      if (!targetRegion) {
        return res.status(400).json({
          error: "Region not found",
          available_regions: regions.map(r => ({ id: r.id, name: r.name })),
          requested_region: region_id
        })
      }

      console.log("✅ Target region found:", {
        id: targetRegion.id,
        name: targetRegion.name,
        currency: targetRegion.currency_code
      })

    } catch (regionError) {
      console.error("❌ Region query failed:", regionError)
      return res.status(500).json({
        error: "Failed to query regions",
        message: regionError instanceof Error ? regionError.message : "Unknown error"
      })
    }

    // Step 2: Check sales channels
    console.log("🛍️ Step 2: Checking sales channels...")
    try {
      const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        fields: ["id", "name", "is_default"],
        filters: {}
      })

      console.log("✅ Available sales channels:", salesChannels.map(sc => ({
        id: sc.id,
        name: sc.name,
        is_default: sc.is_default
      })))

      const defaultSalesChannel = salesChannels.find(sc => sc.is_default) || salesChannels[0]

    } catch (channelError) {
      console.error("❌ Sales channel query failed:", channelError)
    }

    // Step 3: Try cart creation with minimal data
    console.log("🛒 Step 3: Testing cart creation...")

    const cartModule = req.scope.resolve("cart")

    // Test 1: Minimal cart data
    try {
      console.log("🧪 Test 1: Creating cart with minimal data...")
      const minimalCart = await cartModule.createCarts({
        region_id: region_id,
        currency_code: "usd"
      })

      console.log("✅ Minimal cart created:", minimalCart.id)

      // Clean up test cart
      await cartModule.deleteCarts(minimalCart.id)
      console.log("🗑️ Test cart cleaned up")

    } catch (minimalError) {
      console.error("❌ Minimal cart creation failed:", minimalError)

      // Test 2: Even more minimal
      try {
        console.log("🧪 Test 2: Creating cart with region only...")
        const regionOnlyCart = await cartModule.createCarts({
          region_id: region_id
        })

        console.log("✅ Region-only cart created:", regionOnlyCart.id)
        await cartModule.deleteCarts(regionOnlyCart.id)

      } catch (regionOnlyError) {
        console.error("❌ Region-only cart creation failed:", regionOnlyError)

        // Test 3: No parameters
        try {
          console.log("🧪 Test 3: Creating cart with no parameters...")
          const emptyCart = await cartModule.createCarts({})

          console.log("✅ Empty cart created:", emptyCart.id)
          await cartModule.deleteCarts(emptyCart.id)

        } catch (emptyError) {
          console.error("❌ Empty cart creation failed:", emptyError)

          return res.status(500).json({
            error: "All cart creation methods failed",
            tests: {
              minimal: minimalError instanceof Error ? minimalError.message : "Failed",
              regionOnly: regionOnlyError instanceof Error ? regionOnlyError.message : "Failed",
              empty: emptyError instanceof Error ? emptyError.message : "Failed"
            }
          })
        }
      }
    }

    // Step 4: Test with email
    if (email) {
      console.log("📧 Step 4: Testing cart creation with email...")
      try {
        const emailCart = await cartModule.createCarts({
          region_id: region_id,
          currency_code: "usd",
          email: email
        })

        console.log("✅ Email cart created:", emailCart.id)
        await cartModule.deleteCarts(emailCart.id)

      } catch (emailError) {
        console.error("❌ Email cart creation failed:", emailError)
        return res.status(500).json({
          error: "Cart creation with email failed",
          message: emailError instanceof Error ? emailError.message : "Unknown error"
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: "Cart creation debugging completed successfully",
      region_id: region_id,
      email: email || "not provided",
      tests_passed: true
    })

  } catch (error) {
    console.error("❌ Debug cart creation failed:", error)

    return res.status(500).json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}