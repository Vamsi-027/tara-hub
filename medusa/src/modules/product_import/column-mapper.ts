/*
  Smart Column Mapping with Auto-Detection

  This module provides intelligent column mapping capabilities including:
  - Automatic column detection and mapping suggestions
  - User-defined mapping profiles
  - Fuzzy matching for column names
  - Data type inference
  - Validation and quality scoring
*/

import { z } from 'zod';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number; // 0-1 confidence score
  dataType: InferredDataType;
  sampleValues: string[];
  transformation?: TransformationRule;
  isRequired: boolean;
  conflicts: string[];
}

export interface MappingProfile {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  mappings: Record<string, string>; // sourceColumn -> targetField
  transformations: Record<string, TransformationRule>;
  isDefault: boolean;
  usage_count: number;
}

export interface MappingSuggestion {
  mapping: ColumnMapping;
  reason: string;
  alternativeFields: string[];
  qualityScore: number; // 0-100
}

export interface TransformationRule {
  type: TransformationType;
  parameters: Record<string, any>;
  description: string;
}

export type TransformationType =
  | 'none'
  | 'trim'
  | 'uppercase'
  | 'lowercase'
  | 'capitalize'
  | 'remove_prefix'
  | 'remove_suffix'
  | 'replace_pattern'
  | 'split_and_take'
  | 'join_with_separator'
  | 'parse_number'
  | 'parse_boolean'
  | 'parse_date'
  | 'currency_conversion'
  | 'unit_conversion'
  | 'custom_function';

export type InferredDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'currency'
  | 'url'
  | 'email'
  | 'phone'
  | 'json'
  | 'csv_list'
  | 'sku'
  | 'handle'
  | 'unknown';

export interface DataTypeSample {
  value: string;
  type: InferredDataType;
  confidence: number;
  parsedValue?: any;
}

export interface ValidationResult {
  isValid: boolean;
  requiredMissing: string[];
  duplicateMappings: string[];
  conflictingTypes: Array<{
    field: string;
    expected: string;
    inferred: string;
  }>;
  suggestions: MappingSuggestion[];
  qualityScore: number;
}

export class ColumnMapper {
  private static readonly EXPECTED_FIELDS = new Map([
    // Core product fields
    ['title', { required: true, dataType: 'string', aliases: ['name', 'product_name', 'product_title'] }],
    ['handle', { required: false, dataType: 'handle', aliases: ['slug', 'url_handle', 'product_handle'] }],
    ['external_id', { required: false, dataType: 'string', aliases: ['external_id', 'ext_id', 'external_product_id'] }],
    ['status', { required: false, dataType: 'string', aliases: ['product_status', 'state', 'visibility'] }],
    ['description', { required: false, dataType: 'string', aliases: ['product_description', 'desc', 'details'] }],

    // Pricing fields
    ['retail_price', { required: false, dataType: 'currency', aliases: ['price', 'cost', 'base_price', 'selling_price'] }],
    ['currency_code', { required: false, dataType: 'string', aliases: ['currency', 'price_currency'] }],
    ['swatch_price', { required: false, dataType: 'currency', aliases: ['sample_price', 'swatch_cost'] }],

    // Multi-currency pricing
    ['price_usd', { required: false, dataType: 'currency', aliases: ['usd_price', 'price_us'] }],
    ['price_eur', { required: false, dataType: 'currency', aliases: ['eur_price', 'price_eu'] }],
    ['price_gbp', { required: false, dataType: 'currency', aliases: ['gbp_price', 'price_uk'] }],

    // Variants and options
    ['sku', { required: false, dataType: 'sku', aliases: ['product_sku', 'variant_sku', 'item_code'] }],
    ['option_1_title', { required: false, dataType: 'string', aliases: ['option1_title', 'first_option', 'option_title_1'] }],
    ['option_1_value', { required: false, dataType: 'string', aliases: ['option1_value', 'first_option_value', 'option_value_1'] }],
    ['option_2_title', { required: false, dataType: 'string', aliases: ['option2_title', 'second_option', 'option_title_2'] }],
    ['option_2_value', { required: false, dataType: 'string', aliases: ['option2_value', 'second_option_value', 'option_value_2'] }],

    // Media
    ['thumbnail_url', { required: false, dataType: 'url', aliases: ['thumbnail', 'main_image', 'featured_image', 'primary_image'] }],
    ['image_urls', { required: false, dataType: 'csv_list', aliases: ['images', 'additional_images', 'gallery_images'] }],

    // Taxonomy
    ['tags', { required: false, dataType: 'csv_list', aliases: ['product_tags', 'keywords', 'labels'] }],
    ['collection_handles', { required: false, dataType: 'csv_list', aliases: ['collections', 'categories', 'product_collections'] }],
    ['category_handles', { required: false, dataType: 'csv_list', aliases: ['categories', 'product_categories', 'cat_handles'] }],
    ['sales_channel_handles', { required: false, dataType: 'csv_list', aliases: ['sales_channels', 'channels', 'store_channels'] }],

    // Inventory
    ['manage_inventory', { required: false, dataType: 'boolean', aliases: ['track_inventory', 'inventory_managed'] }],
    ['allow_backorder', { required: false, dataType: 'boolean', aliases: ['backorder_allowed', 'allow_backorders'] }],
    ['inventory_quantity', { required: false, dataType: 'number', aliases: ['quantity', 'stock', 'qty', 'stock_quantity'] }],

    // Physical properties
    ['weight', { required: false, dataType: 'number', aliases: ['product_weight', 'weight_kg'] }],
    ['length', { required: false, dataType: 'number', aliases: ['product_length', 'length_cm'] }],
    ['width', { required: false, dataType: 'number', aliases: ['product_width', 'width_cm'] }],
    ['height', { required: false, dataType: 'number', aliases: ['product_height', 'height_cm'] }],

    // Fabric-specific
    ['config_type', { required: false, dataType: 'string', aliases: ['configuration_type', 'fabric_type'] }],
    ['min_selections', { required: false, dataType: 'number', aliases: ['min_select', 'minimum_selections'] }],
    ['max_selections', { required: false, dataType: 'number', aliases: ['max_select', 'maximum_selections'] }],
    ['category_filter', { required: false, dataType: 'string', aliases: ['filter_category', 'category_filter'] }],
    ['collection_filter', { required: false, dataType: 'string', aliases: ['filter_collection', 'collection_filter'] }],

    // Metadata
    ['metadata_json', { required: false, dataType: 'json', aliases: ['metadata', 'custom_data'] }],
  ]);

