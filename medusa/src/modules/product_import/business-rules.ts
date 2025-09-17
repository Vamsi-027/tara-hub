/*
  Business Rules Validation for Fabric-Specific and Inventory Consistency

  This module provides sophisticated business logic validation including:
  - Fabric product configuration validation
  - Inventory consistency checks
  - Pricing validation and margin analysis
  - Cross-product relationship validation
  - Industry-specific rules for fabric/textile business
*/

import { ProductRow } from './schemas';
import { ValidationIssue } from './data-integrity';

export interface BusinessRuleConfig {
  fabricRules: FabricBusinessRules;
  inventoryRules: InventoryBusinessRules;
  pricingRules: PricingBusinessRules;
  generalRules: GeneralBusinessRules;
}

export interface FabricBusinessRules {
  minSwatchPrice: number;
  maxSwatchPrice: number;
  minFabricPrice: number;
  maxFabricPrice: number;
  requiredSelections: {
    min: number;
    max: number;
  };
  allowedConfigTypes: string[];
  requiredFilters: string[];
  swatchSetLimits: {
    maxSelections: number;
    minPrice: number;
  };
  fabricYardLimits: {
    minOrderQuantity: number;
    maxOrderQuantity: number;
  };
}

export interface InventoryBusinessRules {
  defaultManageInventory: boolean;
  allowNegativeStock: boolean;
  maxStockQuantity: number;
  lowStockThreshold: number;
  requiredLocationFields: string[];
  inventoryPolicies: {
    fabricProducts: InventoryPolicy;
    swatchProducts: InventoryPolicy;
    regularProducts: InventoryPolicy;
  };
}

export interface InventoryPolicy {
  trackInventory: boolean;
  allowBackorder: boolean;
  reservationStrategy: 'immediate' | 'on_fulfillment' | 'none';
  lowStockAction: 'notify' | 'hide' | 'mark_unavailable';
}

export interface PricingBusinessRules {
  requiredCurrencies: string[];
  minimumMargin: number; // percentage
  maximumDiscount: number; // percentage
  currencyConversionRules: Record<string, CurrencyRule>;
  priceValidation: {
    requireConsistentMargins: boolean;
    allowZeroPrices: boolean;
    maxPriceVariation: number; // percentage between currencies
  };
}

export interface CurrencyRule {
  conversionRate?: number;
  roundingRules: 'up' | 'down' | 'nearest';
  minimumAmount: number;
}

export interface GeneralBusinessRules {
  handleGeneration: {
    autoGenerate: boolean;
    prefix?: string;
    suffix?: string;
    format: 'kebab-case' | 'snake_case' | 'camelCase';
  };
  skuGeneration: {
    autoGenerate: boolean;
    pattern: string; // e.g., "{handle}-{type}" where {type} is SWATCH or YARD
    enforcePattern: boolean;
  };
  mediaValidation: {
    requireThumbnail: boolean;
    maxImages: number;
    allowExternalUrls: boolean;
    requiredImageSizes?: string[];
  };
  taxonomyRules: {
    maxTags: number;
    requiredCollections?: string[];
    inheritCategoryFromCollection: boolean;
  };
}

export interface BusinessValidationResult {
  isValid: boolean;
  issues: BusinessValidationIssue[];
  recommendations: BusinessRecommendation[];
  compliance: ComplianceReport;
}

export interface BusinessValidationIssue extends ValidationIssue {
  businessRule: string;
  category: ValidationCategory;
  impact: BusinessImpact;
  autoFixable: boolean;
  autoFixAction?: AutoFixAction;
}

export interface BusinessRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  field?: string;
  currentValue?: any;
  suggestedValue?: any;
  impact: BusinessImpact;
  implementation: string;
}

export interface ComplianceReport {
  fabricCompliance: number; // 0-100%
  inventoryCompliance: number; // 0-100%
  pricingCompliance: number; // 0-100%
  overallCompliance: number; // 0-100%
  criticalIssues: number;
  warningIssues: number;
  passedRules: number;
  totalRules: number;
}

export type ValidationCategory =
  | 'fabric_configuration'
  | 'inventory_policy'
  | 'pricing_strategy'
  | 'product_taxonomy'
  | 'data_consistency'
  | 'business_logic'
  | 'compliance';

