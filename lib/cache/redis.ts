/**
 * REDIS CACHE CONFIGURATION
 * Singleton Redis client for caching
 * Falls back gracefully if Redis is not available
 */

import { Redis } from 'ioredis';

class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }
  
  private initialize() {
    // Skip Redis in development if not configured
    if (!process.env.REDIS_URL && process.env.NODE_ENV === 'development') {
      console.log('Redis URL not configured, caching disabled');
      return;
    }
    
    try {
      this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        // Connection retry strategy
        retryStrategy: (times) => {
          if (times > this.maxConnectionAttempts) {
            console.error('Redis connection failed after max attempts');
            this.client = null;
            return null; // Stop retrying
          }
          const delay = Math.min(times * 1000, 3000);
          return delay;
        },
        
        // Connection options
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        
        // Reconnection options
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true; // Reconnect on READONLY error
          }
          return false;
        },
        
        // Performance options
        enableOfflineQueue: true,
        lazyConnect: true,
      });
      
      // Event handlers
      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
        this.connectionAttempts = 0;
      });
      
      this.client.on('ready', () => {
        console.log('Redis client ready');
      });
      
      this.client.on('error', (error) => {
        console.error('Redis error:', error.message);
        this.isConnected = false;
      });
      
      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });
      
      // Attempt to connect
      this.client.connect().catch((error) => {
        console.error('Failed to connect to Redis:', error.message);
        this.client = null;
      });
      
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.client = null;
    }
  }
  
  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Set value in cache
   */
  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Set value with expiry
   */
  async setex(key: string, ttl: number, value: string): Promise<boolean> {
    return this.set(key, value, ttl);
  }
  
  /**
   * Delete key(s)
   */
  async del(...keys: string[]): Promise<number> {
    if (!this.client || !this.isConnected) return 0;
    
    try {
      return await this.client.del(...keys);
    } catch (error) {
      console.error(`Redis DEL error for keys ${keys}:`, error);
      return 0;
    }
  }
  
  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.client || !this.isConnected) return [];
    
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      console.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }
  
  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Set expiry on key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    
    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Increment counter
   */
  async incr(key: string): Promise<number | null> {
    if (!this.client || !this.isConnected) return null;
    
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Publish message to channel
   */
  async publish(channel: string, message: string): Promise<number> {
    if (!this.client || !this.isConnected) return 0;
    
    try {
      return await this.client.publish(channel, message);
    } catch (error) {
      console.error(`Redis PUBLISH error for channel ${channel}:`, error);
      return 0;
    }
  }
  
  /**
   * Subscribe to channel
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (!this.client || !this.isConnected) return;
    
    try {
      await this.client.subscribe(channel);
      this.client.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          callback(message);
        }
      });
    } catch (error) {
      console.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
    }
  }
  
  /**
   * Get client status
   */
  getStatus(): { connected: boolean; available: boolean } {
    return {
      connected: this.isConnected,
      available: this.client !== null,
    };
  }
  
  /**
   * Flush all keys (use with caution)
   */
  async flushall(): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Cannot flush Redis in production');
      return false;
    }
    
    try {
      await this.client.flushall();
      return true;
    } catch (error) {
      console.error('Redis FLUSHALL error:', error);
      return false;
    }
  }
  
  /**
   * Close connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const redis = RedisClient.getInstance();

// Export the client for direct access if needed
export default redis;
