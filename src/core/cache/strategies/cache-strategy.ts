/**
 * Cache Strategy Interface and Implementations
 * Provides abstraction over different caching mechanisms
 */

export interface CacheStrategy {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Vercel KV (Redis) Cache Strategy
 */
export class KVCacheStrategy implements CacheStrategy {
  private kv: any; // Vercel KV client

  constructor(kvClient: any) {
    this.kv = kvClient;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key);
      return value as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      await this.kv.set(key, value, { ex: ttl });
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    // KV doesn't support flush, need to track keys
    console.warn('Clear all cache not implemented for KV');
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.kv.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }
}

/**
 * In-Memory Cache Strategy (for development)
 */
export class MemoryCacheStrategy implements CacheStrategy {
  private cache: Map<string, { value: any; expires: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

/**
 * No-Op Cache Strategy (for testing or when caching is disabled)
 */
export class NoOpCacheStrategy implements CacheStrategy {
  async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {
    // No-op
  }

  async delete(_key: string): Promise<void> {
    // No-op
  }

  async clear(): Promise<void> {
    // No-op
  }

  async exists(_key: string): Promise<boolean> {
    return false;
  }
}

/**
 * Factory function to create appropriate cache strategy
 */
export function createCacheStrategy(): CacheStrategy {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    // Use Vercel KV in production
    const { kv } = require('@vercel/kv');
    return new KVCacheStrategy(kv);
  } else if (process.env.NODE_ENV === 'development') {
    // Use in-memory cache in development
    return new MemoryCacheStrategy();
  } else {
    // No caching in test environment
    return new NoOpCacheStrategy();
  }
}