export type BusinessImpact =
  | 'critical' // Blocks product creation/sale
  | 'high' // Affects customer experience significantly
  | 'medium' // May cause minor issues
  | 'low' // Best practice violation
  | 'informational'; // Suggestion only

export type RecommendationType =
  | 'pricing_optimization'
  | 'inventory_management'
  | 'fabric_configuration'
  | 'seo_optimization'
  | 'customer_experience'
  | 'operational_efficiency';

export interface AutoFixAction {
  type: string;
  parameters: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
}

export class BusinessRulesValidator {
  private config: BusinessRuleConfig;
  private industryStandards: Map<string, any> = new Map();

  constructor(config: BusinessRuleConfig) {
    this.config = config;
    this.initializeIndustryStandards();
  }

  public validateRow(row: ProductRow, rowIndex: number): BusinessValidationResult {
    const issues: BusinessValidationIssue[] = [];
    const recommendations: BusinessRecommendation[] = [];

    // Validate fabric-specific rules
    if (this.isFabricProduct(row)) {
      issues.push(...this.validateFabricRules(row, rowIndex));
      recommendations.push(...this.generateFabricRecommendations(row, rowIndex));
    }

    // Validate inventory rules
    issues.push(...this.validateInventoryRules(row, rowIndex));
    recommendations.push(...this.generateInventoryRecommendations(row, rowIndex));

    // Validate pricing rules
    issues.push(...this.validatePricingRules(row, rowIndex));
    recommendations.push(...this.generatePricingRecommendations(row, rowIndex));

    // Validate general business rules
    issues.push(...this.validateGeneralRules(row, rowIndex));
    recommendations.push(...this.generateGeneralRecommendations(row, rowIndex));

    // Generate compliance report
    const compliance = this.generateComplianceReport(issues);

    return {
      isValid: issues.filter(i => i.impact === 'critical').length === 0,
      issues,
      recommendations,
      compliance
    };
  }

  private isFabricProduct(row: ProductRow): boolean {
    return !!(row.config_type && ['configurable_fabric', 'configurable_swatch_set'].includes(row.config_type));
  }

