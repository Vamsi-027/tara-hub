'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface WishlistContextType {
  wishlist: string[]
  addToWishlist: (fabricId: string) => void
  removeFromWishlist: (fabricId: string) => void
  isInWishlist: (fabricId: string) => boolean
  wishlistCount: number
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('fabric-wishlist')
    if (stored) {
      try {
        setWishlist(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to load wishlist from storage', e)
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('fabric-wishlist', JSON.stringify(wishlist))
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: wishlist }))
  }, [wishlist])

  const addToWishlist = (fabricId: string) => {
    if (!wishlist.includes(fabricId)) {
      setWishlist(prev => [...prev, fabricId])
    }
  }

  const removeFromWishlist = (fabricId: string) => {
    setWishlist(prev => prev.filter(id => id !== fabricId))
  }

  const isInWishlist = (fabricId: string) => {
    return wishlist.includes(fabricId)
  }

  const clearWishlist = () => {
    setWishlist([])
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        wishlistCount: wishlist.length,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}