'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { SwatchFabric } from '@shared/data/fabric-data'

interface SwatchContextType {
  selectedSwatches: SwatchFabric[]
  addSwatch: (fabric: SwatchFabric) => void
  removeSwatch: (fabricId: string) => void
  clearSwatches: () => void
  isSwatchSelected: (fabricId: string) => boolean
  swatchCount: number
}

const SwatchContext = createContext<SwatchContextType | undefined>(undefined)

export function SwatchProvider({ children }: { children: React.ReactNode }) {
  const [selectedSwatches, setSelectedSwatches] = useState<SwatchFabric[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('selectedSwatches')
    if (stored) {
      try {
        setSelectedSwatches(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to load swatches from storage', e)
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('selectedSwatches', JSON.stringify(selectedSwatches))
  }, [selectedSwatches])

  const addSwatch = (fabric: SwatchFabric) => {
    if (selectedSwatches.length >= 5) {
      alert('You can select up to 5 swatches per order')
      return
    }
    if (!selectedSwatches.find(s => s.id === fabric.id)) {
      setSelectedSwatches([...selectedSwatches, fabric])
    }
  }

  const removeSwatch = (fabricId: string) => {
    setSelectedSwatches(selectedSwatches.filter(s => s.id !== fabricId))
  }

  const clearSwatches = () => {
    setSelectedSwatches([])
  }

  const isSwatchSelected = (fabricId: string) => {
    return selectedSwatches.some(s => s.id === fabricId)
  }

  return (
    <SwatchContext.Provider
      value={{
        selectedSwatches,
        addSwatch,
        removeSwatch,
        clearSwatches,
        isSwatchSelected,
        swatchCount: selectedSwatches.length,
      }}
    >
      {children}
    </SwatchContext.Provider>
  )
}

export function useSwatches() {
  const context = useContext(SwatchContext)
  if (context === undefined) {
    throw new Error('useSwatches must be used within a SwatchProvider')
  }
  return context
}