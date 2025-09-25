import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IRegionModuleService } from "@medusajs/framework/types"

// Default providers for fallback
const DEFAULT_PAYMENT_PROVIDERS = [
  { id: "pp_system_default", code: "stripe", is_installed: true, provider_id: "pp_system_default" }
]

const DEFAULT_FULFILLMENT_PROVIDERS = [
  { id: "fp_system_default", code: "manual", is_installed: true, provider_id: "fp_system_default" }
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const regionModule = req.scope.resolve<IRegionModuleService>(Modules.REGION)

    // Fetch single region with relations
    const regions = await regionModule.listRegions(
      { id },
      {
        relations: ["countries", "payment_providers", "fulfillment_providers"]
      }
    )

    const region = regions[0]

    if (!region) {
      return res.status(404).json({
        error: "Region not found"
      })
    }

    // Format region for admin UI with all required fields
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
    }

    let payment_providers = []
    if (region.payment_providers && Array.isArray(region.payment_providers) && region.payment_providers.length > 0) {
      payment_providers = region.payment_providers.map((provider: any) => ({
        id: provider?.id || provider?.provider_id || provider?.code || "",
        code: provider?.code || provider?.id || "",
        is_installed: provider?.is_installed !== false,
        provider_id: provider?.provider_id || provider?.id || ""
      }))
    } else {
      payment_providers = DEFAULT_PAYMENT_PROVIDERS
    }

    let fulfillment_providers = []
    if (region.fulfillment_providers && Array.isArray(region.fulfillment_providers) && region.fulfillment_providers.length > 0) {
      fulfillment_providers = region.fulfillment_providers.map((provider: any) => ({
        id: provider?.id || provider?.provider_id || provider?.code || "",
        code: provider?.code || provider?.id || "",
        is_installed: provider?.is_installed !== false,
        provider_id: provider?.provider_id || provider?.id || ""
      }))
    } else {
      fulfillment_providers = DEFAULT_FULFILLMENT_PROVIDERS
    }

    const formattedRegion = {
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

    res.json({ region: formattedRegion })
  } catch (error: any) {
    console.error("Error fetching region:", error)
    res.status(500).json({
      error: error?.message || "Failed to fetch region"
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const regionModule = req.scope.resolve<IRegionModuleService>(Modules.REGION)

    const data = req.body as any

    // Update region with safe data
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.currency_code !== undefined) updateData.currency_code = data.currency_code
    if (data.tax_rate !== undefined) updateData.tax_rate = data.tax_rate
    if (data.tax_code !== undefined) updateData.tax_code = data.tax_code
    if (data.automatic_taxes !== undefined) updateData.automatic_taxes = data.automatic_taxes
    if (data.gift_cards_taxable !== undefined) updateData.gift_cards_taxable = data.gift_cards_taxable
    if (data.includes_tax !== undefined) updateData.includes_tax = data.includes_tax
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    const region = await regionModule.updateRegions(id, updateData)

    res.json({ region })
  } catch (error: any) {
    console.error("Error updating region:", error)
    res.status(400).json({
      error: error?.message || "Failed to update region"
    })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const regionModule = req.scope.resolve<IRegionModuleService>(Modules.REGION)

    await regionModule.deleteRegions(id)

    res.json({
      id,
      object: "region",
      deleted: true
    })
  } catch (error: any) {
    console.error("Error deleting region:", error)
    res.status(400).json({
      error: error?.message || "Failed to delete region"
    })
  }
}