'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface FabricFilters {
  search: string
  category: string
  collection: string
  color_family: string[]
  color_hex: string[]
  pattern: string[]
  usage: string[]
  composition: string[]
  in_stock: boolean | null
  swatch_available: boolean | null
  swatch_price_min: number
  swatch_price_max: number
  sort_field: string
  sort_direction: 'asc' | 'desc'
  page: number
  limit: number
}

export interface FilterOptions {
  categories: string[]
  collections: string[]
  colorFamilies: string[]
  patterns: string[]
  usages: string[]
  compositions: string[]
  priceRange: { min: number; max: number }
}

const DEFAULT_FILTERS: FabricFilters = {
  search: '',
  category: '',
  collection: '',
  color_family: [],
  color_hex: [],
  pattern: [],
  usage: [],
  composition: [],
  in_stock: null,
  swatch_available: null,
  swatch_price_min: 0,
  swatch_price_max: 50,
  sort_field: 'name',
  sort_direction: 'asc',
  page: 1,
  limit: 12
}

export const useFabricFilters = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FabricFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)

  // Parse URL parameters on mount
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(searchParams)
    setFilters(urlFilters)
  }, [searchParams])

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FabricFilters) => {
    const params = new URLSearchParams()
    
    // Add non-empty filter values to URL
    Object.entries(newFilters).forEach(([key, value]) => {
      if (key === 'page' && value === 1) return // Don't include page=1
      if (key === 'limit' && value === 12) return // Don't include default limit
      
      if (Array.isArray(value) && value.length > 0) {
        params.set(key, value.join(','))
      } else if (typeof value === 'string' && value.trim() !== '') {
        params.set(key, value)
      } else if (typeof value === 'number' && value !== DEFAULT_FILTERS[key as keyof FabricFilters]) {
        params.set(key, value.toString())
      } else if (typeof value === 'boolean' && value !== null) {
        params.set(key, value.toString())
      }
    })

    const url = params.toString() ? `/browse?${params.toString()}` : '/browse'
    router.push(url, { scroll: false })
  }, [router])

  // Update a specific filter
  const updateFilter = useCallback((key: keyof FabricFilters, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset page when other filters change
    }
    setFilters(newFilters)
    updateURL(newFilters)
  }, [filters, updateURL])

  // Add/remove items from array filters
  const toggleArrayFilter = useCallback((key: keyof FabricFilters, value: string) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    
    updateFilter(key, newArray)
  }, [filters, updateFilter])

  // Clear a specific filter
  const clearFilter = useCallback((key: keyof FabricFilters) => {
    const defaultValue = DEFAULT_FILTERS[key]
    updateFilter(key, defaultValue)
  }, [updateFilter])

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS })
    router.push('/browse', { scroll: false })
  }, [router])

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    
    Object.entries(filters).forEach(([key, value]) => {
      const defaultValue = DEFAULT_FILTERS[key as keyof FabricFilters]
      
      if (Array.isArray(value) && value.length > 0) count++
      else if (typeof value === 'string' && value.trim() !== '' && value !== defaultValue) count++
      else if (typeof value === 'number' && value !== defaultValue) count++
      else if (typeof value === 'boolean' && value !== defaultValue) count++
    })
    
    return count
  }, [filters])

  // Get active filters as badges
  const activeFilters = useMemo(() => {
    const badges: Array<{ key: string; label: string; value: any }> = []
    
    if (filters.search.trim()) {
      badges.push({ key: 'search', label: `Search: "${filters.search}"`, value: filters.search })
    }
    
    if (filters.category) {
      badges.push({ key: 'category', label: `Category: ${filters.category}`, value: filters.category })
    }
    
    if (filters.collection) {
      badges.push({ key: 'collection', label: `Collection: ${filters.collection}`, value: filters.collection })
    }
    
    filters.color_family.forEach(color => {
      badges.push({ key: 'color_family', label: `Color: ${color}`, value: color })
    })
    
    filters.pattern.forEach(pattern => {
      badges.push({ key: 'pattern', label: `Pattern: ${pattern}`, value: pattern })
    })
    
    filters.usage.forEach(usage => {
      badges.push({ key: 'usage', label: `Usage: ${usage}`, value: usage })
    })
    
    filters.composition.forEach(comp => {
      badges.push({ key: 'composition', label: `Material: ${comp}`, value: comp })
    })
    
    if (filters.in_stock === true) {
      badges.push({ key: 'in_stock', label: 'In Stock', value: true })
    }
    
    if (filters.swatch_available === true) {
      badges.push({ key: 'swatch_available', label: 'Swatch Available', value: true })
    }
    
    if (filters.swatch_price_min > 0 || filters.swatch_price_max < 50) {
      badges.push({ 
        key: 'swatch_price', 
        label: `Price: $${filters.swatch_price_min} - $${filters.swatch_price_max}`, 
        value: `${filters.swatch_price_min}-${filters.swatch_price_max}` 
      })
    }
    
    return badges
  }, [filters])

  // Build API query string
  const buildApiQuery = useCallback(() => {
    const params = new URLSearchParams()
    
    params.set('limit', filters.limit.toString())
    params.set('page', filters.page.toString())
    params.set('sort_field', filters.sort_field)
    params.set('sort_direction', filters.sort_direction)
    
    if (filters.search.trim()) {
      params.set('search', filters.search.trim())
    }
    
    // Add other filters to API query as needed
    if (filters.category) params.set('category', filters.category)
    if (filters.collection) params.set('collection', filters.collection)
    if (filters.color_family.length) params.set('color_family', filters.color_family.join(','))
    if (filters.pattern.length) params.set('pattern', filters.pattern.join(','))
    if (filters.usage.length) params.set('usage', filters.usage.join(','))
    if (filters.composition.length) params.set('composition', filters.composition.join(','))
    if (filters.in_stock !== null) params.set('in_stock', filters.in_stock.toString())
    if (filters.swatch_available !== null) params.set('swatch_available', filters.swatch_available.toString())
    if (filters.swatch_price_min > 0) params.set('swatch_price_min', filters.swatch_price_min.toString())
    if (filters.swatch_price_max < 50) params.set('swatch_price_max', filters.swatch_price_max.toString())
    
    return params.toString()
  }, [filters])

  return {
    filters,
    updateFilter,
    toggleArrayFilter,
    clearFilter,
    clearAllFilters,
    activeFilterCount,
    activeFilters,
    buildApiQuery,
    isLoading,
    setIsLoading
  }
}

