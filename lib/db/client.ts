/**
 * DATABASE CLIENT CONFIGURATION
 * Optimized for Next.js and serverless environments
 * Supports both Neon (serverless) and standard PostgreSQL
 */

import { neon, neonConfig, Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import * as schema from './schema/fabrics.schema';

// Configure Neon for serverless
neonConfig.fetchConnectionCache = true;

// ============================================
// Database Client Singleton
// ============================================

class DatabaseClient {
  private static instance: DatabaseClient;
  private httpClient: ReturnType<typeof neon> | null = null;
  private poolClient: PgPool | NeonPool | null = null;
  private drizzleInstance: any = null;
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }
  
  private initialize() {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!databaseUrl) {
      console.error('Database URL not configured');
      return;
    }
    
    // Determine environment and connection type
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    const useServerless = isVercel || process.env.DATABASE_SERVERLESS === 'true';
    
    if (useServerless) {
      // Use Neon serverless for Vercel/Edge environments
      console.log('Using serverless database connection');
      this.initializeServerless(databaseUrl);
    } else {
      // Use traditional connection pool for Node.js environments
      console.log('Using pooled database connection');
      this.initializePooled(databaseUrl);
    }
  }
  
  private initializeServerless(databaseUrl: string) {
    try {
      // HTTP client for serverless/edge
      this.httpClient = neon(databaseUrl, {
        fetchOptions: {
          cache: 'no-store', // Disable caching for fresh data
        },
      });
      
      this.drizzleInstance = drizzleHttp(this.httpClient, {
        schema,
        logger: process.env.NODE_ENV === 'development',
      });
      
    } catch (error) {
      console.error('Failed to initialize serverless database:', error);
    }
  }
  
  private initializePooled(databaseUrl: string) {
    try {
      // Parse connection string
      const isNeonUrl = databaseUrl.includes('neon.tech');
      
      if (isNeonUrl) {
        // Use Neon pool for better compatibility
        this.poolClient = new NeonPool({
          connectionString: databaseUrl,
          max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });
      } else {
        // Standard PostgreSQL pool
        this.poolClient = new PgPool({
          connectionString: databaseUrl,
          max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 20,
          min: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          statement_timeout: 30000,
          query_timeout: 30000,
          ssl: process.env.DATABASE_SSL !== 'false' ? {
            rejectUnauthorized: false,
          } : undefined,
        });
        
        // Pool event handlers
        this.poolClient.on('error', (err) => {
          console.error('Unexpected database pool error:', err);
        });
        
        this.poolClient.on('connect', () => {
          console.log('Database pool: client connected');
        });
        
        this.poolClient.on('acquire', () => {
          const pool = this.poolClient as PgPool;
          console.log(`Database pool: client acquired (${pool.totalCount}/${pool.idleCount}/${pool.waitingCount})`);
        });
      }
      
      this.drizzleInstance = drizzleNode(this.poolClient, {
        schema,
        logger: process.env.NODE_ENV === 'development',
      });
      
    } catch (error) {
      console.error('Failed to initialize pooled database:', error);
    }
  }
  
  /**
   * Get Drizzle ORM instance
   */
  getClient() {
    if (!this.drizzleInstance) {
      throw new Error('Database client not initialized');
    }
    return this.drizzleInstance;
  }
  
  /**
   * Get raw SQL client for complex queries
   */
  async getRawClient() {
    if (this.poolClient) {
      return this.poolClient;
    }
    if (this.httpClient) {
      return this.httpClient;
    }
    throw new Error('No database client available');
  }
  
  /**
   * Execute raw SQL query
   */
  async execute(sql: string, params?: any[]): Promise<any> {
    if (this.poolClient) {
      const result = await this.poolClient.query(sql, params);
      return result.rows;
    }
    if (this.httpClient) {
      return await this.httpClient(sql, params);
    }
    throw new Error('No database client available');
  }
  
  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.execute('SELECT 1 as test');
      return result && result[0]?.test === 1;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
  
  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    if (!this.poolClient || !(this.poolClient instanceof PgPool)) {
      return null;
    }
    
    const pool = this.poolClient as PgPool;
    return {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    };
  }
  
  /**
   * Close database connections
   */
  async disconnect() {
    if (this.poolClient) {
      await this.poolClient.end();
      this.poolClient = null;
    }
    this.httpClient = null;
    this.drizzleInstance = null;
  }
  
  /**
   * Handle cleanup on app termination
   */
  async cleanup() {
    console.log('Cleaning up database connections...');
    await this.disconnect();
  }
}

// ============================================
// Export instances
// ============================================

// Create singleton instance
const dbClient = DatabaseClient.getInstance();

// Export Drizzle instance for direct use
export const db = dbClient.getClient();

// Export client instance for advanced usage
export { dbClient };

// ============================================
// Graceful shutdown handling
// ============================================

if (process.env.NODE_ENV !== 'production') {
  // Handle graceful shutdown in development
  process.on('SIGINT', async () => {
    await dbClient.cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await dbClient.cleanup();
    process.exit(0);
  });
}

// ============================================
// Connection monitoring (optional)
// ============================================

if (process.env.DB_MONITOR === 'true') {
  setInterval(() => {
    const stats = dbClient.getPoolStats();
    if (stats) {
      console.log('Database pool stats:', stats);
      
      // Alert if pool is under pressure
      if (stats.waiting > 5) {
        console.warn('High database connection pressure detected');
      }
    }
  }, 30000); // Check every 30 seconds
}

export default db;
