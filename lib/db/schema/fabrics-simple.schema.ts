/**
 * SIMPLIFIED FABRICS SCHEMA FOR INITIAL MIGRATION
 * PostgreSQL schema using Drizzle ORM
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  pgEnum
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ENUMS
export const fabricTypeEnum = pgEnum('fabric_type', [
  'Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 
  'Trim', 'Leather', 'Vinyl', 'Sheer', 'Blackout', 'Lining'
]);

export const fabricStatusEnum = pgEnum('fabric_status', [
  'Active', 'Discontinued', 'Out of Stock', 'Coming Soon', 'Sale', 'Clearance'
]);

// MAIN FABRICS TABLE
export const fabrics = pgTable('fabrics', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Basic Information
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  description: text('description'),
  
  // Categorization
  type: fabricTypeEnum('type').notNull(),
  brand: varchar('brand', { length: 100 }),
  collection: varchar('collection', { length: 100 }),
  category: varchar('category', { length: 100 }),
  style: varchar('style', { length: 100 }),
  
  // Specifications
  material: varchar('material', { length: 255 }),
  width: numeric('width', { precision: 10, scale: 2 }),
  weight: numeric('weight', { precision: 10, scale: 2 }),
  pattern: varchar('pattern', { length: 100 }),
  
  // Colors (JSONB for flexibility)
  colors: jsonb('colors').default([]).notNull(),
  colorFamily: varchar('color_family', { length: 50 }),
  
  // Pricing
  retailPrice: numeric('retail_price', { precision: 10, scale: 2 }).notNull(),
  wholesalePrice: numeric('wholesale_price', { precision: 10, scale: 2 }),
  salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
  cost: numeric('cost', { precision: 10, scale: 2 }),
  
  // Inventory
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  stockUnit: varchar('stock_unit', { length: 20 }).default('yards').notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(10),
  
  // Images (JSONB array for R2 storage URLs)
  images: jsonb('images').default([]).notNull(),
  swatchImage: varchar('swatch_image', { length: 500 }),
  
  // Status & Metadata
  status: fabricStatusEnum('status').default('Active').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  
  // SEO
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  
  // Additional Data (JSONB for flexibility)
  specifications: jsonb('specifications').default({}).notNull(),
  customFields: jsonb('custom_fields').default({}).notNull(),
  
  // Audit Fields
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  
  // Soft Delete
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by'),
  
  // Version for optimistic locking
  version: integer('version').default(1).notNull()
}, (table) => ({
  // Indexes for performance
  skuIdx: index('fabrics_sku_idx').on(table.sku),
  slugIdx: index('fabrics_slug_idx').on(table.slug),
  nameIdx: index('fabrics_name_idx').on(table.name),
  typeIdx: index('fabrics_type_idx').on(table.type),
  statusIdx: index('fabrics_status_idx').on(table.status),
  brandIdx: index('fabrics_brand_idx').on(table.brand),
  collectionIdx: index('fabrics_collection_idx').on(table.collection),
  createdAtIdx: index('fabrics_created_at_idx').on(table.createdAt),
  deletedAtIdx: index('fabrics_deleted_at_idx').on(table.deletedAt),
}));

// TYPE EXPORTS
export type Fabric = typeof fabrics.$inferSelect;
export type NewFabric = typeof fabrics.$inferInsert;

// ZOD SCHEMAS - Custom validation schema for fabric creation
export const insertFabricSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100),
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 'Trim', 'Leather', 'Vinyl', 'Sheer', 'Blackout', 'Lining']),
  brand: z.string().optional(),
  collection: z.string().optional(),
  category: z.string().optional(),
  style: z.string().optional(),
  material: z.string().optional(),
  width: z.number().positive().nullable().optional(),
  weight: z.number().positive().nullable().optional(),
  pattern: z.string().optional(),
  colors: z.array(z.string()).default([]),
  colorFamily: z.string().optional(),
  retailPrice: z.number().positive("Retail price must be greater than 0"),
  wholesalePrice: z.number().positive().nullable().optional(),
  salePrice: z.number().positive().nullable().optional(),
  cost: z.number().positive().nullable().optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  stockUnit: z.string().default('yards'),
  lowStockThreshold: z.number().int().min(0).default(10),
  images: z.array(z.string()).default([]),
  swatchImage: z.string().nullable().optional(),
  status: z.enum(['Active', 'Discontinued', 'Out of Stock', 'Coming Soon', 'Sale', 'Clearance']).default('Active'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  specifications: z.object({}).default({}),
  customFields: z.object({}).default({}),
});

export const selectFabricSchema = createSelectSchema(fabrics);

// FILTER & SORT TYPES
export interface FabricFilter {
  search?: string;
  type?: string[];
  status?: string[];
  brand?: string[];
  collection?: string[];
  category?: string[];
  style?: string[];
  colorFamily?: string[];
  material?: string[];
  pattern?: string[];
  inStock?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  priceMin?: number;
  priceMax?: number;
  widthMin?: number;
  widthMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface FabricSort {
  field: 'name' | 'sku' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}