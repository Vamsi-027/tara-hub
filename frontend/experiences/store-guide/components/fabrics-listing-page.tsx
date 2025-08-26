'use client'

import { useEffect, useState } from 'react'
import { type Fabric, type FabricFilters } from '@/lib/api-client'
import { fabricSwatches as fabricSeedData, filterFabrics } from '@/shared/data/fabric-data'
import { FabricCard } from './fabric-card'
import { FabricFilters as FilterComponent } from './fabric-filters'

export function FabricsListingPage() {
  const [fabrics, setFabrics] = useState<Fabric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FabricFilters>({})
  const [useCache, setUseCache] = useState(true)

  useEffect(() => {
    loadFabrics()
  }, [filters, useCache])

  const loadFabrics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (useCache) {
        // Use cached seed data for better performance
        const filteredData = filterFabrics(fabricSeedData, {
          category: filters.category,
          search: filters.search,
          isPetFriendly: filters.petFriendly,
          isStainResistant: filters.stainResistant,
          isOutdoorSafe: filters.outdoorSafe
        })
        setFabrics(filteredData)
      } else {
        // Optionally fetch from API for fresh data (via local proxy to avoid CORS)
        try {
          const response = await fetch('/api/fabrics', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setFabrics(data)
          } else {
            // Fallback to seed data if API fails
            setFabrics(fabricSeedData)
          }
        } catch {
          // Fallback to seed data if API fails
          setFabrics(fabricSeedData)
        }
      }
    } catch (err) {
      console.error('Failed to load fabrics:', err)
      setError('Failed to load fabrics. Please try again later.')
      // Fallback to seed data on error
      setFabrics(fabricSeedData)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setUseCache(false)
    // Refresh will trigger API fetch on next load
    setTimeout(() => setUseCache(true), 100)
  }

  const handleFilterChange = (newFilters: FabricFilters) => {
    setFilters(newFilters)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={loadFabrics}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Fabric Collection</h1>
        <p className="text-gray-600">{fabrics.length} fabrics available</p>
      </div>

      <FilterComponent onFilterChange={handleFilterChange} />

      {fabrics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No fabrics found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fabrics.map((fabric) => (
            <FabricCard key={fabric.id} fabric={fabric} />
          ))}
        </div>
      )}
    </div>
  )
}