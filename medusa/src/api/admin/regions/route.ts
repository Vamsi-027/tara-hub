import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IRegionModuleService } from "@medusajs/framework/types"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Use the RegionModule directly
    const regionModule = req.scope.resolve<IRegionModuleService>(Modules.REGION)

    // Fetch all regions with relations
    const regions = await regionModule.listRegions(
      {},
      {
        relations: ["countries", "payment_providers", "fulfillment_providers"],
        select: [
          "id",
          "name",
          "currency_code",
          "tax_rate",
          "tax_code",
          "automatic_taxes",
          "gift_cards_taxable",
          "metadata",
          "created_at",
          "updated_at"
        ]
      }
    )

    // Format regions for admin UI
    const formattedRegions = regions.map((region: any) => {
      // Safely format countries
      const countries = (region.countries || []).map((country: any) => ({
        id: country?.id || "",
        iso_2: country?.iso_2 || country?.iso || "",
        iso_3: country?.iso_3 || "",
        num_code: country?.num_code || "",
        name: country?.name || "",
        display_name: country?.display_name || country?.name || "",
        region_id: region.id,
        ...country
      }))

      // Safely format payment providers
      const payment_providers = (region.payment_providers || []).map((provider: any) => ({
        id: provider?.id || provider?.provider_id || "",
        is_installed: true,
        ...provider
      }))

      // Safely format fulfillment providers
      const fulfillment_providers = (region.fulfillment_providers || []).map((provider: any) => ({
        id: provider?.id || provider?.provider_id || "",
        is_installed: true,
        ...provider
      }))

      return {
        id: region.id,
        name: region.name || "Unnamed Region",
        currency_code: region.currency_code || "usd",
        tax_rate: region.tax_rate || 0,
        tax_code: region.tax_code || null,
        automatic_taxes: region.automatic_taxes !== undefined ? region.automatic_taxes : false,
        gift_cards_taxable: region.gift_cards_taxable !== undefined ? region.gift_cards_taxable : true,
        includes_tax: region.includes_tax || false,
        metadata: region.metadata || {},
        created_at: region.created_at || new Date().toISOString(),
        updated_at: region.updated_at || new Date().toISOString(),
        deleted_at: region.deleted_at || null,
        countries,
        payment_providers,
        fulfillment_providers,
        // Additional fields that might be needed
        tax_provider_id: region.tax_provider_id || null,
        tax_inclusive_pricing: region.tax_inclusive_pricing || false
      }
    })

    res.json({
      regions: formattedRegions,
      count: formattedRegions.length,
      offset: 0,
      limit: formattedRegions.length
    })
  } catch (error: any) {
    console.error("Error fetching regions:", error)

    // Return empty regions array on error to prevent UI crash
    res.json({
      regions: [],
      count: 0,
      offset: 0,
      limit: 0,
      error: error?.message || "Failed to fetch regions"
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const regionModule = req.scope.resolve<IRegionModuleService>(Modules.REGION)

    const data = req.body as any

    // Create region with safe defaults
    const regionData = {
      name: data.name || "New Region",
      currency_code: data.currency_code || "usd",
      tax_rate: data.tax_rate || 0,
      tax_code: data.tax_code || null,
      automatic_taxes: data.automatic_taxes || false,
      gift_cards_taxable: data.gift_cards_taxable !== false,
      includes_tax: data.includes_tax || false,
      metadata: data.metadata || {},
      countries: data.countries || [],
      payment_providers: data.payment_providers || [],
      fulfillment_providers: data.fulfillment_providers || []
    }

    const region = await regionModule.createRegions(regionData)

    res.json({ region })
  } catch (error: any) {
    console.error("Error creating region:", error)
    res.status(400).json({
      error: error?.message || "Failed to create region"
    })
  }
}