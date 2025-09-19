/**
 * Money Formatting Utilities
 *
 * Shared utilities for formatting prices and currencies.
 * These are safe to use with both legacy and new checkout flows.
 */

/**
 * Format cents to dollar string
 * @param cents - Amount in cents
 * @param includeSymbol - Whether to include $ symbol
 * @returns Formatted price string
 */
export function formatPrice(cents: number, includeSymbol: boolean = true): string {
  const dollars = cents / 100
  const formatted = dollars.toFixed(2)
  return includeSymbol ? `$${formatted}` : formatted
}

/**
 * Format currency with proper locale
 * @param amount - Amount in smallest currency unit (cents for USD)
 * @param currencyCode - ISO 4217 currency code
 * @param locale - Locale string (default: en-US)
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  const value = amount / 100 // Convert from cents
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(value)
}

/**
 * Parse dollar string to cents
 * @param dollarString - String like "$10.00" or "10.00"
 * @returns Amount in cents
 */
export function parsePriceToCents(dollarString: string): number {
  const cleanString = dollarString.replace(/[$,]/g, '')
  const dollars = parseFloat(cleanString)
  if (isNaN(dollars)) {
    return 0
  }
  return Math.round(dollars * 100)
}

/**
 * Calculate tax amount
 * @param subtotal - Subtotal in cents
 * @param taxRate - Tax rate as decimal (0.0875 for 8.75%)
 * @returns Tax amount in cents
 */
export function calculateTax(subtotal: number, taxRate: number = 0.0875): number {
  return Math.round(subtotal * taxRate)
}

/**
 * Calculate order totals
 * @param items - Array of items with price and quantity
 * @param shippingCost - Shipping cost in cents
 * @param taxRate - Tax rate as decimal
 * @returns Object with subtotal, tax, shipping, and total
 */
export function calculateTotals(
  items: Array<{ price: number; quantity: number; yardage?: number }>,
  shippingCost: number = 0,
  taxRate: number = 0.0875
): {
  subtotal: number
  tax: number
  shipping: number
  total: number
} {
  const subtotal = items.reduce((sum, item) => {
    // For fabric items with yardage, multiply price by yardage
    // For regular items, multiply price by quantity
    const itemTotal = item.yardage
      ? item.price * item.yardage
      : item.price * item.quantity
    return sum + itemTotal
  }, 0)

  const tax = calculateTax(subtotal, taxRate)
  const total = subtotal + tax + shippingCost

  return {
    subtotal,
    tax,
    shipping: shippingCost,
    total,
  }
}

/**
 * Format order number for display
 * @param orderId - Raw order ID
 * @returns Formatted order number
 */
export function formatOrderNumber(orderId: string): string {
  // Extract numeric part if present
  const match = orderId.match(/\d+/)
  if (match) {
    return `#${match[0]}`
  }
  // Fallback to last 6 characters
  return `#${orderId.slice(-6).toUpperCase()}`
}

/**
 * Get currency symbol
 * @param currencyCode - ISO 4217 currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
  }
  return symbols[currencyCode.toUpperCase()] || currencyCode
}