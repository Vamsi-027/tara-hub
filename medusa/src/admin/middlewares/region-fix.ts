import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

/**
 * Middleware to fix region data for admin UI
 * The admin UI expects certain fields that may be undefined
 */
export async function regionDataFix(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Intercept region responses
  const originalJson = res.json.bind(res)

  res.json = function(data: any) {
    // Fix region data if present
    if (data?.regions && Array.isArray(data.regions)) {
      data.regions = data.regions.map(region => ({
        ...region,
        // Ensure required fields exist
        currency_code: region.currency_code || "usd",
        tax_rate: region.tax_rate || 0,
        tax_code: region.tax_code || null,
        includes_tax: region.includes_tax || false,
        countries: region.countries || [],
        payment_providers: region.payment_providers || [],
        fulfillment_providers: region.fulfillment_providers || [],
        metadata: region.metadata || {},
        created_at: region.created_at || new Date().toISOString(),
        updated_at: region.updated_at || new Date().toISOString(),
        deleted_at: region.deleted_at || null,
        // Fix potential undefined fields that cause .split() errors
        automatic_taxes: region.automatic_taxes !== undefined ? region.automatic_taxes : false,
        gift_cards_taxable: region.gift_cards_taxable !== undefined ? region.gift_cards_taxable : true,
      }))
    }

    // Fix single region response
    if (data?.region) {
      data.region = {
        ...data.region,
        currency_code: data.region.currency_code || "usd",
        tax_rate: data.region.tax_rate || 0,
        tax_code: data.region.tax_code || null,
        includes_tax: data.region.includes_tax || false,
        countries: data.region.countries || [],
        payment_providers: data.region.payment_providers || [],
        fulfillment_providers: data.region.fulfillment_providers || [],
        metadata: data.region.metadata || {},
        created_at: data.region.created_at || new Date().toISOString(),
        updated_at: data.region.updated_at || new Date().toISOString(),
        deleted_at: data.region.deleted_at || null,
        automatic_taxes: data.region.automatic_taxes !== undefined ? data.region.automatic_taxes : false,
        gift_cards_taxable: data.region.gift_cards_taxable !== undefined ? data.region.gift_cards_taxable : true,
      }
    }

    return originalJson(data)
  }

  next()
}