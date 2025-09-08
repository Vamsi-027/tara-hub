/**
 * Dependency Injection Container
 * Shared layer - manages dependency injection and service registration
 * Single Responsibility: Service container and dependency resolution
 */

import { drizzleConnection, type DrizzleDb } from '../../infrastructure/database/connections/drizzle.connection';
import { DrizzleFabricRepository } from '../../infrastructure/database/repositories/drizzle-fabric.repository';
import { RedisCacheService, CacheKeyGenerator } from '../../infrastructure/cache/services/redis-cache.service';
import { MemoryCacheService } from '../../infrastructure/cache/services/memory-cache.service';
import { HybridCacheStrategy } from '../../infrastructure/cache/strategies/cache-strategy';
import { InMemoryEventBus } from '../../infrastructure/events/publishers/event-bus.publisher';
import { SlugGeneratorService } from '../../infrastructure/services/slug-generator.service';

import { CreateFabricUseCase } from '../../application/use-cases/fabric/create-fabric.use-case';
import { UpdateFabricUseCase } from '../../application/use-cases/fabric/update-fabric.use-case';
import { DeleteFabricUseCase } from '../../application/use-cases/fabric/delete-fabric.use-case';
import { GetFabricUseCase } from '../../application/use-cases/fabric/get-fabric.use-case';
import { SearchFabricsUseCase } from '../../application/use-cases/fabric/search-fabrics.use-case';
import { ManageInventoryUseCase } from '../../application/use-cases/fabric/manage-inventory.use-case';
import { FabricMapper } from '../../application/mappers/fabric.mapper';

import { FabricController } from '../../interfaces/controllers/fabric.controller';
import { createAuthMiddleware } from '../../interfaces/middleware/auth.middleware';
import { createFabricRoutes } from '../../interfaces/routes/fabric.routes';

import { IFabricRepository } from '../../domain/repositories/fabric.repository.interface';
import { ICacheService } from '../../application/interfaces/services/cache.service.interface';
import { IDomainEventPublisher } from '../../application/interfaces/services/domain-event-publisher.interface';
import { ISlugGenerator } from '../../application/interfaces/services/slug-generator.service.interface';

export interface ContainerConfig {
  database: {
    url: string;
  };
  cache: {
    redis?: {
      url: string;
      password?: string;
    };
    strategy: 'redis' | 'memory' | 'hybrid';
  };
  auth: {
    jwtSecret: string;
    adminEmails: string[];
  };
}

export class Container {
  private services = new Map<string, any>();
  private config: ContainerConfig;

  constructor(config: ContainerConfig) {
    this.config = config;
  }

  // Service registration
  register<T>(token: string, factory: () => T): void {
    this.services.set(token, factory);
  }

  registerSingleton<T>(token: string, factory: () => T): void {
    let instance: T;
    this.services.set(token, () => {
      if (!instance) {
        instance = factory();
      }
      return instance;
    });
  }

  registerInstance<T>(token: string, instance: T): void {
    this.services.set(token, () => instance);
  }

  // Service resolution
  resolve<T>(token: string): T {
    const factory = this.services.get(token);
    if (!factory) {
      throw new Error(`Service not registered: ${token}`);
    }
    return factory();
  }

  // Initialize all services
  async initialize(): Promise<void> {
    await this.registerInfrastructureServices();
    this.registerApplicationServices();
    this.registerInterfaceServices();
  }

  private async registerInfrastructureServices(): Promise<void> {
    // Database
    this.registerSingleton<DrizzleDb>('Database', () => {
      return drizzleConnection(this.config.database.url);
    });

    // Repository
    this.registerSingleton<IFabricRepository>('FabricRepository', () => {
      const db = this.resolve<DrizzleDb>('Database');
      return new DrizzleFabricRepository(db);
    });

    // Cache
    await this.setupCacheServices();

    // Event Publisher
    this.registerSingleton<IDomainEventPublisher>('EventPublisher', () => {
      return new InMemoryEventBus();
    });

    // Slug Generator
    this.registerSingleton<ISlugGenerator>('SlugGenerator', () => {
      return new SlugGeneratorService();
    });
  }

