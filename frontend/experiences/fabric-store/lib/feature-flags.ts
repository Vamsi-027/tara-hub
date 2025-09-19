/**
 * Feature Flags Configuration
 *
 * Controls feature rollout for the fabric-store experience.
 * Allows safe migration from legacy to new implementations.
 */

interface FeatureFlags {
  /**
   * Enable new Medusa-based checkout flow
   * When true: Uses Medusa cart API and Stripe Payment Element
   * When false: Uses legacy LocalStorage cart and CardElement
   */
  useNewCheckout: boolean

  /**
   * Enable guest order lookup
   * When true: Shows order lookup form for non-authenticated users
   */
  enableGuestOrderLookup: boolean

  /**
   * Enable debug mode for development
   */
  debug: boolean
}

class FeatureFlagManager {
  private flags: FeatureFlags

  constructor() {
    this.flags = this.loadFlags()
    this.logConfiguration()
  }

  private loadFlags(): FeatureFlags {
    return {
      useNewCheckout: this.parseBoolean(
        process.env.NEXT_PUBLIC_USE_NEW_CHECKOUT,
        false // Default to false for safety
      ),
      enableGuestOrderLookup: this.parseBoolean(
        process.env.NEXT_PUBLIC_ENABLE_GUEST_ORDER_LOOKUP,
        true
      ),
      debug: this.parseBoolean(
        process.env.NEXT_PUBLIC_DEBUG,
        process.env.NODE_ENV === 'development'
      ),
    }
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) {
      return defaultValue
    }
    return value.toLowerCase() === 'true' || value === '1'
  }

  private logConfiguration(): void {
    if (this.flags.debug || process.env.NODE_ENV === 'development') {
      console.log('🚩 Feature Flags Configuration:')
      console.log(`  - New Checkout: ${this.flags.useNewCheckout ? 'ENABLED' : 'DISABLED'}`)
      console.log(`  - Guest Order Lookup: ${this.flags.enableGuestOrderLookup ? 'ENABLED' : 'DISABLED'}`)
      console.log(`  - Debug Mode: ${this.flags.debug ? 'ON' : 'OFF'}`)
    }
  }

  /**
   * Check if new checkout flow is enabled
   */
  isNewCheckoutEnabled(): boolean {
    return this.flags.useNewCheckout
  }

  /**
   * Check if guest order lookup is enabled
   */
  isGuestOrderLookupEnabled(): boolean {
    return this.flags.enableGuestOrderLookup
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.flags.debug
  }

  /**
   * Get all feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags }
  }

  /**
   * Check a specific feature flag by key
   */
  isEnabled(flagKey: keyof FeatureFlags): boolean {
    return this.flags[flagKey]
  }

  /**
   * Log feature flag check (for debugging)
   */
  logCheck(feature: string, enabled: boolean): void {
    if (this.flags.debug) {
      console.log(`🚩 Feature check: ${feature} = ${enabled ? 'ENABLED' : 'DISABLED'}`)
    }
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager()

// Export convenience functions
export const isNewCheckoutEnabled = () => featureFlags.isNewCheckoutEnabled()
export const isGuestOrderLookupEnabled = () => featureFlags.isGuestOrderLookupEnabled()
export const isDebugEnabled = () => featureFlags.isDebugEnabled()

// Export type
export type { FeatureFlags }