/**
 * Payment Service - Disabled to Fix Deployment
 *
 * This service has been temporarily disabled due to "Class extends value undefined"
 * errors caused by incompatible MedusaService usage in Medusa v2.
 *
 * TODO: Reimplement using proper Medusa v2 service patterns
 */

// Export empty default to prevent module loading errors
export default {}

// Keep interfaces for future implementation
export interface PaymentSessionData {
  id: string
  provider_id: string
  cart_id: string
  status: string
  data: {
    client_secret?: string
    payment_intent_id?: string
    publishable_key?: string
  }
  amount: number
  currency_code: string
  created_at: Date
}

export interface CreatePaymentSessionInput {
  cart_id: string
  provider_id: string
  amount: number
  currency_code: string
  resource_id?: string
  customer_id?: string
  context?: Record<string, any>
}