  private validateFabricRules(row: ProductRow, rowIndex: number): BusinessValidationIssue[] {
    const issues: BusinessValidationIssue[] = [];

    // Validate configuration type
    if (!this.config.fabricRules.allowedConfigTypes.includes(row.config_type!)) {
      issues.push({
        ruleId: 'fabric_config_type',
        ruleName: 'Fabric Configuration Type',
        severity: 'error',
        message: `Invalid configuration type: ${row.config_type}`,
        field: 'config_type',
        businessRule: 'allowedConfigTypes',
        category: 'fabric_configuration',
        impact: 'critical',
        autoFixable: true,
        autoFixAction: {
          type: 'replace_value',
          parameters: { newValue: this.config.fabricRules.allowedConfigTypes[0] },
          description: `Change to ${this.config.fabricRules.allowedConfigTypes[0]}`,
          requiresConfirmation: true
        }
      });
    }

    // Validate selection limits
    if (row.min_selections !== undefined && row.max_selections !== undefined) {
      if (row.min_selections > row.max_selections) {
        issues.push({
          ruleId: 'fabric_selection_limits',
          ruleName: 'Fabric Selection Limits',
          severity: 'error',
          message: 'Minimum selections cannot exceed maximum selections',
          field: 'min_selections',
          businessRule: 'selectionLimits',
          category: 'fabric_configuration',
          impact: 'critical',
          autoFixable: true,
          autoFixAction: {
            type: 'swap_values',
            parameters: { field1: 'min_selections', field2: 'max_selections' },
            description: 'Swap min and max selection values',
            requiresConfirmation: false
          }
        });
      }

      // Check against business rules
      if (row.min_selections < this.config.fabricRules.requiredSelections.min) {
        issues.push({
          ruleId: 'fabric_min_selections',
          ruleName: 'Fabric Minimum Selections',
          severity: 'warning',
          message: `Minimum selections (${row.min_selections}) below recommended minimum (${this.config.fabricRules.requiredSelections.min})`,
          field: 'min_selections',
          businessRule: 'requiredSelections.min',
          category: 'fabric_configuration',
          impact: 'medium',
          autoFixable: true,
          autoFixAction: {
            type: 'set_minimum',
            parameters: { value: this.config.fabricRules.requiredSelections.min },
            description: `Set to recommended minimum (${this.config.fabricRules.requiredSelections.min})`,
            requiresConfirmation: false
          }
        });
      }
    }

    // Validate fabric pricing
    if (row.config_type === 'configurable_fabric') {
      const fabricPrice = this.extractPrice(row.base_price || row.retail_price);
      if (fabricPrice !== null) {
        if (fabricPrice < this.config.fabricRules.minFabricPrice) {
          issues.push({
            ruleId: 'fabric_price_too_low',
            ruleName: 'Fabric Price Validation',
            severity: 'warning',
            message: `Fabric price (${fabricPrice}) below minimum threshold (${this.config.fabricRules.minFabricPrice})`,
            field: 'base_price',
            businessRule: 'minFabricPrice',
            category: 'pricing_strategy',
            impact: 'medium',
            autoFixable: false
          });
        }

        if (fabricPrice > this.config.fabricRules.maxFabricPrice) {
          issues.push({
            ruleId: 'fabric_price_too_high',
            ruleName: 'Fabric Price Validation',
            severity: 'warning',
            message: `Fabric price (${fabricPrice}) exceeds maximum threshold (${this.config.fabricRules.maxFabricPrice})`,
            field: 'base_price',
            businessRule: 'maxFabricPrice',
            category: 'pricing_strategy',
            impact: 'high',
            autoFixable: false
          });
        }
      }
    }

    // Validate swatch pricing
    if (row.config_type === 'configurable_swatch_set') {
      const swatchPrice = this.extractPrice(row.swatch_price || row.set_price);
      if (swatchPrice !== null) {
        if (swatchPrice < this.config.fabricRules.minSwatchPrice) {
          issues.push({
            ruleId: 'swatch_price_too_low',
            ruleName: 'Swatch Price Validation',
            severity: 'warning',
            message: `Swatch price (${swatchPrice}) below minimum threshold (${this.config.fabricRules.minSwatchPrice})`,
            field: 'swatch_price',
            businessRule: 'minSwatchPrice',
            category: 'pricing_strategy',
            impact: 'medium',
            autoFixable: true,
            autoFixAction: {
              type: 'set_minimum',
              parameters: { value: this.config.fabricRules.minSwatchPrice },
              description: `Set to minimum swatch price (${this.config.fabricRules.minSwatchPrice})`,
              requiresConfirmation: true
            }
          });
        }

        // Check swatch set specific limits
        if (row.max_selections && row.max_selections > this.config.fabricRules.swatchSetLimits.maxSelections) {
          issues.push({
            ruleId: 'swatch_set_max_selections',
            ruleName: 'Swatch Set Selection Limit',
            severity: 'warning',
            message: `Swatch set allows too many selections (${row.max_selections}), recommended maximum is ${this.config.fabricRules.swatchSetLimits.maxSelections}`,
            field: 'max_selections',
            businessRule: 'swatchSetLimits.maxSelections',
            category: 'fabric_configuration',
            impact: 'low',
            autoFixable: true,
            autoFixAction: {
              type: 'set_maximum',
              parameters: { value: this.config.fabricRules.swatchSetLimits.maxSelections },
              description: `Limit to recommended maximum (${this.config.fabricRules.swatchSetLimits.maxSelections})`,
              requiresConfirmation: false
            }
          });
        }
      }
    }

    // Validate required filters
    if (!row.category_filter && !row.collection_filter) {
      issues.push({
        ruleId: 'fabric_missing_filters',
        ruleName: 'Fabric Filter Requirements',
        severity: 'error',
        message: 'Fabric products must specify at least one filter (category or collection)',
        field: 'category_filter',
        businessRule: 'requiredFilters',
        category: 'fabric_configuration',
        impact: 'critical',
        autoFixable: false
      });
    }

    return issues;
  }

