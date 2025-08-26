/**
 * Fabric Search Query
 * Query object for fabric search operations
 */

export interface FabricSearchQuery {
  readonly searchTerm?: string;
  readonly filters: {
    readonly type?: string;
    readonly status?: string;
    readonly manufacturerName?: string;
    readonly collection?: string;
    readonly colorFamily?: string;
    readonly pattern?: string;
    readonly featured?: boolean;
    readonly minPrice?: number;
    readonly maxPrice?: number;
    readonly inStock?: boolean;
    readonly tags?: string[];
    readonly properties?: string[];
  };
  readonly sort: {
    readonly field: 'name' | 'sku' | 'retailPrice' | 'createdAt' | 'updatedAt' | 'stockQuantity' | 'viewCount';
    readonly direction: 'asc' | 'desc';
  };
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
  };
}

export interface GetFabricQuery {
  readonly id?: string;
  readonly sku?: string;
  readonly slug?: string;
}

export interface FabricAnalyticsQuery {
  readonly timeframe?: 'day' | 'week' | 'month' | 'year';
  readonly metrics?: ('views' | 'favorites' | 'samples' | 'sales')[];
}

export class FabricSearchQueryBuilder {
  private query: Partial<FabricSearchQuery> = {
    filters: {},
    sort: { field: 'createdAt', direction: 'desc' },
    pagination: { page: 1, limit: 20 }
  };

  searchTerm(term?: string): FabricSearchQueryBuilder {
    this.query.searchTerm = term;
    return this;
  }

  filterByType(type?: string): FabricSearchQueryBuilder {
    this.query.filters!.type = type;
    return this;
  }

  filterByStatus(status?: string): FabricSearchQueryBuilder {
    this.query.filters!.status = status;
    return this;
  }

  filterByManufacturer(manufacturerName?: string): FabricSearchQueryBuilder {
    this.query.filters!.manufacturerName = manufacturerName;
    return this;
  }

  filterByCollection(collection?: string): FabricSearchQueryBuilder {
    this.query.filters!.collection = collection;
    return this;
  }

  filterByColorFamily(colorFamily?: string): FabricSearchQueryBuilder {
    this.query.filters!.colorFamily = colorFamily;
    return this;
  }

  filterByPattern(pattern?: string): FabricSearchQueryBuilder {
    this.query.filters!.pattern = pattern;
    return this;
  }

  filterByFeatured(featured?: boolean): FabricSearchQueryBuilder {
    this.query.filters!.featured = featured;
    return this;
  }

  filterByPriceRange(minPrice?: number, maxPrice?: number): FabricSearchQueryBuilder {
    this.query.filters!.minPrice = minPrice;
    this.query.filters!.maxPrice = maxPrice;
    return this;
  }

  filterByStock(inStock?: boolean): FabricSearchQueryBuilder {
    this.query.filters!.inStock = inStock;
    return this;
  }

  filterByTags(tags?: string[]): FabricSearchQueryBuilder {
    this.query.filters!.tags = tags;
    return this;
  }

  filterByProperties(properties?: string[]): FabricSearchQueryBuilder {
    this.query.filters!.properties = properties;
    return this;
  }

  sortBy(field: FabricSearchQuery['sort']['field'], direction: 'asc' | 'desc' = 'desc'): FabricSearchQueryBuilder {
    this.query.sort = { field, direction };
    return this;
  }

  paginate(page: number, limit: number = 20): FabricSearchQueryBuilder {
    this.query.pagination = { page, limit };
    return this;
  }

  build(): FabricSearchQuery {
    return this.query as FabricSearchQuery;
  }
}