import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

/**
 * Middleware to fix region data for admin UI
 * The admin UI expects certain fields that may be undefined
 * This prevents split() errors on undefined values
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
      data.regions = data.regions.map(region => {
        // Fix countries array - ensure each country has required fields
        const fixedCountries = (region.countries || []).map((country: any) => {
          if (typeof country === 'string') {
            return {
              iso_2: country,
              iso_3: "",
              name: country,
              display_name: country
            }
          }
          return {
            ...country,
            iso_2: country?.iso_2 || country?.iso || "",
            iso_3: country?.iso_3 || "",
            name: country?.name || country?.display_name || "",
            display_name: country?.display_name || country?.name || ""
          }
        })

        // Fix providers arrays - ensure proper format
        const fixedPaymentProviders = (region.payment_providers || []).map((provider: any) => {
          if (typeof provider === 'string') {
            return { id: provider, is_installed: true }
          }
          return {
            ...provider,
            id: provider?.id || provider?.provider_id || "",
            is_installed: provider?.is_installed !== false
          }
        })

        const fixedFulfillmentProviders = (region.fulfillment_providers || []).map((provider: any) => {
          if (typeof provider === 'string') {
            return { id: provider, is_installed: true }
          }
          return {
            ...provider,
            id: provider?.id || provider?.provider_id || "",
            is_installed: provider?.is_installed !== false
          }
        })

        return {
          ...region,
          // Ensure required fields exist
          currency_code: region.currency_code || "usd",
          tax_rate: region.tax_rate || 0,
          tax_code: region.tax_code || null,
          includes_tax: region.includes_tax || false,
          countries: fixedCountries,
          payment_providers: fixedPaymentProviders,
          fulfillment_providers: fixedFulfillmentProviders,
          metadata: region.metadata || {},
          created_at: region.created_at || new Date().toISOString(),
          updated_at: region.updated_at || new Date().toISOString(),
          deleted_at: region.deleted_at || null,
          // Fix potential undefined fields that cause .split() errors
          automatic_taxes: region.automatic_taxes !== undefined ? region.automatic_taxes : false,
          gift_cards_taxable: region.gift_cards_taxable !== undefined ? region.gift_cards_taxable : true,
          // Add safe string fields that might be split
          name: region.name || "Unnamed Region",
        }
      })
    }

    // Fix single region response
    if (data?.region) {
      // Apply same fixes to single region
      const region = data.region

      const fixedCountries = (region.countries || []).map((country: any) => {
        if (typeof country === 'string') {
          return {
            iso_2: country,
            iso_3: "",
            name: country,
            display_name: country
          }
        }
        return {
          ...country,
          iso_2: country?.iso_2 || country?.iso || "",
          iso_3: country?.iso_3 || "",
          name: country?.name || country?.display_name || "",
          display_name: country?.display_name || country?.name || ""
        }
      })

      const fixedPaymentProviders = (region.payment_providers || []).map((provider: any) => {
        if (typeof provider === 'string') {
          return { id: provider, is_installed: true }
        }
        return {
          ...provider,
          id: provider?.id || provider?.provider_id || "",
          is_installed: provider?.is_installed !== false
        }
      })

      const fixedFulfillmentProviders = (region.fulfillment_providers || []).map((provider: any) => {
        if (typeof provider === 'string') {
          return { id: provider, is_installed: true }
        }
        return {
          ...provider,
          id: provider?.id || provider?.provider_id || "",
          is_installed: provider?.is_installed !== false
        }
      })

      data.region = {
        ...region,
        currency_code: region.currency_code || "usd",
        tax_rate: region.tax_rate || 0,
        tax_code: region.tax_code || null,
        includes_tax: region.includes_tax || false,
        countries: fixedCountries,
        payment_providers: fixedPaymentProviders,
        fulfillment_providers: fixedFulfillmentProviders,
        metadata: region.metadata || {},
        created_at: region.created_at || new Date().toISOString(),
        updated_at: region.updated_at || new Date().toISOString(),
        deleted_at: region.deleted_at || null,
        automatic_taxes: region.automatic_taxes !== undefined ? region.automatic_taxes : false,
        gift_cards_taxable: region.gift_cards_taxable !== undefined ? region.gift_cards_taxable : true,
        name: region.name || "Unnamed Region",
      }
    }

    return originalJson(data)
  }

  next()
}