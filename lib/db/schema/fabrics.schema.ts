/**
 * FABRICS DATABASE SCHEMA
 * Complete production-ready schema with all features
 * Use this as a template for other entities
 */

import { 
  pgTable, 
  text, 
  integer, 
  decimal, 
  timestamp, 
  jsonb, 
  boolean,
  uuid,
  index,
  uniqueIndex,
  pgEnum,
  varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================
// ENUMS - Type-safe database enums
// ============================================

export const fabricTypeEnum = pgEnum('fabric_type', [
  'Upholstery',
  'Drapery', 
  'Multi-Purpose',
  'Outdoor',
  'Sheer',
  'Blackout'
]);

export const fabricStatusEnum = pgEnum('fabric_status', [
  'Active',
  'Discontinued', 
  'Out of Stock',
  'Coming Soon',
  'Sale',
  'Clearance'
]);

export const durabilityRatingEnum = pgEnum('durability_rating', [
  'Light Duty',
  'Medium Duty',
  'Heavy Duty',
  'Extra Heavy Duty'
]);

// ============================================
// MAIN TABLE - Comprehensive fabric data
// ============================================

export const fabrics = pgTable('fabrics', {
  // ======= Primary Identification =======
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  version: integer('version').notNull().default(1), // For optimistic locking
  
  // ======= Basic Information =======
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: fabricTypeEnum('type').notNull(),
  status: fabricStatusEnum('status').notNull().default('active'),
  
  // ======= Visual Properties =======
  pattern: varchar('pattern', { length: 100 }),
  primaryColor: varchar('primary_color', { length: 50 }),
  colorHex: varchar('color_hex', { length: 7 }),
  colorFamily: varchar('color_family', { length: 50 }),
  secondaryColors: jsonb('secondary_colors').$type<string[]>(),
  
  // ======= Manufacturer Information =======
  manufacturerId: uuid('manufacturer_id'),
  manufacturerName: varchar('manufacturer_name', { length: 255 }).notNull(),
  collection: varchar('collection', { length: 255 }),
  designerName: varchar('designer_name', { length: 255 }),
  countryOfOrigin: varchar('country_of_origin', { length: 100 }),
  
  // ======= Pricing & Cost =======
  retailPrice: decimal('retail_price', { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: decimal('wholesale_price', { precision: 10, scale: 2 }),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  priceUnit: varchar('price_unit', { length: 20 }).notNull().default('per_yard'),
  
  // ======= Physical Properties =======
  width: decimal('width', { precision: 6, scale: 2 }).notNull(),
  widthUnit: varchar('width_unit', { length: 10 }).notNull().default('inches'),
  weight: decimal('weight', { precision: 6, scale: 2 }),
  weightUnit: varchar('weight_unit', { length: 10 }).default('oz/yd'),
  thickness: decimal('thickness', { precision: 4, scale: 2 }),
  
  // ======= Composition =======
  fiberContent: jsonb('fiber_content').$type<{
    fiber: string;
    percentage: number;
  }[]>(),
  backingType: varchar('backing_type', { length: 100 }),
  finishTreatment: text('finish_treatment'),
  
  // ======= Performance Ratings =======
  durabilityRating: durabilityRatingEnum('durability_rating'),
  martindale: integer('martindale'), // Abrasion resistance
  wyzenbeek: integer('wyzenbeek'), // Alternative abrasion test
  lightfastness: integer('lightfastness'), // 1-8 scale
  pillingResistance: integer('pilling_resistance'), // 1-5 scale
  
  // ======= Treatment Features =======
  isStainResistant: boolean('is_stain_resistant').default(false),
  isFadeResistant: boolean('is_fade_resistant').default(false),
  isWaterResistant: boolean('is_water_resistant').default(false),
  isPetFriendly: boolean('is_pet_friendly').default(false),
  isOutdoorSafe: boolean('is_outdoor_safe').default(false),
  isFireRetardant: boolean('is_fire_retardant').default(false),
  isBleachCleanable: boolean('is_bleach_cleanable').default(false),
  isAntimicrobial: boolean('is_antimicrobial').default(false),
  
  // ======= Inventory Management =======
  stockQuantity: decimal('stock_quantity', { precision: 10, scale: 2 }).notNull().default('0'),
  reservedQuantity: decimal('reserved_quantity', { precision: 10, scale: 2 }).notNull().default('0'),
  availableQuantity: decimal('available_quantity', { precision: 10, scale: 2 }).notNull().default('0'),
  minimumOrder: decimal('minimum_order', { precision: 6, scale: 2 }).notNull().default('1'),
  incrementQuantity: decimal('increment_quantity', { precision: 6, scale: 2 }).default('1'),
  
  // ======= Reorder Management =======
  reorderPoint: decimal('reorder_point', { precision: 10, scale: 2 }),
  reorderQuantity: decimal('reorder_quantity', { precision: 10, scale: 2 }),
  leadTimeDays: integer('lead_time_days'),
  isCustomOrder: boolean('is_custom_order').default(false),
  
  // ======= Location & Storage =======
  warehouseLocation: varchar('warehouse_location', { length: 50 }),
  binLocation: varchar('bin_location', { length: 50 }),
  rollCount: integer('roll_count').default(0),
  
  // ======= Care Instructions =======
  careInstructions: jsonb('care_instructions').$type<string[]>(),
  cleaningCode: varchar('cleaning_code', { length: 10 }),
  
  // ======= Media & Assets =======
  thumbnailUrl: text('thumbnail_url'),
  mainImageUrl: text('main_image_url'),
  images: jsonb('images').$type<{
    url: string;
    alt: string;
    type: 'main' | 'detail' | 'room' | 'swatch';
    order: number;
  }[]>(),
  swatchImageUrl: text('swatch_image_url'),
  textureImageUrl: text('texture_image_url'),
  
  // ======= Certifications & Compliance =======
  certifications: jsonb('certifications').$type<{
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
  }[]>(),
  flammabilityStandard: varchar('flammability_standard', { length: 100 }),
  environmentalRating: varchar('environmental_rating', { length: 50 }),
  
  // ======= SEO & Marketing =======
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  slug: varchar('slug', { length: 255 }).unique(),
  tags: jsonb('tags').$type<string[]>(),
  searchKeywords: text('search_keywords'),
  
  // ======= Display & Features =======
  isFeatured: boolean('is_featured').default(false),
  isNewArrival: boolean('is_new_arrival').default(false),
  isBestSeller: boolean('is_best_seller').default(false),
  displayOrder: integer('display_order').default(0),
  
  // ======= Analytics & Tracking =======
  viewCount: integer('view_count').default(0),
  favoriteCount: integer('favorite_count').default(0),
  sampleRequestCount: integer('sample_request_count').default(0),
  lastViewedAt: timestamp('last_viewed_at'),
  
  // ======= Notes & Internal =======
  internalNotes: text('internal_notes'),
  publicNotes: text('public_notes'),
  warrantyInfo: text('warranty_info'),
  returnPolicy: text('return_policy'),
  
  // ======= Audit Fields =======
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at'), // Soft delete
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  // ======= Indexes for Performance =======
  // Unique constraint indexes
  skuIdx: uniqueIndex('idx_fabrics_sku').on(table.sku),
  slugIdx: uniqueIndex('idx_fabrics_slug').on(table.slug),
  
  // Single column indexes for common queries
  nameIdx: index('idx_fabrics_name').on(table.name),
  statusIdx: index('idx_fabrics_status').on(table.status),
  typeIdx: index('idx_fabrics_type').on(table.type),
  manufacturerIdx: index('idx_fabrics_manufacturer').on(table.manufacturerName),
  collectionIdx: index('idx_fabrics_collection').on(table.collection),
  priceIdx: index('idx_fabrics_price').on(table.retailPrice),
  stockIdx: index('idx_fabrics_stock').on(table.availableQuantity),
  deletedAtIdx: index('idx_fabrics_deleted_at').on(table.deletedAt),
  
  // Composite indexes for complex queries
  typeStatusIdx: index('idx_fabrics_type_status').on(table.type, table.status),
  manufacturerCollectionIdx: index('idx_fabrics_manufacturer_collection')
    .on(table.manufacturerName, table.collection),
  statusStockIdx: index('idx_fabrics_status_stock')
    .on(table.status, table.availableQuantity),
  featuredOrderIdx: index('idx_fabrics_featured_order')
    .on(table.isFeatured, table.displayOrder),
  
  // Full-text search index (PostgreSQL GIN index)
  searchIdx: index('idx_fabrics_search').using('gin', 
    sql`to_tsvector('english', 
      ${table.name} || ' ' || 
      COALESCE(${table.description}, '') || ' ' || 
      COALESCE(${table.pattern}, '') || ' ' || 
      COALESCE(${table.primaryColor}, '') || ' ' ||
      COALESCE(${table.manufacturerName}, '') || ' ' ||
      COALESCE(${table.collection}, '') || ' ' ||
      COALESCE(${table.searchKeywords}, '')
    )`
  ),
}));

// ============================================
// RELATED TABLES
// ============================================

// Price history tracking
export const fabricPriceHistory = pgTable('fabric_price_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  fabricId: uuid('fabric_id').notNull().references(() => fabrics.id, { onDelete: 'cascade' }),
  retailPrice: decimal('retail_price', { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: decimal('wholesale_price', { precision: 10, scale: 2 }),
  effectiveDate: timestamp('effective_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  reason: text('reason'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by'),
}, (table) => ({
  fabricIdx: index('idx_price_history_fabric').on(table.fabricId),
  dateIdx: index('idx_price_history_date').on(table.effectiveDate),
}));

// Stock movements tracking
export const fabricStockMovements = pgTable('fabric_stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  fabricId: uuid('fabric_id').notNull().references(() => fabrics.id, { onDelete: 'cascade' }),
  movementType: text('movement_type').notNull(), // 'in', 'out', 'adjustment', 'reserved', 'released'
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal('balance_before', { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
  referenceType: text('reference_type'), // 'order', 'return', 'adjustment', etc.
  referenceId: text('reference_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by'),
}, (table) => ({
  fabricIdx: index('idx_stock_movements_fabric').on(table.fabricId),
  dateIdx: index('idx_stock_movements_date').on(table.createdAt),
  typeIdx: index('idx_stock_movements_type').on(table.movementType),
}));

// ============================================
// RELATIONS
// ============================================

export const fabricsRelations = relations(fabrics, ({ many }) => ({
  priceHistory: many(fabricPriceHistory),
  stockMovements: many(fabricStockMovements),
}));

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

// Auto-generate base schemas from Drizzle
export const insertFabricSchema = createInsertSchema(fabrics, {
  // Custom validations
  sku: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  name: z.string().min(1).max(255),
  retailPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid decimal'),
  width: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Width must be a valid decimal'),
  stockQuantity: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Quantity must be a valid decimal'),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  martindale: z.number().min(0).max(100000).optional(),
  wyzenbeek: z.number().min(0).max(100000).optional(),
  lightfastness: z.number().min(1).max(8).optional(),
  pillingResistance: z.number().min(1).max(5).optional(),
});

export const selectFabricSchema = createSelectSchema(fabrics);
export const updateFabricSchema = insertFabricSchema.partial().omit({ id: true });

// Custom schemas for specific operations
export const fabricFilterSchema = z.object({
  search: z.string().optional(),
  type: z.array(z.enum(['Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 'Sheer', 'Blackout'])).optional(),
  status: z.array(z.enum(['Active', 'Discontinued', 'Out of Stock', 'Coming Soon', 'Sale', 'Clearance'])).optional(),
  manufacturer: z.array(z.string()).optional(),
  collection: z.array(z.string()).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  inStock: z.boolean().optional(),
  minStock: z.number().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  hasImages: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

export const fabricSortSchema = z.object({
  field: z.enum([
    'name', 'sku', 'price', 'stock', 'createdAt', 'updatedAt', 
    'viewCount', 'favoriteCount', 'displayOrder'
  ]).default('createdAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Export types
export type Fabric = typeof fabrics.$inferSelect;
export type NewFabric = typeof fabrics.$inferInsert;
export type FabricFilter = z.infer<typeof fabricFilterSchema>;
export type FabricSort = z.infer<typeof fabricSortSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
