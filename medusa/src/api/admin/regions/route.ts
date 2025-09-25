import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IRegionModuleService } from "@medusajs/framework/types"

// Default countries list
const DEFAULT_COUNTRIES = [
  { iso_2: "us", iso_3: "usa", num_code: "840", name: "United States", display_name: "United States" },
  { iso_2: "gb", iso_3: "gbr", num_code: "826", name: "United Kingdom", display_name: "United Kingdom" },
  { iso_2: "de", iso_3: "deu", num_code: "276", name: "Germany", display_name: "Germany" },
  { iso_2: "fr", iso_3: "fra", num_code: "250", name: "France", display_name: "France" },
  { iso_2: "es", iso_3: "esp", num_code: "724", name: "Spain", display_name: "Spain" },
  { iso_2: "it", iso_3: "ita", num_code: "380", name: "Italy", display_name: "Italy" },
  { iso_2: "ca", iso_3: "can", num_code: "124", name: "Canada", display_name: "Canada" },
  { iso_2: "au", iso_3: "aus", num_code: "036", name: "Australia", display_name: "Australia" },
]

// Default providers
const DEFAULT_PAYMENT_PROVIDERS = [
  { id: "pp_system_default", code: "stripe", is_installed: true }
]

const DEFAULT_FULFILLMENT_PROVIDERS = [
  { id: "fp_system_default", code: "manual", is_installed: true }
]

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

    // Format regions for admin UI with all required fields
    const formattedRegions = regions.map((region: any) => {
      // Ensure countries array exists and has proper structure
      let countries = []
      if (region.countries && Array.isArray(region.countries) && region.countries.length > 0) {
        countries = region.countries.map((country: any) => ({
          id: country?.id || `country_${country?.iso_2 || 'unknown'}`,
          iso_2: country?.iso_2 || country?.iso || "",
          iso_3: country?.iso_3 || "",
          num_code: country?.num_code || "",
          name: country?.name || country?.display_name || "",
          display_name: country?.display_name || country?.name || "",
          region_id: region.id
        }))
      } else {
        // Provide empty array with proper structure for UI
        countries = []
      }

      // Ensure payment providers have proper structure
      let payment_providers = []
      if (region.payment_providers && Array.isArray(region.payment_providers)) {
        payment_providers = region.payment_providers.map((provider: any) => ({
          id: provider?.id || provider?.provider_id || provider?.code || "",
          code: provider?.code || provider?.id || "",
          is_installed: provider?.is_installed !== false,
          provider_id: provider?.provider_id || provider?.id || ""
        }))
      } else {
        payment_providers = DEFAULT_PAYMENT_PROVIDERS
      }

      // Ensure fulfillment providers have proper structure
      let fulfillment_providers = []
      if (region.fulfillment_providers && Array.isArray(region.fulfillment_providers)) {
        fulfillment_providers = region.fulfillment_providers.map((provider: any) => ({
          id: provider?.id || provider?.provider_id || provider?.code || "",
          code: provider?.code || provider?.id || "",
          is_installed: provider?.is_installed !== false,
          provider_id: provider?.provider_id || provider?.id || ""
        }))
      } else {
        fulfillment_providers = DEFAULT_FULFILLMENT_PROVIDERS
      }

      return {
        id: region.id || "",
        name: region.name || "Unnamed Region",
        currency_code: region.currency_code || "usd",
        tax_rate: region.tax_rate || 0,
        tax_code: region.tax_code || null,
        automatic_taxes: region.automatic_taxes === true,
        gift_cards_taxable: region.gift_cards_taxable !== false,
        includes_tax: region.includes_tax === true,
        metadata: region.metadata || {},
        created_at: region.created_at || new Date().toISOString(),
        updated_at: region.updated_at || new Date().toISOString(),
        deleted_at: region.deleted_at || null,
        countries: countries,
        payment_providers: payment_providers,
        fulfillment_providers: fulfillment_providers,
        // Required fields for admin UI
        tax_provider_id: region.tax_provider_id || null,
        tax_inclusive_pricing: region.tax_inclusive_pricing === true,
        // Additional fields that prevent UI errors
        currency: region.currency_code || "usd",
        tax_provider: null,
        payment_provider_ids: payment_providers.map(p => p.id).filter(Boolean),
        fulfillment_provider_ids: fulfillment_providers.map(p => p.id).filter(Boolean),
        country_codes: countries.map(c => c.iso_2).filter(Boolean)
      }
    })

    res.json({
      regions: formattedRegions,
      count: formattedRegions.length,
      offset: 0,
      limit: formattedRegions.length,
      // Include available countries for region creation
      available_countries: DEFAULT_COUNTRIES
    })
  } catch (error: any) {
    console.error("Error fetching regions:", error)

    // Return empty regions array on error to prevent UI crash
    res.json({
      regions: [],
      count: 0,
      offset: 0,
      limit: 0,
      available_countries: DEFAULT_COUNTRIES,
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