  private validateInventoryRules(row: ProductRow, rowIndex: number): BusinessValidationIssue[] {
    const issues: BusinessValidationIssue[] = [];

    // Validate inventory management settings
    const manageInventory = row.manage_inventory ?? this.config.inventoryRules.defaultManageInventory;

    if (manageInventory && row.inventory_quantity !== undefined) {
      // Check negative stock
      if (row.inventory_quantity < 0 && !this.config.inventoryRules.allowNegativeStock) {
        issues.push({
          ruleId: 'negative_inventory',
          ruleName: 'Negative Inventory Check',
          severity: 'error',
          message: 'Negative inventory quantities are not allowed',
          field: 'inventory_quantity',
          businessRule: 'allowNegativeStock',
          category: 'inventory_policy',
          impact: 'critical',
          autoFixable: true,
          autoFixAction: {
            type: 'set_minimum',
            parameters: { value: 0 },
            description: 'Set inventory to zero',
            requiresConfirmation: false
          }
        });
      }

      // Check maximum stock
      if (row.inventory_quantity > this.config.inventoryRules.maxStockQuantity) {
        issues.push({
          ruleId: 'excessive_inventory',
          ruleName: 'Maximum Inventory Check',
          severity: 'warning',
          message: `Inventory quantity (${row.inventory_quantity}) exceeds maximum limit (${this.config.inventoryRules.maxStockQuantity})`,
          field: 'inventory_quantity',
          businessRule: 'maxStockQuantity',
          category: 'inventory_policy',
          impact: 'medium',
          autoFixable: false
        });
      }

      // Check low stock threshold
      if (row.inventory_quantity <= this.config.inventoryRules.lowStockThreshold) {
        issues.push({
          ruleId: 'low_stock_warning',
          ruleName: 'Low Stock Warning',
          severity: 'warning',
          message: `Inventory quantity (${row.inventory_quantity}) is at or below low stock threshold (${this.config.inventoryRules.lowStockThreshold})`,
          field: 'inventory_quantity',
          businessRule: 'lowStockThreshold',
          category: 'inventory_policy',
          impact: 'low',
          autoFixable: false
        });
      }
    }

    // Validate inventory policy for fabric products
    if (this.isFabricProduct(row)) {
      const fabricPolicy = this.config.inventoryRules.inventoryPolicies.fabricProducts;

      if (manageInventory !== fabricPolicy.trackInventory) {
        issues.push({
          ruleId: 'fabric_inventory_policy',
          ruleName: 'Fabric Inventory Policy',
          severity: 'warning',
          message: `Fabric products should ${fabricPolicy.trackInventory ? 'track' : 'not track'} inventory`,
          field: 'manage_inventory',
          businessRule: 'inventoryPolicies.fabricProducts.trackInventory',
          category: 'inventory_policy',
          impact: 'medium',
          autoFixable: true,
          autoFixAction: {
            type: 'set_boolean',
            parameters: { value: fabricPolicy.trackInventory },
            description: `Set manage_inventory to ${fabricPolicy.trackInventory}`,
            requiresConfirmation: true
          }
        });
      }

      const allowBackorder = row.allow_backorder ?? false;
      if (allowBackorder !== fabricPolicy.allowBackorder) {
        issues.push({
          ruleId: 'fabric_backorder_policy',
          ruleName: 'Fabric Backorder Policy',
          severity: 'warning',
          message: `Fabric products should ${fabricPolicy.allowBackorder ? 'allow' : 'not allow'} backorders`,
          field: 'allow_backorder',
          businessRule: 'inventoryPolicies.fabricProducts.allowBackorder',
          category: 'inventory_policy',
          impact: 'medium',
          autoFixable: true,
          autoFixAction: {
            type: 'set_boolean',
            parameters: { value: fabricPolicy.allowBackorder },
            description: `Set allow_backorder to ${fabricPolicy.allowBackorder}`,
            requiresConfirmation: true
          }
        });
      }
    }

    return issues;
  }

