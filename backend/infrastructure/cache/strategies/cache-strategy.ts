/**
 * Cache Strategy Implementation
 * Infrastructure layer - implements different caching strategies
 * Single Responsibility: Cache management with fallback and invalidation
 */

import { ICacheService } from '../../../application/interfaces/services/cache.service.interface';
import { Result } from '../../../shared/utils/result.util';

export interface ICacheStrategy {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  invalidateTag(tag: string): Promise<void>;
}

export class HybridCacheStrategy implements ICacheStrategy {
  private readonly tagMap = new Map<string, Set<string>>();

  constructor(
    private readonly primaryCache: ICacheService,
    private readonly fallbackCache?: ICacheService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.primaryCache.get<T>(key);
      if (value !== null) {
        return value;
      }

      if (this.fallbackCache) {
        const fallbackValue = await this.fallbackCache.get<T>(key);
        if (fallbackValue !== null) {
          await this.primaryCache.set(key, fallbackValue);
          return fallbackValue;
        }
      }

      return null;
    } catch (error) {
      if (this.fallbackCache) {
        return this.fallbackCache.get<T>(key);
      }
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void> {
    try {
      await this.primaryCache.set(key, value, ttl);
      
      if (tags) {
        this.addTags(key, tags);
      }
    } catch (error) {
      console.error('Primary cache set failed:', error);
    }

    if (this.fallbackCache) {
      try {
        await this.fallbackCache.set(key, value, ttl);
      } catch (error) {
        console.error('Fallback cache set failed:', error);
      }
    }
  }

  async delete(key: string): Promise<void> {
    const promises = [this.primaryCache.delete(key)];
    
    if (this.fallbackCache) {
      promises.push(this.fallbackCache.delete(key));
    }

    this.removeTags(key);
    
    await Promise.allSettled(promises);
  }

  async deletePattern(pattern: string): Promise<void> {
    const promises = [this.primaryCache.deletePattern(pattern)];
    
    if (this.fallbackCache) {
      promises.push(this.fallbackCache.deletePattern(pattern));
    }
    
    await Promise.allSettled(promises);
  }

  async invalidateTag(tag: string): Promise<void> {
    const keys = this.tagMap.get(tag);
    if (!keys) return;

    const deletePromises = Array.from(keys).map(key => this.delete(key));
    await Promise.allSettled(deletePromises);

    this.tagMap.delete(tag);
  }

  private addTags(key: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    });
  }

  private removeTags(key: string): void {
    for (const [tag, keys] of this.tagMap.entries()) {
      keys.delete(key);
      if (keys.size === 0) {
        this.tagMap.delete(tag);
      }
    }
  }
}

export class CacheWithRetry implements ICacheStrategy {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly maxRetries: number = 3,
    private readonly retryDelay: number = 100
  ) {}

  async get<T>(key: string): Promise<T | null> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.cacheService.get<T>(key);
      } catch (error) {
        if (attempt === this.maxRetries - 1) {
          console.error('Cache get failed after retries:', error);
          return null;
        }
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.cacheService.set(key, value, ttl);
        return;
      } catch (error) {
        if (attempt === this.maxRetries - 1) {
          console.error('Cache set failed after retries:', error);
          return;
        }
        await this.delay(this.retryDelay * Math.pow(2, attempt));
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.cacheService.delete(key);
    } catch (error) {
      console.error('Cache delete failed:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      await this.cacheService.deletePattern(pattern);
    } catch (error) {
      console.error('Cache delete pattern failed:', error);
    }
  }

  async invalidateTag(tag: string): Promise<void> {
    await this.deletePattern(`*:${tag}:*`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}