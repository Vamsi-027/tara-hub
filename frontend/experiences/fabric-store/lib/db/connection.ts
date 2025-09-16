/**
 * Database Connection Service
 * Handles connections to PostgreSQL and Vercel KV with proper error handling
 */

import { sql } from '@vercel/postgres'
import { kv } from '@vercel/kv'
import { Pool } from 'pg'
import { dbConfig, validateDbConfig } from './config'

// Database connection pool
let pgPool: Pool | null = null

// Connection status
export enum ConnectionStatus {
  NOT_INITIALIZED = 'not_initialized',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

let connectionStatus: ConnectionStatus = ConnectionStatus.NOT_INITIALIZED
let connectionError: Error | null = null

/**
 * Initialize database connections
 */
export async function initializeDatabase(): Promise<void> {
  const validation = validateDbConfig()
  if (!validation.valid) {
    console.warn('Database configuration validation failed:', validation.errors)
    connectionStatus = ConnectionStatus.ERROR
    connectionError = new Error(validation.errors.join('; '))
    return
  }

  connectionStatus = ConnectionStatus.CONNECTING

  try {
    // Initialize PostgreSQL connection if enabled
    if (dbConfig.features.useDatabase && dbConfig.postgres.connectionString) {
      if (!pgPool) {
        pgPool = new Pool({
          connectionString: dbConfig.postgres.connectionString,
          ssl: dbConfig.postgres.ssl,
          max: dbConfig.postgres.max,
          idleTimeoutMillis: dbConfig.postgres.idleTimeoutMillis,
          connectionTimeoutMillis: dbConfig.postgres.connectionTimeoutMillis,
        })

        // Test the connection
        await pgPool.query('SELECT 1')
        console.log('✅ PostgreSQL connection established')
      }
    }

    // Test KV connection if enabled
    if (dbConfig.features.useCache && dbConfig.kv.url && dbConfig.kv.token) {
      await kv.ping()
      console.log('✅ Vercel KV connection established')
    }

    connectionStatus = ConnectionStatus.CONNECTED
    connectionError = null
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    connectionStatus = ConnectionStatus.ERROR
    connectionError = error as Error
  }
}

/**
 * Get database connection with retry logic
 */
export async function getDatabaseConnection() {
  if (connectionStatus === ConnectionStatus.NOT_INITIALIZED) {
    await initializeDatabase()
  }

  if (connectionStatus === ConnectionStatus.ERROR && connectionError) {
    // Retry connection
    await initializeDatabase()
    if (connectionStatus === ConnectionStatus.ERROR) {
      throw new Error(`Database connection failed: ${connectionError.message}`)
    }
  }

  return {
    pg: pgPool,
    kv: dbConfig.features.useCache ? kv : null,
    sql,
    status: connectionStatus,
  }
}

/**
 * Execute query with retry logic
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  context: string = 'database operation'
): Promise<T> {
  const { maxAttempts, initialDelay, maxDelay, factor } = dbConfig.retry
  let lastError: Error | null = null
  let delay = initialDelay

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt}/${maxAttempts} failed for ${context}:`, error)

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay = Math.min(delay * factor, maxDelay)
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`)
}

/**
 * Close all database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  try {
    if (pgPool) {
      await pgPool.end()
      pgPool = null
      console.log('PostgreSQL connection closed')
    }
    connectionStatus = ConnectionStatus.NOT_INITIALIZED
    connectionError = null
  } catch (error) {
    console.error('Error closing database connections:', error)
  }
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', closeDatabaseConnections)
  process.on('SIGTERM', closeDatabaseConnections)
}