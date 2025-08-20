"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal,
  Package,
  Tag,
  Calendar,
  Eye,
  Trash2,
  Building2,
  Info,
  Ruler,
  Shield,
  Image as ImageIcon,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertCircle,
  Heart
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
  const [selectedImage, setSelectedImage] = useState<number>(0)
  
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'discontinued': return 'bg-red-100 text-red-800 border-red-200'
      case 'out of stock': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'coming soon': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'sale': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'clearance': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStockStatus = () => {
    const stock = parseInt(fabric?.stockQuantity || '0')
    const threshold = parseInt(fabric?.lowStockThreshold || '10')
    
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (stock <= threshold) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Low Stock ({stock} {fabric?.stockUnit || 'units'})</Badge>
    } else {
      return <Badge variant="outline" className="border-green-500 text-green-700">In Stock ({stock} {fabric?.stockUnit || 'units'})</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
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
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/fabrics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-red-600">Fabric Not Found</h1>
            <p className="text-muted-foreground">
              The fabric you're looking for doesn't exist or has been deleted.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Compact Header with Navigation */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/fabrics">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/fabrics" className="hover:text-foreground">Fabrics</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{fabric.sku}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href={`/admin/fabrics/${fabric.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
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

      {/* Hero Section with Key Info and Compact Image */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title and Primary Details */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{fabric.name}</h1>
                <p className="text-muted-foreground mt-1">{fabric.type} • {fabric.brand || 'No Brand'}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(fabric.status)}>
                  {fabric.status}
                </Badge>
                {fabric.isFeatured && (
                  <Badge variant="secondary">Featured</Badge>
                )}
              </div>
            </div>
            {fabric.description && (
              <p className="text-sm text-muted-foreground">{fabric.description}</p>
            )}
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className="text-lg font-bold">{fabric.stockQuantity || 0}</p>
                    <p className="text-xs text-muted-foreground">{fabric.stockUnit || 'units'}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="text-lg font-bold">
                      {fabric.currency || 'USD'} {fabric.procurementCost || fabric.cost || '0'}
                    </p>
                    <p className="text-xs text-muted-foreground">{fabric.priceUnit?.replace('_', ' ') || 'per yard'}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Width</p>
                    <p className="text-lg font-bold">{fabric.width || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{fabric.widthUnit || 'inches'}</p>
                  </div>
                  <Ruler className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Durability</p>
                    <p className="text-lg font-bold">{fabric.durabilityRating?.split(' ')[0] || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{fabric.durabilityRating?.split(' ')[1] || 'Not Set'}</p>
                  </div>
                  <Shield className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Color Badges */}
          {fabric.colors && fabric.colors.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Colors:</span>
              {fabric.colors.map((color, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {color}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Compact Image Gallery - Takes 1 column */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {fabric.images && fabric.images.length > 0 ? (
                <div className="space-y-2">
                  {/* Main Selected Image */}
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={fabric.images[selectedImage]}
                      alt={fabric.name}
                      className="w-full h-full object-cover"
                    />
                    {fabric.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        {selectedImage + 1} / {fabric.images.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Strip */}
                  {fabric.images.length > 1 && (
                    <div className="flex gap-1 p-2 overflow-x-auto">
                      {fabric.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                            selectedImage === index ? 'border-primary' : 'border-transparent hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${fabric.name} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-50 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">No images</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Information in Tabs */}
      <Tabs defaultValue="details" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 mb-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="care">Care & Treatment</TabsTrigger>
        </TabsList>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">SKU:</span>
                    <p className="font-medium">{fabric.sku}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{fabric.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Brand:</span>
                    <p className="font-medium">{fabric.brand || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Collection:</span>
                    <p className="font-medium">{fabric.collection || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p className="font-medium">{fabric.category || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Style:</span>
                    <p className="font-medium">{fabric.style || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Material & Pattern</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Material:</span>
                    <p className="font-medium">{fabric.material || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pattern:</span>
                    <p className="font-medium">{fabric.pattern || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Color Family:</span>
                    <p className="font-medium">{fabric.colorFamily || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cleaning Code:</span>
                    {fabric.cleaningCode ? (
                      <Badge variant="outline" className="mt-1">
                        {fabric.cleaningCode}
                        {fabric.cleaningCode === 'W' && ' - Water'}
                        {fabric.cleaningCode === 'S' && ' - Solvent'}
                        {fabric.cleaningCode === 'WS' && ' - Both'}
                        {fabric.cleaningCode === 'X' && ' - Vacuum'}
                        {fabric.cleaningCode === 'DC' && ' - Dry Clean'}
                      </Badge>
                    ) : (
                      <p className="font-medium">Not specified</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Width:</span>
                  <p className="font-medium">
                    {fabric.width || 'N/A'} {fabric.widthUnit || 'inches'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Weight:</span>
                  <p className="font-medium">
                    {fabric.weight || 'N/A'} {fabric.weightUnit || 'oz/yd'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Durability:</span>
                  <p className="font-medium">
                    {fabric.durabilityRating ? (
                      <Badge variant="outline">{fabric.durabilityRating}</Badge>
                    ) : 'Not rated'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Procurement Tab */}
        <TabsContent value="procurement" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Procurement Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Procurement Cost:</span>
                    <p className="text-xl font-bold">
                      {fabric.currency || 'USD'} {fabric.procurementCost || fabric.cost || '0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fabric.priceUnit ? fabric.priceUnit.replace('_', ' ') : 'per yard'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Currency:</span>
                      <p className="font-medium">{fabric.currency || 'USD'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Unit:</span>
                      <p className="font-medium">{fabric.priceUnit?.replace('_', ' ') || 'per yard'}</p>
                    </div>
                  </div>
                </div>
                
                {(fabric.supplierId || fabric.supplierName) && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Supplier:</span>
                      <p className="text-lg font-semibold">{fabric.supplierName || 'Unknown'}</p>
                      {fabric.supplierId && (
                        <p className="text-sm text-muted-foreground">ID: {fabric.supplierId}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Inventory Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {fabric.stockQuantity || 0} {fabric.stockUnit || 'units'}
                    </p>
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                  </div>
                  <div>{getStockStatus()}</div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Low Stock Threshold:</span>
                    <p className="font-medium">{fabric.lowStockThreshold || 10} {fabric.stockUnit || 'units'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock Unit:</span>
                    <p className="font-medium">{fabric.stockUnit || 'yards'}</p>
                  </div>
                </div>

                {parseInt(fabric.stockQuantity || '0') <= parseInt(fabric.lowStockThreshold || '10') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Low Stock Warning</p>
                      <p className="text-yellow-700">Consider reordering this fabric soon.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Performance Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {fabric.martindale && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Martindale:</span>
                    <p className="font-medium">{fabric.martindale.toLocaleString()} rubs</p>
                  </div>
                )}
                {fabric.wyzenbeek && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Wyzenbeek:</span>
                    <p className="font-medium">{fabric.wyzenbeek.toLocaleString()} double rubs</p>
                  </div>
                )}
                {fabric.lightfastness && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Lightfastness:</span>
                    <p className="font-medium">{fabric.lightfastness}/8</p>
                  </div>
                )}
                {fabric.pillingResistance && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Pilling Resistance:</span>
                    <p className="font-medium">{fabric.pillingResistance}/5</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Care & Treatment Tab */}
        <TabsContent value="care" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Care & Treatment Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Care Instructions */}
              {fabric.careInstructions && fabric.careInstructions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Care Instructions:</p>
                  <div className="flex flex-wrap gap-2">
                    {fabric.careInstructions.map((instruction: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {instruction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Treatment Features */}
              <div>
                <p className="text-sm font-medium mb-2">Treatment Features:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {fabric.isStainResistant && (
                    <Badge variant="secondary">Stain Resistant</Badge>
                  )}
                  {fabric.isFadeResistant && (
                    <Badge variant="secondary">Fade Resistant</Badge>
                  )}
                  {fabric.isWaterResistant && (
                    <Badge variant="secondary">Water Resistant</Badge>
                  )}
                  {fabric.isPetFriendly && (
                    <Badge variant="secondary">Pet Friendly</Badge>
                  )}
                  {fabric.isOutdoorSafe && (
                    <Badge variant="secondary">Outdoor Safe</Badge>
                  )}
                  {fabric.isFireRetardant && (
                    <Badge variant="secondary">Fire Retardant</Badge>
                  )}
                  {fabric.isBleachCleanable && (
                    <Badge variant="secondary">Bleach Cleanable</Badge>
                  )}
                  {fabric.isAntimicrobial && (
                    <Badge variant="secondary">Antimicrobial</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Technical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fiber Content */}
              {fabric.fiberContent && fabric.fiberContent.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Fiber Content:</p>
                  <div className="space-y-1">
                    {fabric.fiberContent.map((fiber: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{fiber.fiber}</span>
                        <span className="font-medium">{fiber.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {fabric.backingType && (
                  <div>
                    <span className="text-muted-foreground">Backing Type:</span>
                    <p className="font-medium">{fabric.backingType}</p>
                  </div>
                )}
                {fabric.finishTreatment && (
                  <div>
                    <span className="text-muted-foreground">Finish Treatment:</span>
                    <p className="font-medium">{fabric.finishTreatment}</p>
                  </div>
                )}
                {fabric.countryOfOrigin && (
                  <div>
                    <span className="text-muted-foreground">Country of Origin:</span>
                    <p className="font-medium">{fabric.countryOfOrigin}</p>
                  </div>
                )}
                {fabric.flammabilityStandard && (
                  <div>
                    <span className="text-muted-foreground">Flammability Standard:</span>
                    <p className="font-medium">{fabric.flammabilityStandard}</p>
                  </div>
                )}
                {fabric.minimumOrder && (
                  <div>
                    <span className="text-muted-foreground">Minimum Order:</span>
                    <p className="font-medium">{fabric.minimumOrder} {fabric.stockUnit || 'units'}</p>
                  </div>
                )}
                {fabric.leadTimeDays && (
                  <div>
                    <span className="text-muted-foreground">Lead Time:</span>
                    <p className="font-medium">{fabric.leadTimeDays} days</p>
                  </div>
                )}
              </div>
              
              {fabric.isCustomOrder && (
                <Badge variant="outline" className="w-fit">Custom Order Only</Badge>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Certifications & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fabric.environmentalRating && (
                <div>
                  <span className="text-sm text-muted-foreground">Environmental Rating:</span>
                  <Badge variant="outline" className="ml-2">{fabric.environmentalRating}</Badge>
                </div>
              )}
              
              {fabric.certifications && fabric.certifications.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Certifications:</p>
                  <div className="space-y-2">
                    {fabric.certifications.map((cert: any, index: number) => (
                      <div key={index} className="border rounded p-2">
                        <p className="font-medium text-sm">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cert.issuer} {cert.date && `• ${new Date(cert.date).toLocaleDateString()}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {fabric.publicNotes && (
                <div>
                  <span className="text-sm text-muted-foreground">Public Notes:</span>
                  <p className="text-sm mt-1">{fabric.publicNotes}</p>
                </div>
              )}
              
              {fabric.warrantyInfo && (
                <div>
                  <span className="text-sm text-muted-foreground">Warranty:</span>
                  <p className="text-sm mt-1">{fabric.warrantyInfo}</p>
                </div>
              )}
              
              {fabric.returnPolicy && (
                <div>
                  <span className="text-sm text-muted-foreground">Return Policy:</span>
                  <p className="text-sm mt-1">{fabric.returnPolicy}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Metadata & Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">
                    {fabric.createdAt ? new Date(fabric.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p className="font-medium">
                    {fabric.updatedAt ? new Date(fabric.updatedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <p className="font-mono text-xs">{fabric.id}</p>
                </div>
              </div>
              
              {(fabric.metaTitle || fabric.metaDescription) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    {fabric.metaTitle && (
                      <div>
                        <span className="text-sm text-muted-foreground">Meta Title:</span>
                        <p className="text-sm font-medium">{fabric.metaTitle}</p>
                      </div>
                    )}
                    {fabric.metaDescription && (
                      <div>
                        <span className="text-sm text-muted-foreground">Meta Description:</span>
                        <p className="text-sm">{fabric.metaDescription}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}