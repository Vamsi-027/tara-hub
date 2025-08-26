/**
 * Drizzle Fabric Repository Implementation
 * Infrastructure layer - implements domain repository interface
 * Single Responsibility: Data access using Drizzle ORM
 */

import { eq, and, isNull, ilike, gte, lte, desc, asc, or, sql, count, inArray } from 'drizzle-orm';
import { Result } from '../../../shared/utils/result.util';
import { Fabric, FabricProperties, FabricMetrics } from '../../../domain/entities/fabric/fabric.entity';
import { FabricId } from '../../../domain/value-objects/fabric-id.vo';
import { SKU } from '../../../domain/value-objects/sku.vo';
import { Money } from '../../../domain/value-objects/money.vo';
import { Quantity } from '../../../domain/value-objects/quantity.vo';
import { 
  IFabricRepository,
  FabricSearchCriteria,
  FabricSortCriteria,
  PaginationCriteria,
  PaginatedResult,
  FabricStatistics,
  FabricFilterOptions
} from '../../../domain/repositories/fabric.repository.interface';
import { DatabaseException } from '../../../domain/exceptions/domain.exceptions';
import { fabricsTable } from '../schemas/fabric.schema';
import type { DrizzleDb } from '../connections/drizzle.connection';

export class DrizzleFabricRepository implements IFabricRepository {
  constructor(private readonly db: DrizzleDb) {}