  private validatePricingRules(row: ProductRow, rowIndex: number): BusinessValidationIssue[] {
    const issues: BusinessValidationIssue[] = [];

    // Collect all prices from the row
    const prices = this.extractAllPrices(row);

    // Validate required currencies
    const availableCurrencies = Object.keys(prices);
    const missingCurrencies = this.config.pricingRules.requiredCurrencies.filter(
      currency => !availableCurrencies.includes(currency)
    );

    if (missingCurrencies.length > 0) {
      issues.push({
        ruleId: 'missing_required_currencies',
        ruleName: 'Required Currency Validation',
        severity: 'error',
        message: `Missing required currencies: ${missingCurrencies.join(', ')}`,
        field: 'pricing',
        businessRule: 'requiredCurrencies',
        category: 'pricing_strategy',
        impact: 'critical',
        autoFixable: false
      });
    }

    // Validate zero prices
    if (!this.config.pricingRules.priceValidation.allowZeroPrices) {
      const zeroPrices = Object.entries(prices).filter(([_, price]) => price === 0);
      if (zeroPrices.length > 0) {
        issues.push({
          ruleId: 'zero_prices_not_allowed',
          ruleName: 'Zero Price Validation',
          severity: 'error',
          message: `Zero prices not allowed for currencies: ${zeroPrices.map(([currency]) => currency).join(', ')}`,
          field: 'pricing',
          businessRule: 'priceValidation.allowZeroPrices',
          category: 'pricing_strategy',
          impact: 'critical',
          autoFixable: false
        });
      }
    }

    // Validate price consistency across currencies
    if (availableCurrencies.length > 1 && this.config.pricingRules.priceValidation.requireConsistentMargins) {
      const priceVariations = this.calculatePriceVariations(prices);
      const maxVariation = Math.max(...Object.values(priceVariations));

      if (maxVariation > this.config.pricingRules.priceValidation.maxPriceVariation) {
        issues.push({
          ruleId: 'inconsistent_currency_pricing',
          ruleName: 'Currency Price Consistency',
          severity: 'warning',
          message: `Price variation (${Math.round(maxVariation * 100)}%) exceeds maximum allowed (${Math.round(this.config.pricingRules.priceValidation.maxPriceVariation * 100)}%)`,
          field: 'pricing',
          businessRule: 'priceValidation.maxPriceVariation',
          category: 'pricing_strategy',
          impact: 'medium',
          autoFixable: false
        });
      }
    }

    // Validate against industry standards
    const industryPricing = this.industryStandards.get('fabric_pricing');
    if (industryPricing && this.isFabricProduct(row)) {
      const avgPrice = Object.values(prices).reduce((sum, price) => sum + price, 0) / Object.values(prices).length;

      if (avgPrice < industryPricing.minPrice) {
        issues.push({
          ruleId: 'below_industry_minimum',
          ruleName: 'Industry Pricing Standards',
          severity: 'warning',
          message: `Price below industry minimum (${industryPricing.minPrice})`,
          field: 'pricing',
          businessRule: 'industryStandards.minPrice',
          category: 'pricing_strategy',
          impact: 'medium',
          autoFixable: false
        });
      }
    }

    return issues;
  }

