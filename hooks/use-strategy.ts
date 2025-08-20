"use client"

import { useState, useEffect } from "react"
import type { StrategyResponse } from "@/core/database/schemas"

export function useStrategy() {
  const [data, setData] = useState<StrategyResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStrategy = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/strategy")
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Failed to fetch strategy data")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching strategy:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStrategy()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchStrategy,
  }
}
