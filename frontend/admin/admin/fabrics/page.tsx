"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, Search, Edit, Trash2, Filter, Download, Upload, 
  Package, MoreVertical, Eye, Grid3X3, List
} from "lucide-react"
import { FabricCardEnhanced, FabricCardSkeleton } from "@/components/admin/fabric-card-enhanced"
import { EmptyState } from "@/components/empty-state"
import { useFabrics, useCreateFabric, useBulkFabricOperations } from "@/modules/fabrics/index.client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AdminFabricsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("createdAt:desc")
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  
  // Parse sort string
  const [sortField, sortDirection] = sortBy.split(':') as ['createdAt', 'desc']
  
  // Use the fabrics hook with filters
  const { 
    fabrics, 
    loading, 
    error, 
    pagination,
    setFilter,
    setSort,
    setPage,
    refetch 
  } = useFabrics({
    filter: {
      search: searchTerm || undefined,
      type: typeFilter ? [typeFilter] : undefined,
      status: statusFilter ? [statusFilter] : undefined,
      isActive: true
    },
    sort: {
      field: sortField as any,
      direction: sortDirection as any
    }
  })

  const { bulkDelete } = useBulkFabricOperations()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    
    if (confirm(`Are you sure you want to delete ${selectedIds.length} fabric(s)?`)) {
      setBulkLoading(true)
      try {
        await bulkDelete(selectedIds)
        setSelectedIds([])
        refetch()
      } catch (error) {
        console.error('Bulk delete failed:', error)
      } finally {
        setBulkLoading(false)
      }
    }
  }

  const handleSingleDelete = async (id: string) => {
    console.log('handleSingleDelete called with id:', id)
    if (confirm(`Are you sure you want to delete this fabric?`)) {
      setBulkLoading(true)
      try {
        console.log('Calling bulkDelete with id:', id)
        const result = await bulkDelete([id])
        console.log('Delete result:', result)
        toast.success('Fabric deleted successfully')
        refetch()
      } catch (error) {
        console.error('Delete failed:', error)
        toast.error('Failed to delete fabric')
      } finally {
        setBulkLoading(false)
      }
    }
  }

  const handleCreateNew = () => {
    router.push('/admin/fabrics/new')
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/fabrics/${id}/edit`)
  }

  const handleView = (id: string) => {
    router.push(`/admin/fabrics/${id}`)
  }


  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Error loading fabrics: {error}</p>
            <Button onClick={refetch} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fabrics Management</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => router.push('/admin/fabrics/import')}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button 
            className="gap-2"
            onClick={handleCreateNew}
          >
            <Plus className="h-4 w-4" />
            Add New Fabric
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search fabrics by name, SKU, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={typeFilter || "all"} 
              onValueChange={(value) => setTypeFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Upholstery">Upholstery</SelectItem>
                <SelectItem value="Drapery">Drapery</SelectItem>
                <SelectItem value="Multi-Purpose">Multi-Purpose</SelectItem>
                <SelectItem value="Outdoor">Outdoor</SelectItem>
                <SelectItem value="Leather">Leather</SelectItem>
                <SelectItem value="Sheer">Sheer</SelectItem>
                <SelectItem value="Blackout">Blackout</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={statusFilter || "all"} 
              onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                <SelectItem value="Discontinued">Discontinued</SelectItem>
                <SelectItem value="Sale">Sale</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt:desc">Newest First</SelectItem>
                <SelectItem value="createdAt:asc">Oldest First</SelectItem>
                <SelectItem value="name:asc">Name (A-Z)</SelectItem>
                <SelectItem value="name:desc">Name (Z-A)</SelectItem>
                <SelectItem value="stock:asc">Stock (Low to High)</SelectItem>
                <SelectItem value="stock:desc">Stock (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="mt-4 flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.length} item(s) selected
              </span>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkLoading}
              >
                Delete Selected
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fabrics</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fabrics.filter(f => f.stockQuantity > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fabrics.filter(f => 
                f.stockQuantity > 0 && 
                f.stockQuantity <= (f.lowStockThreshold || 10)
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Package className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fabrics.filter(f => f.stockQuantity === 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fabrics List */}
      {loading ? (
        <div className={viewMode === 'card' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid gap-4'}>
          {[...Array(viewMode === 'card' ? 8 : 3)].map((_, i) => (
            viewMode === 'card' ? (
              <FabricCardSkeleton key={i} />
            ) : (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            )
          ))}
        </div>
      ) : fabrics.length === 0 ? (
        <EmptyState 
          type="products"
          title="No fabrics found"
          description="No fabrics match your search criteria. Try adjusting your filters or add a new fabric."
          actionLabel="Add First Fabric"
          onAction={handleCreateNew}
        />
      ) : viewMode === 'card' ? (
        /* Card View */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fabrics.map((fabric) => (
            <FabricCardEnhanced
              key={fabric.id}
              fabric={fabric}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleSingleDelete}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="grid gap-4">
          {fabrics.map((fabric) => (
            <Card key={fabric.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(fabric.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, fabric.id])
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== fabric.id))
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{fabric.name}</h3>
                        <Badge variant="secondary">{fabric.type}</Badge>
                        {fabric.brand && (
                          <Badge variant="outline">{fabric.brand}</Badge>
                        )}
                        {fabric.status === 'Active' && fabric.stockQuantity > 0 && (
                          <Badge variant="default" className="bg-green-500">In Stock</Badge>
                        )}
                        {fabric.status === 'Sale' && (
                          <Badge variant="default" className="bg-orange-500">Sale</Badge>
                        )}
                        {fabric.stockQuantity === 0 && (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                        
                        {/* Treatment Features Badges */}
                        {fabric.additionalFeatures?.treatmentFeatures?.waterRepellent && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Water Repellent
                          </Badge>
                        )}
                        {fabric.additionalFeatures?.treatmentFeatures?.stainResistant && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Stain Resistant
                          </Badge>
                        )}
                        {fabric.additionalFeatures?.treatmentFeatures?.fireRetardant && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Fire Retardant
                          </Badge>
                        )}
                        
                        {/* Certification Badges */}
                        {fabric.technicalDocuments?.certifications?.includes('GREENGUARD') && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            GREENGUARD
                          </Badge>
                        )}
                        {fabric.technicalDocuments?.certifications?.includes('OEKO-TEX') && (
                          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                            OEKO-TEX
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        SKU: {fabric.sku} | Collection: {fabric.collection || 'N/A'}
                      </div>
                      
                      {fabric.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {fabric.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{fabric.stockQuantity} {fabric.stockUnit}</span>
                        </div>
                        {fabric.width && (
                          <div>
                            Width: {fabric.width}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleView(fabric.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(fabric.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleSingleDelete(fabric.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} fabrics
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevious}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}