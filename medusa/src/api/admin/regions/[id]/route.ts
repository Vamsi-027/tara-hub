import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IRegionModuleService } from "@medusajs/framework/types"

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

    // Format region for admin UI
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

    const payment_providers = (region.payment_providers || []).map((provider: any) => ({
      id: provider?.id || provider?.provider_id || "",
      is_installed: true,
      ...provider
    }))

    const fulfillment_providers = (region.fulfillment_providers || []).map((provider: any) => ({
      id: provider?.id || provider?.provider_id || "",
      is_installed: true,
      ...provider
    }))

    const formattedRegion = {
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
      tax_provider_id: region.tax_provider_id || null,
      tax_inclusive_pricing: region.tax_inclusive_pricing || false
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