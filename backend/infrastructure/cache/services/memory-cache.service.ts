/**
 * Memory Cache Service Implementation
 * Infrastructure layer - implements cache interface using in-memory storage
 * Single Responsibility: In-memory caching for development/fallback
 */

import { ICacheService } from '../../../application/interfaces/services/cache.service.interface';

interface CacheEntry<T> {
  value: T;
  expiry?: number;
}

export class MemoryCacheService implements ICacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      expiry: ttl ? Date.now() + (ttl * 1000) : undefined
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async exists(key: string): Promise<boolean> {
    if (!this.cache.has(key)) {
      return false;
    }

    const entry = this.cache.get(key);
    if (entry?.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.expiry = Date.now() + (ttl * 1000);
      this.cache.set(key, entry);
    }
  }

  async flush(): Promise<void> {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry && now > entry.expiry) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}