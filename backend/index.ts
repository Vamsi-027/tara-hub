/**
 * Backend Module Entry Point
 * Exports all public interfaces and utilities for the clean architecture
 * Single Responsibility: Module public API definition
 */

// Domain Layer Exports
export { Fabric } from './domain/entities/fabric/fabric.entity';
export { FabricId } from './domain/value-objects/fabric-id.vo';
export { SKU } from './domain/value-objects/sku.vo';
export { Money } from './domain/value-objects/money.vo';
export { Quantity } from './domain/value-objects/quantity.vo';
export { UserId } from './domain/value-objects/user-id.vo';
export * from './domain/events/fabric-created.event';
export * from './domain/events/stock-updated.event';
export * from './domain/events/price-updated.event';
export * from './domain/repositories/fabric.repository.interface';
export * from './domain/exceptions/domain.exceptions';

// Application Layer Exports
export { CreateFabricUseCase } from './application/use-cases/fabric/create-fabric.use-case';
export { UpdateFabricUseCase } from './application/use-cases/fabric/update-fabric.use-case';
export { DeleteFabricUseCase } from './application/use-cases/fabric/delete-fabric.use-case';
export { GetFabricUseCase } from './application/use-cases/fabric/get-fabric.use-case';
export { SearchFabricsUseCase } from './application/use-cases/fabric/search-fabrics.use-case';
export { ManageInventoryUseCase } from './application/use-cases/fabric/manage-inventory.use-case';
export { FabricMapper } from './application/mappers/fabric.mapper';
export * from './application/commands/fabric/create-fabric.command';
export * from './application/commands/fabric/update-fabric.command';
export * from './application/commands/fabric/delete-fabric.command';
export * from './application/commands/fabric/update-stock.command';
export * from './application/queries/fabric/get-fabric.query';
export * from './application/queries/fabric/search-fabrics.query';
export * from './application/dto/responses/fabric.response.dto';
export * from './application/interfaces/services/cache.service.interface';
export * from './application/interfaces/services/domain-event-publisher.interface';
export * from './application/interfaces/services/slug-generator.service.interface';

// Infrastructure Layer Exports
export { DrizzleFabricRepository } from './infrastructure/database/repositories/drizzle-fabric.repository';
export { RedisCacheService, CacheKeyGenerator } from './infrastructure/cache/services/redis-cache.service';
export { MemoryCacheService } from './infrastructure/cache/services/memory-cache.service';
export { HybridCacheStrategy } from './infrastructure/cache/strategies/cache-strategy';
export { InMemoryEventBus } from './infrastructure/events/publishers/event-bus.publisher';
export { SlugGeneratorService, FabricSlugGenerator } from './infrastructure/services/slug-generator.service';
export * from './infrastructure/database/connections/drizzle.connection';
export * from './infrastructure/database/schemas/fabric.schema';

// Interface Layer Exports
export { FabricController } from './interfaces/controllers/fabric.controller';
export { AuthMiddleware, createAuthMiddleware } from './interfaces/middleware/auth.middleware';
export { ValidationMiddleware, commonValidationMiddleware } from './interfaces/middleware/validation.middleware';
export { FabricRoutes, createFabricRoutes } from './interfaces/routes/fabric.routes';

// Shared Layer Exports
export { Container, createContainer, getContainer } from './shared/ioc/container';
export { Result } from './shared/utils/result.util';
export { HttpStatusCode } from './shared/constants/http-status.constants';
export * from './shared/utils/api-response.util';

// Type Exports
export type { 
  FabricType,
  FabricStatus,
  StockOperation,
  FabricProperties,
  FabricMetrics,
  AuditFields
} from './domain/entities/fabric/fabric.entity';

export type {
  FabricSearchCriteria,
  FabricSortCriteria,
  PaginationCriteria,
  PaginatedResult,
  FabricStatistics,
  FabricFilterOptions
} from './domain/repositories/fabric.repository.interface';

export type {
  FabricDetailResponse,
  FabricListResponse
} from './application/dto/responses/fabric.response.dto';

export type {
  AuthenticatedUser,
  AuthenticatedRequest
} from './interfaces/middleware/auth.middleware';

export type {
  ContainerConfig
} from './shared/ioc/container';