  private validateGeneralRules(row: ProductRow, rowIndex: number): BusinessValidationIssue[] {
    const issues: BusinessValidationIssue[] = [];

    // Validate handle format
    if (row.handle && this.config.generalRules.handleGeneration.enforceFormat) {
      const isValidFormat = this.validateHandleFormat(row.handle, this.config.generalRules.handleGeneration.format);
      if (!isValidFormat) {
        issues.push({
          ruleId: 'invalid_handle_format',
          ruleName: 'Handle Format Validation',
          severity: 'warning',
          message: `Handle format should be ${this.config.generalRules.handleGeneration.format}`,
          field: 'handle',
          businessRule: 'handleGeneration.format',
          category: 'data_consistency',
          impact: 'low',
          autoFixable: true,
          autoFixAction: {
            type: 'format_handle',
            parameters: { format: this.config.generalRules.handleGeneration.format },
            description: `Convert to ${this.config.generalRules.handleGeneration.format} format`,
            requiresConfirmation: false
          }
        });
      }
    }

    // Validate SKU pattern
    if (row.sku && this.config.generalRules.skuGeneration.enforcePattern) {
      const isValidPattern = this.validateSkuPattern(row.sku, this.config.generalRules.skuGeneration.pattern);
      if (!isValidPattern) {
        issues.push({
          ruleId: 'invalid_sku_pattern',
          ruleName: 'SKU Pattern Validation',
          severity: 'warning',
          message: `SKU should follow pattern: ${this.config.generalRules.skuGeneration.pattern}`,
          field: 'sku',
          businessRule: 'skuGeneration.pattern',
          category: 'data_consistency',
          impact: 'medium',
          autoFixable: true,
          autoFixAction: {
            type: 'generate_sku',
            parameters: { pattern: this.config.generalRules.skuGeneration.pattern },
            description: 'Generate SKU following the required pattern',
            requiresConfirmation: true
          }
        });
      }
    }

    // Validate media requirements
    if (this.config.generalRules.mediaValidation.requireThumbnail && !row.thumbnail_url) {
      issues.push({
        ruleId: 'missing_thumbnail',
        ruleName: 'Thumbnail Requirement',
        severity: 'error',
        message: 'Product thumbnail is required',
        field: 'thumbnail_url',
        businessRule: 'mediaValidation.requireThumbnail',
        category: 'customer_experience',
        impact: 'high',
        autoFixable: false
      });
    }

    // Validate taxonomy rules
    if (row.tags) {
      const tagCount = row.tags.split(',').length;
      if (tagCount > this.config.generalRules.taxonomyRules.maxTags) {
        issues.push({
          ruleId: 'too_many_tags',
          ruleName: 'Maximum Tags Validation',
          severity: 'warning',
          message: `Too many tags (${tagCount}), maximum allowed: ${this.config.generalRules.taxonomyRules.maxTags}`,
          field: 'tags',
          businessRule: 'taxonomyRules.maxTags',
          category: 'data_consistency',
          impact: 'low',
          autoFixable: true,
          autoFixAction: {
            type: 'trim_tags',
            parameters: { maxCount: this.config.generalRules.taxonomyRules.maxTags },
            description: `Keep only first ${this.config.generalRules.taxonomyRules.maxTags} tags`,
            requiresConfirmation: true
          }
        });
      }
    }

    return issues;
  }

  private generateFabricRecommendations(row: ProductRow, rowIndex: number): BusinessRecommendation[] {
    const recommendations: BusinessRecommendation[] = [];

    if (this.isFabricProduct(row)) {
      // Recommend optimal pricing strategy
      if (row.config_type === 'configurable_fabric' && row.base_price) {
        const basePrice = this.extractPrice(row.base_price);
        if (basePrice && !row.swatch_price) {
          const suggestedSwatchPrice = basePrice * 0.1; // 10% of fabric price
          recommendations.push({
            type: 'pricing_optimization',
            title: 'Add Swatch Pricing',
            description: 'Consider adding swatch pricing to improve customer experience',
            field: 'swatch_price',
            suggestedValue: suggestedSwatchPrice,
            impact: 'medium',
            implementation: 'Add swatch_price field with suggested value'
          });
        }
      }

      // Recommend selection limits optimization
      if (!row.min_selections || !row.max_selections) {
        recommendations.push({
          type: 'fabric_configuration',
          title: 'Optimize Selection Limits',
          description: 'Set appropriate selection limits to guide customer choices',
          field: 'selections',
          suggestedValue: { min: 1, max: 5 },
          impact: 'medium',
          implementation: 'Add min_selections and max_selections fields'
        });
      }
    }

    return recommendations;
  }

  private generateInventoryRecommendations(row: ProductRow, rowIndex: number): BusinessRecommendation[] {
    const recommendations: BusinessRecommendation[] = [];

    // Recommend inventory tracking for valuable items
    const avgPrice = this.calculateAveragePrice(row);
    if (avgPrice > 100 && !row.manage_inventory) {
      recommendations.push({
        type: 'inventory_management',
        title: 'Enable Inventory Tracking',
        description: 'High-value items should track inventory to prevent overselling',
        field: 'manage_inventory',
        currentValue: false,
        suggestedValue: true,
        impact: 'high',
        implementation: 'Set manage_inventory to true'
      });
    }

    return recommendations;
  }

  private generatePricingRecommendations(row: ProductRow, rowIndex: number): BusinessRecommendation[] {
    const recommendations: BusinessRecommendation[] = [];

    const prices = this.extractAllPrices(row);

    // Recommend additional currencies
    if (Object.keys(prices).length === 1) {
      recommendations.push({
        type: 'pricing_optimization',
        title: 'Add Multi-Currency Support',
        description: 'Support additional currencies to reach international customers',
        field: 'pricing',
        impact: 'medium',
        implementation: 'Add price fields for EUR, GBP, and other target markets'
      });
    }

    return recommendations;
  }