  private async setupCacheServices(): Promise<void> {
    const strategy = this.config.cache.strategy;

    if (strategy === 'redis' && this.config.cache.redis) {
      try {
        const { Redis } = await import('ioredis');
        const redis = new Redis(this.config.cache.redis.url);
        
        this.registerSingleton<ICacheService>('CacheService', () => {
          return new RedisCacheService(redis);
        });
      } catch (error) {
        console.warn('Redis not available, falling back to memory cache');
        this.registerMemoryCache();
      }
    } else if (strategy === 'hybrid' && this.config.cache.redis) {
      try {
        const { Redis } = await import('ioredis');
        const redis = new Redis(this.config.cache.redis.url);
        
        this.registerSingleton<ICacheService>('CacheService', () => {
          const redisCache = new RedisCacheService(redis);
          const memoryCache = new MemoryCacheService();
          return new HybridCacheStrategy(redisCache, memoryCache);
        });
      } catch (error) {
        console.warn('Redis not available for hybrid strategy, using memory cache only');
        this.registerMemoryCache();
      }
    } else {
      this.registerMemoryCache();
    }

    this.registerSingleton('CacheKeyGenerator', () => {
      return new CacheKeyGenerator();
    });
  }

  private registerMemoryCache(): void {
    this.registerSingleton<ICacheService>('CacheService', () => {
      return new MemoryCacheService();
    });
  }

  private registerApplicationServices(): void {
    // Use Cases
    this.registerSingleton('CreateFabricUseCase', () => {
      return new CreateFabricUseCase(
        this.resolve<IFabricRepository>('FabricRepository'),
        this.resolve<ISlugGenerator>('SlugGenerator'),
        this.resolve<IDomainEventPublisher>('EventPublisher')
      );
    });

    this.registerSingleton('UpdateFabricUseCase', () => {
      return new UpdateFabricUseCase(
        this.resolve<IFabricRepository>('FabricRepository'),
        this.resolve<ISlugGenerator>('SlugGenerator'),
        this.resolve<IDomainEventPublisher>('EventPublisher')
      );
    });

    this.registerSingleton('DeleteFabricUseCase', () => {
      return new DeleteFabricUseCase(
        this.resolve<IFabricRepository>('FabricRepository'),
        this.resolve<IDomainEventPublisher>('EventPublisher')
      );
    });

    this.registerSingleton('GetFabricUseCase', () => {
      return new GetFabricUseCase(
        this.resolve<IFabricRepository>('FabricRepository'),
        this.resolve<ICacheService>('CacheService')
      );
    });

    this.registerSingleton('SearchFabricsUseCase', () => {
      return new SearchFabricsUseCase(
        this.resolve<IFabricRepository>('FabricRepository'),
        this.resolve<ICacheService>('CacheService')
      );
    });

    this.registerSingleton('ManageInventoryUseCase', () => {
      return new ManageInventoryUseCase(
        this.resolve<IFabricRepository>('FabricRepository'),
        this.resolve<IDomainEventPublisher>('EventPublisher')
      );
    });

    // Mappers
    this.registerSingleton('FabricMapper', () => {
      return new FabricMapper();
    });
  }

  private registerInterfaceServices(): void {
    // Middleware
    this.registerSingleton('AuthMiddleware', () => {
      return createAuthMiddleware(
        this.config.auth.jwtSecret,
        this.config.auth.adminEmails
      );
    });

    // Controllers
    this.registerSingleton('FabricController', () => {
      return new FabricController(
        this.resolve('CreateFabricUseCase'),
        this.resolve('UpdateFabricUseCase'),
        this.resolve('DeleteFabricUseCase'),
        this.resolve('GetFabricUseCase'),
        this.resolve('SearchFabricsUseCase'),
        this.resolve('ManageInventoryUseCase'),
        this.resolve('FabricMapper')
      );
    });

    // Routes
    this.registerSingleton('FabricRoutes', () => {
      return createFabricRoutes(
        this.resolve('FabricController'),
        this.resolve('AuthMiddleware')
      );
    });
  }

  // Cleanup resources
  async dispose(): Promise<void> {
    const cacheService = this.services.get('CacheService');
    if (cacheService && typeof cacheService.destroy === 'function') {
      cacheService.destroy();
    }

    // Add other cleanup logic as needed
  }
}

// Factory function to create container with environment configuration
export function createContainer(): Container {
  const config: ContainerConfig = {
    database: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
    },
    cache: {
      redis: process.env.KV_REST_API_URL ? {
        url: process.env.KV_REST_API_URL,
        password: process.env.KV_REST_API_TOKEN
      } : undefined,
      strategy: process.env.CACHE_STRATEGY as any || 'hybrid'
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '',
      adminEmails: [
        'varaku@gmail.com',
        'batchu.kedareswaraabhinav@gmail.com',
        'vamsicheruku027@gmail.com',
        'admin@deepcrm.ai'
      ]
    }
  };

  if (!config.database.url) {
    throw new Error('Database URL is required');
  }

  if (!config.auth.jwtSecret) {
    throw new Error('JWT secret is required');
  }

  return new Container(config);
}

// Global container instance
let containerInstance: Container | null = null;

export async function getContainer(): Promise<Container> {
  if (!containerInstance) {
    containerInstance = createContainer();
    await containerInstance.initialize();
  }
  return containerInstance;
}