  async findById(id: FabricId): Promise<Result<Fabric | null>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          eq(fabricsTable.id, id.value),
          isNull(fabricsTable.deletedAt)
        ))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const fabric = this.mapToDomainEntity(result[0]);
      return Result.success(fabric);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findById').message);
    }
  }

  async findBySku(sku: SKU): Promise<Result<Fabric | null>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          eq(fabricsTable.sku, sku.value),
          isNull(fabricsTable.deletedAt)
        ))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const fabric = this.mapToDomainEntity(result[0]);
      return Result.success(fabric);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findBySku').message);
    }
  }

  async findBySlug(slug: string): Promise<Result<Fabric | null>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          eq(fabricsTable.slug, slug),
          isNull(fabricsTable.deletedAt)
        ))
        .limit(1);

      if (result.length === 0) {
        return Result.success(null);
      }

      const fabric = this.mapToDomainEntity(result[0]);
      return Result.success(fabric);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findBySlug').message);
    }
  }

  async save(fabric: Fabric): Promise<Result<void>> {
    try {
      const data = this.mapToDbRecord(fabric);

      // Check if fabric exists
      const existing = await this.db
        .select({ id: fabricsTable.id })
        .from(fabricsTable)
        .where(eq(fabricsTable.id, fabric.id.value))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await this.db
          .update(fabricsTable)
          .set(data)
          .where(eq(fabricsTable.id, fabric.id.value));
      } else {
        // Insert new
        await this.db.insert(fabricsTable).values(data);
      }

      return Result.success(undefined);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'save').message);
    }
  }

  async delete(id: FabricId): Promise<Result<void>> {
    try {
      await this.db
        .update(fabricsTable)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(fabricsTable.id, id.value));

      return Result.success(undefined);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'delete').message);
    }
  }

  async search(
    criteria: FabricSearchCriteria,
    sort: FabricSortCriteria,
    pagination: PaginationCriteria
  ): Promise<Result<PaginatedResult<Fabric>>> {
    try {
      // Build where conditions
      const conditions = this.buildSearchConditions(criteria);
      
      // Build order by
      const orderBy = this.buildOrderBy(sort);

      // Execute count query
      const countResult = await this.db
        .select({ count: count() })
        .from(fabricsTable)
        .where(and(...conditions));

      const total = countResult[0]?.count || 0;

      // Execute data query
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(pagination.limit)
        .offset(pagination.offset || (pagination.page - 1) * pagination.limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      
      const totalPages = Math.ceil(total / pagination.limit);
      
      const paginatedResult: PaginatedResult<Fabric> = {
        data: fabrics,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrevious: pagination.page > 1
      };

      return Result.success(paginatedResult);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'search').message);
    }
  }

  async findFeatured(limit: number): Promise<Result<Fabric[]>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          eq(fabricsTable.featured, true),
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(desc(fabricsTable.updatedAt))
        .limit(limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findFeatured').message);
    }
  }

  async skuExists(sku: SKU, excludeId?: FabricId): Promise<Result<boolean>> {
    try {
      const conditions = [
        eq(fabricsTable.sku, sku.value),
        isNull(fabricsTable.deletedAt)
      ];

      if (excludeId) {
        conditions.push(sql`${fabricsTable.id} != ${excludeId.value}`);
      }

      const result = await this.db
        .select({ count: count() })
        .from(fabricsTable)
        .where(and(...conditions));

      return Result.success((result[0]?.count || 0) > 0);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'skuExists').message);
    }
  }

  async slugExists(slug: string, excludeId?: FabricId): Promise<Result<boolean>> {
    try {
      const conditions = [
        eq(fabricsTable.slug, slug),
        isNull(fabricsTable.deletedAt)
      ];

      if (excludeId) {
        conditions.push(sql`${fabricsTable.id} != ${excludeId.value}`);
      }

      const result = await this.db
        .select({ count: count() })
        .from(fabricsTable)
        .where(and(...conditions));

      return Result.success((result[0]?.count || 0) > 0);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'slugExists').message);
    }
  }

  async getStatistics(): Promise<Result<FabricStatistics>> {
    try {
      const result = await this.db
        .select({
          totalFabrics: count(),
          activeFabrics: sql<number>`SUM(CASE WHEN ${fabricsTable.status} = 'Active' THEN 1 ELSE 0 END)`,
          inactiveFabrics: sql<number>`SUM(CASE WHEN ${fabricsTable.status} = 'Inactive' THEN 1 ELSE 0 END)`,
          discontinuedFabrics: sql<number>`SUM(CASE WHEN ${fabricsTable.status} = 'Discontinued' THEN 1 ELSE 0 END)`,
          outOfStockFabrics: sql<number>`SUM(CASE WHEN ${fabricsTable.availableQuantity} = 0 THEN 1 ELSE 0 END)`,
          featuredFabrics: sql<number>`SUM(CASE WHEN ${fabricsTable.featured} = true THEN 1 ELSE 0 END)`,
          totalViewCount: sql<number>`SUM(${fabricsTable.viewCount})`,
          avgRating: sql<number>`AVG(${fabricsTable.averageRating})`
        })
        .from(fabricsTable)
        .where(isNull(fabricsTable.deletedAt));

      const stats = result[0];
      
      const statistics: FabricStatistics = {
        totalFabrics: stats.totalFabrics,
        activeFabrics: Number(stats.activeFabrics) || 0,
        inactiveFabrics: Number(stats.inactiveFabrics) || 0,
        discontinuedFabrics: Number(stats.discontinuedFabrics) || 0,
        outOfStockFabrics: Number(stats.outOfStockFabrics) || 0,
        lowStockFabrics: 0, // Would need separate query with reorder points
        featuredFabrics: Number(stats.featuredFabrics) || 0,
        totalStockValue: 0, // Would need calculation with prices and quantities
        averageRating: Number(stats.avgRating) || 0,
        totalViewCount: Number(stats.totalViewCount) || 0
      };

      return Result.success(statistics);

    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'getStatistics').message);
    }
  }

  // Additional methods would be implemented here...
  async saveAll(fabrics: Fabric[]): Promise<Result<void>> {
    try {
      const dbRecords = fabrics.map(fabric => this.mapToDbRecord(fabric));
      
      await this.db.transaction(async (tx) => {
        for (const record of dbRecords) {
          const existing = await tx
            .select({ id: fabricsTable.id })
            .from(fabricsTable)
            .where(eq(fabricsTable.id, record.id))
            .limit(1);

          if (existing.length > 0) {
            await tx.update(fabricsTable)
              .set(record)
              .where(eq(fabricsTable.id, record.id));
          } else {
            await tx.insert(fabricsTable).values(record);
          }
        }
      });

      return Result.success(undefined);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'saveAll').message);
    }
  }

  async findByIds(ids: FabricId[]): Promise<Result<Fabric[]>> {
    try {
      const idValues = ids.map(id => id.value);
      
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          inArray(fabricsTable.id, idValues),
          isNull(fabricsTable.deletedAt)
        ));

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findByIds').message);
    }
  }

  async deleteAll(ids: FabricId[]): Promise<Result<void>> {
    try {
      const idValues = ids.map(id => id.value);
      
      await this.db
        .update(fabricsTable)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(inArray(fabricsTable.id, idValues));

      return Result.success(undefined);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'deleteAll').message);
    }
  }

  async findAll(sort?: FabricSortCriteria, pagination?: PaginationCriteria): Promise<Result<PaginatedResult<Fabric>>> {
    try {
      const defaultSort: FabricSortCriteria = { field: 'createdAt', direction: 'desc' };
      const defaultPagination: PaginationCriteria = { page: 1, limit: 50 };
      
      const sortCriteria = sort || defaultSort;
      const paginationCriteria = pagination || defaultPagination;
      
      return this.search({}, sortCriteria, paginationCriteria);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findAll').message);
    }
  }

  async findNewArrivals(limit: number, daysBack?: number): Promise<Result<Fabric[]>> {
    try {
      const days = daysBack || 30;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          gte(fabricsTable.createdAt, cutoffDate),
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(desc(fabricsTable.createdAt))
        .limit(limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findNewArrivals').message);
    }
  }

  async findBestSellers(limit: number): Promise<Result<Fabric[]>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(
          desc(fabricsTable.sampleRequestCount),
          desc(fabricsTable.viewCount)
        )
        .limit(limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findBestSellers').message);
    }
  }

  async findRelated(fabricId: FabricId, limit: number): Promise<Result<Fabric[]>> {
    try {
      const fabric = await this.findById(fabricId);
      if (fabric.isFailure() || !fabric.value) {
        return Result.success([]);
      }

      const targetFabric = fabric.value;
      
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          or(
            eq(fabricsTable.manufacturerName, targetFabric.manufacturerName),
            eq(fabricsTable.collection, targetFabric.collection),
            eq(fabricsTable.colorFamily, targetFabric.colorFamily),
            eq(fabricsTable.type, targetFabric.type)
          ),
          sql`${fabricsTable.id} != ${fabricId.value}`,
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(desc(fabricsTable.viewCount))
        .limit(limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findRelated').message);
    }
  }

  async findByManufacturer(manufacturerName: string, limit?: number): Promise<Result<Fabric[]>> {
    try {
      let query = this.db
        .select()
        .from(fabricsTable)
        .where(and(
          eq(fabricsTable.manufacturerName, manufacturerName),
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(asc(fabricsTable.name));

      if (limit) {
        query = query.limit(limit);
      }

      const result = await query;
      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findByManufacturer').message);
    }
  }

  async findByCollection(collection: string, limit?: number): Promise<Result<Fabric[]>> {
    try {
      let query = this.db
        .select()
        .from(fabricsTable)
        .where(and(
          eq(fabricsTable.collection, collection),
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(asc(fabricsTable.name));

      if (limit) {
        query = query.limit(limit);
      }

      const result = await query;
      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findByCollection').message);
    }
  }

  async findByTags(tags: string[], limit?: number): Promise<Result<Fabric[]>> {
    try {
      let query = this.db
        .select()
        .from(fabricsTable)
        .where(and(
          sql`${fabricsTable.tags} && ${tags}`,
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(desc(fabricsTable.viewCount));

      if (limit) {
        query = query.limit(limit);
      }

      const result = await query;
      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findByTags').message);
    }
  }

  async findLowStock(threshold?: number): Promise<Result<Fabric[]>> {
    try {
      const stockThreshold = threshold || 10;
      
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          lte(fabricsTable.availableQuantity, stockThreshold),
          sql`${fabricsTable.availableQuantity} > 0`,
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(asc(fabricsTable.availableQuantity));

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findLowStock').message);
    }
  }

  async findOutOfStock(): Promise<Result<Fabric[]>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          eq(fabricsTable.availableQuantity, 0),
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(desc(fabricsTable.updatedAt));

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findOutOfStock').message);
    }
  }

  async findNeedingReorder(): Promise<Result<Fabric[]>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          sql`${fabricsTable.availableQuantity} <= COALESCE(${fabricsTable.reorderPoint}, 5)`,
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(asc(fabricsTable.availableQuantity));

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findNeedingReorder').message);
    }
  }

  async findByStockRange(min: number, max: number, unit: string): Promise<Result<Fabric[]>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          gte(fabricsTable.availableQuantity, min),
          lte(fabricsTable.availableQuantity, max),
          eq(fabricsTable.quantityUnit, unit),
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(desc(fabricsTable.availableQuantity));

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findByStockRange').message);
    }
  }

  async nameExists(name: string, excludeId?: FabricId): Promise<Result<boolean>> {
    try {
      const conditions = [
        eq(fabricsTable.name, name),
        isNull(fabricsTable.deletedAt)
      ];

      if (excludeId) {
        conditions.push(sql`${fabricsTable.id} != ${excludeId.value}`);
      }

      const result = await this.db
        .select({ count: count() })
        .from(fabricsTable)
        .where(and(...conditions));

      return Result.success((result[0]?.count || 0) > 0);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'nameExists').message);
    }
  }

  async getFilterOptions(): Promise<Result<FabricFilterOptions>> {
    try {
      const [manufacturers, collections, types, colorFamilies, patterns] = await Promise.all([
        this.db.selectDistinct({ manufacturerName: fabricsTable.manufacturerName })
          .from(fabricsTable)
          .where(and(
            sql`${fabricsTable.manufacturerName} IS NOT NULL`,
            isNull(fabricsTable.deletedAt)
          )),
          
        this.db.selectDistinct({ collection: fabricsTable.collection })
          .from(fabricsTable)
          .where(and(
            sql`${fabricsTable.collection} IS NOT NULL`,
            isNull(fabricsTable.deletedAt)
          )),
          
        this.db.selectDistinct({ type: fabricsTable.type })
          .from(fabricsTable)
          .where(isNull(fabricsTable.deletedAt)),
          
        this.db.selectDistinct({ colorFamily: fabricsTable.colorFamily })
          .from(fabricsTable)
          .where(and(
            sql`${fabricsTable.colorFamily} IS NOT NULL`,
            isNull(fabricsTable.deletedAt)
          )),
          
        this.db.selectDistinct({ pattern: fabricsTable.pattern })
          .from(fabricsTable)
          .where(and(
            sql`${fabricsTable.pattern} IS NOT NULL`,
            isNull(fabricsTable.deletedAt)
          ))
      ]);

      const filterOptions: FabricFilterOptions = {
        manufacturers: manufacturers.map(m => m.manufacturerName).filter(Boolean),
        collections: collections.map(c => c.collection).filter(Boolean),
        types: types.map(t => t.type),
        colorFamilies: colorFamilies.map(cf => cf.colorFamily).filter(Boolean),
        patterns: patterns.map(p => p.pattern).filter(Boolean)
      };

      return Result.success(filterOptions);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'getFilterOptions').message);
    }
  }

  async count(criteria?: FabricSearchCriteria): Promise<Result<number>> {
    try {
      const conditions = criteria ? this.buildSearchConditions(criteria) : [isNull(fabricsTable.deletedAt)];
      
      const result = await this.db
        .select({ count: count() })
        .from(fabricsTable)
        .where(and(...conditions));

      return Result.success(result[0]?.count || 0);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'count').message);
    }
  }

  async findTopRated(limit: number): Promise<Result<Fabric[]>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          sql`${fabricsTable.averageRating} > 0`,
          sql`${fabricsTable.ratingCount} >= 3`,
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(
          desc(fabricsTable.averageRating),
          desc(fabricsTable.ratingCount)
        )
        .limit(limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findTopRated').message);
    }
  }

  async findMostViewed(limit: number, timeframe?: 'day' | 'week' | 'month'): Promise<Result<Fabric[]>> {
    try {
      let dateCondition = sql`1=1`;
      
      if (timeframe) {
        let daysBack = 30;
        if (timeframe === 'day') daysBack = 1;
        else if (timeframe === 'week') daysBack = 7;
        
        const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
        dateCondition = gte(fabricsTable.updatedAt, cutoffDate);
      }

      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          dateCondition,
          sql`${fabricsTable.viewCount} > 0`,
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(desc(fabricsTable.viewCount))
        .limit(limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findMostViewed').message);
    }
  }

  async findMostFavorited(limit: number): Promise<Result<Fabric[]>> {
    try {
      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(
          sql`${fabricsTable.favoriteCount} > 0`,
          eq(fabricsTable.status, 'Active'),
          isNull(fabricsTable.deletedAt)
        ))
        .orderBy(
          desc(fabricsTable.favoriteCount),
          desc(fabricsTable.viewCount)
        )
        .limit(limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      return Result.success(fabrics);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'findMostFavorited').message);
    }
  }

  async searchByText(query: string, fields?: string[], pagination?: PaginationCriteria): Promise<Result<PaginatedResult<Fabric>>> {
    try {
      const searchTerm = `%${query}%`;
      const defaultFields = ['name', 'description', 'manufacturerName', 'collection'];
      const searchFields = fields || defaultFields;
      
      const searchConditions = searchFields.map(field => {
        switch (field) {
          case 'name': return ilike(fabricsTable.name, searchTerm);
          case 'description': return ilike(fabricsTable.description, searchTerm);
          case 'manufacturerName': return ilike(fabricsTable.manufacturerName, searchTerm);
          case 'collection': return ilike(fabricsTable.collection, searchTerm);
          case 'sku': return ilike(fabricsTable.sku, searchTerm);
          default: return sql`1=0`;
        }
      });

      const conditions = [
        or(...searchConditions),
        eq(fabricsTable.status, 'Active'),
        isNull(fabricsTable.deletedAt)
      ];

      const defaultPagination: PaginationCriteria = { page: 1, limit: 20 };
      const paginationCriteria = pagination || defaultPagination;

      const countResult = await this.db
        .select({ count: count() })
        .from(fabricsTable)
        .where(and(...conditions));

      const total = countResult[0]?.count || 0;

      const result = await this.db
        .select()
        .from(fabricsTable)
        .where(and(...conditions))
        .orderBy(
          desc(fabricsTable.viewCount),
          asc(fabricsTable.name)
        )
        .limit(paginationCriteria.limit)
        .offset((paginationCriteria.page - 1) * paginationCriteria.limit);

      const fabrics = result.map(record => this.mapToDomainEntity(record));
      const totalPages = Math.ceil(total / paginationCriteria.limit);
      
      const paginatedResult: PaginatedResult<Fabric> = {
        data: fabrics,
        total,
        page: paginationCriteria.page,
        limit: paginationCriteria.limit,
        totalPages,
        hasNext: paginationCriteria.page < totalPages,
        hasPrevious: paginationCriteria.page > 1
      };

      return Result.success(paginatedResult);
    } catch (error: any) {
      return Result.failure(new DatabaseException(error.message, 'searchByText').message);
    }
  }

  // Private mapping methods
  private mapToDomainEntity(record: any): Fabric {
    const id = FabricId.create(record.id);
    const sku = SKU.create(record.sku);
    const retailPrice = Money.create(record.retailPrice, record.currency || 'USD');
    const wholesalePrice = record.wholesalePrice 
      ? Money.create(record.wholesalePrice, record.currency || 'USD')
      : undefined;
    
    const stockQuantity = Quantity.create(record.stockQuantity, record.quantityUnit || 'yards');
    const availableQuantity = Quantity.create(record.availableQuantity, record.quantityUnit || 'yards');
    const reservedQuantity = Quantity.create(record.reservedQuantity || 0, record.quantityUnit || 'yards');
    const reorderPoint = record.reorderPoint 
      ? Quantity.create(record.reorderPoint, record.quantityUnit || 'yards')
      : undefined;

    const properties: FabricProperties = {
      sku,
      name: record.name,
      description: record.description,
      slug: record.slug,
      type: record.type,
      status: record.status,
      retailPrice,
      wholesalePrice,
      stockQuantity,
      availableQuantity,
      reservedQuantity,
      reorderPoint,
      manufacturerName: record.manufacturerName,
      collection: record.collection,
      colorFamily: record.colorFamily,
      pattern: record.pattern,
      width: record.width,
      weight: record.weight,
      composition: record.composition,
      careInstructions: record.careInstructions,
      properties: record.properties,
      tags: record.tags,
      imageUrl: record.imageUrl,
      swatchImageUrl: record.swatchImageUrl,
      featured: record.featured
    };

    const auditFields = {
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy,
      updatedBy: record.updatedBy,
      deletedAt: record.deletedAt,
      deletedBy: record.deletedBy
    };

    const metrics: FabricMetrics = {
      viewCount: record.viewCount || 0,
      favoriteCount: record.favoriteCount || 0,
      sampleRequestCount: record.sampleRequestCount || 0,
      averageRating: record.averageRating,
      ratingCount: record.ratingCount || 0
    };

    return new Fabric(id, properties, auditFields, metrics);
  }

  private mapToDbRecord(fabric: Fabric): any {
    return {
      id: fabric.id.value,
      sku: fabric.sku.value,
      name: fabric.name,
      description: fabric.description,
      slug: fabric.slug,
      type: fabric.type,
      status: fabric.status,
      retailPrice: fabric.retailPrice.amount,
      wholesalePrice: fabric.wholesalePrice?.amount,
      currency: fabric.retailPrice.currency,
      stockQuantity: fabric.stockQuantity.amount,
      availableQuantity: fabric.availableQuantity.amount,
      reservedQuantity: fabric.reservedQuantity.amount,
      quantityUnit: fabric.stockQuantity.unit,
      reorderPoint: fabric.reorderPoint?.amount,
      manufacturerName: fabric.manufacturerName,
      collection: fabric.collection,
      colorFamily: fabric.colorFamily,
      pattern: fabric.pattern,
      width: fabric.width,
      weight: fabric.weight,
      composition: fabric.composition,
      careInstructions: fabric.careInstructions,
      properties: fabric.properties,
      tags: fabric.tags,
      imageUrl: fabric.imageUrl,
      swatchImageUrl: fabric.swatchImageUrl,
      featured: fabric.featured,
      viewCount: fabric.metrics.viewCount,
      favoriteCount: fabric.metrics.favoriteCount,
      sampleRequestCount: fabric.metrics.sampleRequestCount,
      averageRating: fabric.metrics.averageRating,
      ratingCount: fabric.metrics.ratingCount,
      createdAt: fabric.auditFields.createdAt,
      updatedAt: fabric.auditFields.updatedAt,
      createdBy: fabric.auditFields.createdBy,
      updatedBy: fabric.auditFields.updatedBy,
      deletedAt: fabric.auditFields.deletedAt,
      deletedBy: fabric.auditFields.deletedBy
    };
  }

  private buildSearchConditions(criteria: FabricSearchCriteria): any[] {
    const conditions = [isNull(fabricsTable.deletedAt)];

    if (criteria.name) {
      conditions.push(ilike(fabricsTable.name, `%${criteria.name}%`));
    }

    if (criteria.type) {
      conditions.push(eq(fabricsTable.type, criteria.type));
    }

    if (criteria.status) {
      conditions.push(eq(fabricsTable.status, criteria.status));
    }

    if (criteria.manufacturerName) {
      conditions.push(ilike(fabricsTable.manufacturerName, `%${criteria.manufacturerName}%`));
    }

    if (criteria.collection) {
      conditions.push(ilike(fabricsTable.collection, `%${criteria.collection}%`));
    }

    if (criteria.colorFamily) {
      conditions.push(eq(fabricsTable.colorFamily, criteria.colorFamily));
    }

    if (criteria.pattern) {
      conditions.push(eq(fabricsTable.pattern, criteria.pattern));
    }

    if (criteria.featured !== undefined) {
      conditions.push(eq(fabricsTable.featured, criteria.featured));
    }

    if (criteria.minPrice !== undefined) {
      conditions.push(gte(fabricsTable.retailPrice, criteria.minPrice));
    }

    if (criteria.maxPrice !== undefined) {
      conditions.push(lte(fabricsTable.retailPrice, criteria.maxPrice));
    }

    if (criteria.inStock !== undefined) {
      if (criteria.inStock) {
        conditions.push(sql`${fabricsTable.availableQuantity} > 0`);
      } else {
        conditions.push(eq(fabricsTable.availableQuantity, 0));
      }
    }

    return conditions;
  }

  private buildOrderBy(sort: FabricSortCriteria): any {
    const column = this.mapSortField(sort.field);
    return sort.direction === 'asc' ? asc(column) : desc(column);
  }

  private mapSortField(field: string): any {
    switch (field) {
      case 'name':
        return fabricsTable.name;
      case 'sku':
        return fabricsTable.sku;
      case 'retailPrice':
        return fabricsTable.retailPrice;
      case 'createdAt':
        return fabricsTable.createdAt;
      case 'updatedAt':
        return fabricsTable.updatedAt;
      case 'stockQuantity':
        return fabricsTable.stockQuantity;
      case 'viewCount':
        return fabricsTable.viewCount;
      default:
        return fabricsTable.createdAt;
    }
  }
}