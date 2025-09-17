/**
 * Medusa Configuration with Dynamic Region Selection
 * Industry best practices for multi-region e-commerce
 */

interface RegionConfig {
  id: string
  currency: string
  locale: string
  name: string
  tax_included: boolean
  shipping_threshold?: number
}

interface MedusaConfig {
  backendUrl: string
  publishableKey: string
  regions: Record<string, RegionConfig>
  defaultRegion: string
}

// Region configurations following best practices
export const REGION_CONFIGS: Record<string, RegionConfig> = {
  usd: {
    id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD && !process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD.includes('PLACEHOLDER')
      ? process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD
      : '', // Will be set after region creation in Medusa Admin
    currency: 'usd',
    locale: 'en-US',
    name: 'United States',
    tax_included: false, // US shows prices without tax
    shipping_threshold: 500 // Free shipping over $500
  },
  eur: {
    id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_EUR || 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN',
    currency: 'eur',
    locale: 'en-GB',
    name: 'Europe',
    tax_included: true, // EU shows prices with VAT included
    shipping_threshold: 400 // Free shipping over €400
  }
}

/**
 * Get region based on user's location or preference
 */
export function getUserRegion(): RegionConfig {
  // Check for user preference in localStorage
  if (typeof window !== 'undefined') {
    const savedRegion = localStorage.getItem('preferred_region')
    if (savedRegion && REGION_CONFIGS[savedRegion]) {
      return REGION_CONFIGS[savedRegion]
    }
  }

  // Check for region in URL params (for marketing campaigns)
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const urlRegion = params.get('region')
    if (urlRegion && REGION_CONFIGS[urlRegion]) {
      return REGION_CONFIGS[urlRegion]
    }
  }

  // Geolocation-based detection (simplified)
  if (typeof window !== 'undefined') {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone.includes('America')) {
      return REGION_CONFIGS.usd
    }
    if (timezone.includes('Europe')) {
      return REGION_CONFIGS.eur
    }
  }

  // Default to USD for now (US is primary market)
  const defaultRegion = process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION || 'usd'
  return REGION_CONFIGS[defaultRegion] || REGION_CONFIGS.usd
}

/**
 * Save user's region preference
 */
export function saveUserRegion(regionKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred_region', regionKey)
  }
}

/**
 * Get the current region ID for API calls
 */
export function getCurrentRegionId(): string {
  const region = getUserRegion()

  // Fallback to EUR region if USD region not yet created
  if (!region.id && region.currency === 'usd') {
    console.warn('USD region not configured, falling back to EUR region')
    return REGION_CONFIGS.eur.id
  }

  return region.id
}

/**
 * Format price based on region settings
 */
export function formatPrice(amount: number, regionKey?: string): string {
  const region = regionKey ? REGION_CONFIGS[regionKey] : getUserRegion()

  const formatter = new Intl.NumberFormat(region.locale, {
    style: 'currency',
    currency: region.currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  return formatter.format(amount)
}

/**
 * Get shipping message based on region and cart total
 */
export function getShippingMessage(cartTotal: number, regionKey?: string): string {
  const region = regionKey ? REGION_CONFIGS[regionKey] : getUserRegion()

  if (!region.shipping_threshold) {
    return 'Standard shipping rates apply'
  }

  if (cartTotal >= region.shipping_threshold) {
    return '✅ Free shipping on this order!'
  }

  const remaining = region.shipping_threshold - cartTotal
  const formattedRemaining = formatPrice(remaining, regionKey)

  return `Add ${formattedRemaining} more for free shipping`
}

/**
 * Get tax message based on region
 */
export function getTaxMessage(regionKey?: string): string {
  const region = regionKey ? REGION_CONFIGS[regionKey] : getUserRegion()

  if (region.tax_included) {
    return 'VAT included'
  }

  return 'Tax calculated at checkout'
}

/**
 * Convert price between regions (approximate)
 */
export function convertPrice(
  amount: number,
  fromRegion: string,
  toRegion: string
): number {
  // Simple conversion rates (should be fetched from API in production)
  const rates: Record<string, Record<string, number>> = {
    usd: {
      usd: 1.0,
      eur: 0.92
    },
    eur: {
      usd: 1.09,
      eur: 1.0
    }
  }

  const rate = rates[fromRegion]?.[toRegion] || 1.0
  return Math.round(amount * rate * 100) / 100
}

/**
 * Get Medusa configuration
 */
export function getMedusaConfig(): MedusaConfig {
  return {
    backendUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://medusa-backend-production-3655.up.railway.app',
    publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
    regions: REGION_CONFIGS,
    defaultRegion: process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION || 'usd'
  }
}

// Export region detection utilities
export function isUSRegion(): boolean {
  return getUserRegion().currency === 'usd'
}

export function isEURegion(): boolean {
  return getUserRegion().currency === 'eur'
}

// Currency symbols for quick reference
export const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: '$',
  eur: '€',
  gbp: '£',
  jpy: '¥',
  cad: 'C$',
  aud: 'A$'
}

export default {
  getUserRegion,
  saveUserRegion,
  getCurrentRegionId,
  formatPrice,
  getShippingMessage,
  getTaxMessage,
  convertPrice,
  getMedusaConfig,
  isUSRegion,
  isEURegion,
  REGION_CONFIGS,
  CURRENCY_SYMBOLS
}