// Helper function to parse filters from URL search params
const parseFiltersFromURL = (searchParams: URLSearchParams): FabricFilters => {
  const filters = { ...DEFAULT_FILTERS }
  
  // Parse each parameter
  const search = searchParams.get('search')
  if (search) filters.search = search
  
  const category = searchParams.get('category')
  if (category) filters.category = category
  
  const collection = searchParams.get('collection')
  if (collection) filters.collection = collection
  
  const colorFamily = searchParams.get('color_family')
  if (colorFamily) filters.color_family = colorFamily.split(',')
  
  const colorHex = searchParams.get('color_hex')
  if (colorHex) filters.color_hex = colorHex.split(',')
  
  const pattern = searchParams.get('pattern')
  if (pattern) filters.pattern = pattern.split(',')
  
  const usage = searchParams.get('usage')
  if (usage) filters.usage = usage.split(',')
  
  const composition = searchParams.get('composition')
  if (composition) filters.composition = composition.split(',')
  
  const inStock = searchParams.get('in_stock')
  if (inStock) filters.in_stock = inStock === 'true'
  
  const swatchAvailable = searchParams.get('swatch_available')
  if (swatchAvailable) filters.swatch_available = swatchAvailable === 'true'
  
  const priceMin = searchParams.get('swatch_price_min')
  if (priceMin) filters.swatch_price_min = parseInt(priceMin)
  
  const priceMax = searchParams.get('swatch_price_max')
  if (priceMax) filters.swatch_price_max = parseInt(priceMax)
  
  const sortField = searchParams.get('sort_field')
  if (sortField) filters.sort_field = sortField
  
  const sortDirection = searchParams.get('sort_direction')
  if (sortDirection && (sortDirection === 'asc' || sortDirection === 'desc')) {
    filters.sort_direction = sortDirection
  }
  
  const page = searchParams.get('page')
  if (page) filters.page = parseInt(page)
  
  const limit = searchParams.get('limit')
  if (limit) filters.limit = parseInt(limit)
  
  return filters
}

