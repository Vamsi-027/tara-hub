/**
 * BASE REPOSITORY PATTERN
 * Abstract class for all repositories to extend
 * Provides common CRUD operations
 */

import { and, eq, sql, desc, asc, isNull, inArray, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  select?: string[];
  include?: string[];
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

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

export abstract class BaseRepository<TTable extends PgTable, TSelect, TInsert> {
  protected abstract table: TTable;
  protected abstract db: any;
  
  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================
  
  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<TSelect | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(and(
        eq(this.table.id, id),
        isNull(this.table.deletedAt)
      ))
      .limit(1);
    
    return result[0] || null;
  }
  
  /**
   * Find multiple records by IDs (batch loading)
   */
  async findByIds(ids: string[]): Promise<TSelect[]> {
    if (ids.length === 0) return [];
    
    return await this.db
      .select()
      .from(this.table)
      .where(and(
        inArray(this.table.id, ids),
        isNull(this.table.deletedAt)
      ));
  }
  
  /**
   * Find all records with optional filtering
   */
  async findAll(options?: QueryOptions): Promise<TSelect[]> {
    let query = this.db
      .select()
      .from(this.table)
      .where(isNull(this.table.deletedAt));
    
    // Apply ordering
    if (options?.orderBy) {
      for (const order of options.orderBy) {
        const direction = order.direction === 'asc' ? asc : desc;
        query = query.orderBy(direction(this.table[order.field]));
      }
    } else {
      query = query.orderBy(desc(this.table.createdAt));
    }
    
    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  /**
   * Find with pagination
   */
  async findPaginated(
    page: number = 1,
    limit: number = 20,
    where?: SQL,
    orderBy?: SQL
  ): Promise<PaginatedResult<TSelect>> {
    const offset = (page - 1) * limit;
    
    // Build base conditions
    const conditions = [isNull(this.table.deletedAt)];
    if (where) conditions.push(where);
    
    // Get total count
    const countResult = await this.db
      .select({ count: sql`count(*)::int` })
      .from(this.table)
      .where(and(...conditions));
    
    const total = countResult[0]?.count || 0;
    
    // Get paginated data
    let query = this.db
      .select()
      .from(this.table)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
    
    if (orderBy) {
      query = query.orderBy(orderBy);
    } else {
      query = query.orderBy(desc(this.table.createdAt));
    }
    
    const data = await query;
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    };
  }
  
  /**
   * Cursor-based pagination for large datasets
   */
  async findCursorPaginated(
    cursor: string | null,
    limit: number = 20,
    where?: SQL,
    orderField: string = 'id'
  ): Promise<CursorPaginatedResult<TSelect>> {
    const conditions = [isNull(this.table.deletedAt)];
    if (where) conditions.push(where);
    if (cursor) {
      conditions.push(sql`${this.table[orderField]} > ${cursor}`);
    }
    
    const data = await this.db
      .select()
      .from(this.table)
      .where(and(...conditions))
      .orderBy(asc(this.table[orderField]))
      .limit(limit + 1); // Fetch one extra to check if there's more
    
    const hasNext = data.length > limit;
    if (hasNext) {
      data.pop(); // Remove the extra item
    }
    
    return {
      data,
      nextCursor: hasNext ? data[data.length - 1][orderField] : null,
      hasNext,
    };
  }
  
  /**
   * Create a new record
   */
  async create(data: TInsert, userId?: string): Promise<TSelect> {
    const now = new Date();
    const enrichedData = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      version: 1,
    };
    
    const result = await this.db
      .insert(this.table)
      .values(enrichedData)
      .returning();
    
    return result[0];
  }
  
  /**
   * Create multiple records (bulk insert)
   */
  async createMany(items: TInsert[], userId?: string): Promise<TSelect[]> {
    if (items.length === 0) return [];
    
    const now = new Date();
    const enrichedItems = items.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      version: 1,
    }));
    
    // Insert in batches for better performance
    const batchSize = 100;
    const results: TSelect[] = [];
    
    for (let i = 0; i < enrichedItems.length; i += batchSize) {
      const batch = enrichedItems.slice(i, i + batchSize);
      const batchResults = await this.db
        .insert(this.table)
        .values(batch)
        .returning();
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Update a record with optimistic locking
   */
  async update(id: string, data: Partial<TInsert>, userId?: string): Promise<TSelect | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    
    const result = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
        version: sql`${this.table.version} + 1`,
      })
      .where(and(
        eq(this.table.id, id),
        eq(this.table.version, existing.version), // Optimistic locking
        isNull(this.table.deletedAt)
      ))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Concurrent modification detected. Please refresh and try again.');
    }
    
    return result[0];
  }
  
  /**
   * Update multiple records
   */
  async updateMany(
    ids: string[],
    data: Partial<TInsert>,
    userId?: string
  ): Promise<TSelect[]> {
    if (ids.length === 0) return [];
    
    return await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
        version: sql`${this.table.version} + 1`,
      })
      .where(and(
        inArray(this.table.id, ids),
        isNull(this.table.deletedAt)
      ))
      .returning();
  }
  
  /**
   * Soft delete a record
   */
  async softDelete(id: string, userId?: string): Promise<boolean> {
    const result = await this.db
      .update(this.table)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
      })
      .where(and(
        eq(this.table.id, id),
        isNull(this.table.deletedAt)
      ))
      .returning();
    
    return result.length > 0;
  }
  
  /**
   * Soft delete multiple records
   */
  async softDeleteMany(ids: string[], userId?: string): Promise<number> {
    if (ids.length === 0) return 0;
    
    const result = await this.db
      .update(this.table)
      .set({
        deletedAt: new Date(),
        deletedBy: userId,
      })
      .where(and(
        inArray(this.table.id, ids),
        isNull(this.table.deletedAt)
      ))
      .returning();
    
    return result.length;
  }
  
  /**
   * Hard delete a record (use with caution)
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  /**
   * Restore a soft-deleted record
   */
  async restore(id: string, userId?: string): Promise<TSelect | null> {
    const result = await this.db
      .update(this.table)
      .set({
        deletedAt: null,
        deletedBy: null,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(this.table.id, id))
      .returning();
    
    return result[0] || null;
  }
  
  /**
   * Check if a record exists
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ count: sql`1` })
      .from(this.table)
      .where(and(
        eq(this.table.id, id),
        isNull(this.table.deletedAt)
      ))
      .limit(1);
    
    return result.length > 0;
  }
  
  /**
   * Count records with optional conditions
   */
  async count(where?: SQL): Promise<number> {
    const conditions = [isNull(this.table.deletedAt)];
    if (where) conditions.push(where);
    
    const result = await this.db
      .select({ count: sql`count(*)::int` })
      .from(this.table)
      .where(and(...conditions));
    
    return result[0]?.count || 0;
  }
  
  /**
   * Execute raw SQL query (use with caution)
   */
  async raw<T = any>(query: string, params: any[] = []): Promise<T[]> {
    return await this.db.execute(sql.raw(query, ...params));
  }
  
  /**
   * Begin a transaction
   */
  async transaction<T>(
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    return await this.db.transaction(callback);
  }
}
