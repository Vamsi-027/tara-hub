/*
  Advanced Data Integrity Validation Layer

  This module provides sophisticated business logic validation including:
  - Cross-reference validation between related entities
  - Orphaned data detection
  - Consistency checks across the dataset
  - Business rule validation specific to fabric products
*/

import { ProductRow } from './schemas';
import { ParseError } from './streaming-parser';

export interface ValidationContext {
  existingProductHandles: Set<string>;
  existingProductSkus: Set<string>;
  existingCollections: Set<string>;
  existingCategories: Set<string>;
  existingSalesChannels: Set<string>;
  existingMaterials: Set<string>;
  configurableCurrencies: Set<string>;
  defaultSalesChannels: string[];
  inventoryLocations: Set<string>;
  exchangeRateValidation?: {
    enabled: boolean;
    rates?: Record<string, number>; // Base currency to target currency rates
    maxVariation?: number; // Maximum acceptable variation (default: 0.3 = 30%)
  };
}

export interface ValidationRule {
  name: string;
  description: string;
  severity: 'warning' | 'error' | 'critical';
  validate: (row: ProductRow, context: ValidationContext, rowIndex: number) => ValidationIssue[];
}

export interface ValidationIssue {
  ruleId: string;
  ruleName: string;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  field?: string;
  suggestion?: string;
  relatedData?: any;
}

export interface CrossReferenceCheck {
  field: string;
  referenceEntity: string;
  isRequired: boolean;
  autoCreate?: boolean;
}

export interface DatasetAnalysis {
  totalRows: number;
  uniqueProducts: number;
  uniqueVariants: number;
  duplicateHandles: string[];
  duplicateSkus: string[];
  orphanedVariants: number[];
  missingReferences: MissingReference[];
  priceInconsistencies: PriceInconsistency[];
  fabricValidationIssues: FabricValidationIssue[];
}

export interface MissingReference {
  rowIndex: number;
  field: string;
  value: string;
  referenceType: string;
}

export interface PriceInconsistency {
  rowIndex: number;
  issue: string;
  currencies: string[];
  prices: number[];
}

export interface FabricValidationIssue {
  rowIndex: number;
  configType: string;
  issue: string;
  severity: 'warning' | 'error';
}

export class DataIntegrityValidator {
  private rules: ValidationRule[] = [];
  private context: ValidationContext;

  constructor(context: ValidationContext) {
    this.context = context;
    this.initializeRules();
  }

