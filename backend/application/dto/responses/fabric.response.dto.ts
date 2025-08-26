/**
 * Fabric Response DTOs
 * Data Transfer Objects for API responses
 * Clean separation between domain entities and API contracts
 */

export interface CreateFabricResponse {
  id: string;
  sku: string;
  name: string;
  slug: string;
  status: string;
  retailPrice: {
    amount: number;
    currency: string;
    formatted: string;
  };
  stockQuantity: {
    amount: number;
    unit: string;
    formatted: string;
  };
  createdAt: Date;
}

export interface FabricDetailResponse {
  id: string;
  sku: string;
  name: string;
  description?: string;
  slug: string;
  type: string;
  status: string;
  retailPrice: {
    amount: number;
    currency: string;
    formatted: string;
  };
  wholesalePrice?: {
    amount: number;
    currency: string;
    formatted: string;
  };
  stockQuantity: {
    amount: number;
    unit: string;
    formatted: string;
  };
  availableQuantity: {
    amount: number;
    unit: string;
    formatted: string;
  };
  reservedQuantity: {
    amount: number;
    unit: string;
    formatted: string;
  };
  reorderPoint?: {
    amount: number;
    unit: string;
    formatted: string;
  };
  manufacturerName?: string;
  collection?: string;
  colorFamily?: string;
  pattern?: string;
  width?: string;
  weight?: string;
  composition?: string;
  careInstructions?: string;
  properties?: string[];
  tags?: string[];
  imageUrl?: string;
  swatchImageUrl?: string;
  featured: boolean;
  metrics: {
    viewCount: number;
    favoriteCount: number;
    sampleRequestCount: number;
    averageRating?: number;
    ratingCount: number;
  };
  businessStatus: {
    needsReorder: boolean;
    isOutOfStock: boolean;
    isLowStock: boolean;
  };
  auditFields: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
  };
}

export interface FabricListResponse {
  id: string;
  sku: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  retailPrice: {
    amount: number;
    currency: string;
    formatted: string;
  };
  stockQuantity: {
    amount: number;
    unit: string;
    formatted: string;
  };
  availableQuantity: {
    amount: number;
    unit: string;
    formatted: string;
  };
  manufacturerName?: string;
  collection?: string;
  colorFamily?: string;
  imageUrl?: string;
  swatchImageUrl?: string;
  featured: boolean;
  businessStatus: {
    needsReorder: boolean;
    isOutOfStock: boolean;
    isLowStock: boolean;
  };
  metrics: {
    viewCount: number;
    favoriteCount: number;
  };
  updatedAt: Date;
}

export interface FabricSearchResponse {
  data: FabricListResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface FabricStatisticsResponse {
  totalFabrics: number;
  activeFabrics: number;
  inactiveFabrics: number;
  discontinuedFabrics: number;
  outOfStockFabrics: number;
  lowStockFabrics: number;
  featuredFabrics: number;
  totalStockValue: {
    amount: number;
    currency: string;
    formatted: string;
  };
  averageRating: number;
  totalViewCount: number;
}

export interface FabricFilterOptionsResponse {
  types: string[];
  statuses: string[];
  manufacturers: string[];
  collections: string[];
  colorFamilies: string[];
  patterns: string[];
}

export interface BulkOperationResponse {
  successful: number;
  failed: Array<{
    id?: string;
    sku?: string;
    error: string;
    details?: any;
  }>;
  totalProcessed: number;
}