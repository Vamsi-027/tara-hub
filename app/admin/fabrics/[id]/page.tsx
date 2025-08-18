"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal,
  Package,
  DollarSign,
  Tag,
  Calendar,
  User,
  Eye,
  Trash2,
  Upload
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFabric, useDeleteFabric } from "@/hooks/use-fabrics"
import { toast } from "sonner"
import Link from "next/link"

interface FabricViewPageProps {
  params: Promise<{ id: string }>
}

export default function FabricViewPage({ params }: FabricViewPageProps) {
  const router = useRouter()
  const [fabricId, setFabricId] = useState<string>("")
  
  // Resolve params
  useEffect(() => {
    params.then((resolvedParams) => {
      setFabricId(resolvedParams.id)
    })
  }, [params])

  const { fabric, loading, error } = useFabric(fabricId)
  const { deleteFabric, loading: deleteLoading } = useDeleteFabric()

  const handleDelete = async () => {
    if (!fabric) return
    
    if (confirm(`Are you sure you want to delete "${fabric.name}"? This action cannot be undone.`)) {
      try {
        await deleteFabric(fabric.id)
        toast.success('Fabric deleted successfully')
        router.push('/admin/fabrics')
      } catch (error) {
        toast.error('Failed to delete fabric')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !fabric) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/fabrics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-red-600">Fabric Not Found</h1>
            <p className="text-muted-foreground">
              The fabric you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {error || "This fabric could not be found."}
              </p>
              <Button asChild>
                <Link href="/admin/fabrics">Back to Fabrics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'sale': return 'bg-yellow-100 text-yellow-800'
      case 'out of stock': return 'bg-red-100 text-red-800'
      case 'discontinued': return 'bg-gray-100 text-gray-800'
      case 'coming soon': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatus = () => {
    if (fabric.stockQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (fabric.stockQuantity <= fabric.lowStockThreshold) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Low Stock</Badge>
    } else {
      return <Badge variant="outline" className="border-green-500 text-green-700">In Stock</Badge>
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/fabrics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{fabric.name}</h1>
            <p className="text-muted-foreground">
              SKU: {fabric.sku} • {fabric.type}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/admin/fabrics/${fabric.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={deleteLoading}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Fabric
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Image Gallery Section - Prominent Display */}
      {fabric.images && fabric.images.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Fabric Images ({fabric.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Main Image */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={fabric.images[0]}
                  alt={fabric.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Additional Images Thumbnail Gallery */}
              {fabric.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {fabric.images.slice(1, 5).map((image, index) => (
                    <div key={index} className="aspect-square rounded-md overflow-hidden bg-gray-100">
                      <img
                        src={image}
                        alt={`${fabric.name} - ${index + 2}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                      />
                    </div>
                  ))}
                  {fabric.images.length > 5 && (
                    <div className="aspect-square rounded-md bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                      +{fabric.images.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Placeholder for No Images */
        <Card className="mb-6">
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Images Available</p>
              <p className="text-sm text-muted-foreground mb-4">Upload images to showcase this fabric</p>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(fabric.status)}>
                    {fabric.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Stock Status</label>
                <div className="mt-1">
                  {getStockStatus()}
                </div>
              </div>
            </div>
            
            {fabric.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1 text-sm">{fabric.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {fabric.brand && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand</label>
                  <p className="mt-1 text-sm font-medium">{fabric.brand}</p>
                </div>
              )}
              {fabric.collection && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Collection</label>
                  <p className="mt-1 text-sm font-medium">{fabric.collection}</p>
                </div>
              )}
            </div>

            {fabric.colors && fabric.colors.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Available Colors</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {fabric.colors.map((color, index) => (
                    <Badge key={index} variant="secondary">{color}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              {fabric.isFeatured && (
                <Badge variant="outline" className="border-purple-500 text-purple-700">
                  Featured
                </Badge>
              )}
              {fabric.isActive && (
                <Badge variant="outline" className="border-green-500 text-green-700">
                  Active
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Retail Price</label>
                <p className="mt-1 text-lg font-bold">${fabric.retailPrice}</p>
              </div>
              {fabric.salePrice && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sale Price</label>
                  <p className="mt-1 text-lg font-bold text-green-600">${fabric.salePrice}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((1 - parseFloat(fabric.salePrice) / parseFloat(fabric.retailPrice)) * 100)}% off
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {fabric.wholesalePrice && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Wholesale Price</label>
                  <p className="mt-1 text-sm font-medium">${fabric.wholesalePrice}</p>
                </div>
              )}
              {fabric.cost && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cost</label>
                  <p className="mt-1 text-sm font-medium">${fabric.cost}</p>
                </div>
              )}
            </div>

            {fabric.cost && (
              <div className="bg-muted rounded-lg p-3">
                <label className="text-sm font-medium text-muted-foreground">Profit Margin</label>
                <p className="mt-1 text-lg font-bold">
                  {Math.round(((parseFloat(fabric.retailPrice) - parseFloat(fabric.cost)) / parseFloat(fabric.retailPrice)) * 100)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Stock Quantity</label>
                <p className="mt-1 text-lg font-bold">{fabric.stockQuantity} {fabric.stockUnit}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Low Stock Alert</label>
                <p className="mt-1 text-sm font-medium">{fabric.lowStockThreshold} {fabric.stockUnit}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fabric.material && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Material</label>
                  <p className="mt-1 text-sm font-medium">{fabric.material}</p>
                </div>
              )}
              {fabric.pattern && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pattern</label>
                  <p className="mt-1 text-sm font-medium">{fabric.pattern}</p>
                </div>
              )}
              {fabric.width && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Width</label>
                  <p className="mt-1 text-sm font-medium">{fabric.width}"</p>
                </div>
              )}
              {fabric.weight && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Weight</label>
                  <p className="mt-1 text-sm font-medium">{fabric.weight} oz/yd²</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="mt-1 text-sm">{new Date(fabric.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="mt-1 text-sm">{new Date(fabric.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Slug</label>
              <p className="mt-1 text-sm font-mono text-muted-foreground">{fabric.slug}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Version</label>
              <p className="mt-1 text-sm">{fabric.version}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}