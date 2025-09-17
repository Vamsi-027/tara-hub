/*
  Import Configuration and Safety Defaults

  Centralized configuration for bulk import with safe defaults
  and configurable limits to prevent resource exhaustion.
*/

export interface ImportConfig {
  // Safety defaults
  defaults: {
    upsert_by: 'off' | 'handle' | 'sku';
    variant_strategy: 'explicit' | 'default_type';
    force_prune_missing_variants: boolean;
    image_strategy: 'replace' | 'append' | 'merge';
    dry_run: boolean;
    enable_exchange_rate_validation: boolean;
    exchange_rate_max_variation: number; // e.g., 0.3 = 30%
  };

  // Size and row limits
  limits: {
    max_file_size_mb: number;
    max_rows: number;
    max_concurrent_imports: number; // Per admin user
    max_batch_size: number;
    max_variants_per_product: number;
    max_images_per_product: number;
    max_options_per_product: number;
  };

  // Rate limiting
  rate_limits: {
    rows_per_second: number;
    image_checks_per_second: number;
    api_calls_per_second: number;
    enable_image_validation: boolean; // HEAD checks
  };

  // Memory management
  memory: {
    max_memory_usage_mb: number;
    warning_threshold: number; // percentage
    critical_threshold: number; // percentage
    backpressure_threshold: number; // percentage
  };

  // Timeouts
  timeouts: {
    job_timeout_minutes: number;
    row_processing_timeout_ms: number;
    image_check_timeout_ms: number;
    db_transaction_timeout_ms: number;
  };

  // Artifact configuration
  artifacts: {
    retention_days: number;
    enable_annotated_xlsx: boolean;
    annotated_xlsx_max_size_mb: number;
    storage_path: string;
  };

  // Feature toggles
  features: {
    enable_smart_mapping: boolean;
    enable_dependency_resolution: boolean;
    enable_checkpointing: boolean;
    enable_dlq: boolean;
    enable_telemetry: boolean;
    enable_pruning: boolean; // Master switch for pruning functionality
  };
}

export const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  defaults: {
    upsert_by: 'off', // Safe default: no upserts
    variant_strategy: 'explicit', // Safe default: require explicit variant data
    force_prune_missing_variants: false, // Safe default: never prune
    image_strategy: 'replace',
    dry_run: false,
    enable_exchange_rate_validation: false, // Disabled by default
    exchange_rate_max_variation: 0.3 // 30% max variation when enabled
  },

  limits: {
    max_file_size_mb: 100,
    max_rows: 10000,
    max_concurrent_imports: 1, // One active import per admin
    max_batch_size: 100,
    max_variants_per_product: 100,
    max_images_per_product: 20,
    max_options_per_product: 3
  },

  rate_limits: {
    rows_per_second: 50,
    image_checks_per_second: 5,
    api_calls_per_second: 10,
    enable_image_validation: false // Disabled by default for performance
  },

  memory: {
    max_memory_usage_mb: 512,
    warning_threshold: 0.7, // 70%
    critical_threshold: 0.85, // 85%
    backpressure_threshold: 0.8 // 80%
  },

  timeouts: {
    job_timeout_minutes: 60,
    row_processing_timeout_ms: 5000,
    image_check_timeout_ms: 3000,
    db_transaction_timeout_ms: 30000
  },

  artifacts: {
    retention_days: 7,
    enable_annotated_xlsx: true,
    annotated_xlsx_max_size_mb: 50,
    storage_path: '/tmp/medusa-imports'
  },

  features: {
    enable_smart_mapping: true,
    enable_dependency_resolution: true,
    enable_checkpointing: true,
    enable_dlq: true,
    enable_telemetry: true,
    enable_pruning: false // Master switch - disabled by default
  }
};

export class ImportConfigValidator {
  private config: ImportConfig;

