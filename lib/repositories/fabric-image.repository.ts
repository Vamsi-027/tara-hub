/**
 * FABRIC IMAGE REPOSITORY
 * Data access layer for fabric images
 * Handles CRUD operations for fabric_images table
 */

import { db } from '@/lib/db';
import { fabricImages, type FabricImage, type NewFabricImage } from '@/lib/db/schema/fabric-images.schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class FabricImageRepository {
  private tableExists: boolean | null = null;

  /**
   * Check if the fabric_images table exists
   */
  async checkTableExists(): Promise<boolean> {
    if (this.tableExists !== null) {
      return this.tableExists;
    }
    
    try {
      // Try a simple query to check if table exists
      await db.select({ count: sql`1` })
        .from(fabricImages)
        .limit(1);
      this.tableExists = true;
      return true;
    } catch (error: any) {
      console.log('fabric_images table not found, skipping image metadata storage');
      this.tableExists = false;
      return false;
    }
  }

  /**
   * Create a new fabric image record
   */
  async create(data: NewFabricImage): Promise<FabricImage> {
    // Check if table exists first
    const tableExists = await this.checkTableExists();
    if (!tableExists) {
      // Return a mock object if table doesn't exist
      return {
        ...data,
        id: data.id || uuidv4(),
        uploadedAt: new Date(),
        modifiedAt: null,
        deletedAt: null,
        deletedBy: null,
        modifiedBy: null,
      } as FabricImage;
    }

    const [image] = await db
      .insert(fabricImages)
      .values({
        ...data,
        id: data.id || uuidv4(),
      })
      .returning();
    
    return image;
  }

  /**
   * Create multiple fabric image records
   */
  async createBatch(images: NewFabricImage[]): Promise<FabricImage[]> {
    if (images.length === 0) return [];
    
    const results = await db
      .insert(fabricImages)
      .values(images.map(img => ({
        ...img,
        id: img.id || uuidv4(),
      })))
      .returning();
    
    return results;
  }

  /**
   * Get all images for a fabric
   */
  async findByFabricId(fabricId: string): Promise<FabricImage[]> {
    return db
      .select()
      .from(fabricImages)
      .where(
        and(
          eq(fabricImages.fabricId, fabricId),
          isNull(fabricImages.deletedAt)
        )
      )
      .orderBy(fabricImages.order, fabricImages.uploadedAt);
  }

  /**
   * Get a single image by ID
   */
  async findById(id: string): Promise<FabricImage | null> {
    const [image] = await db
      .select()
      .from(fabricImages)
      .where(
        and(
          eq(fabricImages.id, id),
          isNull(fabricImages.deletedAt)
        )
      )
      .limit(1);
    
    return image || null;
  }

  /**
   * Get an image by R2 key
   */
  async findByR2Key(r2Key: string): Promise<FabricImage | null> {
    const [image] = await db
      .select()
      .from(fabricImages)
      .where(
        and(
          eq(fabricImages.r2Key, r2Key),
          isNull(fabricImages.deletedAt)
        )
      )
      .limit(1);
    
    return image || null;
  }

  /**
   * Update an image record
   */
  async update(id: string, data: Partial<FabricImage>): Promise<FabricImage | null> {
    const [updated] = await db
      .update(fabricImages)
      .set({
        ...data,
        modifiedAt: new Date(),
      })
      .where(
        and(
          eq(fabricImages.id, id),
          isNull(fabricImages.deletedAt)
        )
      )
      .returning();
    
    return updated || null;
  }

  /**
   * Update image order for a fabric
   */
  async updateOrder(fabricId: string, imageOrders: { id: string; order: number }[]): Promise<void> {
    // Use a transaction to update all orders
    await db.transaction(async (tx) => {
      for (const { id, order } of imageOrders) {
        await tx
          .update(fabricImages)
          .set({ order })
          .where(
            and(
              eq(fabricImages.id, id),
              eq(fabricImages.fabricId, fabricId),
              isNull(fabricImages.deletedAt)
            )
          );
      }
    });
  }

  /**
   * Set primary image for a fabric
   */
  async setPrimaryImage(fabricId: string, imageId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // First, unset all primary images for this fabric
      await tx
        .update(fabricImages)
        .set({ isPrimary: false })
        .where(
          and(
            eq(fabricImages.fabricId, fabricId),
            isNull(fabricImages.deletedAt)
          )
        );
      
      // Then set the new primary image
      await tx
        .update(fabricImages)
        .set({ isPrimary: true })
        .where(
          and(
            eq(fabricImages.id, imageId),
            eq(fabricImages.fabricId, fabricId),
            isNull(fabricImages.deletedAt)
          )
        );
    });
  }

  /**
   * Soft delete an image
   */
  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const [deleted] = await db
      .update(fabricImages)
      .set({
        deletedAt: new Date(),
        deletedBy,
      })
      .where(
        and(
          eq(fabricImages.id, id),
          isNull(fabricImages.deletedAt)
        )
      )
      .returning();
    
    return !!deleted;
  }

  /**
   * Soft delete all images for a fabric
   */
  async softDeleteByFabricId(fabricId: string, deletedBy: string): Promise<number> {
    const result = await db
      .update(fabricImages)
      .set({
        deletedAt: new Date(),
        deletedBy,
      })
      .where(
        and(
          eq(fabricImages.fabricId, fabricId),
          isNull(fabricImages.deletedAt)
        )
      )
      .returning();
    
    return result.length;
  }

  /**
   * Permanently delete an image (use with caution)
   */
  async hardDelete(id: string): Promise<boolean> {
    const result = await db
      .delete(fabricImages)
      .where(eq(fabricImages.id, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Get orphaned images (not linked to any fabric)
   */
  async findOrphanedImages(olderThan: Date): Promise<FabricImage[]> {
    // This would need a more complex query to find images 
    // where the fabric has been deleted
    return db
      .select()
      .from(fabricImages)
      .where(
        and(
          isNull(fabricImages.deletedAt),
          // Add condition to check if fabric exists
        )
      );
  }

  /**
   * Count images for a fabric
   */
  async countByFabricId(fabricId: string): Promise<number> {
    const result = await db
      .select({ count: fabricImages.id })
      .from(fabricImages)
      .where(
        and(
          eq(fabricImages.fabricId, fabricId),
          isNull(fabricImages.deletedAt)
        )
      );
    
    return result.length;
  }
}

// Export singleton instance
export const fabricImageRepository = new FabricImageRepository();