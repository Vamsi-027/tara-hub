/**
 * Cart Service - Disabled to Fix Deployment
 *
 * This service has been temporarily disabled due to "Class extends value undefined"
 * errors caused by incompatible MedusaService usage in Medusa v2.
 *
 * TODO: Reimplement using proper Medusa v2 service patterns
 */

// Export empty default to prevent module loading errors
export default {}

// Keep interfaces for future implementation
export interface CreateCartInput {
  region_id: string
  email?: string
  currency_code?: string
  customer_id?: string
  sales_channel_id?: string
  metadata?: Record<string, any>
}

export interface AddLineItemInput {
  variant_id: string
  quantity: number
  metadata?: Record<string, any>
}

export interface UpdateLineItemInput {
  quantity?: number
  metadata?: Record<string, any>
}

export interface AddressInput {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone?: string
}

export interface SetAddressesInput {
  shipping_address: AddressInput
  billing_address?: AddressInput
}