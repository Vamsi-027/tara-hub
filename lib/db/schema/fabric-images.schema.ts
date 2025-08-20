/**
 * FABRIC IMAGES SCHEMA
 * Proper relational table for fabric images with full metadata
 * Links images in R2 storage to fabric records in database
 */

import { 
  pgTable, 
  text, 
  integer, 
  timestamp, 
  uuid,
  varchar,
  boolean,
  index,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { fabrics } from './fabrics.schema';

// Image type enum
export const imageTypeEnum = pgEnum('image_type', [
  'main',
  'detail', 
  'swatch',
  'room',
  'texture',
  'pattern'
]);

// ============================================
// FABRIC IMAGES TABLE
// ============================================

export const fabricImages = pgTable('fabric_images', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Foreign key to fabrics table
  fabricId: uuid('fabric_id').notNull().references(() => fabrics.id, { 
    onDelete: 'cascade' 
  }),
  
  // Storage information
  url: text('url').notNull(), // Public URL or API endpoint
  r2Key: varchar('r2_key', { length: 500 }).notNull(), // R2 storage key
  
  // File metadata
  filename: varchar('filename', { length: 255 }).notNull(),
  originalFilename: varchar('original_filename', { length: 255 }),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  size: integer('size').notNull(), // File size in bytes
  width: integer('width'), // Image width in pixels
  height: integer('height'), // Image height in pixels
  
  // Image properties
  type: imageTypeEnum('type').default('detail'),
  order: integer('order').notNull().default(0), // Display order
  isPrimary: boolean('is_primary').notNull().default(false),
  alt: text('alt'), // Alt text for accessibility
  caption: text('caption'), // Optional caption
  
  // Processing status
  isProcessed: boolean('is_processed').notNull().default(false),
  thumbnailUrl: text('thumbnail_url'), // Generated thumbnail URL
  thumbnailR2Key: varchar('thumbnail_r2_key', { length: 500 }),
  
  // Audit fields
  uploadedBy: uuid('uploaded_by').notNull(), // User who uploaded
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  modifiedBy: uuid('modified_by'),
  modifiedAt: timestamp('modified_at'),
  
  // Soft delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  // Indexes for performance
  fabricIdIdx: index('fabric_images_fabric_id_idx').on(table.fabricId),
  r2KeyIdx: index('fabric_images_r2_key_idx').on(table.r2Key),
  typeIdx: index('fabric_images_type_idx').on(table.type),
  orderIdx: index('fabric_images_order_idx').on(table.order),
  deletedAtIdx: index('fabric_images_deleted_at_idx').on(table.deletedAt),
}));

// ============================================
// RELATIONS
// ============================================

export const fabricImagesRelations = relations(fabricImages, ({ one }) => ({
  fabric: one(fabrics, {
    fields: [fabricImages.fabricId],
    references: [fabrics.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type FabricImage = typeof fabricImages.$inferSelect;
export type NewFabricImage = typeof fabricImages.$inferInsert;

// ============================================
// HELPER TYPES
// ============================================

export interface FabricImageUploadResult {
  id: string;
  fabricId: string;
  url: string;
  r2Key: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface FabricImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  colorSpace?: string;
  hasAlpha?: boolean;
}