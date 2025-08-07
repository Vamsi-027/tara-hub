"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fabricSeedData } from "@/lib/fabric-seed-data"
import { Search, Filter } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"

export function FabricsListingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [colorFilter, setColorFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")

  const categories = Array.from(new Set(fabricSeedData.map(fabric => fabric.category)))
  const colors = Array.from(new Set(fabricSeedData.map(fabric => fabric.color)))

  const filteredFabrics = useMemo(() => {
    return fabricSeedData.filter(fabric => {
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
  }, [searchTerm, categoryFilter, colorFilter, stockFilter])

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Card key={fabric.id} className="group hover:shadow-lg transition-shadow duration-300">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <Image
                  src={fabric.swatchImageUrl || "/placeholder.svg"}
                  alt={fabric.name}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{fabric.name}</h3>
                  <Badge variant={fabric.inStock ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                    {fabric.inStock ? "In Stock" : "MTO"}
                  </Badge>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{fabric.description}</p>
                
                <div className="space-y-1 mb-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Composition:</span>
                    <span className="text-gray-900 text-right">{fabric.composition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Width:</span>
                    <span className="text-gray-900">{fabric.width}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge variant="outline" className="text-xs">{fabric.category}</Badge>
                  <Badge variant="outline" className="text-xs">{fabric.color}</Badge>
                </div>

                <div className="space-y-2">
                  <Link href={`/fabric/${fabric.id}`}>
                    <Button className="w-full" size="sm">View Details</Button>
                  </Link>
                  <Button variant="outline" className="w-full" size="sm">Request Sample</Button>
                </div>
              </CardContent>
            </Card>
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
    </div>
  )
}
