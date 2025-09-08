/**
 * Search Fabrics Use Case
 * Handles fabric search with filtering, sorting, and pagination
 * Single Responsibility: Orchestrate fabric search operations
 */

import { Result } from '../../../shared/utils/result.util';
import { Fabric } from '../../../domain/entities/fabric/fabric.entity';
import { 
  IFabricRepository,
  FabricSearchCriteria,
  FabricSortCriteria,
  PaginationCriteria,
  PaginatedResult
} from '../../../domain/repositories/fabric.repository.interface';
import { FabricSearchQuery } from '../../queries/fabric/fabric-search.query';
import { FabricSearchResponse } from '../../dto/responses/fabric.response.dto';
import { FabricMapper } from '../../mappers/fabric.mapper';
import { ICacheService } from '../../interfaces/services/cache.service.interface';

export class SearchFabricsUseCase {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'fabric-search:';

  constructor(
    private readonly fabricRepository: IFabricRepository,
    private readonly fabricMapper: FabricMapper,
    private readonly cacheService: ICacheService
  ) {}

  async execute(query: FabricSearchQuery): Promise<Result<FabricSearchResponse>> {
    try {
      // 1. Generate cache key
      const cacheKey = this.generateCacheKey(query);
      
      // 2. Try cache first
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult.isSuccess()) {
        return cachedResult;
      }

      // 3. Convert query to repository criteria
      const criteria = this.mapToCriteria(query);
      const sort = this.mapToSortCriteria(query.sort);
      const pagination = this.mapToPaginationCriteria(query.pagination);

      // 4. Execute search
      const searchResult = await this.fabricRepository.search(criteria, sort, pagination);
      
      if (searchResult.isFailure()) {
        return Result.failure(`Search failed: ${searchResult.getError()}`);
      }

      // 5. Map to response DTO
      const paginatedFabrics = searchResult.getValue();
      const response = await this.mapToResponse(paginatedFabrics);

      // 6. Cache the result
      await this.cacheResult(cacheKey, response);

      return Result.success(response);

    } catch (error: any) {
      return Result.failure(`Unexpected error during search: ${error.message}`);
    }
  }

  private mapToCriteria(query: FabricSearchQuery): FabricSearchCriteria {
    const criteria: FabricSearchCriteria = {};

    if (query.searchTerm) {
      criteria.name = query.searchTerm;
    }

    if (query.filters.type) {
      criteria.type = query.filters.type;
    }

    if (query.filters.status) {
      criteria.status = query.filters.status;
    }

    if (query.filters.manufacturerName) {
      criteria.manufacturerName = query.filters.manufacturerName;
    }

    if (query.filters.collection) {
      criteria.collection = query.filters.collection;
    }

    if (query.filters.colorFamily) {
      criteria.colorFamily = query.filters.colorFamily;
    }

    if (query.filters.pattern) {
      criteria.pattern = query.filters.pattern;
    }

    if (query.filters.featured !== undefined) {
      criteria.featured = query.filters.featured;
    }

    if (query.filters.minPrice !== undefined) {
      criteria.minPrice = query.filters.minPrice;
    }

    if (query.filters.maxPrice !== undefined) {
      criteria.maxPrice = query.filters.maxPrice;
    }

    if (query.filters.inStock !== undefined) {
      criteria.inStock = query.filters.inStock;
    }

    if (query.filters.tags && query.filters.tags.length > 0) {
      criteria.tags = query.filters.tags;
    }

    if (query.filters.properties && query.filters.properties.length > 0) {
      criteria.properties = query.filters.properties;
    }

    return criteria;
  }

  private mapToSortCriteria(sort: FabricSearchQuery['sort']): FabricSortCriteria {
    return {
      field: sort.field,
      direction: sort.direction
    };
  }

  private mapToPaginationCriteria(pagination: FabricSearchQuery['pagination']): PaginationCriteria {
    return {
      page: Math.max(1, pagination.page),
      limit: Math.min(100, Math.max(1, pagination.limit)),
      offset: (Math.max(1, pagination.page) - 1) * Math.min(100, Math.max(1, pagination.limit))
    };
  }

  private async mapToResponse(paginatedFabrics: PaginatedResult<Fabric>): Promise<FabricSearchResponse> {
    const fabricListItems = await Promise.all(
      paginatedFabrics.data.map(fabric => this.fabricMapper.toListResponse(fabric))
    );

    return {
      data: fabricListItems,
      pagination: {
        total: paginatedFabrics.total,
        page: paginatedFabrics.page,
        limit: paginatedFabrics.limit,
        totalPages: paginatedFabrics.totalPages,
        hasNext: paginatedFabrics.hasNext,
        hasPrevious: paginatedFabrics.hasPrevious
      }
    };
  }

  private generateCacheKey(query: FabricSearchQuery): string {
    const keyData = {
      searchTerm: query.searchTerm,
      filters: query.filters,
      sort: query.sort,
      pagination: query.pagination
    };
    
    const keyString = JSON.stringify(keyData);
    const hash = Buffer.from(keyString).toString('base64');
    
    return `${this.CACHE_PREFIX}${hash}`;
  }

  private async getCachedResult(cacheKey: string): Promise<Result<FabricSearchResponse>> {
    try {
      const cached = await this.cacheService.get<FabricSearchResponse>(cacheKey);
      
      if (cached) {
        return Result.success(cached);
      }
      
      return Result.failure('Cache miss');
    } catch (error: any) {
      // Cache errors shouldn't fail the operation
      return Result.failure('Cache error');
    }
  }

  private async cacheResult(cacheKey: string, response: FabricSearchResponse): Promise<void> {
    try {
      await this.cacheService.set(cacheKey, response, this.CACHE_TTL);
    } catch (error: any) {
      // Cache errors shouldn't fail the operation
      console.error('Failed to cache search result:', error);
    }
  }
}