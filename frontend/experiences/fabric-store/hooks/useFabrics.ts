import { useState, useEffect } from 'react'
import { fabricAPI, type Fabric, type FabricFilters, type FabricCollection } from '../lib/fabric-api'

// Hook to fetch fabrics with filters
export function useFabrics(filters?: FabricFilters) {
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fabricAPI.listFabrics(filters)
        setFabrics(response.fabrics)
        setCount(response.count)
      } catch (err) {
        console.error('Error fetching fabrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch fabrics')
        
        // Fallback to static data if API fails
        try {
          const { fabricSwatches } = await import('../../../shared/data/fabric-data')
          const transformed = fabricSwatches.map((f: any) => ({
            ...f,
            color_family: f.colorFamily,
            swatch_image_url: f.swatchImageUrl,
            color_hex: f.colorHex,
            care_instructions: f.careInstructions,
            in_stock: f.inStock,
            stock_quantity: 100,
          }))
          
          // Apply filters to static data
          let filtered = transformed
          if (filters?.category) {
            filtered = filtered.filter(f => f.category === filters.category)
          }
          if (filters?.collection) {
            filtered = filtered.filter(f => f.collection === filters.collection)
          }
          if (filters?.color_family) {
            filtered = filtered.filter(f => f.color_family === filters.color_family)
          }
          if (filters?.pattern) {
            filtered = filtered.filter(f => f.pattern === filters.pattern)
          }
          
          setFabrics(filtered.slice(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50)))
          setCount(filtered.length)
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchFabrics()
  }, [JSON.stringify(filters)])

  return { fabrics, loading, error, count }
}

// Hook to fetch a single fabric
export function useFabric(id: string | null) {
  const [fabric, setFabric] = useState<Fabric | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setFabric(null)
      setLoading(false)
      return
    }

    const fetchFabric = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fabricAPI.getFabric(id)
        setFabric(response.fabric)
      } catch (err) {
        console.error('Error fetching fabric:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch fabric')
      } finally {
        setLoading(false)
      }
    }

    fetchFabric()
  }, [id])

  return { fabric, loading, error }
}

// Hook to fetch collections
export function useFabricCollections() {
  const [collections, setCollections] = useState<FabricCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fabricAPI.getCollections()
        setCollections(response.collections)
      } catch (err) {
        console.error('Error fetching collections:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch collections')
        
        // Fallback to static data
        try {
          const { fabricCollections } = await import('../../../shared/data/fabric-data')
          setCollections(fabricCollections)
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCollections()
  }, [])

  return { collections, loading, error }
}

// Hook to search fabrics
export function useFabricSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fabricAPI.searchFabrics(query)
        setResults(response.fabrics)
      } catch (err) {
        console.error('Error searching fabrics:', err)
        setError(err instanceof Error ? err.message : 'Failed to search fabrics')
        
        // Fallback to static data search
        try {
          const { fabricSwatches } = await import('../../../shared/data/fabric-data')
          const searchLower = query.toLowerCase()
          const filtered = fabricSwatches.filter((f: any) => 
            f.name.toLowerCase().includes(searchLower) ||
            f.sku.toLowerCase().includes(searchLower) ||
            f.category.toLowerCase().includes(searchLower) ||
            f.color.toLowerCase().includes(searchLower)
          )
          setResults(filtered.map((f: any) => ({
            ...f,
            color_family: f.colorFamily,
            swatch_image_url: f.swatchImageUrl,
            color_hex: f.colorHex,
            care_instructions: f.careInstructions,
            in_stock: f.inStock,
            stock_quantity: 100,
          })))
        } catch (fallbackErr) {
          console.error('Fallback search failed:', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [query, debounceMs])

  return { results, loading, error }
}

// Hook to fetch categories
export function useFabricCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fabricAPI.getCategories()
        setCategories(response.categories)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
        
        // Fallback to static data
        try {
          const { fabricSwatches } = await import('../../../shared/data/fabric-data')
          const uniqueCategories = [...new Set(fabricSwatches.map((f: any) => f.category))]
          setCategories(uniqueCategories)
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, loading, error }
}