  private generateGeneralRecommendations(row: ProductRow, rowIndex: number): BusinessRecommendation[] {
    const recommendations: BusinessRecommendation[] = [];

    // SEO recommendations
    if (!row.handle) {
      recommendations.push({
        type: 'seo_optimization',
        title: 'Add SEO-Friendly Handle',
        description: 'Custom handles improve SEO and create cleaner URLs',
        field: 'handle',
        suggestedValue: this.generateHandle(row.title),
        impact: 'medium',
        implementation: 'Generate handle from product title'
      });
    }

    return recommendations;
  }

  private generateComplianceReport(issues: BusinessValidationIssue[]): ComplianceReport {
    const fabricIssues = issues.filter(i => i.category === 'fabric_configuration');
    const inventoryIssues = issues.filter(i => i.category === 'inventory_policy');
    const pricingIssues = issues.filter(i => i.category === 'pricing_strategy');

    const criticalIssues = issues.filter(i => i.impact === 'critical').length;
    const warningIssues = issues.filter(i => ['high', 'medium'].includes(i.impact)).length;

    // Calculate compliance scores
    const totalRules = 20; // Total number of business rules
    const passedRules = totalRules - issues.length;

    const fabricCompliance = Math.max(0, 100 - (fabricIssues.length * 10));
    const inventoryCompliance = Math.max(0, 100 - (inventoryIssues.length * 15));
    const pricingCompliance = Math.max(0, 100 - (pricingIssues.length * 20));

    const overallCompliance = (fabricCompliance + inventoryCompliance + pricingCompliance) / 3;

    return {
      fabricCompliance,
      inventoryCompliance,
      pricingCompliance,
      overallCompliance,
      criticalIssues,
      warningIssues,
      passedRules,
      totalRules
    };
  }

  // Helper methods
  private extractPrice(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);
    return isNaN(num) ? null : num;
  }

  private extractAllPrices(row: ProductRow): Record<string, number> {
    const prices: Record<string, number> = {};

    // Single currency pricing
    if (row.currency_code && row.retail_price) {
      const price = this.extractPrice(row.retail_price);
      if (price !== null) {
        prices[row.currency_code.toLowerCase()] = price;
      }
    }

    // Multi-currency pricing
    const multiCurrencyFields = Object.keys(row).filter(key => key.match(/^price_[a-z]{3}$/));
    multiCurrencyFields.forEach(field => {
      const currency = field.split('_')[1];
      const price = this.extractPrice((row as any)[field]);
      if (price !== null) {
        prices[currency] = price;
      }
    });

    return prices;
  }

  private calculateAveragePrice(row: ProductRow): number {
    const prices = Object.values(this.extractAllPrices(row));
    return prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
  }

  private calculatePriceVariations(prices: Record<string, number>): Record<string, number> {
    const variations: Record<string, number> = {};
    const currencies = Object.keys(prices);

    for (let i = 0; i < currencies.length; i++) {
      for (let j = i + 1; j < currencies.length; j++) {
        const curr1 = currencies[i];
        const curr2 = currencies[j];
        const variation = Math.abs(prices[curr1] - prices[curr2]) / Math.max(prices[curr1], prices[curr2]);
        variations[`${curr1}_${curr2}`] = variation;
      }
    }

    return variations;
  }

  private validateHandleFormat(handle: string, format: string): boolean {
    switch (format) {
      case 'kebab-case':
        return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle);
      case 'snake_case':
        return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(handle);
      case 'camelCase':
        return /^[a-z][a-zA-Z0-9]*$/.test(handle);
      default:
        return true;
    }
  }

  private validateSkuPattern(sku: string, pattern: string): boolean {
    // Simple pattern validation - could be enhanced with regex
    return sku.includes('-') && sku.length >= 5;
  }

  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private initializeIndustryStandards(): void {
    this.industryStandards.set('fabric_pricing', {
      minPrice: 5.00,
      maxPrice: 500.00,
      avgSwatchPrice: 2.50,
      avgYardPrice: 25.00
    });

    this.industryStandards.set('inventory_benchmarks', {
      fabricTurnover: 4, // times per year
      swatchTurnover: 12, // times per year
      optimalStockDays: 90
    });
  }
}