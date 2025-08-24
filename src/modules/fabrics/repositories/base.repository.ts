/**
 * BASE REPOSITORY
 * Abstract base class for all repositories
 * Provides common CRUD operations
 */

import { SQL, eq } from 'drizzle-orm';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<TTable, TSelect, TInsert> {
  protected abstract table: any;
  protected abstract db: any;

  /**
   * Find by ID
   */
  async findById(id: string): Promise<TSelect | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Find all records
   */
  async findAll(): Promise<TSelect[]> {
    return await this.db.select().from(this.table);
  }

  /**
   * Create a new record
   */
  async create(data: TInsert): Promise<TSelect> {
    const result = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    
    return result[0];
  }

  /**
   * Update a record
   */
  async update(id: string, data: Partial<TInsert>): Promise<TSelect | null> {
    const result = await this.db
      .update(this.table)
      .set(data)
      .where(eq(this.table.id, id))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Count records
   */
  async count(where?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql`count(*)::int` })
      .from(this.table);
    
    if (where) {
      query.where(where);
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }
}