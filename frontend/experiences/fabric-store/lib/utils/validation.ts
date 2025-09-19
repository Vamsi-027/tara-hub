/**
 * Validation Utilities
 *
 * Shared validation functions for forms and data.
 */

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (US format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validate ZIP code (US format)
 */
export function isValidZipCode(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/
  return zipRegex.test(zip)
}

/**
 * Validate credit card number (basic Luhn algorithm)
 */
export function isValidCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s/g, '')
  if (!/^\d+$/.test(cleaned)) return false

  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Validate expiry date (MM/YY format)
 */
export function isValidExpiryDate(expiry: string): boolean {
  const [month, year] = expiry.split('/')
  if (!month || !year) return false

  const monthNum = parseInt(month, 10)
  const yearNum = parseInt(year, 10)

  if (monthNum < 1 || monthNum > 12) return false

  const currentYear = new Date().getFullYear() % 100
  const currentMonth = new Date().getMonth() + 1

  if (yearNum < currentYear) return false
  if (yearNum === currentYear && monthNum < currentMonth) return false

  return true
}

/**
 * Validate CVV
 */
export function isValidCVV(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv)
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

/**
 * Validate address fields
 */
export interface AddressValidation {
  isValid: boolean
  errors: Record<string, string>
}

export function validateAddress(address: {
  firstName?: string
  lastName?: string
  address1?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
}): AddressValidation {
  const errors: Record<string, string> = {}

  if (!address.firstName?.trim()) {
    errors.firstName = 'First name is required'
  }

  if (!address.lastName?.trim()) {
    errors.lastName = 'Last name is required'
  }

  if (!address.address1?.trim()) {
    errors.address1 = 'Address is required'
  }

  if (!address.city?.trim()) {
    errors.city = 'City is required'
  }

  if (!address.state?.trim()) {
    errors.state = 'State is required'
  }

  if (!address.zipCode?.trim()) {
    errors.zipCode = 'ZIP code is required'
  } else if (!isValidZipCode(address.zipCode)) {
    errors.zipCode = 'Invalid ZIP code format'
  }

  if (address.phone && !isValidPhone(address.phone)) {
    errors.phone = 'Invalid phone number format'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}