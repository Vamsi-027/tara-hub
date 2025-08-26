/**
 * Frontend Repository Hook
 * Follows Single Responsibility Principle - handles data fetching only
 */

import { useState, useEffect, useCallback } from 'react';

// Generic repository interface
export interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Result type for error handling
export type Result<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Hook configuration
export interface UseRepositoryConfig {
  autoFetch?: boolean;
  retryCount?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheTime?: number;
}

// Repository hook
export function useRepository<T>(
  repository: IRepository<T>,
  config: UseRepositoryConfig = {}
) {
  const {
    autoFetch = false,
    retryCount = 3,
    retryDelay = 1000,
    cache = true,
    cacheTime = 5 * 60 * 1000 // 5 minutes
  } = config;

  const [state, setState] = useState<Result<T[]>>({ status: 'idle' });
  const [cache, setCache] = useState<Map<string, { data: T; timestamp: number }>>(new Map());

  // Fetch all items
  const fetchAll = useCallback(async () => {
    setState({ status: 'loading' });
    
    let attempts = 0;
    while (attempts < retryCount) {
      try {
        const data = await repository.getAll();
        setState({ status: 'success', data });
        
        // Update cache
        if (cache) {
          const newCache = new Map(cache);
          const timestamp = Date.now();
          data.forEach(item => {
            if ('id' in item && typeof item.id === 'string') {
              newCache.set(item.id, { data: item, timestamp });
            }
          });
          setCache(newCache);
        }
        
        return data;
      } catch (error) {
        attempts++;
        if (attempts >= retryCount) {
          setState({ status: 'error', error: error as Error });
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
      }
    }
  }, [repository, retryCount, retryDelay, cache]);

  // Fetch single item
  const fetchById = useCallback(async (id: string): Promise<T | null> => {
    // Check cache first
    if (cache) {
      const cached = cache.get(id);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data;
      }
    }

    const data = await repository.getById(id);
    
    // Update cache
    if (data && cache) {
      const newCache = new Map(cache);
      newCache.set(id, { data, timestamp: Date.now() });
      setCache(newCache);
    }
    
    return data;
  }, [repository, cache, cacheTime]);

  // Create item
  const create = useCallback(async (data: Omit<T, 'id'>): Promise<T> => {
    const created = await repository.create(data);
    
    // Update local state if we have data
    if (state.status === 'success') {
      setState({
        status: 'success',
        data: [...state.data, created]
      });
    }
    
    // Update cache
    if (cache && 'id' in created && typeof created.id === 'string') {
      const newCache = new Map(cache);
      newCache.set(created.id, { data: created, timestamp: Date.now() });
      setCache(newCache);
    }
    
    return created;
  }, [repository, state, cache]);

  // Update item
  const update = useCallback(async (id: string, data: Partial<T>): Promise<T> => {
    const updated = await repository.update(id, data);
    
    // Update local state if we have data
    if (state.status === 'success') {
      setState({
        status: 'success',
        data: state.data.map(item => 
          'id' in item && item.id === id ? updated : item
        )
      });
    }
    
    // Update cache
    if (cache) {
      const newCache = new Map(cache);
      newCache.set(id, { data: updated, timestamp: Date.now() });
      setCache(newCache);
    }
    
    return updated;
  }, [repository, state, cache]);

  // Delete item
  const remove = useCallback(async (id: string): Promise<void> => {
    await repository.delete(id);
    
    // Update local state if we have data
    if (state.status === 'success') {
      setState({
        status: 'success',
        data: state.data.filter(item => !('id' in item && item.id === id))
      });
    }
    
    // Remove from cache
    if (cache) {
      const newCache = new Map(cache);
      newCache.delete(id);
      setCache(newCache);
    }
  }, [repository, state, cache]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && state.status === 'idle') {
      fetchAll();
    }
  }, [autoFetch, state.status, fetchAll]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    state,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    clearCache,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    data: state.status === 'success' ? state.data : [],
    error: state.status === 'error' ? state.error : null
  };
}