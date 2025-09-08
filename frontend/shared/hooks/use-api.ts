/**
 * Custom hook for API calls
 * Works with both Next.js API routes and future NestJS backend
 */

import { useState, useCallback } from 'react';
import { apiClient, APIResponse } from '@/lib/api/client';

interface UseAPIOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useAPI<T = any>(options: UseAPIOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const get = useCallback(async (endpoint: string) => {
    setLoading(true);
    setError(null);
    
    const response = await apiClient.get<T>(endpoint);
    
    if (response.success) {
      setData(response.data || null);
      options.onSuccess?.(response.data);
    } else {
      setError(response.error || 'Request failed');
      options.onError?.(response.error || 'Request failed');
    }
    
    setLoading(false);
    return response;
  }, [options]);

  const post = useCallback(async (endpoint: string, body?: any) => {
    setLoading(true);
    setError(null);
    
    const response = await apiClient.post<T>(endpoint, body);
    
    if (response.success) {
      setData(response.data || null);
      options.onSuccess?.(response.data);
    } else {
      setError(response.error || 'Request failed');
      options.onError?.(response.error || 'Request failed');
    }
    
    setLoading(false);
    return response;
  }, [options]);

  const put = useCallback(async (endpoint: string, body?: any) => {
    setLoading(true);
    setError(null);
    
    const response = await apiClient.put<T>(endpoint, body);
    
    if (response.success) {
      setData(response.data || null);
      options.onSuccess?.(response.data);
    } else {
      setError(response.error || 'Request failed');
      options.onError?.(response.error || 'Request failed');
    }
    
    setLoading(false);
    return response;
  }, [options]);

  const del = useCallback(async (endpoint: string) => {
    setLoading(true);
    setError(null);
    
    const response = await apiClient.delete<T>(endpoint);
    
    if (response.success) {
      setData(response.data || null);
      options.onSuccess?.(response.data);
    } else {
      setError(response.error || 'Request failed');
      options.onError?.(response.error || 'Request failed');
    }
    
    setLoading(false);
    return response;
  }, [options]);

  const patch = useCallback(async (endpoint: string, body?: any) => {
    setLoading(true);
    setError(null);
    
    const response = await apiClient.patch<T>(endpoint, body);
    
    if (response.success) {
      setData(response.data || null);
      options.onSuccess?.(response.data);
    } else {
      setError(response.error || 'Request failed');
      options.onError?.(response.error || 'Request failed');
    }
    
    setLoading(false);
    return response;
  }, [options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    get,
    post,
    put,
    delete: del,
    patch,
    reset,
  };
}