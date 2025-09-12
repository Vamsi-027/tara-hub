'use client'

import React, { ReactNode } from 'react'
import { useFabricFilters } from '@/hooks/useFabricFilters'

// Context Provider for Fabric Filters
interface FabricFiltersContextType {
  filters: any
  updateFilter: (key: any, value: any) => void
  toggleArrayFilter: (key: any, value: string) => void
  clearFilter: (key: any) => void
  clearAllFilters: () => void
  activeFilterCount: number
  activeFilters: Array<{ key: string; label: string; value: any }>
  buildApiQuery: () => string
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const FabricFiltersContext = React.createContext<FabricFiltersContextType | undefined>(undefined)

export const FabricFiltersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const filterHookValue = useFabricFilters()
  
  return (
    <FabricFiltersContext.Provider value={filterHookValue}>
      {children}
    </FabricFiltersContext.Provider>
  )
}

export const useFabricFiltersContext = () => {
  const context = React.useContext(FabricFiltersContext)
  if (context === undefined) {
    throw new Error('useFabricFiltersContext must be used within a FabricFiltersProvider')
  }
  return context
}