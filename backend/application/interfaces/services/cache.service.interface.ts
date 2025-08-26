/**
 * Cache Service Interface
 * Abstracts caching operations from business logic
 */

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<void>;
  flush(): Promise<void>;
}

export interface ICacheKeyGenerator {
  generate(prefix: string, ...parts: any[]): string;
  generateHash(data: any): string;
}