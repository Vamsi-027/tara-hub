/**
 * Fabric Module Type Definitions
 */

import { z } from 'zod';
import { fabricSchema } from '../schemas/fabric.schema';

// Base Fabric type from schema
export type Fabric = z.infer<typeof fabricSchema>;

// DTOs for API operations
export interface CreateFabricDto {
  name: string;
  category: string;
  material: string;
  weaveType?: string;
  weight?: number;
  width?: number;
  stretchPercentage?: number;
  shrinkagePercentage?: number;
  opacity?: string;
  durabilityRating?: number;
  breathability?: number;
  waterResistance?: number;
  colorFastness?: number;
  uvResistance?: number;
  antiMicrobial?: boolean;
  flameRetardant?: boolean;
  ecoFriendly?: boolean;
  recycledContent?: number;
  biodegradable?: boolean;
  certifications?: string[];
  price?: number;
  currency?: string;
  stockQuantity?: number;
  supplier?: string;
  supplierSku?: string;
  tags?: string[];
  imageUrl?: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface UpdateFabricDto extends Partial<CreateFabricDto> {
  id: string;
}

// Filter types for search and listing
export interface FabricFilter {
  search?: string;
  category?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  ecoFriendly?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'stockQuantity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Import/Export types
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  fields?: (keyof Fabric)[];
  filters?: FabricFilter;
}

// Form data for UI
export interface FabricFormData extends CreateFabricDto {
  imageFile?: File;
  galleryImages?: File[];
}