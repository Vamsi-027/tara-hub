/**
 * Medusa API Client
 * Production-ready service layer for Medusa backend integration
 */

import { cache } from 'react'

// Types
export interface MedusaProduct {
  id: string
  title: string
  subtitle?: string
  description?: string
  handle: string
  is_giftcard: boolean
  status: string
  thumbnail?: string
  images?: Array<{
    id: string
    url: string
    alt?: string
  }>
  collection?: {
    id: string
    title: string
    handle: string
  }
  categories?: Array<{
    id: string
    name: string
    handle: string
  }>
  variants: Array<{
    id: string
    title: string
    sku?: string
    inventory_quantity?: number
    prices: Array<{
      id: string
      amount: number
      currency_code: string
      price_list_id?: string
    }>
    options?: Array<{
      value: string
    }>
  }>
  metadata?: Record<string, any>
  tags?: Array<{
    id: string
    value: string
  }>
  created_at: string
  updated_at: string
}

export interface MedusaCollection {
  id: string
  title: string
  handle: string
  metadata?: Record<string, any>
  products?: MedusaProduct[]
  created_at: string
  updated_at: string
}

export interface MedusaCategory {
  id: string
  name: string
  handle: string
  description?: string
  parent_category?: MedusaCategory
  category_children?: MedusaCategory[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProductsResponse {
  products: MedusaProduct[]
  count: number
  offset: number
  limit: number
}

export interface CollectionsResponse {
  collections: MedusaCollection[]
  count: number
  offset: number
  limit: number
}

export interface CategoriesResponse {
  product_categories: MedusaCategory[]
  count: number
  offset: number
  limit: number
}

// Configuration - Direct Medusa Connection
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

// Determine which backend to use (Mock or Direct Medusa)
const API_BASE_URL = USE_MOCK_API
  ? 'http://localhost:3006/api/mock-products'
  : `${MEDUSA_BACKEND_URL}/store`

// Request helper with error handling
async function medusaFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // For mock API, we need to handle the endpoint differently
  let url: string
  if (USE_MOCK_API) {
    const endpointName = endpoint.replace('/', '').split('?')[0].split('/')[0]
    const mockEndpoint = endpointName === 'product-categories' ? 'categories' : endpointName
    url = `${API_BASE_URL}?endpoint=${mockEndpoint}`
  } else {
    url = `${API_BASE_URL}${endpoint}`
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Medusa API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Failed to fetch from Medusa: ${url}`, error)
    throw error
  }
}

// Cached API functions for Next.js App Router
export const getProducts = cache(async (params?: {
  limit?: number
  offset?: number
  q?: string
  collection_id?: string[]
  category_id?: string[]
  tags?: string[]
  type?: string[]
  created_at?: { gt?: string; lt?: string }
  updated_at?: { gt?: string; lt?: string }
}): Promise<ProductsResponse> => {
  const searchParams = new URLSearchParams()
  
  if (params) {
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())
    if (params.q) searchParams.append('q', params.q)
    if (params.collection_id?.length) {
      params.collection_id.forEach(id => searchParams.append('collection_id[]', id))
    }
    if (params.category_id?.length) {
      params.category_id.forEach(id => searchParams.append('category_id[]', id))
    }
    if (params.tags?.length) {
      params.tags.forEach(tag => searchParams.append('tags[]', tag))
    }
    if (params.type?.length) {
      params.type.forEach(type => searchParams.append('type[]', type))
    }
  }

  const queryString = searchParams.toString()
  const endpoint = `/products${queryString ? `?${queryString}` : ''}`
  
  return medusaFetch<ProductsResponse>(endpoint)
})

export const getProduct = cache(async (id: string): Promise<{ product: MedusaProduct }> => {
  return medusaFetch<{ product: MedusaProduct }>(`/products/${id}`)
})

export const getProductByHandle = cache(async (handle: string): Promise<{ products: MedusaProduct[] }> => {
  return medusaFetch<{ products: MedusaProduct[] }>(`/products?handle=${handle}`)
})

export const getCollections = cache(async (params?: {
  limit?: number
  offset?: number
  created_at?: { gt?: string; lt?: string }
  updated_at?: { gt?: string; lt?: string }
}): Promise<CollectionsResponse> => {
  const searchParams = new URLSearchParams()
  
  if (params) {
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())
  }

  const queryString = searchParams.toString()
  const endpoint = `/collections${queryString ? `?${queryString}` : ''}`
  
  return medusaFetch<CollectionsResponse>(endpoint)
})

export const getCollection = cache(async (id: string): Promise<{ collection: MedusaCollection }> => {
  return medusaFetch<{ collection: MedusaCollection }>(`/collections/${id}`)
})

export const getCategories = cache(async (params?: {
  limit?: number
  offset?: number
  parent_category_id?: string
  include_descendants?: boolean
}): Promise<CategoriesResponse> => {
  const searchParams = new URLSearchParams()
  
  if (params) {
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())
    if (params.parent_category_id) searchParams.append('parent_category_id', params.parent_category_id)
    if (params.include_descendants !== undefined) {
      searchParams.append('include_descendants_tree', params.include_descendants.toString())
    }
  }

  const queryString = searchParams.toString()
  const endpoint = `/product-categories${queryString ? `?${queryString}` : ''}`
  
  return medusaFetch<CategoriesResponse>(endpoint)
})

export const getCategory = cache(async (id: string): Promise<{ product_category: MedusaCategory }> => {
  return medusaFetch<{ product_category: MedusaCategory }>(`/product-categories/${id}`)
})

// Transform Medusa product to fabric-specific format
export function transformMedusaToFabric(product: MedusaProduct) {
  const defaultVariant = product.variants?.[0]
  const defaultPrice = defaultVariant?.prices?.[0]
  
  return {
    id: product.id,
    name: product.title,
    description: product.description || '',
    category: product.categories?.[0]?.name || product.metadata?.fabric_type || 'Uncategorized',
    pricePerYard: defaultPrice ? defaultPrice.amount / 100 : 0,
    color: product.metadata?.color || '',
    pattern: product.metadata?.pattern || '',
    width: product.metadata?.width || 0,
    weight: product.metadata?.weight || 0,
    composition: product.metadata?.composition || [],
    imageUrl: product.thumbnail || '/placeholder.jpg',
    images: product.images?.map(img => img.url) || [],
    inStock: (defaultVariant?.inventory_quantity || 0) > 0,
    availableQuantity: defaultVariant?.inventory_quantity || 0,
    sku: defaultVariant?.sku || '',
    sampleAvailable: product.metadata?.sample_available || false,
    samplePrice: product.metadata?.sample_price || 0,
    sampleSize: product.metadata?.sample_size || '',
    careInstructions: product.metadata?.care_instructions || [],
    certifications: product.metadata?.certifications || [],
    tags: product.tags?.map(t => t.value) || [],
    performanceRating: product.metadata?.performance_rating || {},
  }
}

// Client-side cart functions (non-cached)
export async function createCart() {
  return medusaFetch('/carts', {
    method: 'POST',
    body: JSON.stringify({
      region_id: process.env.NEXT_PUBLIC_REGION_ID || 'reg_default'
    })
  })
}

export async function addToCart(cartId: string, variantId: string, quantity: number = 1) {
  return medusaFetch(`/carts/${cartId}/line-items`, {
    method: 'POST',
    body: JSON.stringify({
      variant_id: variantId,
      quantity
    })
  })
}

export async function updateCartItem(cartId: string, lineItemId: string, quantity: number) {
  return medusaFetch(`/carts/${cartId}/line-items/${lineItemId}`, {
    method: 'POST',
    body: JSON.stringify({ quantity })
  })
}

export async function removeFromCart(cartId: string, lineItemId: string) {
  return medusaFetch(`/carts/${cartId}/line-items/${lineItemId}`, {
    method: 'DELETE'
  })
}

export async function getCart(cartId: string) {
  return medusaFetch(`/carts/${cartId}`)
}