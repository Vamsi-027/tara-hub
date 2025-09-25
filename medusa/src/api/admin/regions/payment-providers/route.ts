import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const PAYMENT_PROVIDERS = [
  {
    id: "pp_stripe_stripe",
    code: "stripe",
    name: "Stripe",
    is_installed: true,
    provider_id: "pp_stripe_stripe"
  },
  {
    id: "pp_paypal_paypal",
    code: "paypal",
    name: "PayPal",
    is_installed: false,
    provider_id: "pp_paypal_paypal"
  },
  {
    id: "pp_system_default",
    code: "manual",
    name: "Manual Payment",
    is_installed: true,
    provider_id: "pp_system_default"
  }
]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    res.json({
      payment_providers: PAYMENT_PROVIDERS,
      count: PAYMENT_PROVIDERS.length
    })
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch payment providers",
      payment_providers: []
    })
  }
}