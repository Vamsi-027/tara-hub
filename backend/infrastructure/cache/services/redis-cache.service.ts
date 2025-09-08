/**
 * Redis Cache Service Implementation
 * Infrastructure layer - implements cache interface using Redis
 * Single Responsibility: Redis-specific caching operations
 */

import { Redis } from 'ioredis';
import { ICacheService, ICacheKeyGenerator } from '../../../application/interfaces/services/cache.service.interface';
import { Result } from '../../../shared/utils/result.util';

export class RedisCacheService implements ICacheService {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis delete pattern error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }
}

export class CacheKeyGenerator implements ICacheKeyGenerator {
  generate(prefix: string, ...parts: any[]): string {
    const cleanParts = parts
      .filter(part => part !== null && part !== undefined)
      .map(part => String(part).replace(/[^a-zA-Z0-9_-]/g, '_'));
    
    return [prefix, ...cleanParts].join(':');
  }

  generateHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(16);
  }
}