import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const FULFILLMENT_PROVIDERS = [
  {
    id: "fp_manual",
    code: "manual",
    name: "Manual Fulfillment",
    is_installed: true,
    provider_id: "fp_manual"
  },
  {
    id: "fp_digital",
    code: "digital",
    name: "Digital Fulfillment",
    is_installed: true,
    provider_id: "fp_digital"
  },
  {
    id: "fp_fedex",
    code: "fedex",
    name: "FedEx",
    is_installed: false,
    provider_id: "fp_fedex"
  },
  {
    id: "fp_ups",
    code: "ups",
    name: "UPS",
    is_installed: false,
    provider_id: "fp_ups"
  }
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    res.json({
      fulfillment_providers: FULFILLMENT_PROVIDERS,
      count: FULFILLMENT_PROVIDERS.length
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch fulfillment providers",
      fulfillment_providers: []
    })
  }
}