  constructor(config: Partial<ImportConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_IMPORT_CONFIG, config);
    this.validate();
  }

  private mergeConfig(defaults: ImportConfig, overrides: Partial<ImportConfig>): ImportConfig {
    return {
      defaults: { ...defaults.defaults, ...overrides.defaults },
      limits: { ...defaults.limits, ...overrides.limits },
      rate_limits: { ...defaults.rate_limits, ...overrides.rate_limits },
      memory: { ...defaults.memory, ...overrides.memory },
      timeouts: { ...defaults.timeouts, ...overrides.timeouts },
      artifacts: { ...defaults.artifacts, ...overrides.artifacts },
      features: { ...defaults.features, ...overrides.features }
    };
  }

  private validate(): void {
    // Validate limits
    if (this.config.limits.max_file_size_mb > 500) {
      throw new Error('Maximum file size cannot exceed 500MB');
    }

    if (this.config.limits.max_rows > 100000) {
      throw new Error('Maximum rows cannot exceed 100,000');
    }

    // Validate memory thresholds
    if (this.config.memory.warning_threshold >= this.config.memory.critical_threshold) {
      throw new Error('Warning threshold must be less than critical threshold');
    }

    if (this.config.memory.backpressure_threshold > this.config.memory.critical_threshold) {
      throw new Error('Backpressure threshold should not exceed critical threshold');
    }

    // Validate pruning safety
    if (this.config.defaults.force_prune_missing_variants && !this.config.features.enable_pruning) {
      throw new Error('Cannot force prune when pruning feature is disabled');
    }
  }

  public getConfig(): ImportConfig {
    return this.config;
  }

  public isWithinLimits(fileSize: number, rowCount: number): { valid: boolean; reason?: string } {
    if (fileSize > this.config.limits.max_file_size_mb * 1024 * 1024) {
      return {
        valid: false,
        reason: `File size exceeds maximum of ${this.config.limits.max_file_size_mb}MB`
      };
    }

    if (rowCount > this.config.limits.max_rows) {
      return {
        valid: false,
        reason: `Row count exceeds maximum of ${this.config.limits.max_rows}`
      };
    }

    return { valid: true };
  }

  public isPruningAllowed(options: any): { allowed: boolean; reason?: string } {
    if (!this.config.features.enable_pruning) {
      return {
        allowed: false,
        reason: 'Pruning feature is globally disabled'
      };
    }

    if (options.force_prune_missing_variants && !options.dry_run) {
      // Additional safety checks for destructive operations
      if (!options.prune_confirm_token) {
        return {
          allowed: false,
          reason: 'Missing confirmation token for pruning'
        };
      }

      return { allowed: true };
    }

    return { allowed: true };
  }
}

// Environment-based configuration overrides
export function getEnvironmentConfig(): Partial<ImportConfig> {
  const env = process.env.NODE_ENV || 'development';
  const config: Partial<ImportConfig> = {};

  if (env === 'production') {
    config.defaults = {
      ...config.defaults,
      dry_run: true, // Default to dry-run in production
      force_prune_missing_variants: false
    };

    config.limits = {
      ...config.limits,
      max_concurrent_imports: 1,
      max_file_size_mb: 50,
      max_rows: 5000
    };

    config.features = {
      ...config.features,
      enable_pruning: false // Disable pruning in production by default
    };
  } else if (env === 'staging') {
    config.limits = {
      ...config.limits,
      max_file_size_mb: 200,
      max_rows: 20000
    };
  }

  // Allow environment variable overrides
  if (process.env.IMPORT_MAX_FILE_SIZE_MB) {
    config.limits = {
      ...config.limits,
      max_file_size_mb: parseInt(process.env.IMPORT_MAX_FILE_SIZE_MB)
    };
  }

  if (process.env.IMPORT_MAX_ROWS) {
    config.limits = {
      ...config.limits,
      max_rows: parseInt(process.env.IMPORT_MAX_ROWS)
    };
  }

  if (process.env.IMPORT_ENABLE_PRUNING === 'true') {
    config.features = {
      ...config.features,
      enable_pruning: true
    };
  }

  return config;
}