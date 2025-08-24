/**
 * FABRIC REPOSITORY
 * Complete data access layer for fabrics
 * Extends base repository with fabric-specific operations
 */

import { and, eq, sql, desc, asc, isNull, gte, lte, like, ilike, or, inArray } from 'drizzle-orm';
import { fabrics } from '../schemas/fabric.schema';
import type { Fabric, FabricFilter } from '../types';
import { db } from '@/src/core/database/drizzle/client';

// Define types that are not exported
type NewFabric = Partial<Fabric>;
type FabricSort = { field: string; direction: 'asc' | 'desc' };
type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export class FabricRepository {
  protected table = fabrics;
  protected db = db;
  
  // ============================================
  // BASE REPOSITORY METHODS
  // ============================================
  
  /**
   * Find paginated results
   */
  async findPaginated(
    page: number,
    limit: number,
    where?: any,
    orderBy?: any
  ): Promise<PaginatedResult<Fabric>> {
    try {
      // Get total count
      const countQuery = this.db
        .select({ count: sql`count(*)::int` })
        .from(this.table);
      
      if (where) {
        countQuery.where(where);
      }
      
      const countResult = await countQuery;
      const total = countResult[0]?.count || 0;
      
      // Get paginated data
      const dataQuery = this.db
        .select()
        .from(this.table)
        .limit(limit)
        .offset((page - 1) * limit);
      
      if (where) {
        dataQuery.where(where);
      }
      
      if (orderBy) {
        dataQuery.orderBy(orderBy);
      }
      
      const data = await dataQuery;
      
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error in findPaginated:', error);
      // Return empty result on error
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }
  
  // ============================================
  // FABRIC-SPECIFIC QUERIES
  // ============================================
  
  /**
   * Find fabric by ID
   */
  async findById(id: string): Promise<Fabric | null> {
    const result = await this.db
      .select()
      .from(fabrics)
      .where(and(
        eq(fabrics.id, id),
        isNull(fabrics.deletedAt)
      ))
      .limit(1);
    
    return result[0] || null;
  }
  
  /**
   * Find fabric by SKU
   */
  async findBySku(sku: string): Promise<Fabric | null> {
    const result = await this.db
      .select()
      .from(fabrics)
      .where(and(
        eq(fabrics.sku, sku),
        isNull(fabrics.deletedAt)
      ))
      .limit(1);
    
    return result[0] || null;
  }
  
  /**
   * Find fabric by slug
   */
  async findBySlug(slug: string): Promise<Fabric | null> {
    const result = await this.db
      .select()
      .from(fabrics)
      .where(and(
        eq(fabrics.slug, slug),
        isNull(fabrics.deletedAt)
      ))
      .limit(1);
    
    return result[0] || null;
  }
  
  /**
   * Create new fabric
   */
  async create(data: any, userId: string): Promise<Fabric> {
    const now = new Date();
    const fabricData = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await this.db
      .insert(fabrics)
      .values(fabricData)
      .returning();
    
    return result[0];
  }
  
  /**
   * Update existing fabric
   */
  async update(id: string, data: any, userId: string): Promise<Fabric | null> {
    const result = await this.db
      .update(fabrics)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(
        eq(fabrics.id, id),
        isNull(fabrics.deletedAt)
      ))
      .returning();
    
    return result[0] || null;
  }
  
  /**
   * Advanced search with filters
   */
  async search(
    filter: FabricFilter,
    sort: FabricSort = { field: 'createdAt', direction: 'desc' },
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Fabric>> {
    const conditions: any[] = [isNull(fabrics.deletedAt)];
    
    // Text search
    if (filter.search) {
      const searchTerm = `%${filter.search}%`;
      conditions.push(or(
        ilike(fabrics.name, searchTerm),
        ilike(fabrics.sku, searchTerm),
        ilike(fabrics.description, searchTerm),
        ilike(fabrics.manufacturerName, searchTerm),
        ilike(fabrics.collection, searchTerm),
        ilike(fabrics.searchKeywords, searchTerm)
      ));
    }
    
    // Type filter
    if (filter.type && filter.type.length > 0) {
      conditions.push(inArray(fabrics.type, filter.type));
    }
    
    // Status filter
    if (filter.status && filter.status.length > 0) {
      conditions.push(inArray(fabrics.status, filter.status));
    }
    
    // Manufacturer filter
    if (filter.manufacturer && filter.manufacturer.length > 0) {
      conditions.push(inArray(fabrics.manufacturerName, filter.manufacturer));
    }
    
    // Collection filter
    if (filter.collection && filter.collection.length > 0) {
      conditions.push(inArray(fabrics.collection, filter.collection));
    }
    
    
    // Stock filter
    if (filter.inStock === true) {
      conditions.push(sql`${fabrics.availableQuantity} > 0`);
    } else if (filter.inStock === false) {
      conditions.push(sql`${fabrics.availableQuantity} <= 0`);
    }
    
    if (filter.minStock !== undefined) {
      conditions.push(gte(fabrics.availableQuantity, filter.minStock.toString()));
    }
    
    // Feature filters
    if (filter.isFeatured !== undefined) {
      conditions.push(eq(fabrics.isFeatured, filter.isFeatured));
    }
    if (filter.isNewArrival !== undefined) {
      conditions.push(eq(fabrics.isNewArrival, filter.isNewArrival));
    }
    if (filter.isBestSeller !== undefined) {
      conditions.push(eq(fabrics.isBestSeller, filter.isBestSeller));
    }
    
    // Tags filter (using JSONB contains)
    if (filter.tags && filter.tags.length > 0) {
      conditions.push(sql`${fabrics.tags} ?| array[${filter.tags.map(t => `'${t}'`).join(',')}]`);
    }
    
    // Image filter
    if (filter.hasImages === true) {
      conditions.push(sql`${fabrics.mainImageUrl} IS NOT NULL`);
    } else if (filter.hasImages === false) {
      conditions.push(sql`${fabrics.mainImageUrl} IS NULL`);
    }
    
    // Date filters
    if (filter.createdAfter) {
      conditions.push(gte(fabrics.createdAt, new Date(filter.createdAfter)));
    }
    if (filter.createdBefore) {
      conditions.push(lte(fabrics.createdAt, new Date(filter.createdBefore)));
    }
    
    // Build sort expression
    let orderByExpression;
    const direction = sort.direction === 'asc' ? asc : desc;
    
    switch (sort.field) {
      case 'name':
        orderByExpression = direction(fabrics.name);
        break;
      case 'sku':
        orderByExpression = direction(fabrics.sku);
        break;
      case 'stock':
        orderByExpression = direction(fabrics.stockQuantity);
        break;
      case 'viewCount':
        // Field doesn't exist in current schema, fall back to createdAt
        orderByExpression = direction(fabrics.createdAt);
        break;
      case 'favoriteCount':
        // Field doesn't exist in current schema, fall back to createdAt
        orderByExpression = direction(fabrics.createdAt);
        break;
      case 'displayOrder':
        // displayOrder field doesn't exist, fall back to createdAt
        orderByExpression = direction(fabrics.createdAt);
        break;
      case 'updatedAt':
        orderByExpression = direction(fabrics.updatedAt);
        break;
      case 'createdAt':
      default:
        orderByExpression = direction(fabrics.createdAt);
    }
    
    return await this.findPaginated(
      page,
      limit,
      and(...conditions),
      orderByExpression
    );
  }
  
  /**
   * Full-text search using PostgreSQL
   */
  async fullTextSearch(query: string, limit: number = 50): Promise<Fabric[]> {
    const result = await this.db.execute(sql`
      SELECT * FROM ${fabrics}
      WHERE deleted_at IS NULL
      AND to_tsvector('english', 
        name || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(pattern, '') || ' ' || 
        COALESCE(primary_color, '') || ' ' ||
        COALESCE(manufacturer_name, '') || ' ' ||
        COALESCE(collection, '') || ' ' ||
        COALESCE(search_keywords, '')
      ) @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank(
        to_tsvector('english', name || ' ' || COALESCE(description, '')), 
        plainto_tsquery('english', ${query})
      ) DESC
      LIMIT ${limit}
    `);
    
    return result.rows as Fabric[];
  }
  
  /**
   * Get featured fabrics
   */
  async getFeatured(limit: number = 12): Promise<Fabric[]> {
    return await this.db
      .select()
      .from(fabrics)
      .where(and(
        eq(fabrics.isFeatured, true),
        eq(fabrics.status, 'Active'),
        isNull(fabrics.deletedAt)
      ))
      .orderBy(asc(fabrics.displayOrder), desc(fabrics.createdAt))
      .limit(limit);
  }
  
  /**
   * Get new arrivals
   */
  async getNewArrivals(limit: number = 12): Promise<Fabric[]> {
    return await this.db
      .select()
      .from(fabrics)
      .where(and(
        eq(fabrics.isNewArrival, true),
        eq(fabrics.status, 'Active'),
        isNull(fabrics.deletedAt)
      ))
      .orderBy(desc(fabrics.createdAt))
      .limit(limit);
  }
  
  /**
   * Get best sellers
   */
  async getBestSellers(limit: number = 12): Promise<Fabric[]> {
    return await this.db
      .select()
      .from(fabrics)
      .where(and(
        eq(fabrics.isFeatured, true),
        eq(fabrics.status, 'Active'),
        isNull(fabrics.deletedAt)
      ))
      .orderBy(desc(fabrics.createdAt))
      .limit(limit);
  }
  
  /**
   * Get related fabrics (by collection, manufacturer, or type)
   */
  async getRelated(fabricId: string, limit: number = 6): Promise<Fabric[]> {
    const fabric = await this.findById(fabricId);
    if (!fabric) return [];
    
    return await this.db
      .select()
      .from(fabrics)
      .where(and(
        sql`${fabrics.id} != ${fabricId}`,
        eq(fabrics.status, 'Active'),
        isNull(fabrics.deletedAt),
        or(
          eq(fabrics.collection, fabric.collection),
          eq(fabrics.manufacturerName, fabric.manufacturerName),
          eq(fabrics.type, fabric.type)
        )
      ))
      .orderBy(sql`
        CASE 
          WHEN ${fabrics.collection} = ${fabric.collection} THEN 1
          WHEN ${fabrics.brand} = ${fabric.brand} THEN 2
          ELSE 3
        END
      `, desc(fabrics.createdAt))
      .limit(limit);
  }
  
  /**
   * Get low stock fabrics
   */
  async getLowStock(threshold?: number): Promise<Fabric[]> {
    const conditions: any[] = [
      eq(fabrics.status, 'active'),
      isNull(fabrics.deletedAt)
    ];
    
    if (threshold !== undefined) {
      conditions.push(lte(fabrics.availableQuantity, threshold.toString()));
    } else {
      conditions.push(sql`${fabrics.availableQuantity} <= ${fabrics.reorderPoint}`);
    }
    
    return await this.db
      .select()
      .from(fabrics)
      .where(and(...conditions))
      .orderBy(asc(fabrics.availableQuantity));
  }
  
  /**
   * Get fabrics needing reorder
   */
  async getNeedingReorder(): Promise<Fabric[]> {
    return await this.db
      .select()
      .from(fabrics)
      .where(and(
        eq(fabrics.status, 'Active'),
        isNull(fabrics.deletedAt),
        sql`${fabrics.availableQuantity} <= ${fabrics.reorderPoint}`,
        sql`${fabrics.reorderPoint} IS NOT NULL`
      ))
      .orderBy(asc(fabrics.availableQuantity));
  }
  
  // ============================================
  // INVENTORY MANAGEMENT
  // ============================================
  
  /**
   * Update stock quantity
   */
  async updateStock(
    fabricId: string,
    quantity: number,
    movementType: 'in' | 'out' | 'adjustment' | 'reserved' | 'released',
    referenceType?: string,
    referenceId?: string,
    notes?: string,
    userId?: string
  ): Promise<Fabric | null> {
    return await this.db.transaction(async (tx) => {
      // Get current fabric
      const fabric = await tx
        .select()
        .from(fabrics)
        .where(eq(fabrics.id, fabricId))
        .for('update') // Lock the row
        .limit(1)
        .then(r => r[0]);
      
      if (!fabric) return null;
      
      const balanceBefore = parseFloat(fabric.stockQuantity);
      let balanceAfter = balanceBefore;
      let availableAfter = parseFloat(fabric.availableQuantity);
      let reservedAfter = parseFloat(fabric.reservedQuantity);
      
      // Calculate new balances based on movement type
      switch (movementType) {
        case 'in':
          balanceAfter += quantity;
          availableAfter += quantity;
          break;
        case 'out':
          if (availableAfter < quantity) {
            throw new Error('Insufficient stock available');
          }
          balanceAfter -= quantity;
          availableAfter -= quantity;
          break;
        case 'adjustment':
          const diff = quantity - balanceBefore;
          balanceAfter = quantity;
          availableAfter += diff;
          break;
        case 'reserved':
          if (availableAfter < quantity) {
            throw new Error('Insufficient stock available for reservation');
          }
          availableAfter -= quantity;
          reservedAfter += quantity;
          break;
        case 'released':
          if (reservedAfter < quantity) {
            throw new Error('Cannot release more than reserved');
          }
          availableAfter += quantity;
          reservedAfter -= quantity;
          break;
      }
      
      // Record stock movement
      // TODO: Add fabricStockMovements table to track inventory changes
      // await tx.insert(fabricStockMovements).values({
      //   id: crypto.randomUUID(),
      //   fabricId,
      //   movementType,
      //   quantity: quantity.toString(),
      //   balanceBefore: balanceBefore.toString(),
      //   balanceAfter: balanceAfter.toString(),
      //   referenceType,
      //   referenceId,
      //   notes,
      //   createdAt: new Date(),
      //   createdBy: userId,
      // });
      
      // Update fabric stock
      const updated = await tx
        .update(fabrics)
        .set({
          stockQuantity: balanceAfter.toString(),
          availableQuantity: availableAfter.toString(),
          reservedQuantity: reservedAfter.toString(),
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(fabrics.id, fabricId))
        .returning()
        .then(r => r[0]);
      
      return updated;
    });
  }
  
  /**
   * Reserve stock for an order
   */
  async reserveStock(
    fabricId: string,
    quantity: number,
    orderId: string,
    userId?: string
  ): Promise<Fabric | null> {
    return await this.updateStock(
      fabricId,
      quantity,
      'reserved',
      'order',
      orderId,
      `Reserved for order ${orderId}`,
      userId
    );
  }
  
  /**
   * Release reserved stock
   */
  async releaseStock(
    fabricId: string,
    quantity: number,
    orderId: string,
    userId?: string
  ): Promise<Fabric | null> {
    return await this.updateStock(
      fabricId,
      quantity,
      'released',
      'order',
      orderId,
      `Released from order ${orderId}`,
      userId
    );
  }
  
  /**
   * Get stock movements history
   */
  async getStockMovements(
    fabricId: string,
    limit: number = 50
  ): Promise<any[]> {
    // TODO: Add fabricStockMovements table to track inventory changes
    // return await this.db
    //   .select()
    //   .from(fabricStockMovements)
    //   .where(eq(fabricStockMovements.fabricId, fabricId))
    //   .orderBy(desc(fabricStockMovements.createdAt))
    //   .limit(limit);
    return [];
  }
  
  
  // ============================================
  // ANALYTICS & METRICS
  // ============================================
  
  /**
   * Increment view count
   * Note: viewCount and lastViewedAt fields not available in current schema
   */
  async incrementViewCount(fabricId: string): Promise<void> {
    // Skip view count update as fields don't exist in current schema
    // TODO: Add viewCount and lastViewedAt fields to schema if analytics needed
    return Promise.resolve();
  }
  
  /**
   * Increment favorite count
   * Note: favoriteCount field not available in current schema
   */
  async incrementFavoriteCount(fabricId: string, increment: boolean = true): Promise<void> {
    // Skip favorite count update as field doesn't exist in current schema
    // TODO: Add favoriteCount field to schema if analytics needed
    return Promise.resolve();
  }
  
  /**
   * Get fabric statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    outOfStock: number;
    lowStock: number;
    totalValue: number;
  }> {
    const stats = await this.db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
        COUNT(*) FILTER (WHERE status = 'active' AND deleted_at IS NULL) as active,
        COUNT(*) FILTER (WHERE available_quantity <= 0 AND deleted_at IS NULL) as out_of_stock,
        COUNT(*) FILTER (WHERE available_quantity > 0 AND available_quantity <= reorder_point AND deleted_at IS NULL) as low_stock,
        SUM(stock_quantity::numeric * retail_price::numeric) FILTER (WHERE deleted_at IS NULL) as total_value
      FROM ${fabrics}
    `);
    
    const row = stats.rows[0];
    return {
      total: parseInt(row.total) || 0,
      active: parseInt(row.active) || 0,
      outOfStock: parseInt(row.out_of_stock) || 0,
      lowStock: parseInt(row.low_stock) || 0,
      totalValue: parseFloat(row.total_value) || 0,
    };
  }
  
  /**
   * Get top performing fabrics
   */
  async getTopPerformers(
    metric: 'views' | 'favorites' | 'samples',
    limit: number = 10
  ): Promise<Fabric[]> {
    let orderByField;
    switch (metric) {
      case 'views':
        // Field doesn't exist in current schema, fall back to createdAt
        orderByField = fabrics.createdAt;
        break;
      case 'favorites':
        // Field doesn't exist in current schema, fall back to createdAt  
        orderByField = fabrics.createdAt;
        break;
      case 'samples':
        // Field doesn't exist in current schema, fall back to createdAt
        orderByField = fabrics.createdAt;
        break;
    }
    
    return await this.db
      .select()
      .from(fabrics)
      .where(and(
        eq(fabrics.status, 'Active'),
        isNull(fabrics.deletedAt)
      ))
      .orderBy(desc(orderByField))
      .limit(limit);
  }
  
  // ============================================
  // AGGREGATIONS
  // ============================================
  
  /**
   * Get unique values for filters
   */
  async getFilterOptions(): Promise<{
    types: string[];
    manufacturers: string[];
    collections: string[];
    colors: string[];
  }> {
    const [types, manufacturers, collections, colors] = await Promise.all([
      // Get unique types
      this.db
        .selectDistinct({ value: fabrics.type })
        .from(fabrics)
        .where(and(eq(fabrics.status, 'active'), isNull(fabrics.deletedAt)))
        .then(r => r.map(row => row.value).filter(Boolean)),
      
      // Get unique manufacturers
      this.db
        .selectDistinct({ value: fabrics.manufacturerName })
        .from(fabrics)
        .where(and(eq(fabrics.status, 'active'), isNull(fabrics.deletedAt)))
        .orderBy(asc(fabrics.manufacturerName))
        .then(r => r.map(row => row.value).filter(Boolean)),
      
      // Get unique collections
      this.db
        .selectDistinct({ value: fabrics.collection })
        .from(fabrics)
        .where(and(eq(fabrics.status, 'active'), isNull(fabrics.deletedAt)))
        .orderBy(asc(fabrics.collection))
        .then(r => r.map(row => row.value).filter(Boolean)),
      
      // Get unique colors
      this.db
        .selectDistinct({ value: fabrics.primaryColor })
        .from(fabrics)
        .where(and(eq(fabrics.status, 'active'), isNull(fabrics.deletedAt)))
        .orderBy(asc(fabrics.primaryColor))
        .then(r => r.map(row => row.value).filter(Boolean)),
    ]);
    
    return {
      types,
      manufacturers,
      collections,
      colors,
    };
  }
}

// Export singleton instance
export const fabricRepository = new FabricRepository();
