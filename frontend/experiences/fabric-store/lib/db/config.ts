/**
 * Database Configuration
 * Production-ready database configuration with environment-based settings
 */

export const dbConfig = {
  // PostgreSQL configuration for persistent storage
  postgres: {
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 20, // Maximum pool connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Redis/KV configuration for caching
  kv: {
    url: process.env.KV_URL,
    token: process.env.KV_REST_API_TOKEN,
    restUrl: process.env.KV_REST_API_URL,
  },

  // Feature flags
  features: {
    useCache: process.env.USE_CACHE === 'true' || process.env.NODE_ENV === 'production',
    useDatabase: process.env.USE_DATABASE !== 'false',
    fallbackToFile: process.env.FALLBACK_TO_FILE === 'true' || process.env.NODE_ENV === 'development',
  },

  // Cache settings
  cache: {
    orderTTL: 3600, // 1 hour in seconds
    listTTL: 300, // 5 minutes for list queries
  },

  // Retry configuration
  retry: {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 1000,
    factor: 2,
  },
}

// Validate configuration
export function validateDbConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (dbConfig.features.useDatabase && !dbConfig.postgres.connectionString) {
    errors.push('DATABASE_URL or POSTGRES_URL is required when database is enabled')
  }

  if (dbConfig.features.useCache && (!dbConfig.kv.url || !dbConfig.kv.token)) {
    errors.push('KV_URL and KV_REST_API_TOKEN are required when cache is enabled')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}