  private savedProfiles: Map<string, MappingProfile> = new Map();

  public async detectColumns(
    headers: string[],
    sampleRows: any[][],
    profileId?: string
  ): Promise<ColumnMapping[]> {
    const mappings: ColumnMapping[] = [];

    // Load profile if specified
    let profileMappings: Record<string, string> = {};
    if (profileId) {
      const profile = this.savedProfiles.get(profileId);
      if (profile) {
        profileMappings = profile.mappings;
      }
    }

    for (const header of headers) {
      const mapping = await this.mapSingleColumn(header, headers, sampleRows, profileMappings);
      mappings.push(mapping);
    }

    return mappings;
  }

  private async mapSingleColumn(
    sourceColumn: string,
    headers: string[],
    sampleRows: any[][],
    profileMappings: Record<string, string>
  ): Promise<ColumnMapping> {
    // Check profile mapping first
    if (profileMappings[sourceColumn]) {
      return {
        sourceColumn,
        targetField: profileMappings[sourceColumn],
        confidence: 1.0,
        dataType: this.inferDataTypeFromField(profileMappings[sourceColumn]),
        sampleValues: this.extractSampleValues(sourceColumn, headers, sampleRows),
        isRequired: this.isFieldRequired(profileMappings[sourceColumn]),
        conflicts: []
      };
    }

    // Extract sample values for this column
    const sampleValues = this.extractSampleValues(sourceColumn, headers, sampleRows);

    // Infer data type from samples
    const dataType = this.inferDataType(sampleValues);

    // Find best field match
    const bestMatch = this.findBestFieldMatch(sourceColumn, dataType, sampleValues);

    return {
      sourceColumn,
      targetField: bestMatch.field,
      confidence: bestMatch.confidence,
      dataType,
      sampleValues: sampleValues.slice(0, 5), // Keep first 5 samples
      isRequired: this.isFieldRequired(bestMatch.field),
      conflicts: bestMatch.conflicts
    };
  }

  private extractSampleValues(columnName: string, headers: string[], sampleRows: any[][]): string[] {
    const columnIndex = headers.indexOf(columnName);
    if (columnIndex === -1) return [];

    return sampleRows
      .slice(1, Math.min(11, sampleRows.length)) // Skip first row (assuming it contains data, not headers), take next 10
      .map(row => String(row[columnIndex] || ''))
      .filter(value => value.trim().length > 0);
  }