  public validateRow(row: ProductRow, rowIndex: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (const rule of this.rules) {
      try {
        const ruleIssues = rule.validate(row, this.context, rowIndex);
        issues.push(...ruleIssues);
      } catch (error) {
        issues.push({
          ruleId: rule.name,
          ruleName: rule.name,
          severity: 'critical',
          message: `Validation rule failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    return issues;
  }

  public validateDataset(rows: ProductRow[]): DatasetAnalysis {
    const analysis: DatasetAnalysis = {
      totalRows: rows.length,
      uniqueProducts: 0,
      uniqueVariants: 0,
      duplicateHandles: [],
      duplicateSkus: [],
      orphanedVariants: [],
      missingReferences: [],
      priceInconsistencies: [],
      fabricValidationIssues: []
    };

    // Track duplicates
    const seenHandles = new Map<string, number[]>();
    const seenSkus = new Map<string, number[]>();
    const productVariants = new Map<string, number[]>();

    rows.forEach((row, index) => {
      // Track handles
      if (row.handle) {
        if (!seenHandles.has(row.handle)) {
          seenHandles.set(row.handle, []);
        }
        seenHandles.get(row.handle)!.push(index);
      }

      // Track SKUs
      if (row.sku) {
        if (!seenSkus.has(row.sku)) {
          seenSkus.set(row.sku, []);
        }
        seenSkus.get(row.sku)!.push(index);
      }

      // Track product-variant relationships
      const productKey = row.handle || row.external_id || row.title;
      if (!productVariants.has(productKey)) {
        productVariants.set(productKey, []);
      }
      productVariants.get(productKey)!.push(index);
    });

    // Identify duplicates
    seenHandles.forEach((indices, handle) => {
      if (indices.length > 1) {
        analysis.duplicateHandles.push(handle);
      }
    });

    seenSkus.forEach((indices, sku) => {
      if (indices.length > 1) {
        analysis.duplicateSkus.push(sku);
      }
    });

    analysis.uniqueProducts = productVariants.size;
    analysis.uniqueVariants = seenSkus.size || rows.length;

    // Check for orphaned variants and other issues
    rows.forEach((row, index) => {
      // Check missing references
      this.checkMissingReferences(row, index, analysis);

      // Check price inconsistencies
      this.checkPriceConsistencies(row, index, analysis);

      // Check fabric-specific validations
      this.checkFabricValidation(row, index, analysis);
    });

    return analysis;
  }

  private checkMissingReferences(row: ProductRow, index: number, analysis: DatasetAnalysis): void {
    const references: CrossReferenceCheck[] = [
      { field: 'collection_handles', referenceEntity: 'collections', isRequired: false },
      { field: 'category_handles', referenceEntity: 'categories', isRequired: false },
      { field: 'sales_channel_handles', referenceEntity: 'sales_channels', isRequired: false },
    ];

    references.forEach(ref => {
      const value = (row as any)[ref.field];
      if (value && typeof value === 'string') {
        const handles = value.split(/[,;]/).map(h => h.trim()).filter(h => h);

        handles.forEach(handle => {
          let exists = false;

          switch (ref.referenceEntity) {
            case 'collections':
              exists = this.context.existingCollections.has(handle);
              break;
            case 'categories':
              exists = this.context.existingCategories.has(handle);
              break;
            case 'sales_channels':
              exists = this.context.existingSalesChannels.has(handle);
              break;
          }

          if (!exists) {
            analysis.missingReferences.push({
              rowIndex: index,
              field: ref.field,
              value: handle,
              referenceType: ref.referenceEntity
            });
          }
        });
      }
    });
  }

  private checkPriceConsistencies(row: ProductRow, index: number, analysis: DatasetAnalysis): void {
    const currencies: string[] = [];
    const prices: number[] = [];

    // Check single currency pricing
    if (row.currency_code && row.retail_price) {
      currencies.push(row.currency_code);
      const price = typeof row.retail_price === 'string'
        ? parseFloat(row.retail_price.replace(/,/g, ''))
        : row.retail_price;
      prices.push(price);
    }

    // Check multi-currency pricing
    const multiCurrencyFields = Object.keys(row).filter(key => key.match(/^price_[a-z]{3}$/));
    multiCurrencyFields.forEach(field => {
      const currency = field.split('_')[1];
      const price = (row as any)[field];

      if (price && this.context.configurableCurrencies.has(currency)) {
        currencies.push(currency);
        const numPrice = typeof price === 'string'
          ? parseFloat(price.replace(/,/g, ''))
          : price;
        prices.push(numPrice);
      }
    });

    // Validate price consistency rules (if enabled)
    if (currencies.length > 1 && this.context.exchangeRateValidation?.enabled) {
      const maxVariation = this.context.exchangeRateValidation.maxVariation || 0.3;
      const rates = this.context.exchangeRateValidation.rates || {};

      // Check for reasonable price ratios between currencies
      const usdIndex = currencies.indexOf('usd');
      const eurIndex = currencies.indexOf('eur');

      if (usdIndex !== -1 && eurIndex !== -1) {
        const actualRatio = prices[eurIndex] / prices[usdIndex];
        const expectedRatio = rates['usd_eur'] || 0.85; // Default expected USD to EUR rate
        const variation = Math.abs(actualRatio - expectedRatio) / expectedRatio;

        if (variation > maxVariation) {
          analysis.priceInconsistencies.push({
            rowIndex: index,
            issue: `USD/EUR price ratio outside acceptable range (${Math.round(variation * 100)}% variation)`,
            currencies: ['usd', 'eur'],
            prices: [prices[usdIndex], prices[eurIndex]]
          });
        }
      }
    }

    // Check for zero or negative prices
    prices.forEach((price, i) => {
      if (price <= 0) {
        analysis.priceInconsistencies.push({
          rowIndex: index,
          issue: 'Zero or negative price',
          currencies: [currencies[i]],
          prices: [price]
        });
      }
    });
  }

  private checkFabricValidation(row: ProductRow, index: number, analysis: DatasetAnalysis): void {
    if (!row.config_type) return;

    const issues: FabricValidationIssue[] = [];

    switch (row.config_type) {
      case 'configurable_fabric':
        this.validateConfigurableFabric(row, index, issues);
        break;
      case 'configurable_swatch_set':
        this.validateConfigurableSwatchSet(row, index, issues);
        break;
    }

    analysis.fabricValidationIssues.push(...issues);
  }

  private validateConfigurableFabric(row: ProductRow, index: number, issues: FabricValidationIssue[]): void {
    // Validate min/max selections
    if (row.min_selections !== undefined && row.max_selections !== undefined) {
      if (row.min_selections > row.max_selections) {
        issues.push({
          rowIndex: index,
          configType: 'configurable_fabric',
          issue: 'min_selections cannot be greater than max_selections',
          severity: 'error'
        });
      }
    }

    // Validate price configuration
    if (row.set_price !== undefined && row.base_price !== undefined) {
      const setPrice = typeof row.set_price === 'string'
        ? parseFloat(row.set_price.replace(/,/g, ''))
        : row.set_price;
      const basePrice = typeof row.base_price === 'string'
        ? parseFloat(row.base_price.replace(/,/g, ''))
        : row.base_price;

      if (setPrice <= 0 || basePrice <= 0) {
        issues.push({
          rowIndex: index,
          configType: 'configurable_fabric',
          issue: 'Fabric prices must be positive',
          severity: 'error'
        });
      }
    }

    // Validate filters
    if (!row.category_filter && !row.collection_filter) {
      issues.push({
        rowIndex: index,
        configType: 'configurable_fabric',
        issue: 'At least one filter (category or collection) should be specified',
        severity: 'warning'
      });
    }
  }

  private validateConfigurableSwatchSet(row: ProductRow, index: number, issues: FabricValidationIssue[]): void {
    // Swatch sets typically have different validation rules
    if (row.max_selections && row.max_selections > 5) {
      issues.push({
        rowIndex: index,
        configType: 'configurable_swatch_set',
        issue: 'Swatch sets typically should not exceed 5 selections',
        severity: 'warning'
      });
    }

    // Validate swatch pricing
    if (row.swatch_price !== undefined) {
      const swatchPrice = typeof row.swatch_price === 'string'
        ? parseFloat(row.swatch_price.replace(/,/g, ''))
        : row.swatch_price;

      if (swatchPrice <= 0) {
        issues.push({
          rowIndex: index,
          configType: 'configurable_swatch_set',
          issue: 'Swatch price must be positive',
          severity: 'error'
        });
      }
    }
  }

  private initializeRules(): void {
    this.rules = [
      {
        name: 'unique_handle_check',
        description: 'Ensures product handles are unique within the import',
        severity: 'error',
        validate: (row, context, rowIndex) => {
          const issues: ValidationIssue[] = [];

          if (row.handle && context.existingProductHandles.has(row.handle)) {
            issues.push({
              ruleId: 'unique_handle_check',
              ruleName: 'Unique Handle Check',
              severity: 'error',
              message: `Product handle '${row.handle}' already exists`,
              field: 'handle',
              suggestion: 'Use a unique handle or enable upsert mode'
            });
          }

          return issues;
        }
      },

      {
        name: 'variant_sku_consistency',
        description: 'Validates SKU uniqueness and format consistency',
        severity: 'error',
        validate: (row, context, rowIndex) => {
          const issues: ValidationIssue[] = [];

          if (row.sku) {
            if (context.existingProductSkus.has(row.sku)) {
              issues.push({
                ruleId: 'variant_sku_consistency',
                ruleName: 'Variant SKU Consistency',
                severity: 'error',
                message: `SKU '${row.sku}' already exists`,
                field: 'sku',
                suggestion: 'Use a unique SKU or enable upsert mode'
              });
            }

            // Check SKU format for fabric products
            if (row.config_type && !row.sku.includes('-')) {
              issues.push({
                ruleId: 'variant_sku_consistency',
                ruleName: 'Variant SKU Consistency',
                severity: 'warning',
                message: 'Fabric product SKUs should follow naming convention (e.g., PRODUCT-TYPE)',
                field: 'sku',
                suggestion: 'Consider using format like "HANDLE-SWATCH" or "HANDLE-YARD"'
              });
            }
          }

          return issues;
        }
      },

      {
        name: 'price_completeness',
        description: 'Ensures proper pricing information is provided',
        severity: 'error',
        validate: (row, context, rowIndex) => {
          const issues: ValidationIssue[] = [];

          const hasSingleCurrencyPrice = row.currency_code && row.retail_price;
          const hasMultiCurrencyPrice = Object.keys(row).some(key =>
            key.match(/^price_[a-z]{3}$/) && (row as any)[key]
          );

          if (!hasSingleCurrencyPrice && !hasMultiCurrencyPrice) {
            issues.push({
              ruleId: 'price_completeness',
              ruleName: 'Price Completeness',
              severity: 'error',
              message: 'At least one price must be provided',
              suggestion: 'Add retail_price with currency_code or use multi-currency price fields'
            });
          }

          return issues;
        }
      },

      {
        name: 'fabric_configuration_completeness',
        description: 'Validates fabric-specific configuration fields',
        severity: 'error',
        validate: (row, context, rowIndex) => {
          const issues: ValidationIssue[] = [];

          if (row.config_type) {
            if (!row.min_selections && !row.max_selections) {
              issues.push({
                ruleId: 'fabric_configuration_completeness',
                ruleName: 'Fabric Configuration Completeness',
                severity: 'warning',
                message: 'Configurable products should specify selection limits',
                suggestion: 'Add min_selections and max_selections fields'
              });
            }
          }

          return issues;
        }
      },

      {
        name: 'sales_channel_validation',
        description: 'Validates sales channel references',
        severity: 'warning',
        validate: (row, context, rowIndex) => {
          const issues: ValidationIssue[] = [];

          if (row.sales_channel_handles) {
            const channels = row.sales_channel_handles.split(';').map(c => c.trim());
            const invalidChannels = channels.filter(c => !context.existingSalesChannels.has(c));

            if (invalidChannels.length > 0) {
              issues.push({
                ruleId: 'sales_channel_validation',
                ruleName: 'Sales Channel Validation',
                severity: 'warning',
                message: `Invalid sales channels: ${invalidChannels.join(', ')}`,
                field: 'sales_channel_handles',
                suggestion: 'Use valid sales channel handles or create them first'
              });
            }
          } else if (context.defaultSalesChannels.length === 0) {
            issues.push({
              ruleId: 'sales_channel_validation',
              ruleName: 'Sales Channel Validation',
              severity: 'warning',
              message: 'No sales channels specified and no default channels configured',
              field: 'sales_channel_handles',
              suggestion: 'Specify sales channels or configure default channels'
            });
          }

          return issues;
        }
      }
    ];
  }

  public addCustomRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  public updateContext(newContext: Partial<ValidationContext>): void {
    this.context = { ...this.context, ...newContext };
  }
}