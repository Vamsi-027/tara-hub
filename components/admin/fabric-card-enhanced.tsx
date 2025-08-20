"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Eye, Edit, Trash2, MoreVertical, Package, 
  Ruler, Palette, Image as ImageIcon
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FabricCardProps {
  fabric: {
    id: string
    sku: string
    name: string
    description?: string
    type: string
    status: string
    stockQuantity: number
    stockUnit: string
    images: string[]
    colors?: string[]
    width?: number
    material?: string
    brand?: string
    isFeatured?: boolean
    additionalFeatures?: {
      treatmentFeatures?: {
        waterRepellent?: boolean
        stainResistant?: boolean
        fireRetardant?: boolean
        antimicrobial?: boolean
        uvResistant?: boolean
        antistatic?: boolean
      }
    }
    technicalDocuments?: {
      certifications?: string[]
    }
  }
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function FabricCardEnhanced({ fabric, onView, onEdit, onDelete }: FabricCardProps) {
  const [imageError, setImageError] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'sale': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'out of stock': return 'bg-red-100 text-red-800 border-red-200'
      case 'discontinued': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'coming soon': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStockStatus = () => {
    if (fabric.stockQuantity === 0) {
      return { label: 'Out of Stock', color: 'text-red-600' }
    } else if (fabric.stockQuantity <= 10) {
      return { label: 'Low Stock', color: 'text-yellow-600' }
    } else {
      return { label: 'In Stock', color: 'text-green-600' }
    }
  }

  const stockStatus = getStockStatus()
  const primaryImage = fabric.images && fabric.images.length > 0 ? fabric.images[0] : null
  const additionalImagesCount = fabric.images ? fabric.images.length - 1 : 0

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-blue-200">
      <CardContent className="p-0">
        {/* Image Section - Prominent Display */}
        <div className="relative">
          {primaryImage && !imageError ? (
            <div className="aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100">
              <img
                src={primaryImage}
                alt={fabric.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
              
              {/* Image Count Indicator */}
              {additionalImagesCount > 0 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {fabric.images.length}
                </div>
              )}
              
              {/* Featured Badge */}
              {fabric.isFeatured && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    Featured
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] bg-gray-100 rounded-t-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm font-medium">No Image</p>
                <p className="text-xs text-gray-500">Upload images to showcase</p>
              </div>
            </div>
          )}

          {/* Action Buttons Overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(fabric.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(fabric.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(fabric.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight truncate" title={fabric.name}>
                {fabric.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground font-mono">{fabric.sku}</span>
                <Badge variant="outline" className="text-xs">
                  {fabric.type}
                </Badge>
              </div>
            </div>
            <Badge className={getStatusColor(fabric.status)}>
              {fabric.status}
            </Badge>
          </div>

          {/* Description */}
          {fabric.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {fabric.description}
            </p>
          )}

          {/* Specifications Row */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* Material & Width */}
            <div className="space-y-1">
              {fabric.material && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Palette className="h-3 w-3" />
                  <span className="truncate">{fabric.material}</span>
                </div>
              )}
              {fabric.width && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Ruler className="h-3 w-3" />
                  <span>{fabric.width}"W</span>
                </div>
              )}
            </div>

            {/* Brand & Image Count */}
            <div className="space-y-1">
              {fabric.brand && (
                <div className="text-muted-foreground truncate">
                  <span className="font-medium text-xs uppercase tracking-wide">
                    {fabric.brand}
                  </span>
                </div>
              )}
              {fabric.images && fabric.images.length > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <ImageIcon className="h-3 w-3" />
                  <span>{fabric.images.length} image{fabric.images.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          {fabric.colors && fabric.colors.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {fabric.colors.slice(0, 3).map((color, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {color}
                </Badge>
              ))}
              {fabric.colors.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{fabric.colors.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Treatment Features & Certifications */}
          {(fabric.additionalFeatures?.treatmentFeatures || fabric.technicalDocuments?.certifications) && (
            <div className="flex flex-wrap gap-1">
              {fabric.additionalFeatures?.treatmentFeatures?.waterRepellent && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  💧 Water
                </Badge>
              )}
              {fabric.additionalFeatures?.treatmentFeatures?.stainResistant && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  🛡️ Stain
                </Badge>
              )}
              {fabric.additionalFeatures?.treatmentFeatures?.fireRetardant && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  🔥 Fire
                </Badge>
              )}
              {fabric.technicalDocuments?.certifications?.includes('GREENGUARD') && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  ✓ GG
                </Badge>
              )}
              {fabric.technicalDocuments?.certifications?.includes('OEKO-TEX') && (
                <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700 border-teal-200">
                  ✓ OT
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            
            <div className="text-right">
              <div className={`text-sm font-medium ${stockStatus.color}`}>
                {stockStatus.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {fabric.stockQuantity} {fabric.stockUnit}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onView(fabric.id)}
            >
              <Eye className="mr-1 h-3 w-3" />
              View
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit(fabric.id)}
            >
              <Edit className="mr-1 h-3 w-3" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton loader for loading state
export function FabricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        {/* Image Skeleton */}
        <div className="aspect-[4/3] bg-gray-200 rounded-t-lg animate-pulse" />
        
        {/* Content Skeleton */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          
          <div className="grid grid-cols-2 gap-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="flex gap-2">
            <div className="h-8 flex-1 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 flex-1 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}