/**
 * Fabric Repository Interface (Domain Contract)
 * Pure domain interface with no infrastructure dependencies
 */

import { Result } from '../../shared/utils/result.util';
import { Fabric } from '../entities/fabric/fabric.entity';
import { FabricId } from '../value-objects/fabric-id.vo';
import { SKU } from '../value-objects/sku.vo';

export interface FabricSearchCriteria {
  name?: string;
  type?: string;
  status?: string;
  manufacturerName?: string;
  collection?: string;
  colorFamily?: string;
  pattern?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  properties?: string[];
}

export interface FabricSortCriteria {
  field: 'name' | 'sku' | 'retailPrice' | 'createdAt' | 'updatedAt' | 'stockQuantity' | 'viewCount';
  direction: 'asc' | 'desc';
}

export interface PaginationCriteria {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface FabricStatistics {
  totalFabrics: number;
  activeFabrics: number;
  inactiveFabrics: number;
  discontinuedFabrics: number;
  outOfStockFabrics: number;
  lowStockFabrics: number;
  featuredFabrics: number;
  totalStockValue: number;
  averageRating: number;
  totalViewCount: number;
}

export interface FabricFilterOptions {
  types: string[];
  statuses: string[];
  manufacturers: string[];
  collections: string[];
  colorFamilies: string[];
  patterns: string[];
}

/**
 * Pure domain repository interface
 * No infrastructure dependencies - only domain entities and value objects
 */
export interface IFabricRepository {
  // Basic CRUD operations
  findById(id: FabricId): Promise<Result<Fabric | null>>;
  findBySku(sku: SKU): Promise<Result<Fabric | null>>;
  findBySlug(slug: string): Promise<Result<Fabric | null>>;
  save(fabric: Fabric): Promise<Result<void>>;
  delete(id: FabricId): Promise<Result<void>>;

  // Bulk operations
  saveAll(fabrics: Fabric[]): Promise<Result<void>>;
  findByIds(ids: FabricId[]): Promise<Result<Fabric[]>>;
  deleteAll(ids: FabricId[]): Promise<Result<void>>;

  // Search and filtering
  search(
    criteria: FabricSearchCriteria,
    sort: FabricSortCriteria,
    pagination: PaginationCriteria
  ): Promise<Result<PaginatedResult<Fabric>>>;

  findAll(
    sort?: FabricSortCriteria,
    pagination?: PaginationCriteria
  ): Promise<Result<PaginatedResult<Fabric>>>;

  // Specialized queries
  findFeatured(limit: number): Promise<Result<Fabric[]>>;
  findNewArrivals(limit: number, daysBack?: number): Promise<Result<Fabric[]>>;
  findBestSellers(limit: number): Promise<Result<Fabric[]>>;
  findRelated(fabricId: FabricId, limit: number): Promise<Result<Fabric[]>>;
  findByManufacturer(manufacturerName: string, limit?: number): Promise<Result<Fabric[]>>;
  findByCollection(collection: string, limit?: number): Promise<Result<Fabric[]>>;
  findByTags(tags: string[], limit?: number): Promise<Result<Fabric[]>>;

  // Stock management
  findLowStock(threshold?: number): Promise<Result<Fabric[]>>;
  findOutOfStock(): Promise<Result<Fabric[]>>;
  findNeedingReorder(): Promise<Result<Fabric[]>>;
  findByStockRange(min: number, max: number, unit: string): Promise<Result<Fabric[]>>;

  // Validation helpers
  skuExists(sku: SKU, excludeId?: FabricId): Promise<Result<boolean>>;
  slugExists(slug: string, excludeId?: FabricId): Promise<Result<boolean>>;
  nameExists(name: string, excludeId?: FabricId): Promise<Result<boolean>>;

  // Analytics and reporting
  getStatistics(): Promise<Result<FabricStatistics>>;
  getFilterOptions(): Promise<Result<FabricFilterOptions>>;
  count(criteria?: FabricSearchCriteria): Promise<Result<number>>;

  // Performance queries
  findTopRated(limit: number): Promise<Result<Fabric[]>>;
  findMostViewed(limit: number, timeframe?: 'day' | 'week' | 'month'): Promise<Result<Fabric[]>>;
  findMostFavorited(limit: number): Promise<Result<Fabric[]>>;
  
  // Full-text search
  searchByText(
    query: string,
    fields?: string[],
    pagination?: PaginationCriteria
  ): Promise<Result<PaginatedResult<Fabric>>>;
}

/**
 * Read-only repository interface for CQRS read side
 */
export interface IFabricReadRepository {
  findById(id: FabricId): Promise<Result<Fabric | null>>;
  search(
    criteria: FabricSearchCriteria,
    sort: FabricSortCriteria,
    pagination: PaginationCriteria
  ): Promise<Result<PaginatedResult<Fabric>>>;
  findFeatured(limit: number): Promise<Result<Fabric[]>>;
  getStatistics(): Promise<Result<FabricStatistics>>;
  getFilterOptions(): Promise<Result<FabricFilterOptions>>;
}