"use client"

import { useState, useEffect } from "react"
import type { ProductsResponse } from "@/core/database/schemas"

export function useProducts() {
  const [data, setData] = useState<ProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/products")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Failed to fetch products data")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchProducts,
  }
}
