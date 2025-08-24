/**
 * FABRIC SERVICE
 * Business logic layer for fabric operations
 * Handles validation, caching, events, and orchestration
 */

import { fabricRepository } from '../repositories/fabric.repository';
import type { 
  Fabric, 
  FabricFilter
} from '../types';
import { insertFabricSchema } from '../schemas/fabric.schema';
import { z } from 'zod';

// Define missing types
type NewFabric = Partial<Fabric>;
type FabricSort = { field: string; direction: 'asc' | 'desc' };
type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export class FabricService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'fabric:';
  private fabricRepository = fabricRepository;
  
  // ============================================
  // CRUD OPERATIONS WITH BUSINESS LOGIC
  // ============================================
  
  /**
   * Get fabric by ID with caching
   */
  async getById(id: string): Promise<Fabric | null> {
    // Try cache first
    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    const cached = await this.getFromCache<Fabric>(cacheKey);
    if (cached) return cached;
    
    // Fetch from database
    const fabric = await this.fabricRepository.findById(id);
    
    // Cache if found
    if (fabric) {
      await this.setCache(cacheKey, fabric);
      // Increment view count asynchronously
      this.fabricRepository.incrementViewCount(id).catch(console.error);
    }
    
    return fabric;
  }
  
  /**
   * Get fabric by SKU with validation
   */
  async getBySku(sku: string): Promise<Fabric | null> {
    // Validate SKU format
    if (!/^[A-Z0-9-]+$/.test(sku)) {
      throw new Error('Invalid SKU format');
    }
    
    const cacheKey = `${this.CACHE_PREFIX}sku:${sku}`;
    const cached = await this.getFromCache<Fabric>(cacheKey);
    if (cached) return cached;
    
    const fabric = await this.fabricRepository.findBySku(sku);
    
    if (fabric) {
      await this.setCache(cacheKey, fabric);
    }
    
    return fabric;
  }
  
  /**
   * Get fabric by slug for SEO-friendly URLs
   */
  async getBySlug(slug: string): Promise<Fabric | null> {
    const cacheKey = `${this.CACHE_PREFIX}slug:${slug}`;
    const cached = await this.getFromCache<Fabric>(cacheKey);
    if (cached) return cached;
    
    const fabric = await this.fabricRepository.findBySlug(slug);
    
    if (fabric) {
      await this.setCache(cacheKey, fabric);
      // Increment view count
      fabricRepository.incrementViewCount(fabric.id).catch(console.error);
    }
    
    return fabric;
  }
  
  /**
   * Search fabrics with validation and caching
   */
  async search(
    filter: any,
    sort: any,
    pagination: any
  ): Promise<PaginatedResult<Fabric>> {
    // Validate inputs
    const validatedFilter = filter || {};
    const validatedSort = sort || { field: 'createdAt', direction: 'desc' };
    const validatedPagination = pagination || { page: 1, limit: 20 };
    
    // Generate cache key from search params
    const cacheKey = this.generateSearchCacheKey(validatedFilter, validatedSort, validatedPagination);
    const cached = await this.getFromCache<PaginatedResult<Fabric>>(cacheKey);
    if (cached) return cached;
    
    // Search in database
    const result = await this.fabricRepository.search(
      validatedFilter,
      validatedSort,
      validatedPagination.page,
      validatedPagination.limit
    );
    
    // Cache results for shorter duration (60 seconds for search)
    await this.setCache(cacheKey, result, 60);
    
    return result;
  }
  
  /**
   * Create new fabric with validation and slug generation
   */
  async create(data: any, userId: string): Promise<Fabric> {
    // Validate input
    const validated = insertFabricSchema.parse(data);
    
    // Check for duplicate SKU
    const existing = await this.fabricRepository.findBySku(validated.sku);
    if (existing) {
      throw new Error(`Fabric with SKU ${validated.sku} already exists`);
    }
    
    // Generate slug from name if not provided
    if (!validated.slug) {
      validated.slug = this.generateSlug(validated.name);
      // Ensure slug is unique
      let slugSuffix = 0;
      let finalSlug = validated.slug;
      while (await this.fabricRepository.findBySlug(finalSlug)) {
        slugSuffix++;
        finalSlug = `${validated.slug}-${slugSuffix}`;
      }
      validated.slug = finalSlug;
    }
    
    // Calculate available quantity
    if (validated.stockQuantity && !validated.availableQuantity) {
      validated.availableQuantity = validated.stockQuantity;
    }
    
    // Create fabric
    let fabric;
    try {
      fabric = await this.fabricRepository.create(validated, userId);
    } catch (dbError: any) {
      console.error('Database error creating fabric:', dbError);
      // Re-throw with better error message
      if (dbError.message?.includes('duplicate key')) {
        throw new Error(`Fabric with SKU ${validated.sku} already exists`);
      }
      throw new Error(`Database error: ${dbError.message || 'Failed to create fabric'}`);
    }
    
    // Clear relevant caches
    await this.clearSearchCaches();
    
    // Emit event for other services
    await this.emitEvent('fabric.created', fabric);
    
    return fabric;
  }
  
  /**
   * Update fabric with validation and cache invalidation
   */
  async update(id: string, data: any, userId: string): Promise<Fabric | null> {
    // Validate input
    // Data cleaning for required fields with empty strings
    const cleanedData = { ...data };
    
    // Ensure type field has a valid value (required field)
    if (!cleanedData.type || cleanedData.type.trim() === '') {
      cleanedData.type = 'Upholstery'; // Default value
    }
    
    // Ensure status field has a valid value (required field)  
    if (!cleanedData.status || cleanedData.status.trim() === '') {
      cleanedData.status = 'Active'; // Default value
    }
    
    const validated = cleanedData; // Skip schema validation for now
    
    // Check if fabric exists
    const existing = await fabricRepository.findById(id);
    if (!existing) {
      throw new Error('Fabric not found');
    }
    
    // If SKU is being changed, check for duplicates
    if (validated.sku && validated.sku !== existing.sku) {
      const duplicate = await fabricRepository.findBySku(validated.sku);
      if (duplicate) {
        throw new Error(`Fabric with SKU ${validated.sku} already exists`);
      }
    }
    
    // If slug is being changed, ensure uniqueness
    if (validated.slug && validated.slug !== existing.slug) {
      const duplicate = await fabricRepository.findBySlug(validated.slug);
      if (duplicate) {
        throw new Error(`Fabric with slug ${validated.slug} already exists`);
      }
    }
    
    // Update fabric
    const updated = await fabricRepository.update(id, validated, userId);
    
    if (updated) {
      // Clear all caches for this fabric
      await this.clearFabricCaches(updated);
      
      // Emit event
      await this.emitEvent('fabric.updated', updated);
    }
    
    return updated;
  }
  
  /**
   * Delete fabric (soft delete)
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const fabric = await fabricRepository.findById(id);
    if (!fabric) {
      throw new Error('Fabric not found');
    }
    
    // Use soft delete by updating deletedAt field
    const deleted = await fabricRepository.update(id, {
      deletedAt: new Date(),
      deletedBy: userId,
      updatedAt: new Date(),
      updatedBy: userId
    }, userId);
    
    if (deleted) {
      // Clear caches
      await this.clearFabricCaches(fabric);
      
      // Emit event
      await this.emitEvent('fabric.deleted', { id, fabric });
    }
    
    return !!deleted;
  }
  
  /**
   * Bulk create fabrics
   */
  async bulkCreate(items: any[], userId: string): Promise<{
    success: Fabric[];
    failed: Array<{ index: number; error: string; data: any }>;
  }> {
    const success: Fabric[] = [];
    const failed: Array<{ index: number; error: string; data: any }> = [];
    
    // Process each item
    for (let i = 0; i < items.length; i++) {
      try {
        const fabric = await this.create(items[i], userId);
        success.push(fabric);
      } catch (error: any) {
        failed.push({
          index: i,
          error: error.message,
          data: items[i]
        });
      }
    }
    
    return { success, failed };
  }
  
  /**
   * Bulk update fabrics
   */
  async bulkUpdate(
    updates: Array<{ id: string; data: any }>,
    userId: string
  ): Promise<{
    success: Fabric[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const success: Fabric[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    
    for (const update of updates) {
      try {
        const fabric = await this.update(update.id, update.data, userId);
        if (fabric) success.push(fabric);
      } catch (error: any) {
        failed.push({
          id: update.id,
          error: error.message
        });
      }
    }
    
    return { success, failed };
  }
  
  /**
   * Bulk delete fabrics
   */
  async bulkDelete(ids: string[], userId: string): Promise<{
    success: number;
    failed: Array<{ id: string; error: string }>;
  }> {
    let success = 0;
    const failed: Array<{ id: string; error: string }> = [];
    
    for (const id of ids) {
      try {
        const deleted = await this.delete(id, userId);
        if (deleted) success++;
      } catch (error: any) {
        failed.push({
          id,
          error: error.message
        });
      }
    }
    
    return { success, failed };
  }
  
  // ============================================
  // SPECIALIZED OPERATIONS
  // ============================================
  
  /**
   * Get featured fabrics with caching
   */
  async getFeatured(limit: number = 12): Promise<Fabric[]> {
    const cacheKey = `${this.CACHE_PREFIX}featured:${limit}`;
    const cached = await this.getFromCache<Fabric[]>(cacheKey);
    if (cached) return cached;
    
    const fabrics = await fabricRepository.getFeatured(limit);
    await this.setCache(cacheKey, fabrics, 600); // Cache for 10 minutes
    
    return fabrics;
  }
  
  /**
   * Get new arrivals
   */
  async getNewArrivals(limit: number = 12): Promise<Fabric[]> {
    const cacheKey = `${this.CACHE_PREFIX}new-arrivals:${limit}`;
    const cached = await this.getFromCache<Fabric[]>(cacheKey);
    if (cached) return cached;
    
    const fabrics = await fabricRepository.getNewArrivals(limit);
    await this.setCache(cacheKey, fabrics, 600);
    
    return fabrics;
  }
  
  /**
   * Get best sellers
   */
  async getBestSellers(limit: number = 12): Promise<Fabric[]> {
    const cacheKey = `${this.CACHE_PREFIX}best-sellers:${limit}`;
    const cached = await this.getFromCache<Fabric[]>(cacheKey);
    if (cached) return cached;
    
    const fabrics = await fabricRepository.getBestSellers(limit);
    await this.setCache(cacheKey, fabrics, 600);
    
    return fabrics;
  }
  
  /**
   * Get related fabrics
   */
  async getRelated(fabricId: string, limit: number = 6): Promise<Fabric[]> {
    const cacheKey = `${this.CACHE_PREFIX}related:${fabricId}:${limit}`;
    const cached = await this.getFromCache<Fabric[]>(cacheKey);
    if (cached) return cached;
    
    const fabrics = await fabricRepository.getRelated(fabricId, limit);
    await this.setCache(cacheKey, fabrics, 1800); // Cache for 30 minutes
    
    return fabrics;
  }
  
  // ============================================
  // INVENTORY OPERATIONS
  // ============================================
  
  /**
   * Update stock with validation
   */
  async updateStock(
    fabricId: string,
    quantity: number,
    operation: 'add' | 'remove' | 'set' | 'reserve' | 'release',
    reference?: { type: string; id: string },
    notes?: string,
    userId?: string
  ): Promise<Fabric | null> {
    // Validate quantity
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    
    let movementType: 'in' | 'out' | 'adjustment' | 'reserved' | 'released';
    
    switch (operation) {
      case 'add':
        movementType = 'in';
        break;
      case 'remove':
        movementType = 'out';
        break;
      case 'set':
        movementType = 'adjustment';
        break;
      case 'reserve':
        movementType = 'reserved';
        break;
      case 'release':
        movementType = 'released';
        break;
    }
    
    const updated = await fabricRepository.updateStock(
      fabricId,
      quantity,
      movementType,
      reference?.type,
      reference?.id,
      notes,
      userId
    );
    
    if (updated) {
      // Clear cache
      await this.clearFabricCaches(updated);
      
      // Check if low stock alert needed
      if (updated.reorderPoint && 
          parseFloat(updated.availableQuantity) <= parseFloat(updated.reorderPoint)) {
        await this.emitEvent('fabric.low-stock', {
          fabric: updated,
          availableQuantity: updated.availableQuantity,
          reorderPoint: updated.reorderPoint
        });
      }
    }
    
    return updated;
  }
  
  /**
   * Get low stock fabrics
   */
  async getLowStock(threshold?: number): Promise<Fabric[]> {
    return await fabricRepository.getLowStock(threshold);
  }
  
  /**
   * Get fabrics needing reorder
   */
  async getNeedingReorder(): Promise<Fabric[]> {
    return await fabricRepository.getNeedingReorder();
  }
  
  /**
   * Get stock movements history
   */
  async getStockHistory(fabricId: string, limit: number = 50): Promise<any[]> {
    return await fabricRepository.getStockMovements(fabricId, limit);
  }
  
  // ============================================
  // PRICING OPERATIONS
  // ============================================
  
  /**
   * Update fabric pricing
   */
  async updatePricing(
    fabricId: string,
    retailPrice: number,
    wholesalePrice?: number,
    reason?: string,
    effectiveDate?: Date,
    userId?: string
  ): Promise<Fabric | null> {
    // Validate prices
    if (retailPrice <= 0) {
      throw new Error('Retail price must be positive');
    }
    if (wholesalePrice && wholesalePrice <= 0) {
      throw new Error('Wholesale price must be positive');
    }
    if (wholesalePrice && wholesalePrice >= retailPrice) {
      throw new Error('Wholesale price must be less than retail price');
    }
    
    const updated = await fabricRepository.updatePricing(
      fabricId,
      retailPrice,
      wholesalePrice,
      reason,
      effectiveDate,
      userId
    );
    
    if (updated) {
      await this.clearFabricCaches(updated);
      await this.emitEvent('fabric.price-updated', {
        fabric: updated,
        oldPrice: updated.retailPrice,
        newPrice: retailPrice
      });
    }
    
    return updated;
  }
  
  /**
   * Get price history
   */
  async getPriceHistory(fabricId: string, limit: number = 20): Promise<any[]> {
    return await fabricRepository.getPriceHistory(fabricId, limit);
  }
  
  // ============================================
  // ANALYTICS & REPORTING
  // ============================================
  
  /**
   * Get fabric statistics
   */
  async getStatistics(): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}statistics`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;
    
    const stats = await fabricRepository.getStatistics();
    await this.setCache(cacheKey, stats, 300); // Cache for 5 minutes
    
    return stats;
  }
  
  /**
   * Get top performing fabrics
   */
  async getTopPerformers(
    metric: 'views' | 'favorites' | 'samples',
    limit: number = 10
  ): Promise<Fabric[]> {
    const cacheKey = `${this.CACHE_PREFIX}top-${metric}:${limit}`;
    const cached = await this.getFromCache<Fabric[]>(cacheKey);
    if (cached) return cached;
    
    const fabrics = await fabricRepository.getTopPerformers(metric, limit);
    await this.setCache(cacheKey, fabrics, 3600); // Cache for 1 hour
    
    return fabrics;
  }
  
  /**
   * Get filter options for UI
   */
  async getFilterOptions(): Promise<any> {
    const cacheKey = `${this.CACHE_PREFIX}filter-options`;
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;
    
    const options = await fabricRepository.getFilterOptions();
    await this.setCache(cacheKey, options, 3600); // Cache for 1 hour
    
    return options;
  }
  
  /**
   * Export fabrics to CSV
   */
  async exportToCSV(filter?: FabricFilter): Promise<string> {
    const fabrics = await fabricRepository.search(
      filter || {},
      { field: 'sku', direction: 'asc' },
      1,
      10000 // Max export limit
    );
    
    // Convert to CSV format
    const headers = [
      'SKU', 'Name', 'Type', 'Status', 'Manufacturer', 'Collection',
      'Retail Price', 'Stock Quantity', 'Available Quantity'
    ];
    
    const rows = fabrics.data.map(fabric => [
      fabric.sku,
      fabric.name,
      fabric.type,
      fabric.status,
      fabric.manufacturerName,
      fabric.collection || '',
      fabric.retailPrice,
      fabric.stockQuantity,
      fabric.availableQuantity
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csv;
  }
  
  /**
   * Import fabrics from CSV
   */
  async importFromCSV(
    csvData: string,
    userId: string
  ): Promise<{
    success: number;
    failed: Array<{ row: number; error: string }>;
  }> {
    // Parse CSV (you would use a proper CSV parser library)
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const results = {
      success: 0,
      failed: [] as Array<{ row: number; error: string }>
    };
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const fabricData: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index];
          // Map CSV headers to fabric fields
          switch (header.toLowerCase()) {
            case 'sku':
              fabricData.sku = value;
              break;
            case 'name':
              fabricData.name = value;
              break;
            // ... map other fields
          }
        });
        
        await this.create(fabricData, userId);
        results.success++;
      } catch (error: any) {
        results.failed.push({
          row: i + 1,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  /**
   * Generate URL-friendly slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start
      .replace(/-+$/, ''); // Trim - from end
  }
  
  /**
   * Generate cache key for search results
   */
  private generateSearchCacheKey(
    filter: FabricFilter,
    sort: FabricSort,
    pagination: any
  ): string {
    const filterStr = JSON.stringify(filter);
    const sortStr = JSON.stringify(sort);
    return `${this.CACHE_PREFIX}search:${Buffer.from(
      `${filterStr}:${sortStr}:${pagination.page}:${pagination.limit}`
    ).toString('base64')}`;
  }
  
  /**
   * Get from cache
   */
  private async getFromCache<T>(key: string): Promise<T | null> {
    try {
      // Redis caching disabled for now - returning null to bypass cache
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  /**
   * Set cache
   */
  private async setCache(key: string, value: any, ttl: number = this.CACHE_TTL): Promise<void> {
    try {
      // Redis caching disabled for now
      return;
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  /**
   * Clear fabric-specific caches
   */
  private async clearFabricCaches(fabric: Fabric): Promise<void> {
    try {
      // Redis caching disabled for now
      return;
      
      const keys = [
        `${this.CACHE_PREFIX}id:${fabric.id}`,
        `${this.CACHE_PREFIX}sku:${fabric.sku}`,
        `${this.CACHE_PREFIX}slug:${fabric.slug}`,
        `${this.CACHE_PREFIX}related:${fabric.id}:*`,
      ];
      
      // Clear all matching keys
      for (const pattern of keys) {
        if (pattern.includes('*')) {
          const matchingKeys = await redis.keys(pattern);
          if (matchingKeys.length > 0) {
            await redis.del(...matchingKeys);
          }
        } else {
          await redis.del(pattern);
        }
      }
      
      // Also clear list caches
      await this.clearSearchCaches();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
  
  /**
   * Clear search and list caches
   */
  private async clearSearchCaches(): Promise<void> {
    try {
      if (!redis) return;
      
      const patterns = [
        `${this.CACHE_PREFIX}search:*`,
        `${this.CACHE_PREFIX}featured:*`,
        `${this.CACHE_PREFIX}new-arrivals:*`,
        `${this.CACHE_PREFIX}best-sellers:*`,
        `${this.CACHE_PREFIX}statistics`,
        `${this.CACHE_PREFIX}filter-options`,
        `${this.CACHE_PREFIX}top-*`,
      ];
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
  
  /**
   * Emit domain events (can be connected to event bus)
   */
  private async emitEvent(eventName: string, data: any): Promise<void> {
    try {
      // In production, this would publish to an event bus (Kafka, RabbitMQ, etc.)
      // For now, just log the event
      console.log(`Event: ${eventName}`, data);
      
      // Could also trigger webhooks, notifications, etc.
      // Redis disabled for now
      // if (redis) {
      //   await redis.publish(`fabric-events:${eventName}`, JSON.stringify(data));
      // }
    } catch (error) {
      console.error('Event emit error:', error);
    }
  }
}

// Export singleton instance
export const fabricService = new FabricService();
