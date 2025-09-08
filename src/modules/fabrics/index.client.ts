"use client"

import { useState, useEffect } from 'react'

// Fabric interface to match the admin requirements
export interface Fabric {
  id: string
  name: string
  description?: string
  category?: string
  color?: string
  material?: string
  price?: number
  stock?: number
  imageUrl?: string
  status?: 'active' | 'inactive' | 'out_of_stock'
  createdAt?: string
  updatedAt?: string
}

// Hook to fetch fabrics with advanced features
export function useFabrics(options?: {
  filter?: {
    search?: string
    type?: string[]
    status?: string[]
    isActive?: boolean
  }
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  page?: number
  limit?: number
}) {
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    current: 1,
    limit: 20
  })
  
  const [currentFilter, setCurrentFilter] = useState(options?.filter)
  const [currentSort, setCurrentSort] = useState(options?.sort)
  const [currentPage, setCurrentPage] = useState(options?.page || 1)

  useEffect(() => {
    fetchFabrics()
  }, [currentFilter, currentSort, currentPage])

  const fetchFabrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = new URLSearchParams()
      
      if (currentFilter?.search) {
        params.append('search', currentFilter.search)
      }
      
      if (currentFilter?.type?.length) {
        params.append('type', currentFilter.type.join(','))
      }
      
      if (currentFilter?.status?.length) {
        params.append('status', currentFilter.status.join(','))
      }
      
      if (currentSort) {
        params.append('sort', `${currentSort.field}:${currentSort.direction}`)
      }
      
      params.append('page', currentPage.toString())
      params.append('limit', '20')
      
      // Try to fetch from the API
      const response = await fetch(`/api/v1/fabrics?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch fabrics')
      }
      
      const data = await response.json()
      
      // Handle both paginated and simple array responses
      if (Array.isArray(data)) {
        setFabrics(data)
        setPagination({
          total: data.length,
          pages: 1,
          current: 1,
          limit: data.length
        })
      } else {
        setFabrics(data.fabrics || data.data || [])
        setPagination({
          total: data.total || data.fabrics?.length || 0,
          pages: data.pages || 1,
          current: data.current || 1,
          limit: data.limit || 20
        })
      }
    } catch (err) {
      console.error('Error fetching fabrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch fabrics')
      // Set empty array and default pagination as fallback
      setFabrics([])
      setPagination({
        total: 0,
        pages: 1,
        current: 1,
        limit: 20
      })
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchFabrics()
  }

  const setFilter = (newFilter: typeof currentFilter) => {
    setCurrentFilter(newFilter)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const setSort = (newSort: typeof currentSort) => {
    setCurrentSort(newSort)
    setCurrentPage(1) // Reset to first page when sorting
  }

  const setPage = (newPage: number) => {
    setCurrentPage(newPage)
  }

  return {
    fabrics,
    loading,
    error,
    pagination,
    setFilter,
    setSort,
    setPage,
    refetch
  }
}

// Hook to create fabric
export function useCreateFabric() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createFabric = async (fabricData: Omit<Fabric, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/fabrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fabricData),
      })

      if (!response.ok) {
        throw new Error('Failed to create fabric')
      }

      const newFabric = await response.json()
      return newFabric
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create fabric'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    createFabric,
    loading,
    error
  }
}

// Hook for bulk operations
export function useBulkFabricOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bulkDelete = async (fabricIds: string[]) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/fabrics/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: fabricIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete fabrics')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete fabrics'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdate = async (updates: { id: string; data: Partial<Fabric> }[]) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/fabrics/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        throw new Error('Failed to update fabrics')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update fabrics'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const importFabrics = async (file: File) => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/v1/fabrics/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to import fabrics')
      }

      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import fabrics'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const exportFabrics = async (format: 'csv' | 'json' = 'csv') => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/fabrics/export?format=${format}`)

      if (!response.ok) {
        throw new Error('Failed to export fabrics')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fabrics.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export fabrics'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    bulkDelete,
    bulkUpdate,
    importFabrics,
    exportFabrics,
    loading,
    error
  }
}