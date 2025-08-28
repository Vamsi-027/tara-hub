/**
 * React Hooks for Medusa Product Data
 * Client-side data fetching with SWR for caching and revalidation
 */

'use client'

import useSWR from 'swr'
import { 
  getProducts, 
  getProduct, 
  getCollections, 
  getCategories,
  transformMedusaToFabric,
  type MedusaProduct,
  type ProductsResponse,
  type CollectionsResponse,
  type CategoriesResponse
} from '../lib/medusa-api'

// SWR Configuration
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 60000, // Refresh every minute
  dedupingInterval: 10000,
}

// Products Hook
export function useProducts(params?: {
  limit?: number
  offset?: number
  q?: string
  collection_id?: string[]
  category_id?: string[]
  tags?: string[]
}) {
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    ['products', params],
    () => getProducts(params),
    swrConfig
  )

  // Transform products to fabric format
  const fabricProducts = data?.products?.map(transformMedusaToFabric) || []

  return {
    products: fabricProducts,
    rawProducts: data?.products || [],
    count: data?.count || 0,
    offset: data?.offset || 0,
    limit: data?.limit || 20,
    isLoading,
    error,
    refresh: mutate
  }
}

// Single Product Hook
export function useProduct(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['product', id] : null,
    () => id ? getProduct(id) : null,
    swrConfig
  )

  const fabricProduct = data?.product ? transformMedusaToFabric(data.product) : null

  return {
    product: fabricProduct,
    rawProduct: data?.product,
    isLoading,
    error,
    refresh: mutate
  }
}

// Collections Hook
export function useCollections(params?: {
  limit?: number
  offset?: number
}) {
  const { data, error, isLoading, mutate } = useSWR<CollectionsResponse>(
    ['collections', params],
    () => getCollections(params),
    swrConfig
  )

  return {
    collections: data?.collections || [],
    count: data?.count || 0,
    offset: data?.offset || 0,
    limit: data?.limit || 20,
    isLoading,
    error,
    refresh: mutate
  }
}

// Categories Hook
export function useCategories(params?: {
  limit?: number
  offset?: number
  parent_category_id?: string
  include_descendants?: boolean
}) {
  const { data, error, isLoading, mutate } = useSWR<CategoriesResponse>(
    ['categories', params],
    () => getCategories(params),
    swrConfig
  )

  return {
    categories: data?.product_categories || [],
    count: data?.count || 0,
    offset: data?.offset || 0,
    limit: data?.limit || 20,
    isLoading,
    error,
    refresh: mutate
  }
}

// Search Hook
export function useProductSearch(query: string, options?: {
  limit?: number
  collection_id?: string[]
  category_id?: string[]
}) {
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    query ? ['search', query, options] : null,
    () => query ? getProducts({ q: query, ...options }) : null,
    {
      ...swrConfig,
      revalidateOnMount: true
    }
  )

  const fabricProducts = data?.products?.map(transformMedusaToFabric) || []

  return {
    results: fabricProducts,
    count: data?.count || 0,
    isSearching: isLoading,
    error,
    refresh: mutate
  }
}

// Infinite Loading Hook
export function useInfiniteProducts(initialLimit: number = 20) {
  const [offset, setOffset] = useState(0)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(true)

  const { data, error, isLoading } = useSWR<ProductsResponse>(
    ['infinite-products', offset, initialLimit],
    () => getProducts({ limit: initialLimit, offset }),
    swrConfig
  )

  useEffect(() => {
    if (data?.products) {
      if (offset === 0) {
        setAllProducts(data.products.map(transformMedusaToFabric))
      } else {
        setAllProducts(prev => [...prev, ...data.products.map(transformMedusaToFabric)])
      }
      setHasMore(data.products.length === initialLimit)
    }
  }, [data, offset, initialLimit])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setOffset(prev => prev + initialLimit)
    }
  }, [isLoading, hasMore, initialLimit])

  return {
    products: allProducts,
    isLoading,
    error,
    hasMore,
    loadMore
  }
}

import { useState, useEffect, useCallback } from 'react'