/**
 * FABRIC HOOKS
 * React hooks for fabric CRUD operations
 * Provides data fetching, caching, and mutations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import type { Fabric, FabricFilter, FabricSort } from '@/lib/db/schema/fabrics-simple.schema';

// ============================================
// Types
// ============================================

interface UseFabricsOptions {
  filter?: FabricFilter;
  sort?: FabricSort;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

interface UseFabricsReturn {
  fabrics: Fabric[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setFilter: (filter: FabricFilter) => void;
  setSort: (sort: FabricSort) => void;
}

interface UseFabricReturn {
  fabric: Fabric | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  update: (data: Partial<Fabric>) => Promise<void>;
  delete: () => Promise<void>;
  updateStock: (quantity: number, type: 'add' | 'remove' | 'set') => Promise<void>;
  updatePricing: (retailPrice: number, wholesalePrice?: number) => Promise<void>;
}

// ============================================
// API Client
// ============================================

class FabricAPI {
  private baseUrl = '/api/v1/fabrics';
  
  /**
   * Fetch fabrics with filters
   */
  async fetchFabrics(options: UseFabricsOptions = {}) {
    const params = new URLSearchParams();
    
    // Add filter parameters
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    // Add sort parameters
    if (options.sort) {
      params.append('sortBy', options.sort.field);
      params.append('sortDirection', options.sort.direction);
    }
    
    // Add pagination
    params.append('page', String(options.page || 1));
    params.append('limit', String(options.limit || 20));
    
    const response = await fetch(`${this.baseUrl}?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch fabrics');
    }
    
    return response.json();
  }
  
  /**
   * Fetch single fabric
   */
  async fetchFabric(id: string, include?: string[]) {
    const params = new URLSearchParams();
    if (include && include.length > 0) {
      params.append('include', include.join(','));
    }
    
    const url = `${this.baseUrl}/${id}${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch fabric');
    }
    
    return response.json();
  }
  
  /**
   * Create fabric
   */
  async createFabric(data: Partial<Fabric>) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create fabric');
    }
    
    return response.json();
  }
  
  /**
   * Update fabric
   */
  async updateFabric(id: string, data: Partial<Fabric>) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update fabric');
    }
    
    return response.json();
  }
  
  /**
   * Delete fabric
   */
  async deleteFabric(id: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete fabric');
    }
    
    return response.json();
  }
  
  /**
   * Update stock
   */
  async updateStock(id: string, quantity: number, type: 'add' | 'remove' | 'set', notes?: string) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'updateStock',
        quantity,
        type,
        notes,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update stock');
    }
    
    return response.json();
  }
  
  /**
   * Update pricing
   */
  async updatePricing(
    id: string,
    retailPrice: number,
    wholesalePrice?: number,
    reason?: string
  ) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'updatePricing',
        retailPrice,
        wholesalePrice,
        reason,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update pricing');
    }
    
    return response.json();
  }
  
  /**
   * Bulk operations
   */
  async bulkOperation(operation: string, data: any) {
    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        ...data,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Bulk operation failed');
    }
    
    return response.json();
  }
  
  /**
   * Export fabrics
   */
  async exportFabrics(filter?: FabricFilter) {
    const params = new URLSearchParams();
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    const response = await fetch(`${this.baseUrl}/export?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to export fabrics');
    }
    
    // Return as blob for download
    return response.blob();
  }
}

const api = new FabricAPI();

// ============================================
// HOOKS
// ============================================

/**
 * Hook to fetch and manage fabrics list
 */
export function useFabrics(options: UseFabricsOptions = {}): UseFabricsReturn {
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: options.page || 1,
    limit: options.limit || 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });
  
  const [filter, setFilter] = useState<FabricFilter>(options.filter || {});
  const [sort, setSort] = useState<FabricSort>(
    options.sort || { field: 'createdAt', direction: 'desc' }
  );
  
  const fetchData = useCallback(async () => {
    if (options.enabled === false) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.fetchFabrics({
        filter,
        sort,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setFabrics(response.data);
      setPagination(response.meta.pagination);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, sort, pagination.page, pagination.limit, options.enabled]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);
  
  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);
  
  return {
    fabrics,
    loading,
    error,
    pagination,
    refetch: fetchData,
    setPage,
    setLimit,
    setFilter,
    setSort,
  };
}

/**
 * Hook to fetch and manage single fabric
 */
export function useFabric(id: string, include?: string[]): UseFabricReturn {
  const router = useRouter();
  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.fetchFabric(id, include);
      setFabric(response.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, include]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const update = useCallback(async (data: Partial<Fabric>) => {
    if (!id) return;
    
    try {
      const response = await api.updateFabric(id, data);
      setFabric(response.data);
      toast.success('Fabric updated successfully');
      return response.data; // Return the updated fabric data
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  }, [id]);
  
  const deleteFabric = useCallback(async () => {
    if (!id) return;
    
    try {
      await api.deleteFabric(id);
      toast.success('Fabric deleted successfully');
      router.push('/admin/fabrics');
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  }, [id, router]);
  
  const updateStock = useCallback(async (
    quantity: number,
    type: 'add' | 'remove' | 'set'
  ) => {
    if (!id) return;
    
    try {
      const response = await api.updateStock(id, quantity, type);
      setFabric(response.data);
      toast.success('Stock updated successfully');
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  }, [id]);
  
  const updatePricing = useCallback(async (
    retailPrice: number,
    wholesalePrice?: number
  ) => {
    if (!id) return;
    
    try {
      const response = await api.updatePricing(id, retailPrice, wholesalePrice);
      setFabric(response.data);
      toast.success('Pricing updated successfully');
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  }, [id]);
  
  return {
    fabric,
    loading,
    error,
    refetch: fetchData,
    update,
    delete: deleteFabric,
    updateStock,
    updatePricing,
  };
}

/**
 * Hook to create fabric
 */
export function useCreateFabric() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const create = useCallback(async (data: Partial<Fabric>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.createFabric(data);
      toast.success('Fabric created successfully');
      
      // Navigate back to fabrics list
      router.push('/admin/fabrics');
      
      return response.data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  return {
    create,
    loading,
    error,
  };
}

/**
 * Hook to delete fabric
 */
export function useDeleteFabric() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFabric = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await api.deleteFabric(id);
      toast.success('Fabric deleted successfully');
      
      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteFabric,
    loading,
    error,
  };
}

/**
 * Hook for bulk operations
 */
export function useBulkFabricOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bulkCreate = useCallback(async (items: Partial<Fabric>[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.bulkOperation('create', { items });
      
      if (response.data.results.failed.length > 0) {
        toast.warning(`Created ${response.data.success} items, ${response.data.failed} failed`);
      } else {
        toast.success(`Successfully created ${response.data.success} items`);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const bulkUpdate = useCallback(async (items: Array<{ id: string; data: Partial<Fabric> }>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.bulkOperation('update', { items });
      
      if (response.data.results.failed.length > 0) {
        toast.warning(`Updated ${response.data.success} items, ${response.data.failed} failed`);
      } else {
        toast.success(`Successfully updated ${response.data.success} items`);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const bulkDelete = useCallback(async (ids: string[]) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.bulkOperation('delete', { ids });
      
      if (response.data.results.failed.length > 0) {
        toast.warning(`Deleted ${response.data.success} items, ${response.data.failed} failed`);
      } else {
        toast.success(`Successfully deleted ${response.data.success} items`);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    bulkCreate,
    bulkUpdate,
    bulkDelete,
    loading,
    error,
  };
}

/**
 * Hook to fetch fabric statistics
 */
export function useFabricStatistics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/fabrics?special=statistics');
      const data = await response.json();
      
      setStats(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook to fetch filter options
 */
export function useFabricFilterOptions() {
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/fabrics?special=filter-options');
        const data = await response.json();
        setOptions(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, []);
  
  return {
    options,
    loading,
    error,
  };
}

/**
 * Hook for fabric import functionality
 */
export function useFabricImport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const importFabrics = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/fabrics/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Import failed');
      }

      setResult(data.data);
      
      if (data.data.successCount > 0) {
        toast.success(`Successfully imported ${data.data.successCount} fabrics`);
      }
      
      if (data.data.failureCount > 0) {
        toast.warning(`${data.data.failureCount} fabrics failed to import. Check the results for details.`);
      }

      return data.data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadTemplate = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/fabrics/import', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'fabric_import_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Template downloaded successfully');
    } catch (err: any) {
      toast.error('Failed to download template');
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return {
    importFabrics,
    downloadTemplate,
    loading,
    error,
    result,
    reset,
  };
}