  private inferDataType(sampleValues: string[]): InferredDataType {
    if (sampleValues.length === 0) return 'unknown';

    const typeScores = new Map<InferredDataType, number>();

    for (const value of sampleValues) {
      const detectedType = this.detectValueType(value);
      typeScores.set(detectedType, (typeScores.get(detectedType) || 0) + 1);
    }

    // Find the type with highest score
    let bestType: InferredDataType = 'string';
    let bestScore = 0;

    for (const [type, score] of typeScores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }

    return bestType;
  }

  private detectValueType(value: string): InferredDataType {
    const trimmed = value.trim();

    // Boolean patterns
    if (/^(true|false|yes|no|0|1)$/i.test(trimmed)) return 'boolean';

    // Number patterns
    if (/^\d+(\.\d+)?$/.test(trimmed)) return 'number';

    // Currency patterns
    if (/^[\$€£¥]?\d+(\.\d{2})?$/.test(trimmed) || /^\d+(\.\d{2})?\s*(USD|EUR|GBP|CAD)$/i.test(trimmed)) return 'currency';

    // URL patterns
    if (/^https?:\/\//.test(trimmed)) return 'url';

    // Email patterns
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email';

    // Date patterns
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) return 'date';

    // CSV list (contains commas or semicolons)
    if (trimmed.includes(',') || trimmed.includes(';')) return 'csv_list';

    // SKU patterns (alphanumeric with dashes/underscores)
    if (/^[A-Z0-9\-_]+$/i.test(trimmed) && trimmed.length >= 3) return 'sku';

    // Handle patterns (lowercase with dashes)
    if (/^[a-z0-9\-]+$/.test(trimmed) && trimmed.includes('-')) return 'handle';

    // JSON patterns
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not valid JSON, continue
      }
    }

    return 'string';
  }

  private findBestFieldMatch(
    sourceColumn: string,
    dataType: InferredDataType,
    sampleValues: string[]
  ): { field: string; confidence: number; conflicts: string[] } {
    const normalizedSource = this.normalizeColumnName(sourceColumn);
    let bestMatch = { field: 'unknown_field', confidence: 0, conflicts: [] as string[] };

    for (const [targetField, fieldInfo] of ColumnMapper.EXPECTED_FIELDS.entries()) {
      const confidence = this.calculateFieldConfidence(normalizedSource, targetField, fieldInfo, dataType, sampleValues);

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          field: targetField,
          confidence,
          conflicts: this.detectFieldConflicts(targetField, dataType, fieldInfo.dataType)
        };
      }
    }

    // If no good match found, create a custom field name
    if (bestMatch.confidence < 0.5) {
      bestMatch.field = `custom_${normalizedSource}`;
      bestMatch.confidence = 0.3;
    }

    return bestMatch;
  }

  private calculateFieldConfidence(
    normalizedSource: string,
    targetField: string,
    fieldInfo: any,
    dataType: InferredDataType,
    sampleValues: string[]
  ): number {
    let confidence = 0;

    // Exact match
    if (normalizedSource === targetField) {
      confidence += 0.9;
    }

    // Alias match
    const normalizedAliases = fieldInfo.aliases.map((alias: string) => this.normalizeColumnName(alias));
    if (normalizedAliases.includes(normalizedSource)) {
      confidence += 0.8;
    }

    // Fuzzy string match
    const fuzzyScore = this.calculateFuzzyMatch(normalizedSource, targetField);
    confidence += fuzzyScore * 0.4;

    // Check aliases with fuzzy matching
    for (const alias of normalizedAliases) {
      const aliasFuzzyScore = this.calculateFuzzyMatch(normalizedSource, alias);
      confidence = Math.max(confidence, confidence + aliasFuzzyScore * 0.6);
    }

    // Data type match bonus
    if (dataType === fieldInfo.dataType) {
      confidence += 0.3;
    } else if (this.areCompatibleTypes(dataType, fieldInfo.dataType)) {
      confidence += 0.1;
    }

    // Sample value analysis
    const sampleScore = this.analyzeSampleValues(sampleValues, targetField, fieldInfo.dataType);
    confidence += sampleScore * 0.2;

    return Math.min(confidence, 1.0);
  }

  private normalizeColumnName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private calculateFuzzyMatch(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private areCompatibleTypes(inferredType: InferredDataType, expectedType: InferredDataType): boolean {
    const compatibilityMap = new Map([
      ['number', ['currency', 'string']],
      ['currency', ['number', 'string']],
      ['string', ['sku', 'handle', 'url', 'email']],
      ['sku', ['string']],
      ['handle', ['string']],
      ['url', ['string']],
      ['email', ['string']],
      ['csv_list', ['string']],
      ['json', ['string']],
      ['boolean', ['string', 'number']],
    ]);

    const compatible = compatibilityMap.get(inferredType) || [];
    return compatible.includes(expectedType);
  }

  private analyzeSampleValues(values: string[], targetField: string, expectedType: InferredDataType): number {
    if (values.length === 0) return 0;

    let score = 0;
    const validCount = values.filter(value => this.isValidForField(value, targetField, expectedType)).length;
    score = validCount / values.length;

    // Field-specific analysis
    switch (targetField) {
      case 'status':
        const validStatuses = values.filter(v => ['published', 'draft', 'active', 'inactive'].includes(v.toLowerCase()));
        score = Math.max(score, validStatuses.length / values.length);
        break;

      case 'currency_code':
        const validCurrencies = values.filter(v => /^[A-Z]{3}$/.test(v.toUpperCase()));
        score = Math.max(score, validCurrencies.length / values.length);
        break;

      case 'manage_inventory':
      case 'allow_backorder':
        const validBooleans = values.filter(v => /^(true|false|yes|no|0|1)$/i.test(v));
        score = Math.max(score, validBooleans.length / values.length);
        break;
    }

    return score;
  }

  private isValidForField(value: string, targetField: string, expectedType: InferredDataType): boolean {
    const trimmed = value.trim();

    switch (expectedType) {
      case 'number':
        return !isNaN(parseFloat(trimmed));
      case 'currency':
        return /^[\$€£¥]?\d+(\.\d{2})?$/.test(trimmed);
      case 'boolean':
        return /^(true|false|yes|no|0|1)$/i.test(trimmed);
      case 'url':
        return /^https?:\/\//.test(trimmed);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      default:
        return trimmed.length > 0;
    }
  }

  private detectFieldConflicts(targetField: string, inferredType: InferredDataType, expectedType: InferredDataType): string[] {
    const conflicts: string[] = [];

    if (inferredType !== expectedType && !this.areCompatibleTypes(inferredType, expectedType)) {
      conflicts.push(`Data type mismatch: inferred ${inferredType}, expected ${expectedType}`);
    }

    return conflicts;
  }

  private isFieldRequired(fieldName: string): boolean {
    const fieldInfo = ColumnMapper.EXPECTED_FIELDS.get(fieldName);
    return fieldInfo?.required || false;
  }

  private inferDataTypeFromField(fieldName: string): InferredDataType {
    const fieldInfo = ColumnMapper.EXPECTED_FIELDS.get(fieldName);
    return fieldInfo?.dataType || 'string';
  }

  public validateMapping(mappings: ColumnMapping[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      requiredMissing: [],
      duplicateMappings: [],
      conflictingTypes: [],
      suggestions: [],
      qualityScore: 0
    };

    // Check for required fields
    const mappedFields = new Set(mappings.map(m => m.targetField));
    const requiredFields = Array.from(ColumnMapper.EXPECTED_FIELDS.entries())
      .filter(([_, info]) => info.required)
      .map(([field, _]) => field);

    result.requiredMissing = requiredFields.filter(field => !mappedFields.has(field));

    // Check for duplicate mappings
    const targetFieldCounts = new Map<string, number>();
    mappings.forEach(mapping => {
      const count = targetFieldCounts.get(mapping.targetField) || 0;
      targetFieldCounts.set(mapping.targetField, count + 1);
    });

    result.duplicateMappings = Array.from(targetFieldCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([field, _]) => field);

    // Check for type conflicts
    mappings.forEach(mapping => {
      if (mapping.conflicts.length > 0) {
        result.conflictingTypes.push({
          field: mapping.targetField,
          expected: this.inferDataTypeFromField(mapping.targetField),
          inferred: mapping.dataType
        });
      }
    });

    // Generate suggestions for low-confidence mappings
    result.suggestions = mappings
      .filter(mapping => mapping.confidence < 0.7)
      .map(mapping => this.generateSuggestion(mapping))
      .filter(suggestion => suggestion !== null) as MappingSuggestion[];

    // Calculate quality score
    const avgConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length;
    const completenessScore = (requiredFields.length - result.requiredMissing.length) / requiredFields.length;
    const conflictPenalty = (result.duplicateMappings.length + result.conflictingTypes.length) * 0.1;

    result.qualityScore = Math.max(0, Math.min(100, (avgConfidence * 0.6 + completenessScore * 0.4 - conflictPenalty) * 100));

    result.isValid = result.requiredMissing.length === 0 &&
                    result.duplicateMappings.length === 0 &&
                    result.conflictingTypes.length === 0;

    return result;
  }

  private generateSuggestion(mapping: ColumnMapping): MappingSuggestion | null {
    // Find alternative fields that might be better matches
    const alternatives: string[] = [];

    for (const [targetField, fieldInfo] of ColumnMapper.EXPECTED_FIELDS.entries()) {
      if (targetField === mapping.targetField) continue;

      const confidence = this.calculateFieldConfidence(
        this.normalizeColumnName(mapping.sourceColumn),
        targetField,
        fieldInfo,
        mapping.dataType,
        mapping.sampleValues
      );

      if (confidence > mapping.confidence) {
        alternatives.push(targetField);
      }
    }

    if (alternatives.length === 0) return null;

    return {
      mapping,
      reason: `Low confidence mapping (${Math.round(mapping.confidence * 100)}%)`,
      alternativeFields: alternatives.slice(0, 3), // Top 3 alternatives
      qualityScore: Math.round(mapping.confidence * 100)
    };
  }

  public saveProfile(profile: Omit<MappingProfile, 'id' | 'createdAt' | 'updatedAt' | 'usage_count'>): string {
    const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const fullProfile: MappingProfile = {
      ...profile,
      id,
      createdAt: now,
      updatedAt: now,
      usage_count: 0
    };

    this.savedProfiles.set(id, fullProfile);
    return id;
  }

  public getProfile(id: string): MappingProfile | undefined {
    return this.savedProfiles.get(id);
  }

  public getAllProfiles(): MappingProfile[] {
    return Array.from(this.savedProfiles.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  public deleteProfile(id: string): boolean {
    return this.savedProfiles.delete(id);
  }

  public applyTransformation(value: string, transformation: TransformationRule): string {
    switch (transformation.type) {
      case 'trim':
        return value.trim();

      case 'uppercase':
        return value.toUpperCase();

      case 'lowercase':
        return value.toLowerCase();

      case 'capitalize':
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

      case 'remove_prefix':
        const prefix = transformation.parameters.prefix || '';
        return value.startsWith(prefix) ? value.slice(prefix.length) : value;

      case 'remove_suffix':
        const suffix = transformation.parameters.suffix || '';
        return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;

      case 'replace_pattern':
        const pattern = new RegExp(transformation.parameters.pattern || '', transformation.parameters.flags || 'g');
        return value.replace(pattern, transformation.parameters.replacement || '');

      case 'split_and_take':
        const parts = value.split(transformation.parameters.separator || ',');
        const index = transformation.parameters.index || 0;
        return parts[index]?.trim() || '';

      default:
        return value;
    }
  }

  public generateMappingFromHeaders(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};

    for (const header of headers) {
      const normalizedHeader = this.normalizeColumnName(header);

      // Try exact match first
      if (ColumnMapper.EXPECTED_FIELDS.has(normalizedHeader)) {
        mapping[header] = normalizedHeader;
        continue;
      }

      // Try alias matching
      let bestMatch = '';
      let bestScore = 0;

      for (const [targetField, fieldInfo] of ColumnMapper.EXPECTED_FIELDS.entries()) {
        const normalizedAliases = fieldInfo.aliases.map((alias: string) => this.normalizeColumnName(alias));

        if (normalizedAliases.includes(normalizedHeader)) {
          mapping[header] = targetField;
          break;
        }

        // Fuzzy matching
        const fuzzyScore = this.calculateFuzzyMatch(normalizedHeader, targetField);
        if (fuzzyScore > bestScore && fuzzyScore > 0.8) {
          bestScore = fuzzyScore;
          bestMatch = targetField;
        }
      }

      if (bestMatch && !mapping[header]) {
        mapping[header] = bestMatch;
      }
    }

    return mapping;
  }
}