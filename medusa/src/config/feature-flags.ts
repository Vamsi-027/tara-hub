/**
 * Feature Flags Configuration
 *
 * This module manages feature flags for the Medusa backend,
 * allowing controlled rollout and rollback of features.
 */

export interface FeatureFlags {
  /**
   * Enable legacy checkout flow (cart, checkout, payment)
   * When true: Uses existing cart/checkout/payment implementation
   * When false: Disables legacy endpoints, preparing for new implementation
   * Default: true (for backward compatibility)
   */
  enableLegacyCheckout: boolean;

  /**
   * Enable debug logging for feature flags
   */
  debugFeatureFlags: boolean;
}

class FeatureFlagManager {
  private flags: FeatureFlags;

  constructor() {
    this.flags = this.loadFlags();
    this.logConfiguration();
  }

  private loadFlags(): FeatureFlags {
    return {
      enableLegacyCheckout: this.parseBoolean(
        process.env.ENABLE_LEGACY_CHECKOUT,
        true // Default to true for backward compatibility
      ),
      debugFeatureFlags: this.parseBoolean(
        process.env.DEBUG_FEATURE_FLAGS,
        false
      ),
    };
  }

  private parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  private logConfiguration(): void {
    if (this.flags.debugFeatureFlags || process.env.NODE_ENV === 'development') {
      console.log('🚩 Feature Flags Configuration:');
      console.log(`  - Legacy Checkout: ${this.flags.enableLegacyCheckout ? 'ENABLED' : 'DISABLED'}`);
      console.log(`  - Debug Logging: ${this.flags.debugFeatureFlags ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Check if legacy checkout is enabled
   */
  isLegacyCheckoutEnabled(): boolean {
    return this.flags.enableLegacyCheckout;
  }

  /**
   * Get all feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Check a specific feature flag by key
   */
  isEnabled(flagKey: keyof FeatureFlags): boolean {
    return this.flags[flagKey];
  }

  /**
   * Log feature flag check (for debugging)
   */
  logCheck(feature: string, enabled: boolean): void {
    if (this.flags.debugFeatureFlags) {
      console.log(`🚩 Feature check: ${feature} = ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager();

// Export convenience functions
export const isLegacyCheckoutEnabled = () => featureFlags.isLegacyCheckoutEnabled();
export const isFeatureEnabled = (flag: keyof FeatureFlags) => featureFlags.isEnabled(flag);