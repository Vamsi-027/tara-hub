/**
 * Base Repository with Caching Support
 * Provides common data access patterns for all repositories
 */

import { CacheStrategy } from '@/src/core/cache/strategies/cache-strategy';

export interface RepositoryOptions {
  cache?: CacheStrategy;
  cachePrefix?: string;
  cacheTTL?: number;
}

export abstract class BaseRepository<T extends { id: string }> {
  protected cache?: CacheStrategy;
  protected cachePrefix: string;
  protected cacheTTL: number;

  constructor(options: RepositoryOptions = {}) {
    this.cache = options.cache;
    this.cachePrefix = options.cachePrefix || this.constructor.name;
    this.cacheTTL = options.cacheTTL || 3600; // 1 hour default
  }

  /**
   * Get cache key for an entity
   */
  protected getCacheKey(id: string): string {
    return `${this.cachePrefix}:${id}`;
  }

  /**
   * Get cache key for a list query
   */
  protected getListCacheKey(params: any): string {
    const paramStr = JSON.stringify(params);
    const hash = this.hashString(paramStr);
    return `${this.cachePrefix}:list:${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Find entity by ID with caching
   */
  async findById(id: string): Promise<T | null> {
    // Check cache first
    if (this.cache) {
      const cacheKey = this.getCacheKey(id);
      const cached = await this.cache.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const result = await this.findByIdImpl(id);

    // Store in cache
    if (result && this.cache) {
      const cacheKey = this.getCacheKey(id);
      await this.cache.set(cacheKey, result, this.cacheTTL);
    }

    return result;
  }

  /**
   * Find all entities with caching
   */
  async findAll(params?: any): Promise<T[]> {
    // Check cache first
    if (this.cache) {
      const cacheKey = this.getListCacheKey(params || {});
      const cached = await this.cache.get<T[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fetch from database
    const results = await this.findAllImpl(params);

    // Store in cache
    if (this.cache) {
      const cacheKey = this.getListCacheKey(params || {});
      await this.cache.set(cacheKey, results, this.cacheTTL);
    }

    return results;
  }

  /**
   * Create entity and invalidate cache
   */
  async create(data: Omit<T, 'id'>): Promise<T> {
    const result = await this.createImpl(data);

    // Invalidate list cache
    if (this.cache) {
      await this.invalidateListCache();
    }

    return result;
  }

  /**
   * Update entity and invalidate cache
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const result = await this.updateImpl(id, data);

    // Invalidate caches
    if (this.cache) {
      const cacheKey = this.getCacheKey(id);
      await this.cache.delete(cacheKey);
      await this.invalidateListCache();
    }

    return result;
  }

  /**
   * Delete entity and invalidate cache
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.deleteImpl(id);

    // Invalidate caches
    if (this.cache) {
      const cacheKey = this.getCacheKey(id);
      await this.cache.delete(cacheKey);
      await this.invalidateListCache();
    }

    return result;
  }

  /**
   * Invalidate all list caches
   * Note: This is a simplified implementation
   * In production, you might want to track all list cache keys
   */
  protected async invalidateListCache(): Promise<void> {
    // This would need a more sophisticated implementation
    // to track all list cache keys
    console.log('List cache invalidation triggered');
  }

  // Abstract methods to be implemented by concrete repositories
  protected abstract findByIdImpl(id: string): Promise<T | null>;
  protected abstract findAllImpl(params?: any): Promise<T[]>;
  protected abstract createImpl(data: Omit<T, 'id'>): Promise<T>;
  protected abstract updateImpl(id: string, data: Partial<T>): Promise<T | null>;
  protected abstract deleteImpl(id: string): Promise<boolean>;
}