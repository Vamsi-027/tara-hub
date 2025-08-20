"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { FabricCard } from "@/components/fabric-card"
import type { Fabric } from "@/shared/types"
import { fabricSeedData } from "@/modules/fabrics/data/seed-data"

interface FabricsListingPageProps {
  initialFabrics?: Fabric[]
  initialFilters?: {
    categories: string[]
    colors: string[]
  }
}

export function FabricsListingPage({ 
  initialFabrics, 
  initialFilters 
}: FabricsListingPageProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "")
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || "all")
  const [colorFilter, setColorFilter] = useState(searchParams.get('color') || "all")
  const [stockFilter, setStockFilter] = useState(searchParams.get('stock') || "all")
  const [fabrics, setFabrics] = useState(initialFabrics || fabricSeedData)

  // Use initial filters if provided, otherwise derive from fabrics
  const categories = initialFilters?.categories || Array.from(new Set(fabrics.map(fabric => fabric.category)))
  const colors = initialFilters?.colors || Array.from(new Set(fabrics.map(fabric => fabric.color)))

  // Fetch fabrics from API if available (optional enhancement)
  useEffect(() => {
    // Only fetch if we want to get latest data from KV
    // For now, we'll use seed data for stability
    if (false && !initialFabrics) {
      fetch('/api/fabrics')
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setFabrics(data)
          }
        })
        .catch(err => {
          console.error('Error fetching fabrics:', err)
          // Keep using seed data on error
        })
    }
  }, [])

  const filteredFabrics = useMemo(() => {
    return fabrics.filter(fabric => {
      const matchesSearch = fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fabric.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           fabric.composition.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || fabric.category === categoryFilter
      const matchesColor = colorFilter === "all" || fabric.color === colorFilter
      const matchesStock = stockFilter === "all" || 
                          (stockFilter === "in-stock" && fabric.inStock) ||
                          (stockFilter === "made-to-order" && !fabric.inStock)

      return matchesSearch && matchesCategory && matchesColor && matchesStock
    })
  }, [searchTerm, categoryFilter, colorFilter, stockFilter, fabrics])

  // Effect to update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (searchTerm) {
      params.set('search', searchTerm)
    } else {
      params.delete('search')
    }
    if (categoryFilter !== 'all') {
      params.set('category', categoryFilter)
    } else {
      params.delete('category')
    }
    if (colorFilter !== 'all') {
 params.set('color', colorFilter);
    } else {
 params.delete('color');
    }
    if (stockFilter !== 'all') {
 params.set('stock', stockFilter);
    } else {
 params.delete('stock');
    }

    // Use replace instead of push to avoid adding to browser history for filter changes
    router.push(`${pathname}?${params.toString()}`)
  }, [searchTerm, categoryFilter, colorFilter, stockFilter])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Fabric Collection</h1>
          <p className="text-lg text-gray-600">
            Explore our comprehensive collection of premium fabrics for interior design and upholstery projects.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filter & Search</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search fabrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={colorFilter} onValueChange={setColorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Colors</SelectItem>
                {colors.map(color => (
                  <SelectItem key={color} value={color}>{color}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fabrics</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="made-to-order">Made to Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredFabrics.length} of {fabricSeedData.length} fabrics
          </p>
        </div>

        {/* Fabric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFabrics.map((fabric) => (
 <FabricCard key={fabric.id} fabric={fabric} /> // Use the FabricCard component
          ))}
        </div>

        {filteredFabrics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No fabrics found matching your criteria.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("")
                setCategoryFilter("all")
                setColorFilter("all")
                setStockFilter("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
    </div>
  )
}
